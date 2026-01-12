import React, { useState, useEffect } from 'react';
import { Popover, Badge, Button, List, Typography, Spin } from 'antd';
import { BellOutlined, WarningOutlined, InfoCircleOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { notificationAPI } from '../utils/api';
import { formatRelativeTime } from '../utils/dateUtils';

const { Text } = Typography;

const NotificationBell = ({ role }) => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

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

  // --- HÀM LOAD THÔNG BÁO TỪ API ---
  const loadNotifications = async () => {
    const userInfo = getUserInfo();
    if (!userInfo || !userInfo.id) {
      console.warn('⚠️ No user info found');
      setNotifications([]);
      return;
    }

    setLoading(true);
    try {
      console.log('🔵 Fetching notifications for user:', userInfo.id);
      const data = await notificationAPI.getByUser(userInfo.id);
      console.log('🔵 Notifications data:', data);
      
      // Chuyển đổi dữ liệu từ API sang format hiển thị
      const formattedNotifications = data.map(notif => ({
        id: notif.id,
        title: notif.title,
        desc: notif.description || '',
        read: notif.read || false,
        createdAt: notif.createdAt,
        role: notif.role || 'all'
      }));
      
      console.log('🔵 Formatted notifications:', formattedNotifications);
      
      // Sắp xếp: Chưa đọc lên trước, sau đó theo thời gian mới nhất
      formattedNotifications.sort((a, b) => {
        if (a.read !== b.read) {
          return a.read ? 1 : -1; // Chưa đọc lên trên
        }
        return new Date(b.createdAt) - new Date(a.createdAt); // Mới nhất lên trên
      });
      
      setNotifications(formattedNotifications);
      console.log('🔵 Unread count:', formattedNotifications.filter(n => !n.read).length);
    } catch (error) {
      console.error('❌ Error loading notifications:', error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();

    // Auto-refresh mỗi 30 giây để cập nhật thời gian thực
    const interval = setInterval(() => {
      const userInfo = getUserInfo();
      // Chỉ load nếu user vẫn đang đăng nhập
      if (userInfo && userInfo.id) {
        loadNotifications();
      }
    }, 30000);

    // Cleanup interval khi component unmount (khi logout)
    return () => {
      clearInterval(interval);
      console.log('🔴 NotificationBell cleanup: interval cleared');
    };
  }, [role]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAsRead = async (id) => {
    // Cập nhật UI ngay lập tức
    const updatedList = notifications.map(item => item.id === id ? { ...item, read: true } : item);
    setNotifications(updatedList);

    // Gọi API để đánh dấu đã đọc
    try {
      await notificationAPI.markAsRead(id);
    } catch (error) {
      console.error('❌ Error marking as read:', error);
      // Nếu lỗi, revert lại state
      setNotifications(notifications);
    }
  };

  const handleViewAll = () => {
    setOpen(false);
    navigate(`/${role}/notifications`);
  };

  const getIcon = (title) => {
    const iconStyle = { fontSize: 18, color: 'white' };
    
    if (title.includes('vắng') || title.includes('Vắng')) {
      return <WarningOutlined style={iconStyle} />;
    }
    if (title.includes('chấm') || title.includes('Điểm') || title.includes('điểm')) {
      return <CheckCircleOutlined style={iconStyle} />;
    }
    if (title.includes('bài tập') || title.includes('Bài tập')) {
      return <InfoCircleOutlined style={iconStyle} />;
    }
    if (title.includes('nộp bài') || title.includes('Nộp bài')) {
      return <CheckCircleOutlined style={iconStyle} />;
    }
    if (title.includes('vào lớp') || title.includes('tham gia')) {
      return <InfoCircleOutlined style={iconStyle} />;
    }
    return <BellOutlined style={iconStyle} />;
  };

  const content = (
    <div style={{ width: 380, maxHeight: 500 }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        padding: '16px 20px', 
        borderBottom: '1px solid #f0f0f0',
        background: '#fafafa'
      }}>
        <Text strong style={{ fontSize: 16 }}>🔔 Thông báo</Text>
        {unreadCount > 0 && (
          <Text type="secondary" style={{ fontSize: 13 }}>
            {unreadCount} chưa đọc
          </Text>
        )}
      </div>
      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <Spin />
        </div>
      ) : notifications.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
          <BellOutlined style={{ fontSize: 48, marginBottom: 16, opacity: 0.3 }} />
          <div>Không có thông báo mới</div>
        </div>
      ) : (
        <List
          dataSource={notifications}
          renderItem={(item) => (
            <List.Item
              onClick={() => handleMarkAsRead(item.id)}
              style={{
                padding: '16px 20px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                background: item.read ? 'white' : '#fffbe6',
                borderBottom: '1px solid #f0f0f0',
                borderLeft: item.read ? 'none' : '4px solid #faad14'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = item.read ? '#fafafa' : '#fff7e6';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = item.read ? 'white' : '#fffbe6';
              }}
            >
              <List.Item.Meta
                avatar={
                  <div style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    background: item.read ? '#f0f0f0' : '#faad14',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {getIcon(item.title)}
                  </div>
                }
                title={
                  <div>
                    <div style={{ 
                      fontWeight: item.read ? 'normal' : 'bold', 
                      fontSize: 14,
                      marginBottom: 4,
                      color: item.read ? '#595959' : '#000'
                    }}>
                      {item.title}
                    </div>
                  </div>
                }
                description={
                  <div>
                    <div style={{ 
                      fontSize: 13, 
                      color: item.read ? '#8c8c8c' : '#595959',
                      marginBottom: 6,
                      lineHeight: 1.5
                    }}>
                      {item.desc}
                    </div>
                    <div style={{ 
                      fontSize: 12, 
                      color: '#bfbfbf',
                      fontStyle: 'italic'
                    }}>
                      {item.createdAt ? formatRelativeTime(item.createdAt) : ''}
                    </div>
                  </div>
                }
              />
            </List.Item>
          )}
          style={{ maxHeight: 400, overflowY: 'auto' }}
        />
      )}
      <div style={{ borderTop: '1px solid #f0f0f0', padding: '12px 20px', background: '#fafafa' }}>
        <Button type="link" block onClick={handleViewAll} style={{ fontWeight: 500 }}>
          Xem tất cả →
        </Button>
      </div>
    </div>
  );

  return (
    <Popover 
      content={content} 
      trigger="click" 
      open={open} 
      onOpenChange={setOpen} 
      placement="bottomRight" 
      overlayStyle={{ zIndex: 1050 }}
      overlayInnerStyle={{ padding: 0 }}
    >
      <Badge 
        count={unreadCount} 
        offset={[-5, 5]}
        style={{ 
          cursor: 'pointer',
          backgroundColor: '#ff4d4f',
          boxShadow: '0 0 0 1px #fff'
        }}
      >
        <Button 
          type="text" 
          icon={<BellOutlined style={{ fontSize: 20, color: 'white' }} />}
          style={{ 
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        />
      </Badge>
    </Popover>
  );
};

export default NotificationBell;