import React, { useState, useEffect } from 'react';
import { Table, Tag, Space, Button, Modal, Form, Input, Select, message, Popconfirm, Switch, Row, Col } from 'antd';
import { EditOutlined, DeleteOutlined, UserAddOutlined, StopOutlined, CheckCircleOutlined, SearchOutlined } from '@ant-design/icons';
import { userAPI, notificationAPI } from '../../utils/api';

const { Option } = Select;

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Filter states
  const [searchText, setSearchText] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchText, selectedRole]);

  const loadUsers = async () => {
    try {
      const data = await userAPI.getAll();
      setUsers(data.map(u => ({ ...u, key: u.id.toString() })));
    } catch (error) {
      console.error('Error loading users:', error);
      message.error('Không thể tải danh sách người dùng');
    }
  };

  const filterUsers = () => {
    let filtered = [...users];

    // Filter by search text (name or email)
    if (searchText) {
      filtered = filtered.filter(user =>
        user.name.toLowerCase().includes(searchText.toLowerCase()) ||
        user.email.toLowerCase().includes(searchText.toLowerCase()) ||
        (user.mssv && user.mssv.toLowerCase().includes(searchText.toLowerCase()))
      );
    }

    // Filter by role
    if (selectedRole !== 'all') {
      filtered = filtered.filter(user => user.role === selectedRole);
    }

    setFilteredUsers(filtered);
  };

  const handleSearchChange = (e) => {
    setSearchText(e.target.value);
  };

  const handleRoleFilterChange = (value) => {
    setSelectedRole(value);
  };

  const resetFilters = () => {
    setSearchText('');
    setSelectedRole('all');
  };

  // 2. XỬ LÝ THÊM / SỬA
  const handleAddOrUpdate = async (values) => {
    setLoading(true);
    try {
      if (editingUser) {
        // Logic SỬA
        const result = await userAPI.update(editingUser.id, values);
        console.log('🔵 Update user result:', result);
        if (result && result.error) {
          const errorMsg = typeof result.error === 'string' ? result.error : (result.error.message || JSON.stringify(result.error));
          console.error('❌ Update user error:', errorMsg);
          setLoading(false);
          // Hiển thị thông báo lỗi bằng message.error trước
          message.error(errorMsg, 5);
          // Sau đó hiển thị modal error để đảm bảo người dùng thấy
          setTimeout(() => {
            Modal.error({
              title: 'Lỗi cập nhật người dùng',
              content: errorMsg,
              okText: 'Đóng',
              width: 500,
              onOk: () => {
                setIsModalOpen(false);
              },
            });
          }, 100);
          return;
        }
        setIsModalOpen(false);
        form.resetFields();
        setEditingUser(null);
        message.success('Cập nhật thông tin thành công!');
        loadUsers();
      } else {
        // Logic THÊM MỚI
        const newUser = {
          name: values.name,
          email: values.email,
          role: values.role,
          password: values.password || '123456', // Default password
          mssv: values.mssv || null,
        };
        console.log('🔵 Creating new user:', { ...newUser, password: '***' });
        const result = await userAPI.create(newUser);
        console.log('🔵 Create user result:', result);
        if (result && result.error) {
          const errorMsg = typeof result.error === 'string' ? result.error : (result.error.message || JSON.stringify(result.error));
          console.error('❌ Create user error:', errorMsg);
          setLoading(false);
          
          // Đóng modal form
          setIsModalOpen(false);
          
          // Set error message và hiển thị modal lỗi
          setErrorMessage(errorMsg);
          // Đợi một chút để modal form đóng hoàn toàn
          setTimeout(() => {
            setErrorModalVisible(true);
          }, 300);
          return;
        }
        setIsModalOpen(false);
        form.resetFields();
        setEditingUser(null);
        message.success('Thêm người dùng mới thành công!');
        
        // Tạo thông báo cho user mới
        if (result && result.id) {
          try {
            await notificationAPI.create(
              result.id,
              '🎉 Chào mừng bạn đến với HUST Classroom!',
              `Tài khoản ${values.role === 'Student' ? 'sinh viên' : values.role === 'Teacher' ? 'giáo viên' : 'quản trị viên'} của bạn đã được tạo thành công. Email: ${values.email}`,
              values.role.toLowerCase()
            );
          } catch (notifError) {
            console.error('⚠️ Failed to create welcome notification:', notifError);
          }
        }
        
        loadUsers();
      }
    } catch (error) {
      console.error('Error saving user:', error);
      message.error({
        content: 'Lưu người dùng thất bại: ' + (error.message || error),
        duration: 6,
      });
    } finally {
      setLoading(false);
    }
  };

  // 3. XỬ LÝ XÓA
  const handleDelete = async (id) => {
    try {
      console.log('🔵 Deleting user with id:', id);
      const result = await userAPI.delete(id);
      console.log('🔵 Delete user result:', result);
      
      if (result && result.error) {
        const errorMsg = typeof result.error === 'string' ? result.error : (result.error.message || JSON.stringify(result.error));
        console.error('❌ Delete user error:', errorMsg);
        setErrorMessage(errorMsg);
        setTimeout(() => {
          setErrorModalVisible(true);
        }, 300);
        return;
      }
      
      message.success('Đã xóa người dùng khỏi hệ thống');
      loadUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      const errorMsg = error.message || 'Xóa người dùng thất bại';
      setErrorMessage(errorMsg);
      setTimeout(() => {
        setErrorModalVisible(true);
      }, 300);
    }
  };

  // 4. XỬ LÝ VÔ HIỆU HÓA / KÍCH HOẠT (Toggle Status) - Removed vì schema mới không có status
  const toggleStatus = async (record) => {
    message.info('Tính năng này đã được loại bỏ trong schema mới');
  };

  const openModal = (record = null) => {
    setEditingUser(record);
    if (record) {
      form.setFieldsValue(record);
    } else {
      form.resetFields();
    }
    setIsModalOpen(true);
  };

  const columns = [
    {
      title: 'Họ Tên',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <span style={{ opacity: record.status === 'inactive' ? 0.5 : 1 }}>
            <b>{text}</b>
        </span>
      ),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Vai trò',
      key: 'role',
      dataIndex: 'role',
      render: (role) => {
        let color = role === 'Teacher' ? 'geekblue' : 'green';
        if (role === 'Admin') color = 'volcano';
        const roleMap = { 'Student': 'Sinh viên', 'Teacher': 'Giáo viên', 'Admin': 'Admin' };
        return <Tag color={color}>{roleMap[role] || role}</Tag>;
      },
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button type="primary" ghost size="small" icon={<EditOutlined />} onClick={() => openModal(record)}>Sửa</Button>
          <Popconfirm title="Xóa vĩnh viễn tài khoản này?" onConfirm={() => handleDelete(record.id)}>
            <Button type="primary" danger size="small" icon={<DeleteOutlined />}>Xóa</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '20px', background: 'linear-gradient(135deg, rgba(241, 245, 249, 0.6) 0%, rgba(248, 250, 252, 0.8) 100%)', borderRadius: '12px', minHeight: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ color: '#1e293b' }}>Quản lý Tài khoản</h2>
        <Button type="primary" icon={<UserAddOutlined />} onClick={() => openModal(null)}>
          Thêm Người dùng
        </Button>
      </div>

      {/* Search and Filter Section */}
      <div style={{ 
        marginBottom: 24, 
        padding: '20px', 
        background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)',
        borderRadius: '12px',
        border: '1px solid rgba(102, 126, 234, 0.1)'
      }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={24} md={12} lg={10}>
            <Input
              size="large"
              placeholder="Tìm kiếm theo tên, email, hoặc MSSV..."
              prefix={<SearchOutlined style={{ color: '#667eea' }} />}
              value={searchText}
              onChange={handleSearchChange}
              allowClear
              style={{ borderRadius: '8px' }}
            />
          </Col>
          <Col xs={24} sm={12} md={6} lg={6}>
            <Select
              size="large"
              placeholder="Lọc theo vai trò"
              value={selectedRole}
              onChange={handleRoleFilterChange}
              style={{ width: '100%', borderRadius: '8px' }}
            >
              <Option value="all">Tất cả vai trò</Option>
              <Option value="Student">Sinh viên</Option>
              <Option value="Teacher">Giáo viên</Option>
              <Option value="Admin">Quản trị viên</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={6} lg={8}>
            <Space>
              <Button onClick={resetFilters} style={{ borderRadius: '8px' }}>
                Đặt lại
              </Button>
              <Tag color="purple" style={{ padding: '4px 12px', fontSize: '14px' }}>
                Tìm thấy: <b>{filteredUsers.length}</b> / {users.length} người dùng
              </Tag>
            </Space>
          </Col>
        </Row>
      </div>

      <Table 
        columns={columns} 
        dataSource={filteredUsers} 
        pagination={{ 
          pageSize: 10,
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50'],
          showTotal: (total) => `Tổng ${total} người dùng`
        }} 
      />

      <Modal
        title={editingUser ? "Cập nhật thông tin" : "Thêm người dùng mới"}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={loading}
      >
        <Form form={form} layout="vertical" onFinish={handleAddOrUpdate}>
          <Form.Item name="name" label="Họ và tên" rules={[{ required: true, message: 'Vui lòng nhập tên!' }]}>
            <Input placeholder="Ví dụ: Nguyễn Văn A" />
          </Form.Item>

          <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
            <Input placeholder="Ví dụ: a@sis.hust.edu.vn" />
          </Form.Item>

          <Form.Item name="role" label="Vai trò" rules={[{ required: true }]}>
            <Select placeholder="Chọn vai trò">
              <Option value="Student">Sinh viên</Option>
              <Option value="Teacher">Giáo viên</Option>
              <Option value="Admin">Quản trị viên</Option>
            </Select>
          </Form.Item>
          
          {!editingUser && (
            <Form.Item name="password" label="Mật khẩu" rules={[{ required: true }]}>
              <Input.Password placeholder="Mật khẩu mặc định: 123456" />
            </Form.Item>
          )}

          <Form.Item name="mssv" label="Mã số SV (Nếu có)">
            <Input placeholder="Chỉ nhập cho sinh viên" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal hiển thị lỗi */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '24px' }}>⚠️</span>
            <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#ff4d4f' }}>Lỗi</span>
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

export default UserManagement;