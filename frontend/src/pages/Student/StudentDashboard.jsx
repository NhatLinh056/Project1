import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, List, Progress, Timeline, Button, Spin, message, Tag } from 'antd';
import { TrophyOutlined, BookOutlined, ClockCircleOutlined, FireOutlined, CheckCircleOutlined, FileTextOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { gradingAPI, classAPI, assignmentAPI } from '../../utils/api';
import { formatDate, formatDateTime, formatRelativeTime } from '../../utils/dateUtils';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState('Sinh viên');
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [assignmentFilter, setAssignmentFilter] = useState('all'); // 'all', 'submitted', 'notSubmitted'
  const [stats, setStats] = useState({
    gpa: 0,
    credits: 0,
    pendingAssignments: 0,
  });

  useEffect(() => {
    const savedUser = localStorage.getItem('user_info');
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      setUserName(parsed.name);
    }
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const userInfo = JSON.parse(localStorage.getItem('user_info') || '{}');
      
      if (!userInfo.id) {
        return;
      }

      // Load classes để tính credits và lấy assignments
      const classes = await classAPI.getAll(userInfo.id, 'Student');
      console.log('🔵 Classes loaded:', classes);
      
      // Load submissions của student
      const submissionsData = await gradingAPI.getSubmissions(null, userInfo.id, null);
      console.log('🔵 Submissions loaded:', submissionsData);
      setSubmissions(Array.isArray(submissionsData) ? submissionsData : []);
      
      // Load assignments từ tất cả các lớp
      const allAssignments = [];
      if (Array.isArray(classes)) {
        for (const classItem of classes) {
          try {
            const classAssignments = await assignmentAPI.getByClass(classItem.classID || classItem.id);
            const assignmentsWithClass = (Array.isArray(classAssignments) ? classAssignments : [])
              .filter(a => a.type === 'ASSIGNMENT') // Chỉ lấy bài tập, không lấy tài liệu
              .map(a => ({
                ...a,
                classId: classItem.classID || classItem.id,
                className: classItem.tenLop || classItem.name || 'Lớp học',
                classCode: classItem.maThamGia || classItem.code || '',
              }));
            allAssignments.push(...assignmentsWithClass);
          } catch (error) {
            console.error('❌ Error loading assignments for class:', classItem.classID, error);
          }
        }
      }
      console.log('🔵 All assignments loaded:', allAssignments);
      setAssignments(allAssignments);
      
      // Tính toán stats
      const gradedSubmissions = submissionsData.filter(s => s.trangThai === 'Graded' && s.diem);
      const totalScore = gradedSubmissions.reduce((sum, s) => sum + parseFloat(s.diem || 0), 0);
      const avgScore = gradedSubmissions.length > 0 ? totalScore / gradedSubmissions.length : 0;
      const gpa = (avgScore / 10) * 4; // Convert to 4.0 scale
      
      // Tính pending assignments (bài tập chưa nộp)
      const submittedAssignmentTitles = new Set(
        submissionsData
          .filter(s => s.tenBaiTap)
          .map(s => s.tenBaiTap)
      );
      const pendingCount = allAssignments.filter(a => !submittedAssignmentTitles.has(a.title)).length;

      setStats({
        gpa: gpa.toFixed(2),
        credits: classes.length * 3, // Giả sử mỗi lớp 3 tín chỉ
        pendingAssignments: pendingCount,
      });

      // Tạo hoạt động gần đây từ submissions
      // Loại bỏ trùng lặp: chỉ lấy submission mới nhất hoặc đã chấm cho mỗi bài tập
      const uniqueSubmissions = new Map();
      
      submissionsData.forEach(sub => {
        const key = `${sub.studentID || sub.student?.id}_${sub.lopHocID || sub.classId}_${sub.tenBaiTap}`;
        const existing = uniqueSubmissions.get(key);
        
        if (!existing) {
          uniqueSubmissions.set(key, sub);
        } else {
          // Nếu submission hiện tại đã được chấm, ưu tiên nó
          if (sub.trangThai === 'Graded' && sub.diem && (!existing.trangThai || existing.trangThai !== 'Graded')) {
            uniqueSubmissions.set(key, sub);
          } 
          // Nếu cả hai đều chưa chấm hoặc đều đã chấm, giữ lại submission mới nhất
          else if (sub.submittedAt && existing.submittedAt) {
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
      
      const activities = [];
      
      // Hoạt động: Nộp bài tập (chỉ từ unique submissions)
      uniqueSubmissionsList
        .filter(s => s.submittedAt)
        .forEach(sub => {
          activities.push({
            type: 'submitted',
            title: `Đã nộp bài tập: ${sub.tenBaiTap || 'Bài tập'}`,
            time: sub.submittedAt,
            classId: sub.lopHocID || sub.classId,
            className: sub.lopHoc?.tenLop || `Lớp học số ${sub.lopHocID || sub.classId}`,
          });
        });
      
      // Hoạt động: Nhận kết quả chấm bài (chỉ từ unique submissions)
      uniqueSubmissionsList
        .filter(s => s.trangThai === 'Graded' && s.gradedAt)
        .forEach(sub => {
          activities.push({
            type: 'graded',
            title: `Nhận kết quả chấm bài: ${sub.tenBaiTap || 'Bài tập'}`,
            time: sub.gradedAt,
            score: sub.diem,
            feedback: sub.nhanXet,
            classId: sub.lopHocID || sub.classId,
            className: sub.lopHoc?.tenLop || `Lớp học số ${sub.lopHocID || sub.classId}`,
          });
        });
      
      // Sắp xếp theo thời gian (mới nhất trước)
      activities.sort((a, b) => {
        const timeA = new Date(a.time).getTime();
        const timeB = new Date(b.time).getTime();
        return timeB - timeA;
      });
      
      setRecentActivities(activities.slice(0, 10)); // Lấy 10 hoạt động gần nhất
    } catch (error) {
      console.error('❌ Error loading dashboard data:', error);
      message.error('Không thể tải dữ liệu bảng điều khiển');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', background: 'linear-gradient(135deg, rgba(241, 245, 249, 0.6) 0%, rgba(248, 250, 252, 0.8) 100%)', borderRadius: '12px', minHeight: '100%' }}>
      <h2 style={{ marginBottom: 24, color: '#1e293b' }}>Chào {userName}, chúc bạn một ngày học tập hiệu quả!</h2>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Spin size="large" />
        </div>
      ) : (
        <>
      {/* KHỐI THỐNG KÊ */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <Card bordered={false} style={{ 
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(217, 119, 6, 0.1) 100%)',
            borderLeft: '4px solid #F59E0B',
            boxShadow: '0 4px 12px rgba(245, 158, 11, 0.15)'
          }} hoverable>
                <Statistic 
                  title={<span style={{ color: '#64748b', fontWeight: 600 }}>Điểm trung bình tích lũy</span>}
                  value={parseFloat(stats.gpa)} 
                  precision={2} 
                  prefix={<TrophyOutlined style={{ color: '#F59E0B' }} />} 
                  suffix="/ 4.0" 
                  valueStyle={{ color: '#F59E0B', fontWeight: 700 }} 
                />
                <Progress percent={(parseFloat(stats.gpa) / 4) * 100} showInfo={false} strokeColor="#F59E0B" size="small" />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card bordered={false} style={{ 
            background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
            borderLeft: '4px solid #667eea',
            boxShadow: '0 4px 12px rgba(102, 126, 234, 0.15)'
          }} hoverable>
                <Statistic 
                  title={<span style={{ color: '#64748b', fontWeight: 600 }}>Số lớp đã tham gia</span>}
                  value={stats.credits / 3} 
                  prefix={<BookOutlined style={{ color: '#667eea' }} />} 
                  valueStyle={{ color: '#667eea', fontWeight: 700 }} 
                />
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 8 }}>Tổng tín chỉ: {stats.credits}</div>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card bordered={false} style={{ 
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.1) 100%)',
            borderLeft: '4px solid #EF4444',
            boxShadow: '0 4px 12px rgba(239, 68, 68, 0.15)'
          }} hoverable>
                <Statistic 
                  title={<span style={{ color: '#64748b', fontWeight: 600 }}>Bài tập chưa nộp</span>}
                  value={stats.pendingAssignments} 
                  prefix={<FireOutlined style={{ color: '#EF4444' }} />} 
                  valueStyle={{ color: '#EF4444', fontWeight: 700 }} 
                />
            <div style={{ fontSize: 12, color: '#888', marginTop: 8 }}>Đừng để trễ deadline nhé!</div>
          </Card>
        </Col>
      </Row>

      <Row gutter={24} style={{ marginTop: 24 }}>
            {/* CỘT TRÁI: BÀI TẬP & HẠN NỘP */}
        <Col xs={24} md={16}>
              <Card 
                title="📅 Bài tập & Hạn nộp" 
                bordered={false}
                extra={
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Button 
                      size="small" 
                      type={assignmentFilter === 'all' ? 'primary' : 'default'}
                      onClick={() => setAssignmentFilter('all')}
                    >
                      Tất cả
                    </Button>
                    <Button 
                      size="small" 
                      type={assignmentFilter === 'submitted' ? 'primary' : 'default'}
                      onClick={() => setAssignmentFilter('submitted')}
                    >
                      Đã nộp
                    </Button>
                    <Button 
                      size="small" 
                      type={assignmentFilter === 'notSubmitted' ? 'primary' : 'default'}
                      onClick={() => setAssignmentFilter('notSubmitted')}
                    >
                      Chưa nộp
                    </Button>
                  </div>
                }
              >
                {(() => {
                  // Lấy danh sách bài tập đã nộp
                  const submittedTitles = new Set(
                    submissions
                      .filter(s => s.tenBaiTap)
                      .map(s => s.tenBaiTap)
                  );
                  
                  // Lọc bài tập theo filter
                  let filteredAssignments = assignments;
                  if (assignmentFilter === 'submitted') {
                    filteredAssignments = assignments.filter(a => submittedTitles.has(a.title));
                  } else if (assignmentFilter === 'notSubmitted') {
                    filteredAssignments = assignments.filter(a => !submittedTitles.has(a.title));
                  }
                  
                  // Sắp xếp: chưa nộp trước, sau đó đến đã nộp
                  filteredAssignments.sort((a, b) => {
                    const aSubmitted = submittedTitles.has(a.title);
                    const bSubmitted = submittedTitles.has(b.title);
                    if (aSubmitted !== bSubmitted) {
                      return aSubmitted ? 1 : -1; // Chưa nộp trước
                    }
                    // Nếu cùng trạng thái, sắp xếp theo dueDate
                    if (a.dueDate && b.dueDate) {
                      return new Date(a.dueDate) - new Date(b.dueDate);
                    }
                    return 0;
                  });
                  
                  if (filteredAssignments.length === 0) {
                    return (
                      <p style={{ textAlign: 'center', color: '#999', padding: '20px' }}>
                        {assignmentFilter === 'submitted' 
                          ? 'Chưa có bài tập nào đã nộp.'
                          : assignmentFilter === 'notSubmitted'
                          ? 'Tất cả bài tập đã được nộp! 🎉'
                          : 'Không có bài tập nào.'}
                      </p>
                    );
                  }
                  
                  return (
            <List
              itemLayout="horizontal"
                      dataSource={filteredAssignments}
                      renderItem={(item) => {
                        const isSubmitted = submittedTitles.has(item.title);
                        const submission = submissions.find(s => s.tenBaiTap === item.title);
                        const isOverdue = item.dueDate && new Date(item.dueDate) < new Date() && !isSubmitted;
                        
                        return (
                          <List.Item 
                            actions={[
                              <Button 
                                type="primary" 
                                size="small" 
                                danger={isOverdue}
                                onClick={() => navigate(`/student/class/${item.classId}`)}
                              >
                                {isSubmitted ? 'Xem chi tiết' : 'Nộp bài'}
                              </Button>
                            ]}
                          >
                  <List.Item.Meta
                              avatar={
                                isSubmitted ? (
                                  <CheckCircleOutlined style={{ fontSize: 24, color: '#52c41a' }} />
                                ) : (
                                  <ClockCircleOutlined style={{ fontSize: 24, color: isOverdue ? '#ff4d4f' : '#1890ff' }} />
                                )
                              }
                              title={
                                <div>
                                  <span>{item.title}</span>
                                  {isSubmitted && (
                                    <Tag color="success" style={{ marginLeft: 8 }}>Đã nộp</Tag>
                                  )}
                                  {isOverdue && (
                                    <Tag color="error" style={{ marginLeft: 8 }}>Quá hạn</Tag>
                                  )}
                                </div>
                              }
                              description={
                                <div>
                                  <div>Lớp: <b>{item.className}</b> ({item.classCode})</div>
                                  {item.dueDate && (
                                    <div style={{ color: isOverdue ? '#ff4d4f' : '#666', marginTop: 4 }}>
                                      Hạn nộp: {formatDate(item.dueDate)}
                                      {isOverdue && ' (Đã quá hạn)'}
                                    </div>
                                  )}
                                  {isSubmitted && submission?.submittedAt && (
                                    <div style={{ color: '#52c41a', marginTop: 4 }}>
                                      Đã nộp: {formatDateTime(submission.submittedAt)}
                                    </div>
                                  )}
                                  {isSubmitted && submission?.diem && (
                                    <div style={{ color: '#1890ff', marginTop: 4, fontWeight: 'bold' }}>
                                      Điểm: {submission.diem}/10
                                    </div>
                                  )}
                                </div>
                              }
                  />
                </List.Item>
                        );
                      }}
            />
                  );
                })()}
          </Card>
        </Col>

            {/* CỘT PHẢI: HOẠT ĐỘNG GẦN ĐÂY */}
        <Col xs={24} md={8}>
          <Card title="🕒 Hoạt động gần đây" bordered={false}>
                {recentActivities.length === 0 ? (
                  <p style={{ textAlign: 'center', color: '#999', padding: '20px' }}>
                    Chưa có hoạt động nào.
                  </p>
                ) : (
                  <Timeline 
                    items={recentActivities.map(activity => {
                      let color = '#1890ff';
                      let icon = <FileTextOutlined />;
                      
                      if (activity.type === 'submitted') {
                        color = '#52c41a';
                        icon = <CheckCircleOutlined />;
                      } else if (activity.type === 'graded') {
                        color = '#faad14';
                        icon = <TrophyOutlined />;
                      }
                      
                      return {
                        color: color,
                        children: (
                          <div>
                            <div style={{ fontWeight: 'bold', marginBottom: 4 }}>
                              {activity.title}
                            </div>
                            <div style={{ fontSize: '12px', color: '#666' }}>
                              {activity.className}
                            </div>
                            {activity.score !== null && activity.score !== undefined && (
                              <div style={{ fontSize: '12px', color: '#1890ff', marginTop: 4, fontWeight: 'bold' }}>
                                Điểm: {activity.score}/10
                              </div>
                            )}
                            <div style={{ fontSize: '11px', color: '#999', marginTop: 4 }}>
                              {formatRelativeTime(activity.time)}
                            </div>
                          </div>
                        ),
                      };
                    })} 
                  />
                )}
          </Card>
        </Col>
      </Row>
        </>
      )}
    </div>
  );
};

export default StudentDashboard;