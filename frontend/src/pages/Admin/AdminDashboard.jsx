import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, List, Avatar, Spin, message } from 'antd';
import { UserOutlined, ReadOutlined, SolutionOutlined, ArrowUpOutlined } from '@ant-design/icons';
import { userAPI, classAPI, gradingAPI, postAPI, assignmentAPI } from '../../utils/api';
import { formatRelativeTime } from '../../utils/dateUtils';

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalClasses: 0,
    submissionsToday: 0,
  });
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      console.log('🔵 Loading admin dashboard data...');
      
      // Load tất cả dữ liệu song song
      const [usersResult, classesResult, submissionsResult] = await Promise.all([
        userAPI.getAll().catch(err => {
          console.error('❌ Error loading users:', err);
          return [];
        }),
        classAPI.getAll(null, null).catch(err => {
          console.error('❌ Error loading classes:', err);
          return [];
        }),
        gradingAPI.getSubmissions(null, null, null).catch(err => {
          console.error('❌ Error loading submissions:', err);
          return [];
        }),
      ]);

      console.log('🔵 Users loaded:', usersResult);
      console.log('🔵 Classes loaded:', classesResult);
      console.log('🔵 Submissions loaded:', submissionsResult);
      console.log('🔵 Submissions count:', Array.isArray(submissionsResult) ? submissionsResult.length : 0);

      // Tính toán thống kê
      const users = Array.isArray(usersResult) ? usersResult : [];
      const classes = Array.isArray(classesResult) ? classesResult : [];
      const submissions = Array.isArray(submissionsResult) ? submissionsResult : [];
      
      const totalUsers = users.length;
      const totalClasses = classes.length;

      // Đếm bài nộp hôm nay
      // Lấy ngày hôm nay theo local timezone
      const now = new Date();
      const todayYear = now.getFullYear();
      const todayMonth = now.getMonth();
      const todayDay = now.getDate();
      
      console.log('🔵 Current date (local):', now.toLocaleString());
      console.log('🔵 Today parts:', `${todayYear}-${String(todayMonth + 1).padStart(2, '0')}-${String(todayDay).padStart(2, '0')}`);
      
      // Loại bỏ trùng lặp trước khi đếm (chỉ lấy submission mới nhất hoặc đã chấm cho mỗi bài tập)
      const uniqueSubmissions = new Map();
      
      submissions.forEach(sub => {
        const key = `${sub.studentID || sub.student?.id}_${sub.lopHocID || sub.classId}_${sub.tenBaiTap}`;
        const existing = uniqueSubmissions.get(key);
        
        if (!existing) {
          uniqueSubmissions.set(key, sub);
        } else {
          // Ưu tiên submission đã chấm
          const subIsGraded = sub.trangThai === 'Graded' && (sub.diem !== null && sub.diem !== undefined);
          const existingIsGraded = existing.trangThai === 'Graded' && (existing.diem !== null && existing.diem !== undefined);
          
          if (subIsGraded && !existingIsGraded) {
            uniqueSubmissions.set(key, sub);
          } else if (!subIsGraded && existingIsGraded) {
            // Giữ existing
          } else if (sub.submittedAt && existing.submittedAt) {
            // Cả hai đều cùng trạng thái, chọn mới nhất
            const subTime = new Date(sub.submittedAt).getTime();
            const existingTime = new Date(existing.submittedAt).getTime();
            if (subTime > existingTime) {
              uniqueSubmissions.set(key, sub);
            }
          } else if (sub.submittedAt && !existing.submittedAt) {
            uniqueSubmissions.set(key, sub);
          }
        }
      });
      
      const uniqueSubmissionsList = Array.from(uniqueSubmissions.values());
      console.log('🔵 Unique submissions (after deduplication):', uniqueSubmissionsList.length, 'out of', submissions.length);
      
      // Log tất cả unique submissions để debug
      console.log('🔵 All unique submissions with dates:');
      uniqueSubmissionsList.forEach((sub, index) => {
        console.log(`  [${index}] Submission ID: ${sub.submissionID || sub.id}, submittedAt: ${sub.submittedAt}, tenBaiTap: ${sub.tenBaiTap || 'N/A'}`);
      });
      
      const submissionsToday = uniqueSubmissionsList.filter(sub => {
        if (!sub.submittedAt) {
          console.log('⚠️ Submission missing submittedAt:', {
            id: sub.submissionID || sub.id,
            tenBaiTap: sub.tenBaiTap,
            allFields: Object.keys(sub)
          });
          return false;
        }
        try {
          const subDate = new Date(sub.submittedAt);
          
          // Kiểm tra xem date có hợp lệ không
          if (isNaN(subDate.getTime())) {
            console.error('❌ Invalid date:', sub.submittedAt);
            return false;
          }
          
          // So sánh theo local date (năm, tháng, ngày) thay vì timestamp
          const subYear = subDate.getFullYear();
          const subMonth = subDate.getMonth();
          const subDay = subDate.getDate();
          
          const isToday = subYear === todayYear && subMonth === todayMonth && subDay === todayDay;
          
          console.log('🔵 Checking submission:', {
            id: sub.submissionID || sub.id,
            submittedAt: sub.submittedAt,
            subDate: subDate.toLocaleString(),
            subDateParts: `${subYear}-${String(subMonth + 1).padStart(2, '0')}-${String(subDay).padStart(2, '0')}`,
            todayParts: `${todayYear}-${String(todayMonth + 1).padStart(2, '0')}-${String(todayDay).padStart(2, '0')}`,
            isToday: isToday,
            title: sub.tenBaiTap || sub.assignment || 'Unknown'
          });
          
          if (isToday) {
            console.log('✅ Submission is today:', sub.tenBaiTap || sub.assignment || 'Unknown');
          }
          return isToday;
        } catch (e) {
          console.error('❌ Error parsing date:', sub.submittedAt, e);
          return false;
        }
      });
      
      console.log('🔵 Submissions today count:', submissionsToday.length);
      console.log('🔵 Submissions today details:', submissionsToday.map(s => ({
        id: s.submissionID,
        title: s.tenBaiTap,
        submittedAt: s.submittedAt,
        parsedDate: new Date(s.submittedAt).toLocaleString()
      })));
      
      const submissionsTodayCount = submissionsToday.length;

      console.log('🔵 Stats calculated:', { totalUsers, totalClasses, submissionsToday });

      setStats({
        totalUsers,
        totalClasses,
        submissionsToday: submissionsTodayCount,
      });

      // Load hoạt động gần đây từ posts và assignments
      await loadRecentActivities(classes);
    } catch (error) {
      console.error('❌ Error loading dashboard data:', error);
      message.error('Không thể tải dữ liệu bảng điều khiển');
    } finally {
      setLoading(false);
    }
  };

  const loadRecentActivities = async (classes) => {
    try {
      console.log('🔵 Loading recent activities for classes:', classes);
      const activitiesList = [];

      // Lấy posts mới nhất từ tất cả các lớp
      if (Array.isArray(classes) && classes.length > 0) {
        const recentPostsPromises = classes.map(async (classItem) => {
          try {
            const classId = classItem.classID || classItem.id;
            if (!classId) {
              console.warn('⚠️ Class item missing ID:', classItem);
              return [];
            }
            
            const posts = await postAPI.getByClass(classId);
            const postsArray = Array.isArray(posts) ? posts : [];
            console.log(`🔵 Loaded ${postsArray.length} posts for class ${classId}`);
            
            return postsArray.map(post => ({
              type: 'post',
              title: `Lớp "${classItem.tenLop || classItem.name}": ${post.content?.substring(0, 50)}${post.content?.length > 50 ? '...' : ''}`,
              time: post.createdAt,
              author: post.author?.name || 'Người dùng',
            }));
          } catch (error) {
            console.error('❌ Error loading posts for class:', classItem.classID, error);
            return [];
          }
        });

        const postsArrays = await Promise.all(recentPostsPromises);
        activitiesList.push(...postsArrays.flat());
      }

      // Lấy assignments mới nhất từ tất cả các lớp
      if (Array.isArray(classes) && classes.length > 0) {
        const recentAssignmentsPromises = classes.map(async (classItem) => {
          try {
            const classId = classItem.classID || classItem.id;
            if (!classId) {
              console.warn('⚠️ Class item missing ID:', classItem);
              return [];
            }
            
            const assignments = await assignmentAPI.getByClass(classId);
            const assignmentsArray = Array.isArray(assignments) ? assignments : [];
            console.log(`🔵 Loaded ${assignmentsArray.length} assignments for class ${classId}`);
            
            return assignmentsArray.map(assignment => ({
              type: 'assignment',
              title: `Lớp "${classItem.tenLop || classItem.name}": Bài tập mới "${assignment.title}"`,
              time: assignment.createdAt,
              author: 'Giáo viên',
            }));
          } catch (error) {
            console.error('❌ Error loading assignments for class:', classItem.classID, error);
            return [];
          }
        });

        const assignmentsArrays = await Promise.all(recentAssignmentsPromises);
        activitiesList.push(...assignmentsArrays.flat());
      }

      console.log('🔵 All activities loaded:', activitiesList.length);

      // Sắp xếp theo thời gian và lấy 5 hoạt động gần nhất
      const sortedActivities = activitiesList
        .filter(act => act.time)
        .sort((a, b) => {
          try {
            return new Date(b.time).getTime() - new Date(a.time).getTime();
          } catch (e) {
            console.error('❌ Error sorting activities:', e);
            return 0;
          }
        })
        .slice(0, 5)
        .map(act => ({
          title: act.title,
          time: formatRelativeTime(act.time),
        }));

      console.log('🔵 Sorted activities (top 5):', sortedActivities);
      setActivities(sortedActivities);
    } catch (error) {
      console.error('❌ Error loading recent activities:', error);
      setActivities([]);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', background: 'linear-gradient(135deg, rgba(241, 245, 249, 0.6) 0%, rgba(248, 250, 252, 0.8) 100%)', borderRadius: '12px', minHeight: '100%' }}>
      <h2 style={{ marginBottom: 24, color: '#1e293b' }}> Tổng quan Hệ thống</h2>

      {/* KHỐI THỐNG KÊ (STATISTICS CARDS) */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <Card style={{ 
            background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
            borderLeft: '4px solid #667eea',
            boxShadow: '0 4px 12px rgba(102, 126, 234, 0.15)'
          }} hoverable>
            <Statistic
              title={<span style={{ color: '#64748b', fontWeight: 600 }}>Tổng Người dùng</span>}
              value={stats.totalUsers}
              prefix={<UserOutlined style={{ color: '#667eea' }} />}
              valueStyle={{ color: '#667eea', fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card style={{ 
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.1) 100%)',
            borderLeft: '4px solid #10B981',
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.15)'
          }} hoverable>
            <Statistic
              title={<span style={{ color: '#64748b', fontWeight: 600 }}>Lớp học Đang mở</span>}
              value={stats.totalClasses}
              prefix={<ReadOutlined style={{ color: '#10B981' }} />}
              valueStyle={{ color: '#10B981', fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card style={{ 
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.1) 100%)',
            borderLeft: '4px solid #EF4444',
            boxShadow: '0 4px 12px rgba(239, 68, 68, 0.15)'
          }} hoverable>
            <Statistic
              title={<span style={{ color: '#64748b', fontWeight: 600 }}>Bài nộp hôm nay</span>}
              value={stats.submissionsToday}
              prefix={<SolutionOutlined style={{ color: '#EF4444' }} />}
              suffix={<ArrowUpOutlined style={{ fontSize: 16, color: '#10B981' }} />}
              valueStyle={{ color: '#EF4444', fontWeight: 700 }}
            />
          </Card>
        </Col>
      </Row>

      {/* KHỐI HOẠT ĐỘNG GẦN ĐÂY */}
      <div style={{ marginTop: 24 }}>
        <Card title="Hoạt động gần đây" variant="outlined">
          {activities.length > 0 ? (
          <List
            itemLayout="horizontal"
            dataSource={activities}
            renderItem={(item) => (
              <List.Item>
                <List.Item.Meta
                  avatar={<Avatar src={`https://api.dicebear.com/7.x/miniavs/svg?seed=${item.title}`} />}
                  title={item.title}
                  description={item.time}
                />
              </List.Item>
            )}
          />
          ) : (
            <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
              Chưa có hoạt động nào gần đây
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
