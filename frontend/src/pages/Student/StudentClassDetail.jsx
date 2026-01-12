import React, { useState, useEffect } from 'react';
import { Tabs, List, Avatar, Button, Input, Card, Tag, Collapse, Modal, Form, Upload, message, Divider, Typography, Spin } from 'antd';
import { UserOutlined, FilePdfOutlined, FileTextOutlined, UploadOutlined, LinkOutlined, CheckCircleOutlined, SendOutlined, DownloadOutlined } from '@ant-design/icons';
import { useParams } from 'react-router-dom';
import { classAPI, userAPI, gradingAPI, postAPI, assignmentAPI, fileAPI, notificationAPI } from '../../utils/api';
import { formatDate, formatDateTime, formatRelativeTime, isPastDate } from '../../utils/dateUtils';

const { Panel } = Collapse;
const { Title, Text } = Typography;

const StudentClassDetail = () => {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [classInfo, setClassInfo] = useState(null);
  const [teacherInfo, setTeacherInfo] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentAssignment, setCurrentAssignment] = useState(null);
  const [form] = Form.useForm();
  const [commentInput, setCommentInput] = useState({});
  const [isFileViewerOpen, setIsFileViewerOpen] = useState(false);
  const [viewingFile, setViewingFile] = useState(null);

  useEffect(() => {
    loadClassData();
  }, [id]);

  const loadClassData = async () => {
    try {
      setLoading(true);
      console.log('🔵 Loading class data for ID:', id);
      
      // Load thông tin lớp
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

      // Load submissions của student cho lớp này
      const userInfo = JSON.parse(localStorage.getItem('user_info') || '{}');
      if (userInfo.id) {
        try {
          const submissionsData = await gradingAPI.getSubmissions(null, userInfo.id, id);
          console.log('🔵 Submissions data:', submissionsData);
          setSubmissions(Array.isArray(submissionsData) ? submissionsData : []);
        } catch (err) {
          console.error('Error loading submissions:', err);
          setSubmissions([]);
        }
      }

      // Load assignments
      try {
        const assignmentsData = await assignmentAPI.getByClass(id);
        console.log('🔵 Assignments data:', assignmentsData);
        setAssignments(Array.isArray(assignmentsData) ? assignmentsData : []);
      } catch (err) {
        console.error('Error loading assignments:', err);
        setAssignments([]);
      }
    } catch (error) {
      console.error('Error loading class data:', error);
      message.error('Không thể tải thông tin lớp học');
    } finally {
      setLoading(false);
    }
  };

  const handleComment = (postId) => {
    const content = commentInput[postId];
    if (!content) return;
    // TODO: Implement comment API
    message.success('Đã đăng bình luận');
    setCommentInput({ ...commentInput, [postId]: '' });
  };

  const openSubmitModal = (assignment) => {
    // Kiểm tra xem đã nộp bài chưa
    const userInfo = JSON.parse(localStorage.getItem('user_info') || '{}');
    const existingSubmission = submissions.find(s => s.tenBaiTap === assignment.title);
    
    if (existingSubmission) {
      message.warning('Bạn đã nộp bài tập này rồi! Mỗi bài tập chỉ được nộp một lần.');
      return;
    }
    
    setCurrentAssignment(assignment);
    setIsModalOpen(true);
  };

  const handleSubmit = async (values) => {
    try {
      const userInfo = JSON.parse(localStorage.getItem('user_info') || '{}');
      
      // Kiểm tra lại xem đã nộp bài chưa (double check)
      const assignmentTitle = currentAssignment?.title || 'Bài tập';
      const existingSubmission = submissions.find(s => s.tenBaiTap === assignmentTitle);
      
      if (existingSubmission) {
        message.error('Bạn đã nộp bài tập này rồi! Mỗi bài tập chỉ được nộp một lần.');
        setIsModalOpen(false);
        form.resetFields();
        return;
      }
      
      let filePath = null;
      
      // Upload file nếu có
      if (values.file && values.file.length > 0) {
        const fileItem = values.file[0];
        const file = fileItem.originFileObj || fileItem;
        if (file) {
          console.log('🔵 Uploading file:', file.name);
          message.loading({ content: 'Đang upload file...', key: 'upload' });
          const uploadResult = await fileAPI.upload(file);
          if (uploadResult.error) {
            message.error({ content: 'Upload file thất bại: ' + uploadResult.error, key: 'upload' });
            return;
          }
          filePath = uploadResult.url;
          message.success({ content: 'Upload file thành công!', key: 'upload' });
          console.log('🔵 File uploaded, URL:', filePath);
        }
      }
      
      if (!filePath) {
        message.error('Vui lòng chọn file để upload!');
        return;
      }
      
      const submissionData = {
        studentID: userInfo.id,
        lopHocID: id,
        tenBaiTap: assignmentTitle,
        filePath: filePath,
      };

      console.log('🔵 Creating submission:', submissionData);
      const response = await gradingAPI.createSubmission(submissionData);
      
      if (response.error) {
        // Kiểm tra xem lỗi có phải do đã nộp bài không
        if (response.error.includes('đã nộp') || response.error.includes('already submitted') || response.error.includes('duplicate')) {
          message.error('Bạn đã nộp bài tập này rồi! Mỗi bài tập chỉ được nộp một lần.');
        } else {
          message.error(response.error);
        }
        return;
      }

      message.success('Nộp bài thành công! 🎉');
      
      // Gửi thông báo cho giáo viên
      try {
        if (classInfo && classInfo.giaoVienID) {
          await notificationAPI.create(
            classInfo.giaoVienID,
            `📥 Sinh viên nộp bài: ${assignmentTitle}`,
            `Sinh viên ${userInfo.name || userInfo.email} vừa nộp bài tập trong lớp ${classInfo.name}`,
            'teacher'
          );
          console.log('✅ Sent submission notification to teacher');
        }
      } catch (notifError) {
        console.error('⚠️ Failed to notify teacher:', notifError);
      }
      
    setIsModalOpen(false);
    form.resetFields();
      
      // Reload để cập nhật danh sách (bao gồm assignments)
      // Bỏ qua lỗi nếu có khi reload submissions (lỗi 500 từ backend)
      try {
        // Chỉ reload assignments, không reload submissions để tránh lỗi 500
        const assignmentsData = await assignmentAPI.getByClass(id);
        setAssignments(Array.isArray(assignmentsData) ? assignmentsData : []);
        
        // Thử reload submissions nhưng không fail nếu có lỗi
        try {
          const userInfo = JSON.parse(localStorage.getItem('user_info') || '{}');
          if (userInfo.id) {
            const submissionsData = await gradingAPI.getSubmissions(null, userInfo.id, id);
            setSubmissions(Array.isArray(submissionsData) ? submissionsData : []);
          }
        } catch (submissionError) {
          console.error('❌ Error reloading submissions (ignored):', submissionError);
          // Không hiển thị lỗi cho user vì submission đã được tạo thành công
        }
      } catch (error) {
        console.error('❌ Error reloading class data:', error);
        // Vẫn hiển thị thành công vì submission đã được tạo
      }
    } catch (error) {
      console.error('Error submitting:', error);
      message.error('Nộp bài thất bại!');
    }
  };

  const [posts, setPosts] = useState([]);

  useEffect(() => {
    if (id) {
      loadPosts();
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

  const loadAssignments = async () => {
    try {
      console.log('🔵 Loading assignments for class:', id);
      const assignmentsData = await assignmentAPI.getByClass(id);
      console.log('🔵 Assignments loaded:', assignmentsData);
      setAssignments(Array.isArray(assignmentsData) ? assignmentsData : []);
    } catch (error) {
      console.error('❌ Error loading assignments:', error);
      setAssignments([]);
    }
  };

  const items = [
    {
      key: '1', label: 'Bảng tin',
      children: (
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
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
      key: '2', label: 'Bài tập & Tài liệu',
      children: loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Spin size="large" />
        </div>
      ) : (
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          {assignments.length === 0 ? (
            <Card>
              <p style={{ textAlign: 'center', color: '#999' }}>Chưa có bài tập hoặc tài liệu nào.</p>
            </Card>
          ) : (
            <Collapse defaultActiveKey={['assignments', 'materials']} ghost>
              <Panel 
                header={<Title level={4} style={{ margin: 0, color: '#faad14' }}>📝 Bài tập</Title>} 
                key="assignments"
              >
                {assignments.filter(a => a.type === 'ASSIGNMENT').length === 0 ? (
                  <Card>
                    <p style={{ textAlign: 'center', color: '#999' }}>Chưa có bài tập nào.</p>
                  </Card>
                ) : (
                    <List
                        itemLayout="horizontal"
                    dataSource={assignments.filter(a => a.type === 'ASSIGNMENT')}
                    renderItem={item => {
                      // Tìm submission tương ứng
                      const submission = submissions.find(s => s.tenBaiTap === item.title);
                      const hasSubmitted = !!submission;
                      
                      return (
                            <List.Item
                                actions={[
                            hasSubmitted ? (
                              submission.trangThai === 'Graded' ? (
                                <Tag icon={<CheckCircleOutlined />} color="success">Đã chấm</Tag>
                              ) : (
                                <Tag color="processing">Đã nộp</Tag>
                              )
                            ) : (
                              <Button 
                                type="primary" 
                                size="small" 
                                onClick={() => openSubmitModal({ title: item.title, assignmentID: item.assignmentID })}
                                disabled={hasSubmitted}
                              >
                                Nộp bài
                              </Button>
                            ),
                                ]}
                            >
                                <List.Item.Meta
                                    avatar={
                              <Avatar shape="square" icon={<FileTextOutlined />} style={{ backgroundColor: '#faad14' }} />
                            }
                            title={
                              <div>
                                <span>{item.title}</span>
                              </div>
                            }
                                    description={
                              <div>
                                {item.description && <div>{item.description}</div>}
                                {item.filePath && (
                                  <div style={{ marginTop: 4, display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                    <a 
                                      href="#" 
                                      onClick={(e) => {
                                        e.preventDefault();
                                        setViewingFile(item.filePath);
                                        setIsFileViewerOpen(true);
                                      }}
                                      style={{ color: '#1890ff', cursor: 'pointer' }}
                                    >
                                      <FileTextOutlined /> Xem file
                                    </a>
                                    <a 
                                      href="#" 
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        // Xử lý download file
                                        let downloadUrl = item.filePath;
                                        if (!downloadUrl.startsWith('http://') && !downloadUrl.startsWith('https://')) {
                                          if (downloadUrl.startsWith('/api/files/')) {
                                            downloadUrl = `http://localhost:5000${downloadUrl}`;
                                          } else {
                                            message.warning('Không thể tải file này. File chưa được upload lên server.');
                                            return;
                                          }
                                        }
                                        // Tạo link tạm để download
                                        const link = document.createElement('a');
                                        link.href = downloadUrl;
                                        link.download = item.title || 'tai-lieu.pdf';
                                        link.target = '_blank';
                                        document.body.appendChild(link);
                                        link.click();
                                        document.body.removeChild(link);
                                      }}
                                      style={{ color: '#52c41a', cursor: 'pointer' }}
                                    >
                                      <DownloadOutlined /> Tải về
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
                                {submission && submission.diem !== null && (
                                  <div style={{ color: 'green', fontWeight: 'bold', marginTop: 4 }}>
                                    Điểm của bạn: {parseFloat(submission.diem)}/{item.maxScore || 10}
                                  </div>
                                )}
                                {submission && submission.nhanXet && (
                                  <div style={{ marginTop: 4 }}>Nhận xét: {submission.nhanXet}</div>
                                )}
                              </div>
                            }
                          />
                        </List.Item>
                      );
                    }}
                  />
                )}
              </Panel>

              <Panel 
                header={<Title level={4} style={{ margin: 0, color: '#1890ff' }}>📚 Tài liệu</Title>} 
                key="materials"
              >
                {assignments.filter(a => a.type === 'MATERIAL').length === 0 ? (
                  <Card>
                    <p style={{ textAlign: 'center', color: '#999' }}>Chưa có tài liệu nào.</p>
                  </Card>
                ) : (
                  <List
                    itemLayout="horizontal"
                    dataSource={assignments.filter(a => a.type === 'MATERIAL')}
                    renderItem={item => (
                      <List.Item
                        actions={[
                          item.filePath && (
                            <>
                              <Button 
                                type="link" 
                                icon={<LinkOutlined />} 
                                onClick={(e) => {
                                  e.preventDefault();
                                  setViewingFile(item.filePath);
                                  setIsFileViewerOpen(true);
                                }}
                              >
                                Xem
                              </Button>
                              <Button 
                                type="link" 
                                icon={<DownloadOutlined />} 
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  // Xử lý download file
                                  let downloadUrl = item.filePath;
                                  if (!downloadUrl.startsWith('http://') && !downloadUrl.startsWith('https://')) {
                                    if (downloadUrl.startsWith('/api/files/')) {
                                      downloadUrl = `http://localhost:5000${downloadUrl}`;
                                    } else {
                                      message.warning('Không thể tải file này. File chưa được upload lên server.');
                                      return;
                                    }
                                  }
                                  // Tạo link tạm để download
                                  const link = document.createElement('a');
                                  link.href = downloadUrl;
                                  link.download = item.title || 'tai-lieu.pdf';
                                  link.target = '_blank';
                                  document.body.appendChild(link);
                                  link.click();
                                  document.body.removeChild(link);
                                }}
                              >
                                Tải về
                              </Button>
                            </>
                          ),
                        ]}
                      >
                        <List.Item.Meta
                          avatar={
                            <Avatar shape="square" icon={<FilePdfOutlined />} style={{ backgroundColor: '#1890ff' }} />
                          }
                          title={
                            <div>
                              <span>{item.title}</span>
                            </div>
                          }
                          description={item.description || 'Tài liệu tham khảo'}
                                />
                            </List.Item>
                        )}
                    />
                )}
                </Panel>
          </Collapse>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Spin size="large" />
        </div>
      ) : (
        <>
        <div style={{ marginBottom: 20, borderBottom: '1px solid #eee', paddingBottom: 10 }}>
            <Title level={3} style={{ margin: 0 }}>
              {classInfo?.tenLop || classInfo?.name || 'Lớp học'}
            </Title>
            <Text type="secondary">
              Giảng viên: {teacherInfo?.name || 'Chưa có thông tin'} | 
              Mã lớp: {classInfo?.maThamGia || classInfo?.code || 'Không có'}
            </Text>
        </div>

        <Tabs defaultActiveKey="2" items={items} size="large" />

        <Modal
            title={`Nộp bài: ${currentAssignment?.title || 'Bài tập'}`}
            open={isModalOpen}
            onOk={form.submit}
            onCancel={() => {
              setIsModalOpen(false);
              form.resetFields();
            }}
            okText="Nộp bài"
        >
            <Form form={form} onFinish={handleSubmit} layout="vertical">
              <Form.Item name="title" label="Họ tên - MSSV" rules={[{ required: true, message: 'Vui lòng nhập Họ tên - MSSV!' }]}>
                <Input placeholder="Ví dụ: Nguyễn Văn A - 20201234" />
                </Form.Item>
              <Form.Item 
                name="file" 
                label="Tải file lên" 
                valuePropName="fileList"
                getValueFromEvent={(e) => {
                  if (Array.isArray(e)) {
                    return e;
                  }
                  return e && e.fileList ? e.fileList : [];
                }}
                rules={[{ required: true, message: 'Vui lòng chọn file để upload!' }]}
              >
                <Upload
                  beforeUpload={() => false}
                  maxCount={1}
                  onChange={(info) => {
                    form.setFieldsValue({ file: info.fileList });
                  }}
                >
                  <Button icon={<UploadOutlined />}>Chọn file</Button>
                </Upload>
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
                    // Nếu chỉ là tên file (không phải URL), hiển thị thông báo
                    const fileName = viewingFile;
                    const isPDFName = fileName.toLowerCase().endsWith('.pdf') || fileName.toLowerCase().includes('.pdf');
                    
                    return (
                      <div style={{ padding: '40px', textAlign: 'center' }}>
                        <p style={{ fontSize: '16px', marginBottom: 10, color: '#ff4d4f' }}>⚠️ File chưa được upload lên server</p>
                        <p style={{ color: '#666', fontSize: '12px', marginTop: 10 }}>Tên file: {fileName}</p>
                        <p style={{ color: '#999', fontSize: '11px', marginTop: 5 }}>
                          File này chưa được upload. Vui lòng liên hệ giáo viên để upload file lên server.
                        </p>
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
        </>
      )}
    </div>
  );
};

export default StudentClassDetail;