import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, message, Tabs, Modal } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, IdcardOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../../utils/api';

const { Title } = Typography;

const RegisterPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const onFinish = async (values) => {
    setLoading(true);
    try {
      // Chuẩn hóa role theo enum VaiTro: Admin, Teacher, Student
      const role = values.role === 'Student' ? 'Student' : 
                   values.role === 'Teacher' ? 'Teacher' : 'Student';
      
      const userData = {
        name: values.name,
        email: values.email,
        password: values.password,
        role: role,
        mssv: values.mssv || null,
      };

      console.log('🔵 Attempting register with:', { ...userData, password: '***' });
      const response = await authAPI.register(userData);
      
      console.log('🟢 Register response:', response);
      console.log('🟢 Has error?', !!response.error);
      
      if (response && response.error) {
        const errorMsg = typeof response.error === 'string' 
          ? response.error 
          : (response.error.message || JSON.stringify(response.error));
        console.error('❌ Register error:', errorMsg);
        setLoading(false);
        
        // Hiển thị modal lỗi
        setErrorMessage(errorMsg);
        setErrorModalVisible(true);
        return;
      }

      if (response && response.token) {
        message.success('Đăng ký thành công! Vui lòng đăng nhập.');
        navigate('/login');
      } else {
        console.warn('⚠️ Unexpected response format:', response);
        message.warning('Đăng ký thành công nhưng response không đúng định dạng.');
        navigate('/login');
      }
    } catch (error) {
      console.error('Register error:', error);
      setLoading(false);
      const errorMsg = error.message || 'Đăng ký thất bại. Vui lòng kiểm tra console để xem chi tiết lỗi!';
      setErrorMessage(errorMsg);
      setErrorModalVisible(true);
    } finally {
      setLoading(false);
    }
  };

  // Form Fields chung
  const renderCommonFields = () => (
    <>
      <Form.Item name="name" rules={[{ required: true, message: 'Vui lòng nhập họ tên!' }]}>
        <Input prefix={<UserOutlined />} placeholder="Họ và tên" />
      </Form.Item>
      <Form.Item name="email" rules={[{ required: true, type: 'email', message: 'Email không hợp lệ!' }]}>
        <Input prefix={<MailOutlined />} placeholder="Email" />
      </Form.Item>
      <Form.Item name="password" rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}>
        <Input.Password prefix={<LockOutlined />} placeholder="Mật khẩu" />
      </Form.Item>
      <Form.Item
        name="confirm"
        dependencies={['password']}
        hasFeedback
        rules={[
          { required: true, message: 'Vui lòng xác nhận mật khẩu!' },
          ({ getFieldValue }) => ({
            validator(_, value) {
              if (!value || getFieldValue('password') === value) return Promise.resolve();
              return Promise.reject(new Error('Mật khẩu xác nhận không khớp!'));
            },
          }),
        ]}
      >
        <Input.Password prefix={<LockOutlined />} placeholder="Xác nhận mật khẩu" />
      </Form.Item>
    </>
  );

  const items = [
    {
      key: 'student',
      label: 'Sinh viên',
      children: (
        <Form name="student_register" onFinish={(values) => onFinish({ ...values, role: 'Student' })} size="large" layout="vertical">
          {renderCommonFields()}
          <Form.Item name="mssv" rules={[{ required: true, message: 'Vui lòng nhập MSSV!' }]}>
            <Input prefix={<IdcardOutlined />} placeholder="Mã số Sinh viên" />
          </Form.Item>
          <Button type="primary" htmlType="submit" block loading={loading} style={{ 
            background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
            border: 'none',
            height: 48,
            fontSize: '15px',
            fontWeight: 'bold',
            borderRadius: '12px',
            boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)'
          }}>
            Đăng ký Sinh viên
          </Button>
        </Form>
      ),
    },
    {
      key: 'teacher',
      label: 'Giáo viên',
      children: (
        <Form name="teacher_register" onFinish={(values) => onFinish({ ...values, role: 'Teacher' })} size="large" layout="vertical">
          {renderCommonFields()}
          <Form.Item name="department" rules={[{ required: true, message: 'Vui lòng nhập Khoa/Viện!' }]}>
            <Input prefix={<IdcardOutlined />} placeholder="Khoa / Viện công tác" />
          </Form.Item>
          <Button type="primary" htmlType="submit" block loading={loading} style={{ 
            background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
            border: 'none',
            height: 48,
            fontSize: '15px',
            fontWeight: 'bold',
            borderRadius: '12px',
            boxShadow: '0 4px 15px rgba(59, 130, 246, 0.4)'
          }}>
            Đăng ký Giáo viên
          </Button>
        </Form>
      ),
    },
  ];

  return (
    <div style={{
      display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Animated background circles */}
      <div style={{
        position: 'absolute',
        width: '400px',
        height: '400px',
        borderRadius: '50%',
        background: 'rgba(255, 255, 255, 0.1)',
        top: '-200px',
        right: '-200px',
        animation: 'float 20s infinite ease-in-out'
      }} />
      <div style={{
        position: 'absolute',
        width: '250px',
        height: '250px',
        borderRadius: '50%',
        background: 'rgba(255, 255, 255, 0.08)',
        bottom: '-125px',
        left: '-125px',
        animation: 'float 15s infinite ease-in-out reverse'
      }} />
      
      <Card style={{ 
        width: 450, 
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)', 
        borderRadius: 20,
        backdropFilter: 'blur(10px)',
        background: 'rgba(255, 255, 255, 0.95)',
        marginTop: 20, 
        marginBottom: 20,
        position: 'relative',
        zIndex: 1
      }}>
        <div style={{ textAlign: 'center', marginBottom: 25 }}>
          <div style={{
            width: '70px',
            height: '70px',
            margin: '0 auto 15px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '36px',
            boxShadow: '0 8px 25px rgba(102, 126, 234, 0.4)'
          }}>
            ✨
          </div>
          <Title level={2} style={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            margin: 0,
            fontWeight: 700
          }}>ĐĂNG KÝ TÀI KHOẢN</Title>
        </div>
        <Tabs defaultActiveKey="student" items={items} centered />
        <div style={{ textAlign: 'center', marginTop: 20, color: '#64748b' }}>
          Đã có tài khoản? <Link to="/login" style={{fontWeight: 'bold', color: '#6366F1', textDecoration: 'none'}}>Đăng nhập ngay</Link>
        </div>
      </Card>

      {/* Modal hiển thị lỗi */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '24px' }}>⚠️</span>
            <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#ff4d4f' }}>Lỗi đăng ký</span>
          </div>
        }
        open={errorModalVisible}
        onOk={() => setErrorModalVisible(false)}
        onCancel={() => setErrorModalVisible(false)}
        okText="Đóng"
        cancelButtonProps={{ style: { display: 'none' } }}
        width={520}
        centered
        styles={{
          header: {
            borderBottom: '1px solid #ffccc7',
            paddingBottom: '16px',
          },
          body: {
            padding: '24px',
          },
          footer: {
            borderTop: '1px solid #f0f0f0',
            paddingTop: '12px',
          }
        }}
      >
        <div style={{
          color: '#595959',
          fontSize: '15px',
          padding: '20px',
          backgroundColor: '#fff2f0',
          border: '1px solid #ffccc7',
          borderRadius: '8px',
          lineHeight: '1.8',
          marginBottom: '8px',
        }}>
          {errorMessage}
        </div>
      </Modal>
    </div>
  );
};

export default RegisterPage;