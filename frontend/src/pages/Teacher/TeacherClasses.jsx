import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Tag, Modal, Form, Input, message, Popconfirm } from 'antd';
import { ArrowRightOutlined, PlusOutlined, BookOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { classAPI } from '../../utils/api';

const TeacherClasses = () => {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  // Lấy danh sách lớp học
  useEffect(() => {
    console.log('🔵 TeacherClasses component mounted, loading classes...');
    loadClasses();
  }, []);
  
  // Reload khi quay lại trang này
  useEffect(() => {
    const handleFocus = () => {
      console.log('🔵 Page focused, reloading classes...');
      loadClasses();
    };
    
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const loadClasses = async () => {
    try {
      const userInfo = JSON.parse(localStorage.getItem('user_info') || '{}');
      console.log('🔵 Loading classes for user:', userInfo.id, 'role:', 'Teacher');
      const data = await classAPI.getAll(userInfo.id, 'Teacher');
      console.log('🔵 Classes loaded:', data);
      setClasses(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('❌ Error loading classes:', error);
      message.error('Không thể tải danh sách lớp học');
      setClasses([]);
    }
  };

  // --- XỬ LÝ THÊM / SỬA ---
  const handleSaveClass = async (values) => {
    console.log('🔵 handleSaveClass called with values:', values);
    
    setLoading(true);
    try {
      const userInfo = JSON.parse(localStorage.getItem('user_info') || '{}');
      console.log('🔵 User info:', userInfo);
      
      if (!userInfo.id) {
        message.error('Không tìm thấy thông tin người dùng! Vui lòng đăng nhập lại.');
        setLoading(false);
        return;
      }
      
      if (editingClass) {
        // Logic SỬA
        console.log('🔵 Updating class:', editingClass.classID || editingClass.id);
        const updateResponse = await classAPI.update(editingClass.classID || editingClass.id, {
          name: values.name,
          code: values.code,
          description: values.topic,
        });
        
        if (updateResponse.error) {
          message.error(updateResponse.error || 'Cập nhật lớp học thất bại!');
          setLoading(false);
          return;
        }
        
        message.success('Cập nhật thông tin lớp thành công!');
      } else {
        // Logic THÊM
        console.log('🔵 Creating new class with data:', {
          name: values.name,
          code: values.code,
          description: values.topic,
          giaoVienID: userInfo.id,
        });
        
        const response = await classAPI.create({
          name: values.name,
          code: values.code,
          description: values.topic,
          giaoVienID: userInfo.id,
        });
        
        console.log('🔵 Class created response:', response);
        
        if (response.error) {
          const errorMsg = typeof response.error === 'string' 
            ? response.error 
            : JSON.stringify(response.error);
          console.error('❌ Create class error:', errorMsg);
          message.error({
            content: errorMsg,
            duration: 5,
          });
          setLoading(false);
          return;
        }
        
        message.success('Tạo lớp học thành công!');
      }
      
      setIsModalOpen(false);
      form.resetFields();
      setEditingClass(null);
      
      // Reload ngay lập tức và sau đó reload lại để đảm bảo
      await loadClasses();
      setTimeout(() => {
        console.log('🔵 Reloading classes again after delay...');
        loadClasses();
      }, 1000);
    } catch (error) {
      console.error('❌ Error saving class:', error);
      message.error({
        content: `Lưu lớp học thất bại: ${error.message || error}`,
        duration: 5,
      });
    } finally {
      setLoading(false);
    }
  };

  // --- XỬ LÝ XÓA ---
  const handleDelete = async (id) => {
    try {
      console.log('🔵 Deleting class with id:', id);
      const result = await classAPI.delete(id);
      console.log('🔵 Delete class result:', result);
      
      if (result && result.error) {
        const errorMsg = typeof result.error === 'string' ? result.error : (result.error.message || JSON.stringify(result.error));
        console.error('❌ Delete class error:', errorMsg);
        message.error({
          content: errorMsg,
          duration: 6,
        });
        return;
      }
      
      message.success('Đã xóa lớp học');
      loadClasses();
    } catch (error) {
      console.error('Error deleting class:', error);
      message.error({
        content: 'Xóa lớp học thất bại: ' + (error.message || error),
        duration: 6,
      });
    }
  };

  // --- MỞ MODAL ---
  const openModal = (record = null) => {
    setEditingClass(record);
    if (record) {
      form.setFieldsValue({
        name: record.tenLop || record.name,
        code: record.maThamGia || record.code,
        topic: record.moTa || record.description,
      });
    } else {
      form.resetFields();
    }
    setIsModalOpen(true);
  };

  return (
    <div style={{ padding: '20px', background: 'linear-gradient(135deg, rgba(241, 245, 249, 0.6) 0%, rgba(248, 250, 252, 0.8) 100%)', borderRadius: '12px', minHeight: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ color: '#1e293b', margin: 0 }}>Lớp học của tôi</h2>
        <Button type="primary" size="large" icon={<PlusOutlined />} onClick={() => openModal(null)}>
          Tạo lớp mới
        </Button>
      </div>

      <Row gutter={[16, 16]}>
        {classes.map((cls) => (
          <Col xs={24} sm={12} md={8} key={cls.classID || cls.id}>
            <Card
              hoverable
              style={{
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 1) 100%)',
                border: '1px solid rgba(102, 126, 234, 0.2)',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                transition: 'all 0.3s ease'
              }}
              headStyle={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                fontWeight: 'bold',
                borderRadius: '12px 12px 0 0'
              }}
              title={<><BookOutlined /> {cls.tenLop || cls.name}</>}
              extra={
                <Button 
                  type="text" 
                  style={{ color: 'white', fontWeight: 'bold' }}
                  onClick={() => navigate(`/teacher/class/${cls.classID || cls.id}`)}
                >
                  Vào lớp <ArrowRightOutlined />
                </Button>
              }
              actions={[
                <EditOutlined key="edit" onClick={() => openModal(cls)} style={{ fontSize: '16px', color: '#1890ff' }} />,
                <Popconfirm title="Xóa lớp này?" onConfirm={() => handleDelete(cls.classID || cls.id)}>
                  <DeleteOutlined key="delete" style={{ color: '#ff4d4f', fontSize: '16px' }} />
                </Popconfirm>
              ]}
            >
              <div style={{ padding: '8px 0' }}>
                <p style={{ marginBottom: '8px' }}>
                  <Tag color="blue" style={{ fontSize: '13px', padding: '4px 12px' }}>
                    Mã: <b>{cls.maThamGia || cls.code || 'Không có'}</b>
                  </Tag>
                </p>
                <p style={{ color: '#64748b', fontSize: '14px', marginBottom: 0 }}>
                  {cls.moTa || cls.description || 'Chưa có mô tả'}
                </p>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* MODAL FORM (Dùng chung cho Tạo và Sửa) */}
      <Modal
        title={editingClass ? "Cập nhật Lớp học" : "Tạo Lớp học mới"}
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          form.resetFields();
          setEditingClass(null);
        }}
        onOk={() => {
          console.log('🔵 Modal OK clicked');
          form.submit();
        }}
        confirmLoading={loading}
        okText="Lưu"
        cancelText="Hủy"
      >
        <Form 
          form={form} 
          layout="vertical" 
          onFinish={handleSaveClass}
          onFinishFailed={(errorInfo) => {
            console.error('❌ Form validation failed:', errorInfo);
            message.error('Vui lòng điền đầy đủ thông tin!');
          }}
        >
          <Form.Item 
            name="name" 
            label="Tên lớp học" 
            rules={[{ required: true, message: 'Vui lòng nhập tên lớp học!' }]}
          >
            <Input placeholder="Ví dụ: Tin học đại cương" />
          </Form.Item>
          <Form.Item 
            name="code" 
            label="Mã học phần" 
            rules={[{ required: true, message: 'Vui lòng nhập mã học phần!' }]}
          >
            <Input placeholder="Ví dụ: IT1110" />
          </Form.Item>
          <Form.Item 
            name="topic" 
            label="Chủ đề chính" 
            rules={[{ required: true, message: 'Vui lòng nhập chủ đề chính!' }]}
          >
            <Input placeholder="Ví dụ: C++ cơ bản" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TeacherClasses;