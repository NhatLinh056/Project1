import React, { useState, useEffect } from 'react';
import { Card, Avatar, Button, Form, Input, Upload, message, Row, Col, Divider, Tabs } from 'antd';
import { UserOutlined, UploadOutlined, LockOutlined, MailOutlined, SaveOutlined } from '@ant-design/icons';
import { userAPI } from '../../utils/api';

const UserProfile = () => {
  const [loading, setLoading] = useState(false);

  // Khởi tạo state từ LocalStorage (nếu có), nếu không thì dùng mặc định
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user_info');
    return savedUser ? JSON.parse(savedUser) : {
      name: 'Nguyễn Quang Linh',
      email: 'linh.nq20236041@sis.hust.edu.vn',
      avatar: null,
      role: 'Sinh viên'
    };
  });

  // Hàm hỗ trợ lưu vào LocalStorage và báo cho Header biết
  const saveUserData = (newData) => {
    setUser(newData);
    localStorage.setItem('user_info', JSON.stringify(newData));
    // Bắn sự kiện để Header cập nhật ngay lập tức mà không cần F5
    window.dispatchEvent(new Event("user-update"));
  };

  // 1. XỬ LÝ UPLOAD ẢNH
  const customUpload = ({ file, onSuccess }) => {
    setLoading(true);
    setTimeout(() => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const newUser = { ...user, avatar: reader.result };
            saveUserData(newUser); // Lưu ngay
            setLoading(false);
            message.success('Tải ảnh đại diện thành công!');
            onSuccess("ok");
        };
    }, 1000);
  };

  // 2. CẬP NHẬT THÔNG TIN
  const handleUpdateInfo = async (values) => {
    try {
      setLoading(true);
      const userInfo = JSON.parse(localStorage.getItem('user_info') || '{}');
      
      if (!userInfo.id) {
        message.error('Không tìm thấy thông tin người dùng!');
        return;
      }
      
      console.log('🔵 Updating user info:', values);
      const response = await userAPI.update(userInfo.id, values);
      
      if (response.error) {
        message.error(response.error);
        return;
      }
      
      // Cập nhật thông tin user trong localStorage
      const newUser = { ...user, ...values };
      saveUserData(newUser);
      message.success('Cập nhật thông tin thành công!');
    } catch (error) {
      console.error('Error updating info:', error);
      message.error('Cập nhật thông tin thất bại!');
    } finally {
      setLoading(false);
    }
  };

  // 3. ĐỔI MẬT KHẨU
  const handleChangePassword = async (values) => {
    try {
      setLoading(true);
      const userInfo = JSON.parse(localStorage.getItem('user_info') || '{}');
      
      if (!userInfo.id) {
        message.error('Không tìm thấy thông tin người dùng!');
        return;
      }
      
      console.log('🔵 Changing password for user:', userInfo.id);
      const response = await userAPI.changePassword(
        userInfo.id,
        values.oldPass,
        values.newPass
      );
      
      console.log('🔵 Change password response:', response);
      
      if (response.error) {
        const errorMsg = typeof response.error === 'string' 
          ? response.error 
          : JSON.stringify(response.error);
        message.error(errorMsg);
        return;
      }
      
      message.success('Đổi mật khẩu thành công!');
      
      // Reset form bằng cách force re-render tab
      window.location.reload(); // Reload để đảm bảo form được reset
    } catch (error) {
      console.error('Error changing password:', error);
      message.error('Đổi mật khẩu thất bại: ' + (error.message || 'Lỗi không xác định'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <h2 style={{ marginBottom: 24 }}>Hồ sơ cá nhân</h2>
      <Row gutter={24}>
        <Col xs={24} md={8} style={{ textAlign: 'center', marginBottom: 20 }}>
          <Card>
            <div style={{ marginBottom: 20 }}>
                <Avatar size={120} icon={<UserOutlined />} src={user.avatar} />
            </div>
            <Upload customRequest={customUpload} showUploadList={false}>
                <Button icon={<UploadOutlined />} loading={loading}>Đổi ảnh đại diện</Button>
            </Upload>
            <Divider />
            <h3>{user.name}</h3>
            <p style={{ color: '#888' }}>{user.role}</p>
          </Card>
        </Col>
        <Col xs={24} md={16}>
          <Card>
            <Tabs defaultActiveKey="1" items={[
                {
                    key: '1', label: 'Thông tin chung',
                    children: (
                        <Form layout="vertical" initialValues={user} onFinish={handleUpdateInfo} key={user.name}>
                            <Form.Item name="name" label="Họ và Tên"><Input prefix={<UserOutlined />} /></Form.Item>
                            <Form.Item name="email" label="Email"><Input prefix={<MailOutlined />} disabled /></Form.Item>
                            <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={loading}>Lưu thay đổi</Button>
                        </Form>
                    )
                },
                {
                    key: '2', label: 'Đổi mật khẩu',
                    children: (
                        <Form layout="vertical" onFinish={handleChangePassword} key="password-form">
                            <Form.Item 
                                name="oldPass" 
                                label="Mật khẩu cũ" 
                                rules={[{ required: true, message: 'Vui lòng nhập mật khẩu cũ!' }]}
                            >
                                <Input.Password prefix={<LockOutlined />} placeholder="Nhập mật khẩu cũ" />
                            </Form.Item>
                            <Form.Item 
                                name="newPass" 
                                label="Mật khẩu mới" 
                                rules={[
                                    { required: true, message: 'Vui lòng nhập mật khẩu mới!' },
                                    { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự!' }
                                ]}
                            >
                                <Input.Password prefix={<LockOutlined />} placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)" />
                            </Form.Item>
                            <Form.Item 
                                name="confirmPass" 
                                label="Xác nhận mật khẩu mới" 
                                dependencies={['newPass']}
                                rules={[
                                    { required: true, message: 'Vui lòng xác nhận mật khẩu mới!' },
                                    ({ getFieldValue }) => ({
                                        validator(_, value) {
                                            if (!value || getFieldValue('newPass') === value) {
                                                return Promise.resolve();
                                            }
                                            return Promise.reject(new Error('Mật khẩu xác nhận không khớp!'));
                                        },
                                    }),
                                ]}
                            >
                                <Input.Password prefix={<LockOutlined />} placeholder="Nhập lại mật khẩu mới" />
                            </Form.Item>
                            <Button type="primary" danger htmlType="submit" loading={loading}>Đổi mật khẩu</Button>
                        </Form>
                    )
                }
            ]} />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default UserProfile;