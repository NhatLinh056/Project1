import React, { useState, useEffect } from 'react';
import { Layout, Menu, Button, theme, Avatar, Space, Dropdown, Modal } from 'antd';
import { ReadOutlined, SolutionOutlined, UserOutlined, MenuFoldOutlined, MenuUnfoldOutlined, LogoutOutlined, HomeOutlined } from '@ant-design/icons';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import NotificationBell from '../components/NotificationBell';
import MyBreadcrumb from '../components/MyBreadcrumb';
import { doLogout } from '../utils/logout';

const { Header, Sider, Content } = Layout;

const TeacherLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [userInfo, setUserInfo] = useState({ name: 'Giáo viên', avatar: null });
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { token: { colorBgContainer, borderRadiusLG } } = theme.useToken();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const updateUserData = () => {
      const savedUser = localStorage.getItem('user_info');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        setUserInfo({ name: parsed.name, avatar: parsed.avatar });
      }
    };
    updateUserData();
    window.addEventListener('user-update', updateUserData);
    return () => window.removeEventListener('user-update', updateUserData);
  }, []);

  // --- SỬA LẠI PHẦN XỬ LÝ MENU ---
  const handleMenuClick = (e) => {
    const key = e?.key || e?.keyPath?.[0];
    
    // Đóng dropdown ngay lập tức
    setDropdownOpen(false);
    
    if (key === 'logout') {
      // Logout trực tiếp không cần modal xác nhận
      console.log('🔴 Logout clicked, calling doLogout directly');
      doLogout(navigate);
    } else if (key === 'profile') {
      navigate('/teacher/profile');
    }
  };

  const userMenuItems = [
    { 
      key: 'profile', 
      label: 'Hồ sơ cá nhân', 
      icon: <UserOutlined />
    },
    { type: 'divider' },
    { 
      key: 'logout', 
      label: 'Đăng xuất', 
      icon: <LogoutOutlined />, 
      danger: true
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider 
        trigger={null} 
        collapsible 
        collapsed={collapsed} 
        style={{ 
          background: 'linear-gradient(180deg, #5563d1 0%, #6b46a0 100%)',
          boxShadow: '2px 0 12px rgba(85, 99, 209, 0.4)'
        }}
      >
        <div style={{ height: 64, margin: 16, display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold', color: 'white', fontSize: collapsed ? '14px' : '16px' }}>{collapsed ? 'GV' : 'Giáo viên'}</div>
        <Menu 
          theme="dark" 
          mode="inline" 
          defaultSelectedKeys={[location.pathname]} 
          onClick={({ key }) => navigate(key)}
          style={{ background: 'transparent', borderRight: 'none' }}
          items={[
            { key: '/teacher', icon: <HomeOutlined />, label: 'Trang chủ' },
            { key: '/teacher/classes', icon: <ReadOutlined />, label: 'Lớp học của tôi' },
            { key: '/teacher/grading', icon: <SolutionOutlined />, label: 'Chấm bài' },
          ]}
        />
      </Sider>
      <Layout>
        <Header style={{ padding: '0 24px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Button type="text" icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />} onClick={() => setCollapsed(!collapsed)} style={{ fontSize: '16px', width: 64, height: 64, color: 'white' }} />
          <Space size="large">
            <NotificationBell role="teacher" />

            {/* Dropdown menu với onClick handler */}
            <Dropdown 
              menu={{ 
                items: userMenuItems,
                onClick: handleMenuClick
              }}
              trigger={['click']}
              open={dropdownOpen}
              onOpenChange={setDropdownOpen}
            >
              <Space style={{ cursor: 'pointer', color: 'white' }}>
                <Avatar style={{ backgroundColor: '#1890ff' }} icon={<UserOutlined />} src={userInfo.avatar} />
                <span style={{ color: 'white' }}>{userInfo.name}</span>
              </Space>
            </Dropdown>
          </Space>
        </Header>
        <Content style={{ margin: '16px', padding: '24px', background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.95) 100%)', borderRadius: '16px', minHeight: '500px' }}>
          <MyBreadcrumb />
          <div style={{ marginTop: '16px' }}>
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default TeacherLayout;