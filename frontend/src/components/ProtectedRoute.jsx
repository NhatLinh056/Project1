import React from 'react';
import { Navigate } from 'react-router-dom';
import { message } from 'antd';

const ProtectedRoute = ({ children, allowedRoles }) => {
  // Lấy thông tin user từ LocalStorage
  const userJson = localStorage.getItem('user_info');
  const user = userJson ? JSON.parse(userJson) : null;

  // 1. Chưa đăng nhập -> Đá về Login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 2. Xác định role hiện tại (Admin, Teacher, Student)
  let currentRole = user.role;

  // Map role từ backend (Admin/Teacher/Student) sang lowercase cho route
  const roleMap = {
    'Admin': 'admin',
    'Teacher': 'teacher',
    'Student': 'student',
  };
  
  const routeRole = roleMap[currentRole] || 'student';
  
  // 3. Kiểm tra quyền truy cập (allowedRoles dùng lowercase: admin, teacher, student)
  if (allowedRoles && !allowedRoles.includes(routeRole)) {
    message.error('Bạn không có quyền truy cập trang này!');
    // Đá về trang chủ tương ứng với role của họ
    return <Navigate to={`/${routeRole}`} replace />;
  }

  return children;
};

export default ProtectedRoute;