import React, { useState, useEffect } from 'react';
import { List, Avatar, Button, Card, Tag, message, Spin } from 'antd';
import { BellOutlined, CheckCircleOutlined, ReadOutlined, WarningOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { notificationAPI } from '../../utils/api';
import { formatRelativeTime, formatDateTime } from '../../utils/dateUtils';

const StudentNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Lấy userInfo từ localStorage
  const getUserInfo = () => {
    try {
      const userInfoStr = localStorage.getItem('user_info');
      return userInfoStr ? JSON.parse(userInfoStr) : null;
    } catch (error) {
      console.error('Error parsing userInfo:', error);
      return null;
    }
  };

  // Load notifications từ API
  const loadNotifications = async () => {
    const userInfo = getUserInfo();
    if (!userInfo || !userInfo.id) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const data = await notificationAPI.getByUser(userInfo.id);
      console.log('🔵 Loaded notifications:', data);
      
      const formattedNotifications = data.map(notif => ({
        id: notif.id,
        title: notif.title,
        desc: notif.description || '',
        read: notif.read || false,
        createdAt: notif.createdAt,
        role: notif.role || 'all'
      }));
      
      setNotifications(formattedNotifications);
    } catch (error) {
      console.error('❌ Error loading notifications:', error);
      message.error('Không thể tải thông báo');
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();

    // Auto-refresh mỗi 30 giây để cập nhật thời gian thực
    const interval = setInterval(() => {
      loadNotifications();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Hàm xử lý khi bấm nút "Đánh dấu đã đọc"
  const handleMarkRead = async (id) => {
    // Cập nhật UI ngay lập tức
    const updatedList = notifications.map(item => {
      if (item.id === id) {
        return { ...item, read: true };
      }
      return item;
    });
    setNotifications(updatedList);

    // Gọi API
    try {
      await notificationAPI.markAsRead(id);
      message.success('Đã đánh dấu là đã đọc');
    } catch (error) {
      console.error('❌ Error marking as read:', error);
      message.error('Không thể đánh dấu đã đọc');
      // Revert lại state
      setNotifications(notifications);
    }
  };

  // Hàm đánh dấu tất cả là đã đọc
  const handleMarkAllRead = async () => {
    const userInfo = getUserInfo();
    if (!userInfo || !userInfo.id) {
      message.error('Không tìm thấy thông tin người dùng');
      return;
    }

    // Cập nhật UI ngay lập tức
    const updatedList = notifications.map(item => ({ ...item, read: true }));
    setNotifications(updatedList);

    // Gọi API
    try {
      await notificationAPI.markAllAsRead(userInfo.id);
      message.success('Đã đọc tất cả thông báo');
    } catch (error) {
      console.error('❌ Error marking all as read:', error);
      message.error('Không thể đánh dấu tất cả đã đọc');
      // Revert lại state
      setNotifications(notifications);
    }
  };

  const getIcon = (title) => {
    if (title.includes('vắng') || title.includes('Vắng')) return <WarningOutlined style={{ color: 'red' }} />;
    if (title.includes('Muộn') || title.includes('muộn')) return <InfoCircleOutlined style={{ color: 'orange' }} />;
    return <BellOutlined style={{ color: '#1890ff' }} />;
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ margin: 0 }}>🔔 Tất cả thông báo</h2>
        <Button icon={<ReadOutlined />} onClick={handleMarkAllRead}>Đọc tất cả</Button>
      </div>

      <Card>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <Spin size="large" />
          </div>
        ) : (
          <List
            itemLayout="horizontal"
            dataSource={notifications}
            renderItem={(item) => (
              <List.Item
                actions={[
                  item.read ? (
                      <Tag color="default" icon={<CheckCircleOutlined />}>Đã đọc</Tag>
                  ) : (
                      <Button type="link" size="small" onClick={() => handleMarkRead(item.id)}>
                          Đánh dấu đã đọc
                      </Button>
                  )
                ]}
                style={{
                    background: item.read ? '#fff' : '#f0f5ff',
                    padding: 15,
                    borderRadius: 8,
                    marginBottom: 10,
                    transition: 'all 0.3s'
                }}
              >
                <List.Item.Meta
                  avatar={
                    <Avatar
                      icon={getIcon(item.title)}
                      style={{ backgroundColor: item.read ? '#d9d9d9' : '#1890ff' }}
                    />
                  }
                  title={
                      <span style={{ fontWeight: item.read ? 'normal' : 'bold', color: item.read ? 'inherit' : '#1890ff' }}>
                          {item.title}
                      </span>
                  }
                  description={
                      <div>
                          <div style={{ color: '#555' }}>{item.desc}</div>
                          <div style={{ fontSize: 12, color: '#999', marginTop: 5 }}>
                            {item.createdAt ? formatRelativeTime(item.createdAt) : ''}
                          </div>
                      </div>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Card>
    </div>
  );
};

export default StudentNotifications;