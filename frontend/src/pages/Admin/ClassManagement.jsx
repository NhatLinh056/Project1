import React, { useState, useEffect } from 'react';
import { Table, Tag, Button, Space, Popconfirm, message, Input, Modal, Form, Select } from 'antd';
import { DeleteOutlined, SearchOutlined, EditOutlined, SwapOutlined } from '@ant-design/icons';
import { classAPI, userAPI } from '../../utils/api';

const { Option } = Select;

const ClassManagement = () => {
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadClasses();
    loadTeachers();
  }, []);

  const loadClasses = async () => {
    try {
      const data = await classAPI.getAll();
      setClasses(data.map(c => ({ ...c, key: (c.classID || c.id).toString() })));
    } catch (error) {
      console.error('Error loading classes:', error);
      message.error('Không thể tải danh sách lớp học');
    }
  };

  const loadTeachers = async () => {
    try {
      const users = await userAPI.getAll();
      const teacherUsers = users.filter(u => u.role === 'Teacher');
      setTeachers(teacherUsers);
    } catch (error) {
      console.error('Error loading teachers:', error);
    }
  };

  // 2. XỬ LÝ XÓA LỚP
  const handleDeleteClass = async (id) => {
    try {
      await classAPI.delete(id);
      message.success('Đã giải tán lớp học thành công!');
      loadClasses();
    } catch (error) {
      console.error('Error deleting class:', error);
      message.error('Xóa lớp học thất bại');
    }
  };

  // 3. XỬ LÝ SỬA (Đổi giáo viên)
  const handleUpdateClass = async (values) => {
    setLoading(true);
    try {
      // Tìm teacher ID từ teacher name
      const teacher = teachers.find(t => t.name === values.teacher);
      const updateData = {
        name: values.name,
        giaoVienID: teacher ? teacher.id : editingClass.giaoVienID,
      };
      
      await classAPI.update(editingClass.classID || editingClass.id, updateData);
      setIsModalOpen(false);
      message.success('Cập nhật thông tin lớp thành công!');
      loadClasses();
    } catch (error) {
      console.error('Error updating class:', error);
      message.error('Cập nhật lớp học thất bại');
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (record) => {
    setEditingClass(record);
    // Tìm teacher name từ ID
    const teacher = teachers.find(t => t.id === record.giaoVienID);
    form.setFieldsValue({
      name: record.tenLop || record.name,
      teacher: teacher ? teacher.name : record.giaoVienID,
    });
    setIsModalOpen(true);
  };

  const columns = [
    {
      title: 'Mã Lớp',
      dataIndex: 'maThamGia',
      key: 'maThamGia',
      render: (text, record) => <b>{text || record.code || 'Không có'}</b>,
    },
    {
      title: 'Tên Lớp học',
      dataIndex: 'tenLop',
      key: 'tenLop',
      render: (text, record) => text || record.name || 'Không có',
    },
    {
      title: 'Giảng viên',
      dataIndex: 'giaoVienID',
      key: 'giaoVienID',
      render: (id, record) => {
        const teacher = teachers.find(t => t.id === id);
        return <Tag color="blue">{teacher ? teacher.name : id || record.teacherEmail || 'Không có'}</Tag>;
      }
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button type="default" size="small" icon={<EditOutlined />} onClick={() => openEditModal(record)}>
            Sửa / Đổi giáo viên
          </Button>
          <Popconfirm
            title="Hành động nguy hiểm"
            description="Bạn có chắc chắn muốn xóa vĩnh viễn lớp này?"
            onConfirm={() => handleDeleteClass(record.classID || record.id)}
            okText="Xóa ngay"
            cancelText="Hủy"
          >
             <Button type="primary" danger size="small" icon={<DeleteOutlined />}>Xóa</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '20px', background: 'linear-gradient(135deg, rgba(241, 245, 249, 0.6) 0%, rgba(248, 250, 252, 0.8) 100%)', borderRadius: '12px', minHeight: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ color: '#1e293b', margin: 0 }}>Quản lý Lớp học toàn hệ thống</h2>
        <Input
            placeholder="Tìm kiếm theo mã lớp, tên giáo viên..."
            prefix={<SearchOutlined />}
            size="large"
            style={{ width: 320, borderRadius: '8px' }}
        />
      </div>

      <Table 
        columns={columns} 
        dataSource={classes} 
        rowKey="key"
        style={{ background: 'white', borderRadius: '12px', overflow: 'hidden' }}
      />

      {/* MODAL SỬA LỚP HỌC */}
      <Modal
        title={`Chỉnh sửa lớp: ${editingClass?.tenLop || editingClass?.name} (${editingClass?.maThamGia || editingClass?.code || ''})`}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={loading}
      >
        <Form form={form} layout="vertical" onFinish={handleUpdateClass}>
            {/* Admin chỉ sửa những thông tin quan trọng */}
            <Form.Item name="teacher" label="Giảng viên phụ trách" rules={[{ required: true }]}>
                <Select placeholder="Chọn giảng viên thay thế">
                    {teachers.map(t => <Option key={t.id} value={t.name}>{t.name} ({t.email})</Option>)}
                </Select>
            </Form.Item>

            <Form.Item name="name" label="Tên lớp (Chỉnh sửa nếu vi phạm)">
                <Input />
            </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ClassManagement;