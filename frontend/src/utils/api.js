const API_BASE_URL = 'http://localhost:5000/api';

// Test connection function
export const testConnection = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: 'test', password: 'test' }),
    });
    return response.status !== 0; // If we get any response, backend is running
  } catch (error) {
    console.error('Backend connection test failed:', error);
    return false;
  }
};

// Helper function để lấy token từ localStorage
const getToken = () => {
  return localStorage.getItem('token');
};

// Helper function để lấy headers với token
const getHeaders = (includeAuth = true) => {
  const headers = {
    'Content-Type': 'application/json',
  };
  
  if (includeAuth) {
    const token = getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  
  return headers;
};

// Auth APIs
export const authAPI = {
  login: async (email, password) => {
    try {
      console.log('🔵 Sending login request to:', `${API_BASE_URL}/auth/login`);
      console.log('🔵 Request data:', { email, password: '***' });
      
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: getHeaders(false),
        body: JSON.stringify({ email, password }),
      });
      
      console.log('🟢 Response status:', response.status);
      console.log('🟢 Response ok:', response.ok);
      
      // Kiểm tra nếu response không phải JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('❌ Response is not JSON:', text);
        return { error: `Server trả về lỗi: ${text.substring(0, 100)}` };
      }
      
      const data = await response.json();
      console.log('🟢 Response data:', data);
      
      if (!response.ok) {
        // Backend trả về lỗi với status 400 hoặc 500
        const errorMessage = data.error || data.message || `Đăng nhập thất bại (Status: ${response.status})`;
        console.error('❌ Login failed:', errorMessage);
        return { error: errorMessage };
      }
      
      return data;
    } catch (error) {
      console.error('❌ Login API error:', error);
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        return { error: 'Không thể kết nối đến server! Vui lòng kiểm tra:\n1. Backend đã chạy chưa? (http://localhost:5000)\n2. Database đã kết nối chưa?' };
      }
      return { error: `Lỗi: ${error.message}` };
    }
  },

  register: async (userData) => {
    try {
      console.log('🔵 Sending register request to:', `${API_BASE_URL}/auth/register`);
      console.log('🔵 Request data:', { ...userData, password: '***' });
      
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: getHeaders(false),
        body: JSON.stringify(userData),
      });
      
      console.log('🟢 Response status:', response.status);
      console.log('🟢 Response ok:', response.ok);
      console.log('🟢 Content-Type:', response.headers.get('content-type'));
      
      // Đọc response text trước để xử lý cả JSON và plain text
      const responseText = await response.text();
      console.log('🟢 Response text (raw):', responseText);
      
      // Kiểm tra nếu response không phải JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('❌ Response is not JSON:', responseText);
        return { error: responseText || `Server trả về lỗi (Status: ${response.status})` };
      }
      
      // Parse JSON
      let data;
      try {
        data = JSON.parse(responseText);
        console.log('🟢 Response data (parsed):', data);
      } catch (parseError) {
        console.error('❌ JSON parse error:', parseError);
        return { error: responseText || `Lỗi parse JSON (Status: ${response.status})` };
      }
      
      // Xử lý lỗi
      if (!response.ok) {
        // Xử lý cả trường hợp backend trả về object {error: "..."} hoặc plain text
        let errorMsg;
        if (typeof data === 'string') {
          errorMsg = data;
        } else if (data && typeof data === 'object') {
          errorMsg = data.error || data.message || JSON.stringify(data);
        } else {
          errorMsg = `Đăng ký thất bại (Status: ${response.status})`;
        }
        console.error('❌ Register error:', errorMsg);
        return { error: errorMsg };
      }
      
      return data;
    } catch (error) {
      console.error('❌ Register API error:', error);
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        return { error: 'Không thể kết nối đến server! Vui lòng kiểm tra backend đã chạy chưa!' };
      }
      return { error: `Lỗi: ${error.message}` };
    }
  },

  forgotPassword: async (email) => {
    try {
      console.log('🔵 Sending forgot password request to:', `${API_BASE_URL}/auth/forgot-password`);
      console.log('🔵 Request data:', { email });
      
      const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: getHeaders(false),
        body: JSON.stringify({ email }),
      });
      
      console.log('🟢 Response status:', response.status);
      
      const contentType = response.headers.get('content-type');
      let data;
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        console.error('❌ Response is not JSON:', text);
        return { error: text || `Lỗi: ${response.status}` };
      }
      
      console.log('🟢 Forgot password response:', data);
      
      if (!response.ok) {
        return { error: data.error || `Lỗi: ${response.status}` };
      }
      
      return data;
    } catch (error) {
      console.error('❌ Forgot password API error:', error);
      return { error: error.message || 'Không thể gửi yêu cầu quên mật khẩu' };
    }
  },
};

// Class APIs
export const classAPI = {
  getAll: async (userId, role) => {
    try {
    const params = new URLSearchParams();
    if (userId) params.append('userId', userId);
    if (role) params.append('role', role);
    
      const url = `${API_BASE_URL}/classes?${params}`;
      console.log('🔵 Fetching classes from:', url);
      
      const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders(),
    });
      
      const contentType = response.headers.get('content-type');
      let data;
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        console.error('❌ Response is not JSON:', text);
        return [];
      }
      
      if (!response.ok) {
        console.error('❌ Get classes failed:', response.status, response.statusText, data);
        return [];
      }
      
      console.log('🔵 Get classes response:', data);
      console.log('🔵 Response type:', typeof data, 'isArray:', Array.isArray(data));
      
      if (Array.isArray(data)) {
        console.log('🔵 Returning', data.length, 'classes');
        return data;
      } else if (data && Array.isArray(data.classes)) {
        console.log('🔵 Found classes in data.classes:', data.classes.length);
        return data.classes;
      } else {
        console.warn('⚠️ Unexpected response format:', data);
        return [];
      }
    } catch (error) {
      console.error('❌ Get classes error:', error);
      return [];
    }
  },

  getById: async (id) => {
    const response = await fetch(`${API_BASE_URL}/classes/${id}`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return response.json();
  },

  create: async (classData) => {
    try {
      const requestBody = {
        tenLop: classData.name,
        moTa: classData.description,
        maThamGia: classData.code || classData.maThamGia,
        giaoVienID: classData.teacherEmail || classData.giaoVienID,
      };
      
      console.log('🔵 Creating class with data:', requestBody);
      
      const response = await fetch(`${API_BASE_URL}/classes`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(requestBody),
      });
      
      // Kiểm tra Content-Type trước khi parse JSON
      const contentType = response.headers.get('content-type');
      let data;
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        // Nếu không phải JSON, đọc text
        const text = await response.text();
        console.error('❌ Response is not JSON:', text);
        return { error: text || `Lỗi: ${response.status}` };
      }
      
      console.log('🔵 Create class response:', data);
      
      if (!response.ok) {
        return { error: data.error || data || `Lỗi: ${response.status}` };
      }
      
      return data;
    } catch (error) {
      console.error('❌ Create class error:', error);
      return { error: error.message || 'Không thể tạo lớp học' };
    }
  },

  update: async (id, classData) => {
    const response = await fetch(`${API_BASE_URL}/classes/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({
        tenLop: classData.name,
        moTa: classData.description,
        maThamGia: classData.code || classData.maThamGia,
        giaoVienID: classData.teacherEmail || classData.giaoVienID,
      }),
    });
    return response.json();
  },

  delete: async (id) => {
    try {
      console.log('🔵 Deleting class:', id);
      
      const response = await fetch(`${API_BASE_URL}/classes/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      
      console.log('🔵 Response status:', response.status);
      console.log('🔵 Response ok:', response.ok);
      
      const contentType = response.headers.get('content-type');
      let data;
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        console.error('❌ Response is not JSON:', text);
        return { error: text || `Lỗi: ${response.status}` };
      }
      
      console.log('🔵 Delete class response:', data);
      
      if (!response.ok) {
        return { error: data.error || data || `Lỗi: ${response.status}` };
      }
      
      return data;
    } catch (error) {
      console.error('❌ Delete class error:', error);
      return { error: error.message || 'Không thể xóa lớp học' };
    }
  },

  enroll: async (sinhVienID, maThamGia) => {
    try {
      console.log('🔵 Enrolling student:', { sinhVienID, maThamGia });
      
    const response = await fetch(`${API_BASE_URL}/classes/enroll`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        sinhVienID: sinhVienID,
        maThamGia: maThamGia,
      }),
    });
      
      const contentType = response.headers.get('content-type');
      let data;
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        console.error('❌ Response is not JSON:', text);
        return { error: text || `Lỗi: ${response.status}` };
      }
      
      console.log('🔵 Enroll response:', data);
      
      if (!response.ok) {
        return { error: data.error || data || `Lỗi: ${response.status}` };
      }
      
      return data;
    } catch (error) {
      console.error('❌ Enroll error:', error);
      return { error: error.message || 'Không thể tham gia lớp học' };
    }
  },

  getStudents: async (classId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/classes/${classId}/students`, {
        method: 'GET',
        headers: getHeaders(),
      });
      
      if (!response.ok) {
        console.error('Error fetching students:', response.status, response.statusText);
        return [];
      }
      
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error in getStudents API:', error);
      return [];
    }
  },

  addStudent: async (classId, email, mssv) => {
    try {
      console.log('🔵 Adding student to class:', { classId, email, mssv });
      
    const response = await fetch(`${API_BASE_URL}/classes/${classId}/add-student`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        email: email || null,
        mssv: mssv || null,
      }),
    });
      
      const contentType = response.headers.get('content-type');
      let data;
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        console.error('❌ Response is not JSON:', text);
        return { error: text || `Lỗi: ${response.status}` };
      }
      
      console.log('🔵 Add student response:', data);
      
      if (!response.ok) {
        return { error: data.error || data || `Lỗi: ${response.status}` };
      }
      
      return data;
    } catch (error) {
      console.error('❌ Add student error:', error);
      return { error: error.message || 'Không thể thêm sinh viên' };
    }
  },
};

// Attendance APIs
export const attendanceAPI = {
  get: async (classId, date) => {
    const response = await fetch(`${API_BASE_URL}/attendance?classId=${classId}&date=${date}`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return response.json();
  },

  getAllByClass: async (classId) => {
    const response = await fetch(`${API_BASE_URL}/attendance/class/${classId}`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return response.json();
  },

  save: async (classId, date, records) => {
    try {
      console.log('🔵 Saving attendance:', { classId, date, records });
      
    const response = await fetch(`${API_BASE_URL}/attendance`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        class_id: classId,
        date: date,
        records: records,
      }),
    });
      
      const contentType = response.headers.get('content-type');
      let data;
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        console.error('❌ Response is not JSON:', text);
        return { error: text || `Lỗi: ${response.status}` };
      }
      
      console.log('🔵 Save attendance response:', data);
      
      if (!response.ok) {
        return { error: data.error || data || `Lỗi: ${response.status}` };
      }
      
      return data;
    } catch (error) {
      console.error('❌ Save attendance error:', error);
      return { error: error.message || 'Không thể lưu điểm danh' };
    }
  },
};

// User APIs
export const userAPI = {
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/users`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return response.json();
  },

  getById: async (id) => {
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return response.json();
  },

  create: async (userData) => {
    try {
      console.log('🔵 Creating user:', { ...userData, password: '***' });
      
      const response = await fetch(`${API_BASE_URL}/users`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(userData),
      });
      
      console.log('🔵 Response status:', response.status);
      console.log('🔵 Response ok:', response.ok);
      console.log('🔵 Content-Type:', response.headers.get('content-type'));
      
      const contentType = response.headers.get('content-type');
      let data;
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
        console.log('🔵 Create user response (parsed):', data);
      } else {
        const text = await response.text();
        console.error('❌ Response is not JSON:', text);
        return { error: text || `Lỗi: ${response.status}` };
      }
      
      if (!response.ok) {
        // Xử lý cả trường hợp data là object {error: "..."} hoặc string
        let errorMsg;
        if (typeof data === 'string') {
          errorMsg = data;
        } else if (data && typeof data === 'object') {
          errorMsg = data.error || data.message || JSON.stringify(data);
        } else {
          errorMsg = `Lỗi: ${response.status}`;
        }
        console.error('❌ Create user error:', errorMsg);
        return { error: errorMsg };
      }
      
      return data;
    } catch (error) {
      console.error('❌ Create user error:', error);
      return { error: error.message || 'Không thể tạo người dùng' };
    }
  },

  update: async (id, userData) => {
    try {
      console.log('🔵 Updating user:', id, userData);
      
      const response = await fetch(`${API_BASE_URL}/users/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(userData),
      });
      
      const contentType = response.headers.get('content-type');
      let data;
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        console.error('❌ Response is not JSON:', text);
        return { error: text || `Lỗi: ${response.status}` };
      }
      
      console.log('🔵 Update user response:', data);
      
      if (!response.ok) {
        return { error: data.error || data || `Lỗi: ${response.status}` };
      }
      
      return data;
    } catch (error) {
      console.error('❌ Update user error:', error);
      return { error: error.message || 'Không thể cập nhật người dùng' };
    }
  },

  delete: async (id) => {
    try {
      console.log('🔵 Deleting user:', id);
      
      const response = await fetch(`${API_BASE_URL}/users/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      
      const contentType = response.headers.get('content-type');
      let data;
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        console.error('❌ Response is not JSON:', text);
        return { error: text || `Lỗi: ${response.status}` };
      }
      
      console.log('🔵 Delete user response:', data);
      
      if (!response.ok) {
        return { error: data.error || data || `Lỗi: ${response.status}` };
      }
      
      return data;
    } catch (error) {
      console.error('❌ Delete user error:', error);
      return { error: error.message || 'Không thể xóa người dùng' };
    }
  },

  changePassword: async (id, oldPassword, newPassword) => {
    try {
      console.log('🔵 Changing password for user:', id);
      
      const response = await fetch(`${API_BASE_URL}/users/${id}/change-password`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          oldPassword: oldPassword,
          newPassword: newPassword,
        }),
      });
      
      const contentType = response.headers.get('content-type');
      let data;
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        console.error('❌ Response is not JSON:', text);
        return { error: text || `Lỗi: ${response.status}` };
      }
      
      console.log('🔵 Change password response:', data);
      
      if (!response.ok) {
        return { error: data.error || data || `Lỗi: ${response.status}` };
      }
      
      return data;
    } catch (error) {
      console.error('❌ Change password error:', error);
      return { error: error.message || 'Không thể đổi mật khẩu' };
    }
  },
};

// Grading APIs
export const gradingAPI = {
  getSubmissions: async (teacherId, studentId, classId) => {
    try {
      const params = new URLSearchParams();
      if (teacherId) params.append('teacherId', teacherId);
      if (studentId) params.append('studentId', studentId);
      if (classId) params.append('classId', classId);
      
      const url = `${API_BASE_URL}/grading?${params}`;
      console.log('🔵 Fetching submissions from:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: getHeaders(),
      });
      
      if (!response.ok) {
        // Nếu lỗi 500, chỉ log warning, không throw error
        if (response.status === 500) {
          console.warn('⚠️ Backend error (500) when fetching submissions. This is a backend issue, not a frontend problem.');
          console.warn('⚠️ Returning empty array to prevent UI errors.');
          return [];
        }
        console.error('❌ Error fetching submissions:', response.status, response.statusText);
        return [];
      }
      
      const data = await response.json();
      console.log('🔵 Submissions data:', data);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.warn('⚠️ Error in getSubmissions API (non-critical):', error.message);
      // Không log full error để tránh làm rối console
      return [];
    }
  },

  gradeSubmission: async (submissionId, diem, nhanXet) => {
    const response = await fetch(`${API_BASE_URL}/grading/${submissionId}/grade`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({
        diem: diem,
        nhanXet: nhanXet || '',
      }),
    });
    return response.json();
  },

  createSubmission: async (submissionData) => {
    try {
      console.log('🔵 Creating submission:', submissionData);
      
    const response = await fetch(`${API_BASE_URL}/grading`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(submissionData),
    });
      
      const contentType = response.headers.get('content-type');
      let data;
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        console.error('❌ Response is not JSON:', text);
        return { error: text || `Lỗi: ${response.status}` };
      }
      
      console.log('🔵 Create submission response:', data);
      
      if (!response.ok) {
        return { error: data.error || data || `Lỗi: ${response.status}` };
      }
      
      return data;
    } catch (error) {
      console.error('❌ Create submission error:', error);
      return { error: error.message || 'Không thể tạo submission' };
    }
  },

  cleanupDuplicates: async () => {
    try {
      console.log('🔵 Cleaning up duplicate submissions...');
      const response = await fetch(`${API_BASE_URL}/grading/cleanup-duplicates`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      
      const contentType = response.headers.get('content-type');
      let data;
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        console.error('❌ Response is not JSON:', text);
        return { error: text || `Lỗi: ${response.status}` };
      }
      
      console.log('🔵 Cleanup duplicates response:', data);
      
      if (!response.ok) {
        return { error: data.error || data || `Lỗi: ${response.status}` };
      }
      
      return data;
    } catch (error) {
      console.error('❌ Cleanup duplicates error:', error);
      return { error: error.message || 'Không thể xóa bài nộp trùng lặp' };
    }
  },
};

// Post APIs
export const postAPI = {
  getByClass: async (classId) => {
    try {
      console.log('🔵 Fetching posts for class:', classId);
      const response = await fetch(`${API_BASE_URL}/posts/class/${classId}`, {
        method: 'GET',
        headers: getHeaders(),
      });
      
      if (!response.ok) {
        console.error('❌ Error fetching posts:', response.status, response.statusText);
        return [];
      }
      
      const data = await response.json();
      console.log('🔵 Posts data:', data);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('❌ Error in getByClass API:', error);
      return [];
    }
  },

  create: async (classId, authorId, content, filePath) => {
    try {
      console.log('🔵 Creating post:', { classId, authorId, content });
      
      const response = await fetch(`${API_BASE_URL}/posts`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          classId: classId,
          authorId: authorId,
          content: content,
          filePath: filePath || null,
        }),
      });
      
      const contentType = response.headers.get('content-type');
      let data;
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        console.error('❌ Response is not JSON:', text);
        return { error: text || `Lỗi: ${response.status}` };
      }
      
      console.log('🔵 Create post response:', data);
      
      if (!response.ok) {
        return { error: data.error || data || `Lỗi: ${response.status}` };
      }
      
      return data;
    } catch (error) {
      console.error('❌ Create post error:', error);
      return { error: error.message || 'Không thể tạo bài đăng' };
    }
  },

  delete: async (postId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/posts/${postId}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      
      const contentType = response.headers.get('content-type');
      let data;
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        return { error: text || `Lỗi: ${response.status}` };
      }
      
      if (!response.ok) {
        return { error: data.error || data || `Lỗi: ${response.status}` };
      }
      
      return data;
    } catch (error) {
      console.error('❌ Delete post error:', error);
      return { error: error.message || 'Không thể xóa bài đăng' };
    }
  },
};

// Assignment APIs
export const assignmentAPI = {
  getByClass: async (classId, type) => {
    try {
      console.log('🔵 Fetching assignments for class:', classId, 'type:', type);
      const url = type 
        ? `${API_BASE_URL}/assignments/class/${classId}?type=${type}`
        : `${API_BASE_URL}/assignments/class/${classId}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: getHeaders(),
      });
      
      if (!response.ok) {
        console.error('❌ Error fetching assignments:', response.status, response.statusText);
        return [];
      }
      
      const data = await response.json();
      console.log('🔵 Assignments data:', data);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('❌ Error in getByClass API:', error);
      return [];
    }
  },

  getById: async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/assignments/${id}`, {
        method: 'GET',
        headers: getHeaders(),
      });
      
      if (!response.ok) {
        return { error: `Lỗi: ${response.status}` };
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('❌ Get assignment error:', error);
      return { error: error.message || 'Không thể lấy thông tin bài tập' };
    }
  },

  create: async (classId, title, description, type, filePath, dueDate, maxScore) => {
    try {
      const requestBody = {
        classId: classId,
        title: title,
        description: description || null,
        type: type || 'ASSIGNMENT',
        filePath: filePath || null,
        dueDate: dueDate || null,
      };
      
      // Chỉ thêm maxScore nếu có giá trị hợp lệ
      if (maxScore != null && maxScore > 0) {
        requestBody.maxScore = maxScore;
      }
      
      console.log('🔵 Creating assignment request body:', JSON.stringify(requestBody, null, 2));
      
      const response = await fetch(`${API_BASE_URL}/assignments`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(requestBody),
      });
      
      const contentType = response.headers.get('content-type');
      let data;
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        console.error('❌ Response is not JSON:', text);
        return { error: text || `Lỗi: ${response.status}` };
      }
      
      console.log('🔵 Create assignment response:', data);
      
      if (!response.ok) {
        return { error: data.error || data || `Lỗi: ${response.status}` };
      }
      
      return data;
    } catch (error) {
      console.error('❌ Create assignment error:', error);
      return { error: error.message || 'Không thể tạo bài tập' };
    }
  },

  update: async (id, title, description, filePath, dueDate, maxScore) => {
    try {
      const response = await fetch(`${API_BASE_URL}/assignments/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({
          title: title,
          description: description,
          filePath: filePath,
          dueDate: dueDate,
          maxScore: maxScore,
        }),
      });
      
      const contentType = response.headers.get('content-type');
      let data;
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        return { error: text || `Lỗi: ${response.status}` };
      }
      
      if (!response.ok) {
        return { error: data.error || data || `Lỗi: ${response.status}` };
      }
      
      return data;
    } catch (error) {
      console.error('❌ Update assignment error:', error);
      return { error: error.message || 'Không thể cập nhật bài tập' };
    }
  },

  delete: async (id) => {
    try {
      console.log('🔵 [API] Deleting assignment with ID:', id);
      const response = await fetch(`${API_BASE_URL}/assignments/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      
      console.log('🔵 [API] Delete response status:', response.status);
      console.log('🔵 [API] Delete response ok:', response.ok);
      
      const contentType = response.headers.get('content-type');
      let data;
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
        console.log('🔵 [API] Delete response data:', data);
      } else {
        const text = await response.text();
        console.log('🔵 [API] Delete response text:', text);
        return { error: text || `Lỗi: ${response.status}` };
      }
      
      if (!response.ok) {
        console.error('❌ [API] Delete failed:', data);
        return { error: data.error || data || `Lỗi: ${response.status}` };
      }
      
      console.log('🔵 [API] Delete successful');
      return data;
    } catch (error) {
      console.error('❌ Delete assignment error:', error);
      return { error: error.message || 'Không thể xóa bài tập' };
    }
  },
};

// Notification APIs
export const notificationAPI = {
  getByUser: async (userId) => {
    try {
      console.log('🔵 Fetching notifications for user:', userId);
      const response = await fetch(`${API_BASE_URL}/notifications/user/${userId}`, {
        method: 'GET',
        headers: getHeaders(),
      });
      
      if (!response.ok) {
        console.error('❌ Error fetching notifications:', response.status, response.statusText);
        return [];
      }
      
      const data = await response.json();
      console.log('🔵 Notifications data:', data);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('❌ Error in getByUser API:', error);
      return [];
    }
  },

  getUnreadByUser: async (userId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/notifications/user/${userId}/unread`, {
        method: 'GET',
        headers: getHeaders(),
      });
      
      if (!response.ok) {
        return [];
      }
      
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('❌ Error in getUnreadByUser API:', error);
      return [];
    }
  },

  create: async (userId, title, description, role) => {
    try {
      console.log('🔵 Creating notification:', { userId, title });
      
      const response = await fetch(`${API_BASE_URL}/notifications`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          userId: userId,
          title: title,
          description: description || null,
          role: role || 'all',
        }),
      });
      
      const contentType = response.headers.get('content-type');
      let data;
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        console.error('❌ Response is not JSON:', text);
        return { error: text || `Lỗi: ${response.status}` };
      }
      
      console.log('🔵 Create notification response:', data);
      
      if (!response.ok) {
        return { error: data.error || data || `Lỗi: ${response.status}` };
      }
      
      return data;
    } catch (error) {
      console.error('❌ Create notification error:', error);
      return { error: error.message || 'Không thể tạo thông báo' };
    }
  },

  markAsRead: async (notificationId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: getHeaders(),
      });
      
      const contentType = response.headers.get('content-type');
      let data;
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        return { error: text || `Lỗi: ${response.status}` };
      }
      
      if (!response.ok) {
        return { error: data.error || data || `Lỗi: ${response.status}` };
      }
      
      return data;
    } catch (error) {
      console.error('❌ Mark as read error:', error);
      return { error: error.message || 'Không thể đánh dấu đã đọc' };
    }
  },

  markAllAsRead: async (userId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/notifications/user/${userId}/read-all`, {
        method: 'PUT',
        headers: getHeaders(),
      });
      
      const contentType = response.headers.get('content-type');
      let data;
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        return { error: text || `Lỗi: ${response.status}` };
      }
      
      if (!response.ok) {
        return { error: data.error || data || `Lỗi: ${response.status}` };
      }
      
      return data;
    } catch (error) {
      console.error('❌ Mark all as read error:', error);
      return { error: error.message || 'Không thể đánh dấu tất cả đã đọc' };
    }
  },
};

// File Upload API
export const fileAPI = {
  upload: async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch(`${API_BASE_URL}/files/upload`, {
        method: 'POST',
        body: formData,
        // Không set Content-Type header, browser sẽ tự động set với boundary
      });
      
      const contentType = response.headers.get('content-type');
      let data;
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        console.error('❌ Response is not JSON:', text);
        return { error: text || `Lỗi: ${response.status}` };
      }
      
      if (!response.ok) {
        return { error: data.error || data || `Lỗi: ${response.status}` };
      }
      
      // Tạo URL đầy đủ - giữ nguyên format /api/files/... để lưu vào database
      // URL này sẽ được xử lý khi hiển thị
      console.log('🔵 Upload response:', data);
      
      return data;
    } catch (error) {
      console.error('❌ Upload file error:', error);
      return { error: error.message || 'Không thể upload file' };
    }
  },
};

