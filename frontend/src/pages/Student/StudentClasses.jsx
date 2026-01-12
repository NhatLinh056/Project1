import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Input, Modal, message, Progress, Tag } from 'antd';
import { ArrowRightOutlined, PlusCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { classAPI, notificationAPI } from '../../utils/api';

const StudentClasses = () => {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [joinCode, setJoinCode] = useState('');

  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    try {
      const userInfo = JSON.parse(localStorage.getItem('user_info') || '{}');
      console.log('🔵 Loading classes for student:', userInfo.id);
      
      if (!userInfo.id) {
        console.error('❌ No user ID found');
        message.error('Không tìm thấy thông tin người dùng! Vui lòng đăng nhập lại.');
        return;
      }
      
      const data = await classAPI.getAll(userInfo.id, 'Student');
      console.log('🔵 Classes loaded:', data);
      setClasses(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('❌ Error loading classes:', error);
      message.error('Không thể tải danh sách lớp học');
      setClasses([]);
    }
  };

  const handleJoinClass = async () => {
    if (!joinCode) return message.error('Vui lòng nhập mã lớp!');

    try {
      const userInfo = JSON.parse(localStorage.getItem('user_info') || '{}');
      
      if (!userInfo.id) {
        message.error('Không tìm thấy thông tin người dùng! Vui lòng đăng nhập lại.');
        return;
      }
      
      console.log('🔵 Joining class with code:', joinCode);
      const response = await classAPI.enroll(userInfo.id, joinCode);
      
      console.log('🔵 Join class response:', response);
      
      if (response.error) {
        const errorMsg = typeof response.error === 'string' 
          ? response.error 
          : JSON.stringify(response.error);
        message.error(errorMsg);
        return;
      }
      
      const className = response.class?.tenLop || response.class?.name || 'Thành công';
      message.success(`Đã tham gia lớp học: ${className}`);
      
      // Gửi thông báo cho giáo viên
      try {
        if (response.class && response.class.giaoVienID) {
          await notificationAPI.create(
            response.class.giaoVienID,
            `👥 Sinh viên mới tham gia lớp`,
            `Sinh viên ${userInfo.name || userInfo.email} vừa tham gia lớp ${className}`,
            'teacher'
          );
          console.log('✅ Sent join notification to teacher');
        }
      } catch (notifError) {
        console.error('⚠️ Failed to notify teacher:', notifError);
      }
      
      setIsModalOpen(false);
      setJoinCode('');
      
      // Reload danh sách lớp
      setTimeout(() => {
        loadClasses();
      }, 500);
    } catch (error) {
      console.error('❌ Error joining class:', error);
      message.error('Tham gia lớp học thất bại: ' + (error.message || 'Lỗi không xác định'));
    }
  };

  return (
    <div style={{ padding: '20px', background: 'linear-gradient(135deg, rgba(241, 245, 249, 0.6) 0%, rgba(248, 250, 252, 0.8) 100%)', borderRadius: '12px', minHeight: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ color: '#1e293b', margin: 0 }}>Lớp học của tôi</h2>
        <Button type="primary" size="large" icon={<PlusCircleOutlined />} onClick={() => setIsModalOpen(true)}>
            Tham gia lớp mới
        </Button>
      </div>

      <Row gutter={[16, 16]}>
        {classes.map((cls) => (
          <Col xs={24} sm={12} md={8} key={cls.classID || cls.id}>
            <Card
              hoverable
              style={{
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 1) 100%)',
                border: '1px solid rgba(102, 126, 234, 0.2)',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                transition: 'all 0.3s ease'
              }}
              headStyle={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                fontWeight: 'bold',
                borderRadius: '12px 12px 0 0'
              }}
              title={cls.tenLop || cls.name}
              extra={
                <Button 
                  type="text" 
                  style={{ color: 'white', fontWeight: 'bold' }}
                  onClick={() => navigate(`/student/class/${cls.classID || cls.id}`)}
                >
                  Vào học <ArrowRightOutlined />
                </Button>
              }
            >
              <div style={{ padding: '8px 0' }}>
                <p style={{ marginBottom: '8px' }}>
                  <Tag color="blue" style={{ fontSize: '13px', padding: '4px 12px' }}>
                    Mã: <b>{cls.maThamGia || cls.code || 'Không có'}</b>
                  </Tag>
                </p>
                {cls.moTa && <p style={{ color: '#64748b', fontSize: '14px' }}>{cls.moTa}</p>}
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Modal Nhập mã lớp */}
      <Modal title="Tham gia lớp học" open={isModalOpen} onOk={handleJoinClass} onCancel={() => setIsModalOpen(false)}>
        <p>Vui lòng nhập mã tham gia do giảng viên cung cấp:</p>
        <Input
            placeholder="Ví dụ: HUST_PRJ1"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
        />
      </Modal>
    </div>
  );
};

export default StudentClasses;