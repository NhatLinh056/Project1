import React, { useState } from 'react';
import { Button, Card, message } from 'antd';

const TestConnection = () => {
  const [testing, setTesting] = useState(false);

  const testBackend = async () => {
    setTesting(true);
    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: 'test@test.com', password: 'test' }),
      });
      
      const data = await response.json();
      console.log('Response status:', response.status);
      console.log('Response data:', data);
      
      if (response.ok) {
        message.success('Backend đang chạy! (Có thể sai thông tin đăng nhập nhưng server đã phản hồi)');
      } else {
        message.warning(`Backend đang chạy nhưng có lỗi: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Connection error:', error);
      message.error('Không thể kết nối đến backend! Vui lòng kiểm tra:\n1. Backend đã chạy chưa?\n2. Port 5000 có đang được sử dụng không?\n3. Database đã được tạo chưa?');
    } finally {
      setTesting(false);
    }
  };

  return (
    <Card style={{ margin: 20 }}>
      <h2>Test Backend Connection</h2>
      <Button type="primary" onClick={testBackend} loading={testing}>
        Test Connection
      </Button>
      <p style={{ marginTop: 10 }}>
        Mở Console (F12) để xem chi tiết lỗi nếu có
      </p>
    </Card>
  );
};

export default TestConnection;

