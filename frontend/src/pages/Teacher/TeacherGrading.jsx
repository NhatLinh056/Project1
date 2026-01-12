import React, { useState, useEffect } from 'react';
import { Table, Tag, Button, Modal, Form, InputNumber, Input, message, Select, Spin, Empty, Space, Row, Col } from 'antd';
import { EditOutlined, FilePdfOutlined, SearchOutlined, FilterOutlined, ReloadOutlined } from '@ant-design/icons';
import { gradingAPI, classAPI, notificationAPI } from '../../utils/api';

const TeacherGrading = () => {
  const [submissions, setSubmissions] = useState([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentRecord, setCurrentRecord] = useState(null);
  const [form] = Form.useForm();

  // Lấy thông tin user từ localStorage
  const userInfo = JSON.parse(localStorage.getItem('user_info') || '{}');

  // Load dữ liệu
  useEffect(() => {
    loadData();
  }, []);

  // Filter submissions khi chọn lớp, trạng thái hoặc tìm kiếm
  useEffect(() => {
    if (!Array.isArray(submissions)) {
      setFilteredSubmissions([]);
      return;
    }
    
    let filtered = [...submissions];
    
    // Lọc theo lớp học
    if (selectedClassId !== 'all') {
      filtered = filtered.filter(s => {
        const sClassId = s.lopHocID || s.classId;
        return sClassId === selectedClassId || sClassId === parseInt(selectedClassId);
      });
    }
    
    // Lọc theo trạng thái
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(s => s.status === selectedStatus);
    }
    
    // Tìm kiếm theo tên sinh viên, MSSV, hoặc tên bài tập
    if (searchText.trim()) {
      const searchLower = searchText.toLowerCase().trim();
      filtered = filtered.filter(s => 
        (s.student && s.student.toLowerCase().includes(searchLower)) ||
        (s.mssv && s.mssv.toLowerCase().includes(searchLower)) ||
        (s.assignment && s.assignment.toLowerCase().includes(searchLower)) ||
        (s.tenLop && s.tenLop.toLowerCase().includes(searchLower))
      );
    }
    
    setFilteredSubmissions(filtered);
  }, [selectedClassId, selectedStatus, searchText, submissions]);

  const loadData = async () => {
    setLoading(true);
    try {
      console.log('🔵 Loading grading data for teacher:', userInfo.id);
      
      // Load danh sách lớp học
      const classesData = await classAPI.getAll(userInfo.id, 'Teacher');
      console.log('🔵 Classes loaded:', classesData);
      setClasses(Array.isArray(classesData) ? classesData : []);

      // Load danh sách bài nộp
      const submissionsData = await gradingAPI.getSubmissions(userInfo.id, null, null);
      console.log('🔵 Submissions loaded:', submissionsData);
      
      if (!Array.isArray(submissionsData)) {
        console.error('❌ Submissions data is not an array:', submissionsData);
        setSubmissions([]);
        return;
      }
      
      const formattedSubmissions = submissionsData.map((item, index) => {
        // Lấy thông tin student từ object student hoặc từ studentID
        const studentName = item.student?.name || item.student?.ten || item.student || 'Chưa có tên';
        const studentMssv = item.student?.mssv || item.mssv || '--';
        
        // Lấy thông tin lớp từ object lopHoc hoặc từ lopHocID
        const className = item.lopHoc?.tenLop || item.lopHoc?.name || item.tenLop || 'Chưa có tên lớp';
        const classId = item.lopHocID || item.lopHoc?.classID || item.classId;
        
        return {
          key: item.submissionID || index.toString(),
          submissionID: item.submissionID,
          student: studentName,
          mssv: studentMssv,
          assignment: item.tenBaiTap || 'Chưa có tên',
          file: item.filePath ? item.filePath.split('/').pop() : 'Chưa có file',
          filePath: item.filePath,
          score: item.diem,
          status: item.trangThai || 'Pending',
          feedback: item.nhanXet || '',
          lopHocID: classId,
          tenLop: className,
        };
      });
      
      console.log('🔵 Formatted submissions:', formattedSubmissions);
      setSubmissions(formattedSubmissions);
    } catch (error) {
      console.error('❌ Error loading data:', error);
      message.error('Không thể tải dữ liệu: ' + (error.message || error));
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  };

  // Mở Modal chấm điểm
  const handleGradeClick = (record) => {
    setCurrentRecord(record);
    form.setFieldsValue({
      score: record.score,
      feedback: record.feedback || ''
    });
    setIsModalOpen(true);
  };

  // Lưu điểm
  const handleSaveGrade = async (values) => {
    try {
      const result = await gradingAPI.gradeSubmission(
        currentRecord.submissionID,
        values.score,
        values.feedback
      );

      if (result.error) {
        message.error(result.error);
        return;
      }

      message.success(`Đã chấm điểm cho sinh viên ${currentRecord.student}`);
      
      // Gửi thông báo cho sinh viên
      try {
        if (currentRecord.studentID) {
          await notificationAPI.create(
            currentRecord.studentID,
            `📊 Bài tập đã được chấm điểm`,
            `Giáo viên đã chấm bài "${currentRecord.assignment}" của bạn. Điểm: ${values.score}/100`,
            'student'
          );
          console.log('✅ Sent grading notification to student');
        }
      } catch (notifError) {
        console.error('⚠️ Failed to notify student:', notifError);
      }
      
      setIsModalOpen(false);
      
      // Reload dữ liệu
      await loadData();
    } catch (error) {
      console.error('Error grading submission:', error);
      message.error('Không thể lưu điểm!');
    }
  };

  const columns = [
    { title: 'Lớp học', dataIndex: 'tenLop', key: 'tenLop', render: text => <b>{text}</b> },
    { title: 'Sinh viên', dataIndex: 'student', key: 'student', render: text => <b>{text}</b> },
    { title: 'MSSV', dataIndex: 'mssv', key: 'mssv' },
    { title: 'Bài tập', dataIndex: 'assignment', key: 'assignment' },
    {
      title: 'File nộp',
      key: 'file',
      render: (_, record) => {
        if (!record.filePath) {
          return <span style={{ color: '#ccc' }}>Chưa có file</span>;
        }
        
        // Xử lý URL file - nếu là relative path, thêm base URL
        let fileUrl = record.filePath;
        if (!fileUrl.startsWith('http://') && !fileUrl.startsWith('https://')) {
          if (fileUrl.startsWith('/api/files/')) {
            fileUrl = `http://localhost:5000${fileUrl}`;
          }
        }
        
        return (
          <a href={fileUrl} target="_blank" rel="noopener noreferrer">
            <FilePdfOutlined /> {record.file}
          </a>
        );
      }
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: status => {
        let color = status === 'Graded' ? 'green' : status === 'Late' ? 'volcano' : 'blue';
        let text = status === 'Graded' ? 'Đã chấm' : status === 'Late' ? 'Nộp muộn' : 'Chưa chấm';
        return <Tag color={color}>{text}</Tag>;
      }
    },
    {
      title: 'Điểm số',
      dataIndex: 'score',
      key: 'score',
      render: score => score ? <b>{score}</b> : <span style={{color: '#ccc'}}>--</span>
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_, record) => (
        <Button type="primary" size="small" icon={<EditOutlined />} onClick={() => handleGradeClick(record)}>
          {record.score ? 'Sửa điểm' : 'Chấm điểm'}
        </Button>
      ),
    },
  ];

  // Tạo options cho Select lớp học
  const classOptions = [
    { value: 'all', label: 'Tất cả lớp' },
    ...(Array.isArray(classes) ? classes.map(cls => ({
      value: cls.classID || cls.id,
      label: `${cls.maThamGia || cls.code || ''} - ${cls.tenLop || cls.name || 'Lớp học'}`
    })) : [])
  ];
  
  // Options cho Select trạng thái
  const statusOptions = [
    { value: 'all', label: 'Tất cả trạng thái' },
    { value: 'Pending', label: '🔵 Chưa chấm' },
    { value: 'Graded', label: '🟢 Đã chấm' },
    { value: 'Late', label: '🔴 Nộp muộn' },
  ];
  
  // Reset filters
  const handleResetFilters = () => {
    setSelectedClassId('all');
    setSelectedStatus('all');
    setSearchText('');
  };
  
  // Statistics
  const stats = {
    total: submissions.length,
    pending: submissions.filter(s => s.status === 'Pending').length,
    graded: submissions.filter(s => s.status === 'Graded').length,
    filtered: filteredSubmissions.length,
  };

  if (!userInfo.id) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Empty description="Không tìm thấy thông tin giáo viên. Vui lòng đăng nhập lại." />
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ marginBottom: 10 }}>📝 Danh sách Bài nộp cần chấm</h2>
        
        {/* Statistics Bar */}
        <div style={{ 
          backgroundColor: '#f5f5f5', 
          padding: '12px 16px', 
          borderRadius: 8, 
          marginBottom: 16,
          display: 'flex',
          gap: 24
        }}>
          <div>
            <span style={{ color: '#888' }}>Tổng số bài: </span>
            <b style={{ fontSize: 16, color: '#1890ff' }}>{stats.total}</b>
          </div>
          <div>
            <span style={{ color: '#888' }}>Chưa chấm: </span>
            <b style={{ fontSize: 16, color: '#ff4d4f' }}>{stats.pending}</b>
          </div>
          <div>
            <span style={{ color: '#888' }}>Đã chấm: </span>
            <b style={{ fontSize: 16, color: '#52c41a' }}>{stats.graded}</b>
          </div>
          <div style={{ marginLeft: 'auto' }}>
            <span style={{ color: '#888' }}>Đang hiển thị: </span>
            <b style={{ fontSize: 16 }}>{stats.filtered}</b>
            <span style={{ color: '#888' }}> bài</span>
          </div>
        </div>
        
        {/* Filter Controls */}
        <Row gutter={[12, 12]}>
          <Col xs={24} sm={24} md={8} lg={8}>
            <Input
              placeholder="🔍 Tìm theo tên SV, MSSV, bài tập, lớp..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={12} sm={12} md={6} lg={5}>
            <Select 
              value={selectedClassId} 
              style={{ width: '100%' }} 
              options={classOptions}
              onChange={(value) => setSelectedClassId(value)}
              placeholder="Chọn lớp"
              suffixIcon={<FilterOutlined />}
            />
          </Col>
          <Col xs={12} sm={12} md={6} lg={5}>
            <Select 
              value={selectedStatus} 
              style={{ width: '100%' }} 
              options={statusOptions}
              onChange={(value) => setSelectedStatus(value)}
              placeholder="Chọn trạng thái"
              suffixIcon={<FilterOutlined />}
            />
          </Col>
          <Col xs={12} sm={12} md={4} lg={3}>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={handleResetFilters}
              block
            >
              Xóa lọc
            </Button>
          </Col>
          <Col xs={12} sm={12} md={24} lg={3}>
            <Button 
              type="primary" 
              icon={<ReloadOutlined />} 
              onClick={loadData}
              loading={loading}
              block
            >
              Tải lại
            </Button>
          </Col>
        </Row>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <Spin size="large" />
        </div>
      ) : !Array.isArray(filteredSubmissions) || filteredSubmissions.length === 0 ? (
        <Empty description={
          searchText || selectedClassId !== 'all' || selectedStatus !== 'all' 
            ? "Không tìm thấy bài nộp phù hợp với bộ lọc"
            : "Chưa có bài nộp nào cần chấm"
        } />
      ) : (
        <Table 
          columns={columns} 
          dataSource={filteredSubmissions} 
          pagination={{ 
            pageSize: 10,
            showTotal: (total) => `Tổng ${total} bài nộp`,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50', '100']
          }} 
        />
      )}

      {/* MODAL CHẤM ĐIỂM */}
      <Modal
        title={`Chấm bài: ${currentRecord?.student}`}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={() => form.submit()}
      >
        <Form form={form} layout="vertical" onFinish={handleSaveGrade}>
          <Form.Item name="score" label="Điểm số (Thang 10)" rules={[{ required: true, message: 'Vui lòng nhập điểm' }]}>
            <InputNumber min={0} max={10} step={0.1} style={{ width: '100%' }} placeholder="Nhập điểm..." />
          </Form.Item>
          <Form.Item name="feedback" label="Nhận xét của Giáo viên">
            <Input.TextArea rows={4} placeholder="Nhập nhận xét..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TeacherGrading;