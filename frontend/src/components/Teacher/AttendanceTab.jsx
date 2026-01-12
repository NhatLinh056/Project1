import React, { useState, useEffect } from 'react';
import { Table, Radio, Button, DatePicker, Space, message, Card, Tag, Spin } from 'antd';
import { FileExcelOutlined, SaveOutlined } from '@ant-design/icons';
import * as XLSX from 'xlsx';
import dayjs from 'dayjs';
import { attendanceAPI, classAPI, notificationAPI } from '../../utils/api';

const AttendanceTab = ({ classId }) => {
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(true);

  // Load danh sách sinh viên từ API
  useEffect(() => {
    if (classId) {
      loadStudents();
    }
  }, [classId]);

  // Load attendance data when date changes
  useEffect(() => {
    if (classId && students.length > 0) {
      loadAttendance();
    }
  }, [classId, selectedDate]);

  const loadStudents = async () => {
    if (!classId) return;
    
    try {
      setLoadingStudents(true);
      const studentsData = await classAPI.getStudents(classId);
      console.log('🔵 AttendanceTab - Students data from API:', studentsData);
      
      // Chỉ set students nếu có dữ liệu từ API
      if (Array.isArray(studentsData) && studentsData.length > 0) {
        // Chuyển đổi sang format cho attendance với status mặc định là 'present'
        const studentsList = studentsData.map((sv, index) => {
          // Debug: In ra để xem structure của sv
          console.log('🔵 Student data:', { 
            id: sv.id, 
            userID: sv.userID, 
            mssv: sv.mssv, 
            name: sv.name 
          });
          
          return {
            key: index + 1,
            id: sv.mssv || sv.id,
            userId: sv.userID || sv.id, // Ưu tiên userID từ ClassStudent entity, fallback sang id
            name: sv.name,
            status: 'present'
          };
        });
        
        console.log('🔵 Processed students list:', studentsList);
        setStudents(studentsList);
      } else {
        // Nếu không có sinh viên, set rỗng
        console.log('🔵 AttendanceTab - No students found, setting empty array');
        setStudents([]);
      }
    } catch (error) {
      console.error('Error loading students:', error);
      message.error('Không thể tải danh sách sinh viên');
      setStudents([]); // Đảm bảo set rỗng nếu có lỗi
    } finally {
      setLoadingStudents(false);
    }
  };

  const loadAttendance = async () => {
    if (!classId || students.length === 0) {
      console.log('🔵 AttendanceTab - Skipping loadAttendance: no classId or no students');
      return;
    }
    
    try {
      const dateStr = selectedDate.format('YYYY-MM-DD');
      console.log('🔵 AttendanceTab - Loading attendance for date:', dateStr);
      const data = await attendanceAPI.get(classId, dateStr);
      console.log('🔵 AttendanceTab - Attendance data:', data);
      
      if (data.records && data.records !== 'null' && data.records !== '') {
        try {
          const records = JSON.parse(data.records);
          console.log('🔵 AttendanceTab - Parsed records:', records);
          
          if (Array.isArray(records) && records.length > 0) {
            // Chỉ merge với sinh viên đã có trong danh sách (đã tham gia lớp)
            const updatedStudents = students.map(sv => {
              const record = records.find(r => 
                (r.id && (r.id === sv.id || r.id === sv.mssv)) || 
                (r.name && r.name === sv.name)
              );
              return record ? { ...sv, status: record.status } : sv;
            });
            setStudents(updatedStudents);
          }
        } catch (e) {
          console.error('Error parsing records:', e);
        }
      } else {
        console.log('🔵 AttendanceTab - No attendance records found for this date');
      }
    } catch (error) {
      console.error('Error loading attendance:', error);
      // Giữ danh sách sinh viên hiện tại, không thay đổi
    }
  };

  const handleStatusChange = (key, value) => {
    const updatedStudents = students.map((s) =>
      s.key === key ? { ...s, status: value } : s
    );
    setStudents(updatedStudents);
  };

  // --- LOGIC MỚI: LƯU VÀ GỬI THÔNG BÁO ---
  const handleSave = async () => {
    if (!classId) {
      message.error('Không tìm thấy lớp học!');
      return;
    }

    message.loading({ content: 'Đang xử lý dữ liệu...', key: 'save' });
    setLoading(true);

    try {
      const dateStr = selectedDate.format('YYYY-MM-DD');
      
      console.log('🔵 Saving attendance:', { classId, dateStr, studentsCount: students.length });
      
      // Lưu vào backend
      const response = await attendanceAPI.save(classId, dateStr, students);
      
      console.log('🔵 Save attendance response:', response);
      
      if (response.error) {
        const errorMsg = typeof response.error === 'string' 
          ? response.error 
          : JSON.stringify(response.error);
        console.error('❌ Error saving attendance:', errorMsg);
        message.error({ 
          content: `Lưu điểm danh thất bại: ${errorMsg}`, 
          duration: 5,
          key: 'save' 
        });
        return;
      }

      // 1. Lọc ra danh sách sinh viên bị Vắng hoặc Muộn
      const absentOrLateStudents = students.filter(s => s.status === 'absent' || s.status === 'late');
      
      console.log('🔵 Students to notify:', absentOrLateStudents.map(s => ({ 
        name: s.name, 
        userId: s.userId, 
        status: s.status 
      })));

      // 2. Tạo thông báo qua API cho từng sinh viên
      let notificationCount = 0;
      for (const student of absentOrLateStudents) {
        try {
          const studentId = student.userId; // userId đã được set từ loadStudents
          if (!studentId) {
            console.warn('⚠️ No student ID found for student:', student);
            continue;
          }

          const title = student.status === 'absent' ? '📢 Cảnh báo vắng học' : '⏰ Nhắc nhở đi muộn';
          const description = `Bạn bị đánh dấu ${student.status === 'absent' ? 'VẮNG' : 'MUỘN'} ngày ${selectedDate.format('DD/MM/YYYY')} trong lớp học.`;
          
          console.log('🔵 Creating notification for student:', { 
            studentId, 
            studentName: student.name,
            title, 
            description 
          });
          
          const result = await notificationAPI.create(studentId, title, description, 'student');
          
          if (!result.error) {
            console.log('✅ Notification created successfully for:', student.name);
            notificationCount++;
          } else {
            console.error('❌ Error creating notification for student:', student.name, result.error);
          }
        } catch (error) {
          console.error('❌ Error creating notification for student:', student.name, error);
        }
      }

      message.success({ 
        content: absentOrLateStudents.length > 0 
          ? `Đã lưu điểm danh và gửi ${notificationCount}/${absentOrLateStudents.length} thông báo!` 
          : 'Đã lưu điểm danh!',
        key: 'save' 
      });
    } catch (error) {
      console.error('❌ Error saving attendance:', error);
      const errorMsg = error.message || 'Lưu điểm danh thất bại!';
      message.error({ 
        content: errorMsg, 
        duration: 5,
        key: 'save' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = () => {
    const dataToExport = students.map((s, index) => ({
      STT: index + 1,
      MSSV: s.id,
      'Họ và Tên': s.name,
      'Ngày điểm danh': selectedDate.format('DD/MM/YYYY'),
      'Trạng thái': s.status === 'present' ? 'Có mặt' : (s.status === 'absent' ? 'Vắng' : 'Muộn')
    }));
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "DiemDanh");
    XLSX.writeFile(workbook, `DiemDanh_${selectedDate.format('DD-MM-YYYY')}.xlsx`);
    message.success('Đã tải xuống file Excel!');
  };

  const columns = [
    { title: 'MSSV', dataIndex: 'id', key: 'id', width: 120 },
    { title: 'Họ và tên', dataIndex: 'name', key: 'name' },
    {
      title: 'Trạng thái',
      key: 'status',
      render: (_, record) => (
        <Radio.Group value={record.status} onChange={(e) => handleStatusChange(record.key, e.target.value)}>
          <Radio value="present"><Tag color="success">Có mặt</Tag></Radio>
          <Radio value="late"><Tag color="warning">Muộn</Tag></Radio>
          <Radio value="absent"><Tag color="error">Vắng</Tag></Radio>
        </Radio.Group>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <Space>
          <span style={{ fontWeight: 600 }}>Ngày điểm danh:</span>
          <DatePicker value={selectedDate} onChange={(date) => setSelectedDate(date)} format="DD/MM/YYYY" allowClear={false}/>
        </Space>
        <Space>
            <Button type="primary" icon={<SaveOutlined />} onClick={handleSave} loading={loading}>Lưu & Gửi thông báo</Button>
            <Button style={{ backgroundColor: '#217346', color: 'white' }} icon={<FileExcelOutlined />} onClick={handleExportExcel}>Xuất Excel</Button>
        </Space>
      </div>
      {loadingStudents ? (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <Spin /> <span style={{ marginLeft: 10 }}>Đang tải danh sách sinh viên...</span>
        </div>
      ) : students.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
          <p style={{ fontSize: '16px', marginBottom: '10px' }}>Chưa có sinh viên nào trong lớp này.</p>
          <p style={{ fontSize: '14px' }}>Sinh viên cần tham gia lớp bằng mã tham gia do giáo viên cung cấp.</p>
        </div>
      ) : (
        <>
          <Table dataSource={students} columns={columns} pagination={false} bordered />
          <Card style={{ marginTop: 20, background: '#f9f9f9' }} size="small">
            <Space size="large">
                <span><b>Tổng số:</b> {students.length}</span>
                <span style={{ color: '#52c41a' }}><b>Có mặt:</b> {students.filter(s => s.status === 'present').length}</span>
                <span style={{ color: '#faad14' }}><b>Muộn:</b> {students.filter(s => s.status === 'late').length}</span>
                <span style={{ color: '#ff4d4f' }}><b>Vắng:</b> {students.filter(s => s.status === 'absent').length}</span>
            </Space>
          </Card>
        </>
      )}
    </div>
  );
};

export default AttendanceTab;