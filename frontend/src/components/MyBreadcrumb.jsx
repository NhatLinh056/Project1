// src/components/MyBreadcrumb.jsx
import React from 'react';
import { Breadcrumb } from 'antd';
import { useLocation, Link } from 'react-router-dom';

const breadcrumbNameMap = {
  '/admin': 'Quản trị',
  '/admin/users': 'Quản lý Người dùng',
  '/admin/classes': 'Quản lý Lớp học',
  '/admin/profile': 'Hồ sơ cá nhân',
  '/teacher': 'Giáo viên',
  '/teacher/classes': 'Lớp học của tôi',
  '/teacher/grading': 'Chấm bài',
  '/teacher/profile': 'Hồ sơ cá nhân',
  '/student': 'Sinh viên',
  '/student/classes': 'Lớp học',
  '/student/grades': 'Bảng điểm',
  '/student/notifications': 'Thông báo',
  '/student/profile': 'Hồ sơ cá nhân',
};

const MyBreadcrumb = () => {
  const location = useLocation();
  const pathSnippets = location.pathname.split('/').filter((i) => i);

  const extraBreadcrumbItems = pathSnippets.map((_, index) => {
    const url = `/${pathSnippets.slice(0, index + 1).join('/')}`;
    // Nếu đường dẫn có chứa ID (số), ta không hiển thị tên cụ thể mà hiển thị "Chi tiết"
    const title = breadcrumbNameMap[url] || (Number(pathSnippets[index]) ? 'Chi tiết' : 'Trang chủ');

    return {
      key: url,
      title: <Link to={url}>{title}</Link>,
    };
  });

  const breadcrumbItems = [
    {
      title: <Link to="/">Trang chủ</Link>,
      key: 'home',
    },
  ].concat(extraBreadcrumbItems);

  return (
    <Breadcrumb items={breadcrumbItems} style={{ margin: '16px 0' }} />
  );
};

export default MyBreadcrumb;