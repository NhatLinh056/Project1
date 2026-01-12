import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, List, Avatar, Button, Spin, Empty } from 'antd';
import { ReadOutlined, TeamOutlined, FormOutlined, RightOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { classAPI } from '../../utils/api';

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState({ name: 'Giáo viên' });
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalClasses: 0,
    totalStudents: 0,
    recentClasses: []
  });

  useEffect(() => {
    // Lấy thông tin user
    const savedUser = localStorage.getItem('user_info');
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      setUserInfo(parsed);
    }

    // Load thống kê
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const userInfo = JSON.parse(localStorage.getItem('user_info') || '{}');
      
      // Lấy danh sách lớp học
      const classes = await classAPI.getAll(userInfo.id, 'Teacher');
      
      // Tính tổng số sinh viên từ tất cả các lớp
      let totalStudents = 0;
      const studentsPromises = classes.map(cls => classAPI.getStudents(cls.classID || cls.id));
      const studentsArrays = await Promise.all(studentsPromises);
      totalStudents = studentsArrays.reduce((sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0), 0);
      
      // Lấy 3 lớp gần nhất
      const recentClasses = classes.slice(0, 3);
      
      setStats({
        totalClasses: classes.length,
        totalStudents: totalStudents,
        recentClasses: recentClasses
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', background: 'linear-gradient(135deg, rgba(241, 245, 249, 0.6) 0%, rgba(248, 250, 252, 0.8) 100%)', borderRadius: '12px', minHeight: '100%' }}>
      <h2 style={{ marginBottom: 24, color: '#1e293b' }}>Xin chào, {userInfo.name || 'Giáo viên'}</h2>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <Spin size="large" />
          <p style={{ marginTop: '10px' }}>Đang tải thống kê...</p>
        </div>
      ) : (
        <>
          {/* THỐNG KÊ NHANH */}
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={8}>
              <Card bordered={false} style={{ 
                background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                borderLeft: '4px solid #667eea',
                transition: 'all 0.3s ease'
              }} hoverable>
                <Statistic
                  title={<span style={{ color: '#64748b', fontWeight: 600 }}>Lớp đang dạy</span>}
                  value={stats.totalClasses}
                  prefix={<ReadOutlined style={{ color: '#667eea' }} />}
                  valueStyle={{ color: '#667eea', fontWeight: 700 }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card bordered={false} style={{ 
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.1) 100%)',
                borderLeft: '4px solid #10B981',
                transition: 'all 0.3s ease'
              }} hoverable>
                <Statistic
                  title={<span style={{ color: '#64748b', fontWeight: 600 }}>Tổng Sinh viên</span>}
                  value={stats.totalStudents}
                  prefix={<TeamOutlined style={{ color: '#10B981' }} />}
                  valueStyle={{ color: '#10B981', fontWeight: 700 }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card bordered={false} style={{ 
                background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.1) 100%)',
                borderLeft: '4px solid #EF4444',
                transition: 'all 0.3s ease'
              }} hoverable>
                <Statistic
                  title={<span style={{ color: '#64748b', fontWeight: 600 }}>Bài cần chấm</span>}
                  value={0}
                  prefix={<FormOutlined style={{ color: '#EF4444' }} />}
                  valueStyle={{ color: '#EF4444', fontWeight: 700 }}
                />
              </Card>
            </Col>
          </Row>

          <div style={{ marginTop: 24 }}>
            <Row gutter={24}>
              {/* CỘT TRÁI: Lớp học gần đây */}
              <Col xs={24} md={16}>
                <Card 
                  title="📚 Lớp học của tôi" 
                  bordered={false}
                  extra={<Button type="link" onClick={() => navigate('/teacher/classes')}>Xem tất cả <RightOutlined /></Button>}
                >
                  {stats.recentClasses.length === 0 ? (
                    <Empty description="Chưa có lớp học nào" />
                  ) : (
                    <List
                      itemLayout="horizontal"
                      dataSource={stats.recentClasses}
                      renderItem={(item) => (
                        <List.Item 
                          actions={[
                            <Button type="link" onClick={() => navigate(`/teacher/class/${item.classID || item.id}`)}>
                              Vào lớp <RightOutlined />
                            </Button>
                          ]}
                        >
                          <List.Item.Meta
                            avatar={<Avatar style={{ backgroundColor: '#1890ff' }} icon={<ReadOutlined />} />}
                            title={item.tenLop || item.name}
                            description={
                              <span>
                                Mã tham gia: <b>{item.maThamGia || item.code || 'Không có'}</b>
                                {item.moTa && <span> - {item.moTa}</span>}
                              </span>
                            }
                          />
                        </List.Item>
                      )}
                    />
                  )}
                </Card>
              </Col>

              {/* CỘT PHẢI: Thông báo */}
              <Col xs={24} md={8}>
                <Card title="🔔 Thông báo" bordered={false}>
                  <div style={{ color: '#999', fontSize: '14px' }}>
                    <p>Chưa có thông báo mới.</p>
                    <p style={{ marginTop: '10px', fontSize: '12px' }}>
                      Thông báo sẽ hiển thị tại đây khi có cập nhật.
                    </p>
                  </div>
                </Card>
              </Col>
            </Row>
          </div>
        </>
      )}
    </div>
  );
};

export default TeacherDashboard;