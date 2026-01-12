import React, { useState, useEffect } from 'react';
import { List, Avatar, Button, Card, Tag, message, Spin } from 'antd';
import { BellOutlined, CheckCircleOutlined, ReadOutlined, UserAddOutlined, SafetyCertificateOutlined, WarningOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { notificationAPI } from '../../utils/api';
import { formatRelativeTime } from '../../utils/dateUtils';

const AdminNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const getUserInfo = () => {
    try {
      const userInfoStr = localStorage.getItem('user_info');
      return userInfoStr ? JSON.parse(userInfoStr) : null;
    } catch (error) {
      console.error('Error parsing userInfo:', error);
      return null;
    }
  };

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

    const interval = setInterval(() => {
      loadNotifications();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleMarkRead = async (id) => {
    const updatedList = notifications.map(item =>
      item.id === id ? { ...item, read: true } : item
    );
    setNotifications(updatedList);

    try {
      await notificationAPI.markAsRead(id);
      message.success('Đã đánh dấu là đã đọc');
    } catch (error) {
      console.error('❌ Error marking as read:', error);
      message.error('Không thể đánh dấu đã đọc');
      setNotifications(notifications);
    }
  };

  const handleMarkAllRead = async () => {
    const userInfo = getUserInfo();
    if (!userInfo || !userInfo.id) {
      message.error('Không tìm thấy thông tin người dùng');
      return;
    }

    const updatedList = notifications.map(item => ({ ...item, read: true }));
    setNotifications(updatedList);

    try {
      await notificationAPI.markAllAsRead(userInfo.id);
      message.success('Đã đọc tất cả thông báo');
    } catch (error) {
      console.error('❌ Error marking all as read:', error);
      message.error('Không thể đánh dấu tất cả đã đọc');
      setNotifications(notifications);
    }
  };

  const getIcon = (title) => {
    if (title.includes('bảo trì') || title.includes('Bảo trì') || title.includes('vi phạm') || title.includes('Vi phạm')) return <BellOutlined />;
    if (title.includes('người dùng') || title.includes('Người dùng')) return <UserAddOutlined />;
    if (title.includes('sao lưu') || title.includes('Sao lưu')) return <CheckCircleOutlined />;
    return <SafetyCertificateOutlined />;
  };

  const getColor = (title) => {
    if (title.includes('bảo trì') || title.includes('Bảo trì') || title.includes('vi phạm') || title.includes('Vi phạm')) return '#ff4d4f';
    if (title.includes('người dùng') || title.includes('Người dùng')) return '#1890ff';
    if (title.includes('sao lưu') || title.includes('Sao lưu')) return '#52c41a';
    return '#faad14';
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ margin: 0 }}>🔔 Thông báo Hệ thống (Admin)</h2>
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
                    background: item.read ? '#fff' : '#fff1f0',
                    padding: 15,
                    borderRadius: 8,
                    marginBottom: 10,
                    transition: 'all 0.3s',
                    borderLeft: item.read ? '1px solid #f0f0f0' : '3px solid #ff4d4f'
                }}
              >
                <List.Item.Meta
                  avatar={
                    <Avatar
                      icon={getIcon(item.title)}
                      style={{ backgroundColor: item.read ? '#d9d9d9' : getColor(item.title) }}
                    />
                  }
                  title={
                      <span style={{ fontWeight: item.read ? 'normal' : 'bold', color: item.read ? 'inherit' : '#cf1322' }}>
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

export default AdminNotifications;
