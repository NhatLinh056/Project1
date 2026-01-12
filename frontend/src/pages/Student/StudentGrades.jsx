import React, { useState, useEffect } from 'react';
import { Table, Tag, Card, Badge, Tooltip, Spin, message } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import { gradingAPI, classAPI } from '../../utils/api';

const StudentGrades = () => {
  const [loading, setLoading] = useState(true);
  const [gradeData, setGradeData] = useState([]);
  const [classes, setClasses] = useState({});

  useEffect(() => {
    loadGrades();
  }, []);

  const loadGrades = async () => {
    try {
      setLoading(true);
      const userInfo = JSON.parse(localStorage.getItem('user_info') || '{}');
      
      if (!userInfo.id) {
        message.error('Không tìm thấy thông tin người dùng!');
        return;
      }

      console.log('🔵 Loading grades for student:', userInfo.id);
      
      // Load tất cả submissions của student
      const submissions = await gradingAPI.getSubmissions(null, userInfo.id, null);
      console.log('🔵 Submissions loaded:', submissions);

      // Load thông tin lớp để map tên lớp
      const classIds = [...new Set(submissions.map(s => s.lopHocID || s.classId))];
      const classPromises = classIds.map(id => classAPI.getById(id).catch(() => null));
      const classResults = await Promise.all(classPromises);
      
      const classMap = {};
      classResults.forEach((cls, index) => {
        if (cls) {
          classMap[classIds[index]] = cls.tenLop || cls.name || 'Lớp học';
        }
      });
      setClasses(classMap);

      // Loại bỏ trùng lặp: chỉ lấy submission mới nhất hoặc đã chấm cho mỗi bài tập
      const uniqueSubmissions = new Map();
      
      submissions.forEach(sub => {
        const key = `${sub.studentID || sub.student?.id}_${sub.lopHocID || sub.classId}_${sub.tenBaiTap}`;
        const existing = uniqueSubmissions.get(key);
        
        if (!existing) {
          uniqueSubmissions.set(key, sub);
        } else {
          // Ưu tiên 1: Submission đã được chấm (có điểm)
          const subIsGraded = sub.trangThai === 'Graded' && (sub.diem !== null && sub.diem !== undefined);
          const existingIsGraded = existing.trangThai === 'Graded' && (existing.diem !== null && existing.diem !== undefined);
          
          if (subIsGraded && !existingIsGraded) {
            // Submission hiện tại đã chấm, existing chưa chấm -> chọn submission hiện tại
            uniqueSubmissions.set(key, sub);
          } else if (!subIsGraded && existingIsGraded) {
            // Existing đã chấm, submission hiện tại chưa chấm -> giữ existing
            // Không làm gì
          } else if (subIsGraded && existingIsGraded) {
            // Cả hai đều đã chấm -> chọn submission mới nhất (theo gradedAt hoặc submittedAt)
            const subTime = sub.gradedAt ? new Date(sub.gradedAt).getTime() : (sub.submittedAt ? new Date(sub.submittedAt).getTime() : 0);
            const existingTime = existing.gradedAt ? new Date(existing.gradedAt).getTime() : (existing.submittedAt ? new Date(existing.submittedAt).getTime() : 0);
            if (subTime > existingTime) {
              uniqueSubmissions.set(key, sub);
            }
          } else {
            // Cả hai đều chưa chấm -> chọn submission mới nhất
            if (sub.submittedAt && existing.submittedAt) {
              const subTime = new Date(sub.submittedAt).getTime();
              const existingTime = new Date(existing.submittedAt).getTime();
              if (subTime > existingTime) {
                uniqueSubmissions.set(key, sub);
              }
            } else if (sub.submittedAt && !existing.submittedAt) {
              uniqueSubmissions.set(key, sub);
            }
          }
        }
      });
      
      const uniqueSubmissionsList = Array.from(uniqueSubmissions.values());
      console.log('🔵 Unique submissions (after deduplication):', uniqueSubmissionsList.length, 'out of', submissions.length);

      // Chuyển đổi submissions thành format hiển thị
      const formattedData = uniqueSubmissionsList.map((sub, index) => {
        // Log để debug
        console.log('🔵 Processing submission:', {
          id: sub.submissionID,
          tenBaiTap: sub.tenBaiTap,
          diem: sub.diem,
          nhanXet: sub.nhanXet,
          trangThai: sub.trangThai,
          submittedAt: sub.submittedAt
        });
        
        // Xác định trạng thái: nếu đã chấm thì "Graded", nếu có submittedAt thì "Submitted", còn lại "Pending"
        let status = 'Pending';
        if (sub.trangThai === 'Graded' && (sub.diem !== null && sub.diem !== undefined)) {
          status = 'Graded';
        } else if (sub.submittedAt) {
          status = 'Submitted';
        }
        
        // Xử lý điểm số: kiểm tra nhiều trường hợp
        let score = null;
        if (sub.diem !== null && sub.diem !== undefined && sub.diem !== '') {
          const scoreValue = typeof sub.diem === 'number' ? sub.diem : parseFloat(sub.diem);
          if (!isNaN(scoreValue)) {
            score = scoreValue;
          }
        }
        
        // Xử lý nhận xét
        const feedback = sub.nhanXet || '';
        
        return {
          key: sub.submissionID || sub.id || index.toString(),
          course: classMap[sub.lopHocID || sub.classId] || 'Lớp học',
          assignment: sub.tenBaiTap || 'Bài tập',
          score: score,
          feedback: feedback,
          status: status,
          submittedAt: sub.submittedAt, // Lưu để debug
        };
      });

      console.log('🔵 Formatted grade data:', formattedData);
      setGradeData(formattedData);
    } catch (error) {
      console.error('❌ Error loading grades:', error);
      message.error('Không thể tải bảng điểm');
      setGradeData([]);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'Môn học',
      dataIndex: 'course',
      key: 'course',
      render: text => <b>{text}</b>,
    },
    {
      title: 'Bài tập / Đầu điểm',
      dataIndex: 'assignment',
      key: 'assignment',
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: status => {
        let color = status === 'Graded' ? 'success' : status === 'Submitted' ? 'processing' : 'default';
        let text = status === 'Graded' ? 'Đã chấm' : status === 'Submitted' ? 'Đã nộp' : 'Chưa nộp';
        return <Badge status={color} text={text} />;
      }
    },
    {
      title: 'Điểm số',
      dataIndex: 'score',
      key: 'score',
      render: score => score ? <Tag color="green" style={{ fontSize: 14, fontWeight: 'bold' }}>{score}</Tag> : <span style={{color: '#ccc'}}>--</span>
    },
    {
      title: 'Nhận xét',
      dataIndex: 'feedback',
      key: 'feedback',
      render: (text) => text ? (
        <Tooltip title={text}>
            <span>{text.length > 20 ? text.substring(0, 20) + '...' : text} <InfoCircleOutlined style={{color: '#1890ff'}}/></span>
        </Tooltip>
      ) : '--'
    }
  ];

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>📑 Bảng điểm cá nhân</h2>
      <Card bordered={false}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Spin size="large" />
          </div>
        ) : gradeData.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#999', padding: '40px' }}>
            Chưa có bài tập nào được nộp.
          </p>
        ) : (
          <Table columns={columns} dataSource={gradeData} pagination={false} />
        )}
      </Card>
    </div>
  );
};

export default StudentGrades;