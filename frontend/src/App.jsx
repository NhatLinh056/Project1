import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Result, Button } from 'antd'; // Import thêm Result, Button

// --- AUTH ---
import LoginPage from './pages/Auth/LoginPage';
import RegisterPage from './pages/Auth/RegisterPage';

// --- COMMON ---
import UserProfile from './pages/Common/UserProfile';

// --- ADMIN COMPONENTS ---
import AdminLayout from './layouts/AdminLayout';
import AdminDashboard from './pages/Admin/AdminDashboard';
import UserManagement from './pages/Admin/UserManagement';
import ClassManagement from './pages/Admin/ClassManagement';
import AdminNotifications from './pages/Admin/AdminNotifications';

// --- TEACHER COMPONENTS ---
import TeacherLayout from './layouts/TeacherLayout';
import TeacherDashboard from './pages/Teacher/TeacherDashboard';
import TeacherClasses from './pages/Teacher/TeacherClasses';
import TeacherClassDetail from './pages/Teacher/TeacherClassDetail';
import TeacherGrading from './pages/Teacher/TeacherGrading';
import TeacherNotifications from './pages/Teacher/TeacherNotifications';

// --- STUDENT COMPONENTS ---
import StudentLayout from './layouts/StudentLayout';
import StudentDashboard from './pages/Student/StudentDashboard';
import StudentClasses from './pages/Student/StudentClasses';
import StudentClassDetail from './pages/Student/StudentClassDetail';
import StudentGrades from './pages/Student/StudentGrades';
import StudentNotifications from './pages/Student/StudentNotifications';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* --- PUBLIC --- */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* --- ADMIN --- */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="classes" element={<ClassManagement />} />
          <Route path="profile" element={<UserProfile />} />
          <Route path="notifications" element={<AdminNotifications />} />
        </Route>

        {/* --- TEACHER --- */}
        <Route
          path="/teacher"
          element={
            <ProtectedRoute allowedRoles={['teacher']}>
              <TeacherLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<TeacherDashboard />} />
          <Route path="classes" element={<TeacherClasses />} />
          <Route path="class/:id" element={<TeacherClassDetail />} />
          <Route path="grading" element={<TeacherGrading />} />
          <Route path="profile" element={<UserProfile />} />
          <Route path="notifications" element={<TeacherNotifications />} />
        </Route>

        {/* --- STUDENT --- */}
        <Route
          path="/student"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentLayout />
            </ProtectedRoute>
          }
        >
           <Route index element={<StudentDashboard />} />
           <Route path="classes" element={<StudentClasses />} />
           <Route path="class/:id" element={<StudentClassDetail />} />
           <Route path="grades" element={<StudentGrades />} />
           <Route path="notifications" element={<StudentNotifications />} />
           <Route path="profile" element={<UserProfile />} />
        </Route>

        {/* --- 404 PAGE (MỚI) --- */}
        <Route path="*" element={
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
                <Result
                    status="404"
                    title="404"
                    subTitle="Xin lỗi, trang bạn tìm kiếm không tồn tại."
                    extra={<Button type="primary" href="/">Quay về trang chủ</Button>}
                />
            </div>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;