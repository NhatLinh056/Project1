import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Tabs, Button, List, Avatar, Typography, Card, Space,
  Input, Upload, message, Collapse, Tag, Dropdown, Menu, Spin, Empty, Modal, Form, Select, Popconfirm
} from 'antd';
import {
  UserOutlined, UploadOutlined, PlusOutlined, SendOutlined,
  FileTextOutlined, FilePdfOutlined, MoreOutlined, TeamOutlined, EditOutlined, DeleteOutlined, UserAddOutlined
} from '@ant-design/icons';

// --- QUAN TRỌNG: Import Component Điểm Danh ---
import AttendanceTab from '../../components/Teacher/AttendanceTab';
import { classAPI, userAPI, postAPI, gradingAPI, assignmentAPI, fileAPI, notificationAPI } from '../../utils/api';
import { formatDate, formatDateTime, formatRelativeTime, isPastDate, getMinDate } from '../../utils/dateUtils';

const { Title, Text } = Typography;
const { Panel } = Collapse;
const { TextArea } = Input;

const TeacherClassDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [classInfo, setClassInfo] = useState(null);
  const [teacherInfo, setTeacherInfo] = useState(null);
  const [students, setStudents] = useState([]);
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
  const [addStudentLoading, setAddStudentLoading] = useState(false);
  const [addStudentForm] = Form.useForm();
  const [collapseActiveKeys, setCollapseActiveKeys] = useState(['assignments', 'materials']);
  const [isFileViewerOpen, setIsFileViewerOpen] = useState(false);
  const [viewingFile, setViewingFile] = useState(null);

  // Load thông tin lớp học và sinh viên
  useEffect(() => {
    loadClassData();
  }, [id]);

  const loadClassData = async () => {
    try {
      setLoading(true);
      // Load thông tin lớp học
      const classData = await classAPI.getById(id);
      console.log('🔵 Class data:', classData);
      setClassInfo(classData);

      // Load thông tin giáo viên
      if (classData.giaoVienID) {
        try {
          const teacher = await userAPI.getById(classData.giaoVienID);
          console.log('🔵 Teacher data:', teacher);
          setTeacherInfo(teacher);
        } catch (err) {
          console.error('Error loading teacher:', err);
        }
      }

      // Load danh sách sinh viên
      try {
        console.log('🔵 Loading students for class ID:', id);
        const studentsData = await classAPI.getStudents(id);
        console.log('🔵 Students data received:', studentsData);
        console.log('🔵 Students data type:', typeof studentsData, 'isArray:', Array.isArray(studentsData));
        setStudents(Array.isArray(studentsData) ? studentsData : []);
        console.log('🔵 Students state set to:', Array.isArray(studentsData) ? studentsData.length : 0, 'items');
      } catch (err) {
        console.error('❌ Error loading students:', err);
        setStudents([]);
      }
    } catch (error) {
      console.error('Error loading class data:', error);
      message.error('Không thể tải thông tin lớp học');
    } finally {
      setLoading(false);
    }
  };

  // Thêm sinh viên vào lớp
  const handleAddStudent = async (values) => {
    try {
      setAddStudentLoading(true);
      console.log('🔵 Adding student with:', { email: values.email, mssv: values.mssv });
      
      const response = await classAPI.addStudent(id, values.email, values.mssv);
      console.log('🟢 Add student response:', response);
      
      if (response.error) {
        console.error('❌ Error adding student:', response.error);
        message.error(response.error);
        return;
      }
      
      message.success('Đã thêm sinh viên vào lớp thành công!');
      
      // Gửi thông báo cho sinh viên mới được thêm
      try {
        if (response.student && response.student.id) {
          await notificationAPI.create(
            response.student.id,
            `👥 Bạn được thêm vào lớp học`,
            `Giáo viên đã thêm bạn vào lớp ${classInfo?.name || 'học'}`,
            'student'
          );
          console.log('✅ Sent join notification to student');
        }
      } catch (notifError) {
        console.error('⚠️ Failed to notify student:', notifError);
      }
      
      setIsAddStudentModalOpen(false);
      addStudentForm.resetFields();
      
      // Đợi một chút để đảm bảo database đã commit, sau đó reload
      setTimeout(() => {
        console.log('🔵 Reloading class data after adding student...');
      loadClassData();
      }, 500);
    } catch (error) {
      console.error('❌ Error adding student:', error);
      message.error('Thêm sinh viên thất bại! Vui lòng kiểm tra console để xem chi tiết.');
    } finally {
      setAddStudentLoading(false);
    }
  };

  const [posts, setPosts] = useState([]);
  const [postContent, setPostContent] = useState('');
  const [postLoading, setPostLoading] = useState(false);
  const [submissions, setSubmissions] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  const [assignmentForm] = Form.useForm();
  const [editingAssignment, setEditingAssignment] = useState(null);

  // Load posts, submissions và assignments
  useEffect(() => {
    if (id) {
      loadPosts();
      loadSubmissions();
      loadAssignments();
    }
  }, [id]);

  const loadPosts = async () => {
    try {
      console.log('🔵 Loading posts for class:', id);
      const postsData = await postAPI.getByClass(id);
      console.log('🔵 Posts loaded:', postsData);
      setPosts(Array.isArray(postsData) ? postsData : []);
    } catch (error) {
      console.error('❌ Error loading posts:', error);
      setPosts([]);
    }
  };

  const loadSubmissions = async () => {
    try {
      const userInfo = JSON.parse(localStorage.getItem('user_info') || '{}');
      if (userInfo.id) {
        const submissionsData = await gradingAPI.getSubmissions(userInfo.id, null, id);
        console.log('🔵 Submissions loaded:', submissionsData);
        setSubmissions(Array.isArray(submissionsData) ? submissionsData : []);
      }
    } catch (error) {
      console.error('❌ Error loading submissions:', error);
      setSubmissions([]);
    }
  };

  const loadAssignments = async () => {
    try {
      console.log('🔵 Loading assignments for class:', id);
      const assignmentsData = await assignmentAPI.getByClass(id);
      console.log('🔵 Assignments loaded:', assignmentsData);
      console.log('🔵 First assignment sample:', assignmentsData && assignmentsData.length > 0 ? {
        id: assignmentsData[0].assignmentID || assignmentsData[0].id,
        assignmentID: assignmentsData[0].assignmentID,
        filePath: assignmentsData[0].filePath,
        title: assignmentsData[0].title
      } : 'No assignments');
      setAssignments(Array.isArray(assignmentsData) ? assignmentsData : []);
    } catch (error) {
      console.error('❌ Error loading assignments:', error);
      setAssignments([]);
    }
  };

  const handlePost = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!postContent.trim()) {
      message.warning('Vui lòng nhập nội dung!');
      return;
    }

    try {
      setPostLoading(true);
      const userInfo = JSON.parse(localStorage.getItem('user_info') || '{}');
      
      if (!userInfo.id) {
        message.error('Không tìm thấy thông tin người dùng!');
        return;
      }

      console.log('🔵 Creating post:', { classId: id, authorId: userInfo.id, content: postContent });
      const response = await postAPI.create(id, userInfo.id, postContent, null);
      
      if (response.error) {
        message.error(response.error);
        return;
      }

    message.success('Đã đăng thông báo mới!');
      
      // Gửi thông báo cho tất cả sinh viên trong lớp
      try {
        if (students && students.length > 0) {
          const notificationPromises = students.map(student =>
            notificationAPI.create(
              student.userID || student.id,
              `📌 Thông báo mới từ giáo viên`,
              `Giáo viên vừa đăng thông báo trong lớp ${classInfo?.name}: "${postContent.substring(0, 50)}${postContent.length > 50 ? '...' : ''}"`,
              'student'
            ).catch(err => console.error('Failed to notify student:', student.id, err))
          );
          await Promise.all(notificationPromises);
          console.log('✅ Sent post notifications to', students.length, 'students');
        }
      } catch (notifError) {
        console.error('⚠️ Some notifications failed:', notifError);
      }
      
      // Clear content và reload sau khi đăng thành công
      const contentToClear = postContent; // Lưu lại để clear
      setPostContent('');
      
      // Reload danh sách posts sau một chút
      setTimeout(() => {
        loadPosts();
      }, 300);
    } catch (error) {
      console.error('Error creating post:', error);
      message.error('Đăng tin thất bại!');
    } finally {
      setPostLoading(false);
    }
  };

  // --- NỘI DUNG CÁC TAB ---

  // 2. Tab Bài tập & Tài liệu - Tạo và quản lý bài tập/tài liệu
  const handleCreateAssignment = async (values) => {
    try {
      console.log('🔵 Creating assignment:', values);
      console.log('🔵 Form values type:', values.type);
      console.log('🔵 Form values file:', values.file);
      console.log('🔵 Form values maxScore:', values.maxScore, 'type:', typeof values.maxScore);
      
      let filePath = null;
      
      // Nếu có file được upload, upload file trước
      // values.file có thể là array (fileList) hoặc object với fileList property
      const fileList = Array.isArray(values.file) ? values.file : (values.file?.fileList || []);
      console.log('🔵 File list:', fileList);
      
      if (fileList && fileList.length > 0) {
        const fileItem = fileList[0];
        const file = fileItem.originFileObj || fileItem;
        if (file) {
          console.log('🔵 Uploading file:', file.name, 'size:', file.size);
          message.loading({ content: 'Đang upload file...', key: 'upload' });
          const uploadResult = await fileAPI.upload(file);
          console.log('🔵 Upload result:', uploadResult);
          if (uploadResult.error) {
            message.error({ content: 'Upload file thất bại: ' + uploadResult.error, key: 'upload' });
            return;
          }
          filePath = uploadResult.url;
          message.success({ content: 'Upload file thành công!', key: 'upload' });
          console.log('🔵 File uploaded, URL:', filePath);
        } else {
          console.error('❌ No file object found in fileList');
          message.error('Không tìm thấy file để upload!');
          return;
        }
      } else {
        console.log('⚠️ No file selected for upload');
        message.warning('Vui lòng chọn file để upload!');
        return;
      }
      
      if (!filePath) {
        console.error('❌ filePath is null after upload');
        message.error('Không thể lấy URL của file đã upload!');
        return;
      }
      
      // Chỉ gửi dueDate và maxScore nếu là ASSIGNMENT
      const dueDate = values.type === 'ASSIGNMENT' && values.dueDate 
        ? new Date(values.dueDate).toISOString().split('T')[0] 
        : null;
      
      let maxScore = null;
      // Chỉ xử lý maxScore nếu type là ASSIGNMENT
      if (values.type === 'ASSIGNMENT') {
        if (values.maxScore !== null && values.maxScore !== undefined && values.maxScore !== '') {
          const parsed = parseInt(values.maxScore);
          if (!isNaN(parsed) && parsed > 0) {
            maxScore = parsed;
          }
        }
      }
      // Nếu type là MATERIAL, đảm bảo maxScore là null
      else if (values.type === 'MATERIAL') {
        maxScore = null;
      }
      
      console.log('🔵 Final values to send:', {
        classId: id,
        title: values.title,
        type: values.type,
        filePath: filePath,
        dueDate,
        maxScore
      });
      
      const response = await assignmentAPI.create(
        id,
        values.title,
        values.description,
        values.type || 'ASSIGNMENT',
        filePath,
        dueDate,
        maxScore
      );
      
      if (response.error) {
        message.error(response.error);
        return;
      }
      
      message.success('Đã tạo ' + (values.type === 'MATERIAL' ? 'tài liệu' : 'bài tập') + ' thành công!');
      setIsAssignmentModalOpen(false);
      assignmentForm.resetFields();
      setEditingAssignment(null);
      
      // Gửi thông báo cho tất cả sinh viên trong lớp
      if (values.type === 'ASSIGNMENT' && students && students.length > 0) {
        try {
          const notificationPromises = students.map(student =>
            notificationAPI.create(
              student.userID || student.id,
              `📝 Bài tập mới: ${values.title}`,
              `Giáo viên vừa đăng bài tập mới trong lớp ${classInfo?.name || 'của bạn'}. Hạn nộp: ${dueDate ? formatDateTime(dueDate) : 'Chưa xác định'}`,
              'student'
            ).catch(err => console.error('Failed to notify student:', student.id, err))
          );
          await Promise.all(notificationPromises);
          console.log('✅ Sent notifications to', students.length, 'students');
        } catch (notifError) {
          console.error('⚠️ Some notifications failed:', notifError);
        }
      }
      
      // Đảm bảo collapse vẫn mở sau khi tạo
      if (values.type === 'MATERIAL') {
        setCollapseActiveKeys(['assignments', 'materials']);
      } else {
        setCollapseActiveKeys(['assignments', 'materials']);
      }
      
      await loadAssignments();
    } catch (error) {
      console.error('Error creating assignment:', error);
      message.error('Tạo bài tập thất bại!');
    }
  };

  const handleDeleteAssignment = async (assignmentId) => {
    try {
      console.log('🔵 [handleDeleteAssignment] Starting delete for ID:', assignmentId);
      if (!assignmentId) {
        console.error('❌ [handleDeleteAssignment] No assignmentId provided!');
        message.error('Không tìm thấy ID của bài tập/tài liệu!');
        return;
      }
      const response = await assignmentAPI.delete(assignmentId);
      console.log('🔵 [handleDeleteAssignment] Delete response:', response);
      if (response && response.error) {
        console.error('❌ [handleDeleteAssignment] Delete error:', response.error);
        message.error(response.error);
        return;
      }
      console.log('🔵 [handleDeleteAssignment] Delete successful, response:', response);
      message.success(response?.message || 'Đã xóa thành công!');
      await loadAssignments();
      console.log('🔵 [handleDeleteAssignment] Reloaded assignments');
    } catch (error) {
      console.error('❌ [handleDeleteAssignment] Exception:', error);
      console.error('❌ [handleDeleteAssignment] Error stack:', error.stack);
      message.error('Xóa thất bại: ' + (error.message || error));
    }
  };

  const ClassworkContent = () => {
    // Group assignments by type
    const assignmentsList = assignments.filter(a => a.type === 'ASSIGNMENT');
    const materialsList = assignments.filter(a => a.type === 'MATERIAL');

    return (
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={4} style={{ margin: 0 }}>Bài tập & Tài liệu</Title>
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={() => {
              setEditingAssignment(null);
              assignmentForm.resetFields();
              setIsAssignmentModalOpen(true);
            }}
          >
            Tạo mới
          </Button>
          </div>

        <Collapse 
          activeKey={collapseActiveKeys} 
          onChange={(keys) => setCollapseActiveKeys(keys)}
          ghost
        >
          <Panel 
            header={<Title level={4} style={{ margin: 0, color: '#faad14' }}>📝 Bài tập</Title>} 
            key="assignments"
          >
            {assignmentsList.length === 0 ? (
              <Card>
                <p style={{ textAlign: 'center', color: '#999' }}>Chưa có bài tập nào.</p>
      </Card>
            ) : (
      <List
                itemLayout="horizontal"
                dataSource={assignmentsList}
                renderItem={item => (
                  <List.Item
                    actions={[
                      <Button 
                        type="link" 
                        icon={<EditOutlined />} 
                        onClick={() => {
                          setEditingAssignment(item);
                          assignmentForm.setFieldsValue({
                            title: item.title,
                            description: item.description,
                            type: item.type,
                            filePath: item.filePath,
                            dueDate: item.dueDate ? new Date(item.dueDate).toISOString().split('T')[0] : null,
                            maxScore: item.maxScore,
                          });
                          setIsAssignmentModalOpen(true);
                        }}
                      />,
                      <Popconfirm
                        title="Xác nhận xóa"
                        description="Bạn có chắc chắn muốn xóa bài tập này?"
                        okText="Xóa"
                        cancelText="Hủy"
                        okType="danger"
                        onConfirm={async () => {
                          const assignmentId = item.assignmentID || item.id;
                          console.log('🔵 Popconfirm onConfirm called for assignment:', assignmentId);
                          if (!assignmentId) {
                            message.error('Không tìm thấy ID của bài tập!');
                            return;
                          }
                          try {
                            await handleDeleteAssignment(assignmentId);
                            console.log('🔵 Delete completed successfully in Popconfirm.onConfirm');
                          } catch (error) {
                            console.error('❌ Error in Popconfirm.onConfirm:', error);
                            message.error('Xóa thất bại: ' + (error.message || error));
                          }
                        }}
                        onCancel={() => {
                          console.log('🔵 Popconfirm cancelled');
                        }}
                      >
                        <Button 
                          type="link" 
                          danger 
                          icon={<DeleteOutlined />} 
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            const assignmentId = item.assignmentID || item.id;
                            console.log('🔵 Delete button clicked, assignmentId:', assignmentId, 'item:', item);
                          }}
                        />
                      </Popconfirm>
                    ]}
                    style={{ padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}
                  >
             <List.Item.Meta
                      avatar={<Avatar icon={<FileTextOutlined />} style={{ backgroundColor: '#faad14' }} />}
                      title={
                        <div>
                          <span>{item.title}</span>
                        </div>
                      }
                      description={
                        <div>
                          {item.description && <div>{item.description}</div>}
                          {item.filePath && (
                            <div style={{ marginTop: 4 }}>
                              <a 
                                href="#" 
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  console.log('🔵 Clicked to view file, filePath:', item.filePath);
                                  console.log('🔵 Full item:', item);
                                  setViewingFile(item.filePath);
                                  setIsFileViewerOpen(true);
                                }}
                                style={{ color: '#1890ff', cursor: 'pointer' }}
                              >
                                <FileTextOutlined /> Xem file
                              </a>
                            </div>
                          )}
                          {item.dueDate && (
                            <div style={{ color: isPastDate(item.dueDate) ? 'red' : '#faad14', marginTop: 4 }}>
                              Hạn nộp: {formatDate(item.dueDate)} {isPastDate(item.dueDate) ? '(Đã quá hạn)' : ''}
                            </div>
                          )}
                          {item.maxScore && (
                            <div style={{ color: '#1890ff', marginTop: 4 }}>
                              Điểm tối đa: {item.maxScore}
                            </div>
                          )}
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </Panel>

          <Panel 
            header={<Title level={4} style={{ margin: 0, color: '#1890ff' }}>📚 Tài liệu</Title>} 
            key="materials"
          >
            {materialsList.length === 0 ? (
              <Card>
                <p style={{ textAlign: 'center', color: '#999' }}>Chưa có tài liệu nào.</p>
              </Card>
            ) : (
                <List
                    itemLayout="horizontal"
                dataSource={materialsList}
                    renderItem={item => (
                        <List.Item
                    actions={[
                      <Button 
                        type="link" 
                        icon={<EditOutlined />} 
                        onClick={() => {
                          setEditingAssignment(item);
                          assignmentForm.setFieldsValue({
                            title: item.title,
                            description: item.description,
                            type: item.type,
                            filePath: item.filePath,
                          });
                          setIsAssignmentModalOpen(true);
                        }}
                      />,
                      <Popconfirm
                        title="Xác nhận xóa"
                        description="Bạn có chắc chắn muốn xóa tài liệu này?"
                        okText="Xóa"
                        cancelText="Hủy"
                        okType="danger"
                        onConfirm={async () => {
                          const assignmentId = item.assignmentID || item.id;
                          console.log('🔵 Popconfirm onConfirm called for material:', assignmentId);
                          if (!assignmentId) {
                            message.error('Không tìm thấy ID của tài liệu!');
                            return;
                          }
                          try {
                            await handleDeleteAssignment(assignmentId);
                            console.log('🔵 Delete completed successfully in Popconfirm.onConfirm');
                          } catch (error) {
                            console.error('❌ Error in Popconfirm.onConfirm:', error);
                            message.error('Xóa thất bại: ' + (error.message || error));
                          }
                        }}
                        onCancel={() => {
                          console.log('🔵 Popconfirm cancelled');
                        }}
                      >
                        <Button 
                          type="link" 
                          danger 
                          icon={<DeleteOutlined />} 
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            const assignmentId = item.assignmentID || item.id;
                            console.log('🔵 Delete button clicked, assignmentId:', assignmentId, 'item:', item);
                          }}
                        />
                      </Popconfirm>
                    ]}
                            style={{ padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}
                        >
                            <List.Item.Meta
                      avatar={<Avatar icon={<FilePdfOutlined />} style={{ backgroundColor: '#1890ff' }} />}
                      title={
                        <div>
                          <span>{item.title}</span>
                        </div>
                      }
                      description={
                        <div>
                          {item.description && <div>{item.description}</div>}
                          {item.filePath && (
                            <div style={{ marginTop: 8 }}>
                              <a 
                                href="#" 
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  console.log('🔵 Clicked to view material, filePath:', item.filePath);
                                  console.log('🔵 Full item:', item);
                                  setViewingFile(item.filePath);
                                  setIsFileViewerOpen(true);
                                }}
                                style={{ color: '#1890ff', cursor: 'pointer' }}
                              >
                                <FilePdfOutlined /> Xem tài liệu
                              </a>
                            </div>
                          )}
                        </div>
                      }
                            />
                        </List.Item>
                    )}
                />
            )}
            </Panel>
      </Collapse>
    </div>
  );
  };

  // 3. Tab Thành viên (People)
  const PeopleContent = () => (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
       <Title level={4} style={{ color: '#1890ff', borderBottom: '1px solid #1890ff', paddingBottom: 10, marginBottom: 20 }}>
          Giáo viên
       </Title>
       {loading ? (
         <div style={{ textAlign: 'center', padding: '20px' }}>
           <Spin /> <span style={{ marginLeft: 10 }}>Đang tải...</span>
         </div>
       ) : (
         <List.Item>
             <List.Item.Meta
                 avatar={<Avatar size="large" style={{ backgroundColor: '#1890ff' }} icon={<UserOutlined />} />}
                 title={teacherInfo?.name || 'Chưa có thông tin'}
                 description={teacherInfo?.email || ''}
             />
         </List.Item>
       )}

       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 30, borderBottom: '1px solid #1890ff', paddingBottom: 10, marginBottom: 20 }}>
           <Title level={4} style={{ color: '#1890ff', margin: 0 }}>Sinh viên</Title>
           <Space>
             <span style={{ fontWeight: 'bold' }}>{students.length} sinh viên</span>
             <Button 
               type="primary" 
               icon={<UserAddOutlined />} 
               onClick={() => setIsAddStudentModalOpen(true)}
               size="small"
             >
               Thêm sinh viên
             </Button>
           </Space>
       </div>

       {loading ? (
         <div style={{ textAlign: 'center', padding: '20px' }}>
           <Spin /> <span style={{ marginLeft: 10 }}>Đang tải danh sách sinh viên...</span>
         </div>
       ) : students.length === 0 ? (
         <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
           <p>Chưa có sinh viên nào trong lớp này.</p>
           <p style={{ fontSize: '12px', marginTop: '10px' }}>Sinh viên cần tham gia lớp bằng mã tham gia do giáo viên cung cấp.</p>
         </div>
       ) : (
         <List
            itemLayout="horizontal"
            dataSource={students}
            renderItem={item => (
                <List.Item actions={[<Button type="text" icon={<MoreOutlined />} />]}>
                    <List.Item.Meta
                        avatar={<Avatar icon={<UserOutlined />} />}
                        title={item.name || 'Chưa có tên'}
                        description={item.email || item.mssv || ''}
                    />
                </List.Item>
            )}
         />
       )}

       {/* Modal thêm sinh viên */}
       <Modal
         title="Thêm sinh viên vào lớp"
         open={isAddStudentModalOpen}
         onCancel={() => {
           setIsAddStudentModalOpen(false);
           addStudentForm.resetFields();
         }}
         onOk={() => addStudentForm.submit()}
         confirmLoading={addStudentLoading}
       >
         <Form
           form={addStudentForm}
           layout="vertical"
           onFinish={handleAddStudent}
         >
           <Form.Item
             name="email"
             label="Email sinh viên"
             rules={[
               ({ getFieldValue }) => ({
                 validator(_, value) {
                   if (!value && !getFieldValue('mssv')) {
                     return Promise.reject(new Error('Vui lòng nhập email hoặc MSSV!'));
                   }
                   if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                     return Promise.reject(new Error('Email không hợp lệ!'));
                   }
                   return Promise.resolve();
                 },
               }),
             ]}
           >
             <Input placeholder="Ví dụ: sv1@sis.hust.edu.vn" />
           </Form.Item>
           <div style={{ textAlign: 'center', margin: '10px 0', color: '#999' }}>HOẶC</div>
           <Form.Item
             name="mssv"
             label="Mã số sinh viên (MSSV)"
             rules={[
               ({ getFieldValue }) => ({
                 validator(_, value) {
                   if (!value && !getFieldValue('email')) {
                     return Promise.reject(new Error('Vui lòng nhập email hoặc MSSV!'));
                   }
                   return Promise.resolve();
                 },
               }),
             ]}
           >
             <Input placeholder="Ví dụ: 2023001" />
           </Form.Item>
           <div style={{ fontSize: '12px', color: '#999', marginTop: '-10px', marginBottom: '10px' }}>
             * Nhập email hoặc MSSV của sinh viên cần thêm vào lớp
           </div>
         </Form>
       </Modal>
    </div>
  );

  // --- CẤU HÌNH TABS (ĐÃ THÊM TAB ĐIỂM DANH) ---
  const items = [
    {
      key: '1',
      label: 'Bảng tin',
      children: (
        <div style={{ padding: 20, maxWidth: 800, margin: '0 auto' }}>
          <Card style={{ marginBottom: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <Space style={{ width: '100%' }} direction="vertical" size="middle">
              <div style={{ display: 'flex', gap: 10 }}>
                 <Avatar style={{ backgroundColor: '#1890ff' }} icon={<UserOutlined />} />
                 <Text strong style={{ marginTop: 5 }}>{teacherInfo?.name || 'Đang tải...'}</Text>
              </div>
              <TextArea 
                rows={4} 
                placeholder="Thông báo nội dung nào đó cho lớp học..." 
                value={postContent}
                onChange={(e) => {
                  const newValue = e.target.value;
                  setPostContent(newValue);
                }}
                style={{ width: '100%' }}
                allowClear
                showCount
                maxLength={1000}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                 <Upload>
                    <Button icon={<UploadOutlined />}>Thêm tệp</Button>
                 </Upload>
                 <Button 
                   type="primary" 
                   icon={<SendOutlined />} 
                   onClick={handlePost}
                   loading={postLoading}
                   disabled={!postContent.trim()}
                 >
                   Đăng tin
                 </Button>
              </div>
            </Space>
          </Card>

          {posts.length === 0 ? (
            <Card>
              <p style={{ textAlign: 'center', color: '#999' }}>Chưa có bài đăng nào.</p>
            </Card>
          ) : (
            <List
              itemLayout="vertical"
              dataSource={posts}
              renderItem={(item) => (
                <Card style={{ marginBottom: 15 }}>
                   <List.Item.Meta
                      avatar={<Avatar style={{ backgroundColor: '#1890ff' }} icon={<UserOutlined />} />}
                      title={
                        <span>
                          <b>{item.author?.name || 'Giáo viên'}</b> 
                          <span style={{fontSize: 12, color: '#999', marginLeft: 10}}>
                            {item.createdAt ? formatRelativeTime(item.createdAt) : ''}
                          </span>
                        </span>
                      }
                      description={item.content}
                   />
                </Card>
              )}
            />
          )}
        </div>
      ),
    },
    {
      key: '2',
      label: 'Bài tập & Tài liệu',
      children: <div style={{ padding: 20 }}><ClassworkContent /></div>,
    },
    // --- TAB MỚI: ĐIỂM DANH ---
    {
      key: '3',
      label: 'Điểm danh',
      children: <div style={{ padding: 20 }}><AttendanceTab classId={id} /></div>,
    },
    // -------------------------
    {
      key: '4',
      label: 'Thành viên',
      children: <div style={{ padding: 20 }}><PeopleContent /></div>,
    },
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <p>Đang tải thông tin lớp học...</p>
      </div>
    );
  }

  return (
    <div>
      {/* HEADER LỚP HỌC */}
      <Card
        style={{
            height: 200,
            backgroundImage: 'linear-gradient(to right, #4facfe 0%, #00f2fe 100%)',
            borderRadius: 10,
            display: 'flex',
            alignItems: 'flex-end',
            marginBottom: 20
        }}
        styles={{ body: { width: '100%', padding: 24 } }}
      >
        <div style={{ color: 'white' }}>
            <h1 style={{ fontSize: 32, margin: 0 }}>{classInfo?.tenLop || classInfo?.name || 'Đang tải...'}</h1>
            <p style={{ fontSize: 18, opacity: 0.9 }}>Mã tham gia: {classInfo?.maThamGia || classInfo?.code || 'Không có'}</p>
        </div>
      </Card>

      {/* THANH TABS CHÍNH */}
      <Tabs
        defaultActiveKey="1"
        items={items}
        size="large"
        tabBarStyle={{ fontWeight: 'bold' }}
      />

      {/* Modal Tạo/Sửa Bài tập */}
      <Modal
        title={editingAssignment ? 'Sửa bài tập/tài liệu' : 'Tạo bài tập/tài liệu mới'}
        open={isAssignmentModalOpen}
        onCancel={() => {
          setIsAssignmentModalOpen(false);
          assignmentForm.resetFields();
          setEditingAssignment(null);
        }}
        onOk={() => assignmentForm.submit()}
        width={600}
      >
        <Form
          form={assignmentForm}
          layout="vertical"
          onFinish={handleCreateAssignment}
          onValuesChange={(changedValues, allValues) => {
            console.log('🔵 Form onValuesChange:', changedValues, 'allValues:', allValues);
            if (changedValues.file) {
              console.log('🔵 File changed:', changedValues.file);
            }
          }}
        >
          <Form.Item
            name="type"
            label="Loại"
            initialValue="ASSIGNMENT"
            rules={[{ required: true }]}
          >
            <Select>
              <Select.Option value="ASSIGNMENT">Bài tập</Select.Option>
              <Select.Option value="MATERIAL">Tài liệu</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="title"
            label="Tiêu đề"
            rules={[{ required: true, message: 'Vui lòng nhập tiêu đề!' }]}
          >
            <Input placeholder="Nhập tiêu đề bài tập/tài liệu" />
          </Form.Item>
          <Form.Item
            name="description"
            label="Mô tả"
          >
            <Input.TextArea rows={3} placeholder="Nhập mô tả (tùy chọn)" />
          </Form.Item>
          <Form.Item
            name="file"
            label="📁 Tải file lên"
            valuePropName="fileList"
            getValueFromEvent={(e) => {
              console.log('🔵 getValueFromEvent called:', e);
              console.log('🔵 getValueFromEvent type:', typeof e, 'isArray:', Array.isArray(e));
              if (Array.isArray(e)) {
                console.log('🔵 Returning array directly:', e);
                return e;
              }
              if (e && e.fileList) {
                console.log('🔵 Returning e.fileList:', e.fileList);
                return e.fileList;
              }
              if (e && e.target && e.target.files) {
                // Handle file input change event
                const files = Array.from(e.target.files);
                console.log('🔵 Returning files from input:', files);
                return files.map(file => ({ originFileObj: file, name: file.name }));
              }
              console.log('🔵 Returning empty array');
              return [];
            }}
            rules={[
              {
                validator: (_, value) => {
                  console.log('🔵 Validating file, value:', value);
                  console.log('🔵 Validating file, value type:', typeof value, 'isArray:', Array.isArray(value));
                  if (!value) {
                    console.log('❌ Validation failed: value is undefined/null');
                    return Promise.reject(new Error('Vui lòng chọn file để upload!'));
                  }
                  const fileList = Array.isArray(value) ? value : (value?.fileList || []);
                  console.log('🔵 Validating file, fileList:', fileList, 'length:', fileList.length);
                  if (!fileList || fileList.length === 0) {
                    console.log('❌ Validation failed: no file selected');
                    return Promise.reject(new Error('Vui lòng chọn file để upload!'));
                  }
                  console.log('✅ Validation passed');
                  return Promise.resolve();
                }
              }
            ]}
          >
            <Upload
              beforeUpload={() => false} // Không tự động upload, sẽ upload khi submit form
              maxCount={1}
              accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.mp4"
              onChange={(info) => {
                console.log('🔵 Upload onChange called:', info);
                console.log('🔵 Upload onChange fileList:', info.fileList);
                // Cập nhật giá trị form trực tiếp
                assignmentForm.setFieldsValue({ file: info.fileList });
                console.log('🔵 Form value updated, new value:', assignmentForm.getFieldValue('file'));
              }}
            >
              <Button icon={<UploadOutlined />}>Chọn file</Button>
            </Upload>
          </Form.Item>
          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) => prevValues.type !== currentValues.type}
          >
            {({ getFieldValue }) => {
              const type = getFieldValue('type');
              const isAssignment = type === 'ASSIGNMENT';
              
              return (
                <>
                  <Form.Item
                    name="dueDate"
                    label="Hạn nộp (chỉ cho bài tập)"
                    shouldUpdate
                    rules={[
                      {
                        validator: (_, value) => {
                          if (!isAssignment || !value) {
                            return Promise.resolve();
                          }
                          const selectedDate = new Date(value);
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          if (selectedDate < today) {
                            return Promise.reject(new Error('Hạn nộp không được là quá khứ!'));
                          }
                          return Promise.resolve();
                        },
                      },
                    ]}
                  >
                    <Input 
                      type="date" 
                      disabled={!isAssignment}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </Form.Item>
                  {isAssignment && (
                    <Form.Item
                      name="maxScore"
                      label="Điểm tối đa (chỉ cho bài tập)"
                    >
                      <Input 
                        type="number" 
                        min={0} 
                        max={100} 
                        placeholder="Ví dụ: 10" 
                      />
                    </Form.Item>
                  )}
                </>
              );
            }}
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal Xem File */}
      <Modal
        title="Xem tài liệu"
        open={isFileViewerOpen}
        onCancel={() => {
          setIsFileViewerOpen(false);
          setViewingFile(null);
        }}
        footer={[
          <Button key="close" onClick={() => {
            setIsFileViewerOpen(false);
            setViewingFile(null);
          }}>
            Đóng
          </Button>,
          viewingFile && (viewingFile.startsWith('http://') || viewingFile.startsWith('https://')) && (
            <Button 
              key="open" 
              type="primary" 
              onClick={() => {
                window.open(viewingFile, '_blank');
              }}
            >
              Mở trong tab mới
            </Button>
          )
        ]}
        width="90%"
        style={{ top: 20 }}
        styles={{ body: { height: '80vh', padding: 0 } }}
      >
        {viewingFile ? (
          <div style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#f5f5f5' }}>
            {(() => {
              console.log('🔵 Viewing file:', viewingFile);
              
              // Xử lý URL - nếu là relative path từ server, thêm base URL
              let fileUrl = viewingFile;
              console.log('🔵 Processing file URL (original):', fileUrl);
              console.log('🔵 File URL type:', typeof fileUrl);
              
              if (!fileUrl) {
                console.error('❌ viewingFile is null or undefined');
                fileUrl = null;
              } else if (!fileUrl.startsWith('http://') && !fileUrl.startsWith('https://')) {
                // Nếu bắt đầu bằng /api/files/, đó là URL từ server
                if (fileUrl.startsWith('/api/files/')) {
                  fileUrl = `http://localhost:5000${fileUrl}`;
                  console.log('🔵 Converted to full URL:', fileUrl);
                } else if (fileUrl.startsWith('api/files/')) {
                  // Nếu thiếu dấu / ở đầu
                  fileUrl = `http://localhost:5000/${fileUrl}`;
                  console.log('🔵 Fixed and converted to full URL:', fileUrl);
                } else {
                  // Nếu chỉ là tên file, hiển thị thông báo
                  console.log('⚠️ File URL is not a valid URL, only filename:', fileUrl);
                  fileUrl = null;
                }
              } else {
                console.log('🔵 File URL is already a full URL:', fileUrl);
              }
              
              // Kiểm tra loại file
              const isPDF = fileUrl && (fileUrl.toLowerCase().endsWith('.pdf') || fileUrl.toLowerCase().includes('.pdf'));
              const isImage = fileUrl && fileUrl.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/i);
              const isVideo = fileUrl && fileUrl.match(/\.(mp4|webm|ogg)$/i);
              
                  if (!fileUrl) {
                    // Nếu chỉ là tên file (không phải URL), thử dùng Google Viewer với tên file
                    // Hoặc hiển thị thông báo yêu cầu upload lại
                    const fileName = viewingFile;
                    const isPDFName = fileName.toLowerCase().endsWith('.pdf') || fileName.toLowerCase().includes('.pdf');
                    
                    return (
                      <div style={{ padding: '40px', textAlign: 'center' }}>
                        <p style={{ fontSize: '16px', marginBottom: 10, color: '#ff4d4f' }}>⚠️ File chưa được upload lên server</p>
                        <p style={{ color: '#666', fontSize: '12px', marginTop: 10 }}>Tên file: {fileName}</p>
                        <p style={{ color: '#999', fontSize: '11px', marginTop: 5, marginBottom: 20 }}>
                          File này chỉ là tên file, chưa được upload lên server. Vui lòng:
                        </p>
                        <div style={{ textAlign: 'left', maxWidth: 400, margin: '0 auto', background: '#f5f5f5', padding: '15px', borderRadius: '4px' }}>
                          <p style={{ margin: '5px 0', fontSize: '13px' }}>1. Sửa lại tài liệu này</p>
                          <p style={{ margin: '5px 0', fontSize: '13px' }}>2. Chọn file từ máy tính để upload</p>
                          <p style={{ margin: '5px 0', fontSize: '13px' }}>3. Hoặc nhập URL đầy đủ của file (nếu file đã có trên internet)</p>
                        </div>
                        {isPDFName && (
                          <p style={{ color: '#1890ff', fontSize: '11px', marginTop: 15, fontStyle: 'italic' }}>
                            💡 File PDF cần được upload lên server để xem được
                          </p>
                        )}
                      </div>
                    );
                  }
              
              if (isPDF) {
                return (
                  <iframe
                    src={fileUrl}
                    style={{ width: '100%', height: '100%', border: 'none' }}
                    title="File Viewer"
                    onError={(e) => {
                      console.error('❌ Iframe load error:', e);
                    }}
                  />
                );
              }
              
              if (isImage) {
                return (
                  <img 
                    src={fileUrl} 
                    alt="File preview" 
                    style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                    onError={(e) => {
                      console.error('❌ Image load error:', e);
                      e.target.style.display = 'none';
                    }}
                  />
                );
              }
              
              if (isVideo) {
                return (
                  <video 
                    src={fileUrl} 
                    controls 
                    style={{ maxWidth: '100%', maxHeight: '100%' }}
                    onError={(e) => {
                      console.error('❌ Video load error:', e);
                    }}
                  />
                );
              }
              
              // File không được hỗ trợ
              return (
                <div style={{ padding: '40px', textAlign: 'center' }}>
                  <p>Không thể hiển thị file này trực tiếp.</p>
                  <p style={{ color: '#666', fontSize: '12px', marginTop: 10 }}>File: {viewingFile}</p>
                  <Button 
                    type="primary" 
                    onClick={() => window.open(fileUrl, '_blank')}
                    style={{ marginTop: 20 }}
                  >
                    Mở trong tab mới
                  </Button>
                </div>
              );
            })()}
          </div>
        ) : (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <p>Không có file để hiển thị.</p>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default TeacherClassDetail;