import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Card, Typography, message, Modal, Alert } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI, testConnection } from '../../utils/api';

const { Title } = Typography;

const LoginPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [backendConnected, setBackendConnected] = useState(null);

  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);

  useEffect(() => {
    // Test backend connection on mount
    testConnection().then(connected => {
      setBackendConnected(connected);
      if (!connected) {
        message.warning('Không thể kết nối đến backend! Vui lòng đảm bảo backend đang chạy tại http://localhost:5000');
      }
    });
  }, []);

  // --- XỬ LÝ ĐĂNG NHẬP ---
  const onFinish = async (values) => {
    setLoading(true);
    try {
      const { email, password } = values;
      
      console.log('🔵 Attempting login with:', { email });
      const response = await authAPI.login(email, password);
      
      console.log('🟢 Login response:', response);
      
      if (response.error) {
        // Hiển thị lỗi chi tiết hơn
        const errorMsg = typeof response.error === 'string' 
          ? response.error 
          : JSON.stringify(response.error);
        console.error('❌ Login error:', errorMsg);
        
        // DEBUG: Alert để đảm bảo code chạy được
        alert('LỖI: ' + errorMsg);
        
        // Hiển thị thông báo lỗi dễ hiểu hơn
        if (errorMsg.includes('Unauthorized') || errorMsg.includes('401')) {
          message.error({
            content: '❌ Email hoặc mật khẩu không chính xác!',
            duration: 4,
          });
        } else if (errorMsg.includes('Không thể kết nối')) {
          message.error({
            content: '❌ Không thể kết nối đến server! Vui lòng kiểm tra backend đã chạy chưa.',
            duration: 5,
          });
        } else {
          message.error({
            content: `❌ ${errorMsg}`,
            duration: 5,
          });
        }
        setLoading(false);
        return;
      }

      if (!response.token || !response.user) {
        message.error({
          content: '❌ Phản hồi từ server không hợp lệ! Vui lòng kiểm tra backend.',
          duration: 4,
        });
        setLoading(false);
        return;
      }

      // Lưu token và user info
      localStorage.setItem('token', response.token);
      localStorage.setItem('user_info', JSON.stringify(response.user));
      window.dispatchEvent(new Event("user-update"));

      // Điều hướng theo role (Admin, Teacher, Student)
      const role = response.user.role;
      if (role === 'Admin') {
        message.success('✅ Chào mừng Admin!');
        navigate('/admin');
      } else if (role === 'Teacher') {
        message.success(`✅ Chào mừng ${response.user.name}!`);
        navigate('/teacher');
      } else if (role === 'Student') {
        message.success(`✅ Chào mừng ${response.user.name}!`);
        navigate('/student');
      } else {
        message.success(`✅ Chào mừng ${response.user.name}!`);
        navigate('/student');
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      message.error({
        content: '❌ Đăng nhập thất bại! Vui lòng kiểm tra console để xem chi tiết lỗi.',
        duration: 4,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendResetLink = async (values) => {
    setForgotLoading(true);
    try {
      console.log('🔵 Requesting password reset for:', values.email);
      const response = await authAPI.forgotPassword(values.email);
      
      if (response.error) {
        message.error(response.error);
        setForgotLoading(false);
        return;
      }
      
      // Hiển thị thông báo thành công
      message.success({
        content: `Mật khẩu mới đã được gửi về email: ${values.email}`,
        duration: 5,
      });
      
      // Trong môi trường dev, hiển thị mật khẩu mới trong console
      if (response.newPassword) {
        console.log('🔐 Mật khẩu mới (dev only):', response.newPassword);
        console.log('📧 Email:', values.email);
      }
      
      setIsForgotModalOpen(false);
    } catch (error) {
      console.error('Error sending reset link:', error);
      message.error('Không thể gửi yêu cầu quên mật khẩu. Vui lòng thử lại!');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Animated background circles */}
      <div style={{
        position: 'absolute',
        width: '500px',
        height: '500px',
        borderRadius: '50%',
        background: 'rgba(255, 255, 255, 0.1)',
        top: '-250px',
        right: '-250px',
        animation: 'float 20s infinite ease-in-out'
      }} />
      <div style={{
        position: 'absolute',
        width: '300px',
        height: '300px',
        borderRadius: '50%',
        background: 'rgba(255, 255, 255, 0.08)',
        bottom: '-150px',
        left: '-150px',
        animation: 'float 15s infinite ease-in-out reverse'
      }} />
      
      <Card style={{ 
        width: 420, 
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)', 
        borderRadius: 20,
        backdropFilter: 'blur(10px)',
        background: 'rgba(255, 255, 255, 0.95)',
        position: 'relative',
        zIndex: 1
      }} bordered={false}>

        {/* --- TIÊU ĐỀ HIỆN ĐẠI --- */}
        <div style={{ textAlign: 'center', marginBottom: 35 }}>
          <div style={{
            width: '80px',
            height: '80px',
            margin: '0 auto 20px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '40px',
            boxShadow: '0 10px 30px rgba(102, 126, 234, 0.4)'
          }}>
            🎓
          </div>
          <Title level={2} style={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            margin: 0,
            fontWeight: 700,
            letterSpacing: '1px'
          }}>HUST CLASSROOM</Title>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '8px' }}>Hệ thống quản lý lớp học thông minh</p>
        </div>

        {/* Backend connection warning */}
        {backendConnected === false && (
          <Alert
            message="Backend chưa kết nối"
            description="Vui lòng chạy backend tại port 5000 trước khi đăng nhập!"
            type="error"
            showIcon
            style={{ marginBottom: 20 }}
          />
        )}

        <Form 
          name="login_form" 
          initialValues={{ remember: true }} 
          onFinish={onFinish} 
          onFinishFailed={(errorInfo) => {
            console.error('Form validation failed:', errorInfo);
          }}
          size="large"
        >
          <Form.Item 
            name="email" 
            rules={[
              { required: true, message: 'Vui lòng nhập Email!' }, 
              { type: 'email', message: 'Email không đúng định dạng!' }
            ]}
          >
            <Input 
              prefix={<UserOutlined className="site-form-item-icon" />} 
              placeholder="Email" 
              disabled={loading}
            />
          </Form.Item>

          <Form.Item 
            name="password" 
            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
          >
            <Input.Password 
              prefix={<LockOutlined className="site-form-item-icon" />} 
              placeholder="Mật khẩu" 
              disabled={loading}
            />
          </Form.Item>

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              className="login-form-button" 
              block 
              loading={loading} 
              disabled={backendConnected === false}
              style={{ 
                height: '48px',
                fontSize: '16px',
                fontWeight: 'bold',
                borderRadius: '12px',
                letterSpacing: '1px'
              }}
            >
              {loading ? 'Đang xử lý...' : 'ĐĂNG NHẬP'}
            </Button>
          </Form.Item>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px' }}>
             <a onClick={() => setIsForgotModalOpen(true)} style={{ 
               color: '#6366F1', 
               cursor: 'pointer',
               fontWeight: 500,
               textDecoration: 'none'
             }}>Quên mật khẩu?</a>
            <Link to="/register" style={{ 
              color: '#10B981', 
              fontWeight: 'bold',
              textDecoration: 'none'
            }}>Đăng ký ngay</Link>
          </div>
        </Form>
      </Card>

      <Modal title="Khôi phục mật khẩu" open={isForgotModalOpen} onCancel={() => setIsForgotModalOpen(false)} footer={null}>
        <p>Vui lòng nhập email đã đăng ký để nhận liên kết đặt lại mật khẩu.</p>
        <Form onFinish={handleSendResetLink} layout="vertical">
            <Form.Item name="email" rules={[{ required: true, message: 'Vui lòng nhập email!', type: 'email' }]}>
                <Input prefix={<MailOutlined />} placeholder="Nhập email của bạn" />
            </Form.Item>
            <Form.Item>
                <Button type="primary" htmlType="submit" block loading={forgotLoading}>Gửi yêu cầu</Button>
            </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default LoginPage;