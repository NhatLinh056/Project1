-- ===================================================================
-- SAMPLE DATA FOR CLASSROOM DATABASE
-- Dữ liệu mẫu để test hệ thống
-- ===================================================================

-- Xóa dữ liệu cũ (nếu có)
TRUNCATE TABLE notifications, posts, submissions, assignments, attendance, class_students, classes, users RESTART IDENTITY CASCADE;

-- ===================================================================
-- 1. USERS (Admin, Teachers, Students)
-- ===================================================================

-- Admin accounts
INSERT INTO users (name, email, password, role) VALUES
('Admin HUST', 'admin@hust.edu.vn', 'admin123', 'Admin'),
('Quản trị viên', 'admin2@hust.edu.vn', 'admin123', 'Admin');

-- Teacher accounts
INSERT INTO users (name, email, password, role) VALUES
('GV. Phạm Mạnh Tuấn', 'tuan.pm@hust.edu.vn', 'teacher123', 'Teacher'),
('GV. Nguyễn Thị Lan', 'lan.nt@hust.edu.vn', 'teacher123', 'Teacher'),
('GV. Trần Văn Hùng', 'hung.tv@hust.edu.vn', 'teacher123', 'Teacher');

-- Student accounts (20 sinh viên)
INSERT INTO users (name, email, password, role, mssv) VALUES
('Nguyễn Văn An', 'an.nv@sis.hust.edu.vn', 'student123', 'Student', '20236001'),
('Trần Thị Bình', 'binh.tt@sis.hust.edu.vn', 'student123', 'Student', '20236002'),
('Lê Văn Cường', 'cuong.lv@sis.hust.edu.vn', 'student123', 'Student', '20236003'),
('Phạm Thị Dung', 'dung.pt@sis.hust.edu.vn', 'student123', 'Student', '20236004'),
('Hoàng Văn Em', 'em.hv@sis.hust.edu.vn', 'student123', 'Student', '20236005'),
('Đỗ Thị Hoa', 'hoa.dt@sis.hust.edu.vn', 'student123', 'Student', '20236006'),
('Vũ Văn Khải', 'khai.vv@sis.hust.edu.vn', 'student123', 'Student', '20236007'),
('Bùi Thị Lan', 'lan.bt@sis.hust.edu.vn', 'student123', 'Student', '20236008'),
('Đinh Văn Minh', 'minh.dv@sis.hust.edu.vn', 'student123', 'Student', '20236009'),
('Mai Thị Nga', 'nga.mt@sis.hust.edu.vn', 'student123', 'Student', '20236010'),
('Lý Văn Phong', 'phong.lv@sis.hust.edu.vn', 'student123', 'Student', '20236011'),
('Trịnh Thị Quỳnh', 'quynh.tt@sis.hust.edu.vn', 'student123', 'Student', '20236012'),
('Phan Văn Sơn', 'son.pv@sis.hust.edu.vn', 'student123', 'Student', '20236013'),
('Ngô Thị Tâm', 'tam.nt@sis.hust.edu.vn', 'student123', 'Student', '20236014'),
('Đặng Văn Út', 'ut.dv@sis.hust.edu.vn', 'student123', 'Student', '20236015'),
('Hồ Thị Vân', 'van.ht@sis.hust.edu.vn', 'student123', 'Student', '20236016'),
('Cao Văn Xuân', 'xuan.cv@sis.hust.edu.vn', 'student123', 'Student', '20236017'),
('Võ Thị Yến', 'yen.vt@sis.hust.edu.vn', 'student123', 'Student', '20236018'),
('Dương Văn Zung', 'zung.dv@sis.hust.edu.vn', 'student123', 'Student', '20236019'),
('Lương Thị Ánh', 'anh.lt@sis.hust.edu.vn', 'student123', 'Student', '20236020');

-- ===================================================================
-- 2. CLASSES (Lớp học)
-- ===================================================================

INSERT INTO classes (ten_lop, mo_ta, ma_tham_gia, giao_vien_id) VALUES
('Lập trình Web - IT3040', 'Môn học về phát triển ứng dụng web với React, Spring Boot', 'IT3040-01', 3),
('Cơ sở dữ liệu - IT3080', 'Thiết kế và quản trị cơ sở dữ liệu quan hệ', 'IT3080-02', 4),
('Cấu trúc dữ liệu và giải thuật - IT3090', 'Các cấu trúc dữ liệu cơ bản và thuật toán', 'IT3090-03', 5),
('Hệ điều hành - IT3070', 'Nguyên lý hoạt động của hệ điều hành', 'IT3070-04', 3),
('Mạng máy tính - IT3100', 'Kiến trúc và giao thức mạng', 'IT3100-05', 4);

-- ===================================================================
-- 3. CLASS_STUDENTS (Sinh viên trong lớp)
-- ===================================================================

-- Lớp 1: Lập trình Web (10 sinh viên)
INSERT INTO class_students (class_id, student_id, enrolled_at) VALUES
(1, 6, NOW()), (1, 7, NOW()), (1, 8, NOW()), (1, 9, NOW()), (1, 10, NOW()),
(1, 11, NOW()), (1, 12, NOW()), (1, 13, NOW()), (1, 14, NOW()), (1, 15, NOW());

-- Lớp 2: Cơ sở dữ liệu (10 sinh viên)
INSERT INTO class_students (class_id, student_id, enrolled_at) VALUES
(2, 11, NOW()), (2, 12, NOW()), (2, 13, NOW()), (2, 14, NOW()), (2, 15, NOW()),
(2, 16, NOW()), (2, 17, NOW()), (2, 18, NOW()), (2, 19, NOW()), (2, 20, NOW());

-- Lớp 3: CTDL (tất cả 20 sinh viên)
INSERT INTO class_students (class_id, student_id, enrolled_at) VALUES
(3, 6, NOW()), (3, 7, NOW()), (3, 8, NOW()), (3, 9, NOW()), (3, 10, NOW()),
(3, 11, NOW()), (3, 12, NOW()), (3, 13, NOW()), (3, 14, NOW()), (3, 15, NOW()),
(3, 16, NOW()), (3, 17, NOW()), (3, 18, NOW()), (3, 19, NOW()), (3, 20, NOW()),
(3, 21, NOW()), (3, 22, NOW()), (3, 23, NOW()), (3, 24, NOW()), (3, 25, NOW());

-- Lớp 4: Hệ điều hành (8 sinh viên)
INSERT INTO class_students (class_id, student_id, enrolled_at) VALUES
(4, 6, NOW()), (4, 8, NOW()), (4, 10, NOW()), (4, 12, NOW()),
(4, 14, NOW()), (4, 16, NOW()), (4, 18, NOW()), (4, 20, NOW());

-- Lớp 5: Mạng máy tính (12 sinh viên)
INSERT INTO class_students (class_id, student_id, enrolled_at) VALUES
(5, 7, NOW()), (5, 9, NOW()), (5, 11, NOW()), (5, 13, NOW()), (5, 15, NOW()),
(5, 17, NOW()), (5, 19, NOW()), (5, 21, NOW()), (5, 22, NOW()), (5, 23, NOW()),
(5, 24, NOW()), (5, 25, NOW());

-- ===================================================================
-- 4. ASSIGNMENTS (Bài tập và tài liệu)
-- ===================================================================

-- Lớp 1: Lập trình Web
INSERT INTO assignments (class_id, title, description, type, due_date, max_score) VALUES
(1, 'Bài tập 1: HTML/CSS cơ bản', 'Tạo trang web giới thiệu cá nhân', 'ASSIGNMENT', CURRENT_DATE + INTERVAL '7 days', 10),
(1, 'Bài tập 2: JavaScript', 'Xây dựng ứng dụng Todo List', 'ASSIGNMENT', CURRENT_DATE + INTERVAL '14 days', 10),
(1, 'Tài liệu: React Hooks', 'Hướng dẫn sử dụng React Hooks', 'MATERIAL', NULL, NULL),
(1, 'Project cuối kỳ: Web App', 'Xây dựng ứng dụng web hoàn chỉnh', 'ASSIGNMENT', CURRENT_DATE + INTERVAL '30 days', 30);

-- Lớp 2: Cơ sở dữ liệu
INSERT INTO assignments (class_id, title, description, type, due_date, max_score) VALUES
(2, 'Bài tập 1: SQL cơ bản', 'Viết các câu truy vấn SELECT, INSERT, UPDATE', 'ASSIGNMENT', CURRENT_DATE + INTERVAL '7 days', 10),
(2, 'Bài tập 2: Thiết kế ERD', 'Thiết kế cơ sở dữ liệu cho hệ thống quản lý thư viện', 'ASSIGNMENT', CURRENT_DATE + INTERVAL '14 days', 15),
(2, 'Tài liệu: Chuẩn hóa CSDL', 'Các dạng chuẩn 1NF, 2NF, 3NF', 'MATERIAL', NULL, NULL);

-- Lớp 3: CTDL
INSERT INTO assignments (class_id, title, description, type, due_date, max_score) VALUES
(3, 'Bài tập 1: Linked List', 'Cài đặt danh sách liên kết đơn', 'ASSIGNMENT', CURRENT_DATE + INTERVAL '5 days', 10),
(3, 'Bài tập 2: Stack & Queue', 'Cài đặt Stack và Queue', 'ASSIGNMENT', CURRENT_DATE + INTERVAL '10 days', 10),
(3, 'Tài liệu: Big-O Notation', 'Phân tích độ phức tạp thuật toán', 'MATERIAL', NULL, NULL);

-- ===================================================================
-- 5. SUBMISSIONS (Bài nộp của sinh viên)
-- ===================================================================

-- Một số bài nộp mẫu cho Lớp 1, Bài tập 1
INSERT INTO submissions (student_id, class_id, ten_bai_tap, diem, nhan_xet, trang_thai, submitted_at, graded_at) VALUES
(6, 1, 'Bài tập 1: HTML/CSS cơ bản', 9.5, 'Làm tốt, giao diện đẹp', 'Graded', NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day'),
(7, 1, 'Bài tập 1: HTML/CSS cơ bản', 8.0, 'Cần cải thiện responsive', 'Graded', NOW() - INTERVAL '3 days', NOW() - INTERVAL '1 day'),
(8, 1, 'Bài tập 1: HTML/CSS cơ bản', NULL, NULL, 'Pending', NOW() - INTERVAL '1 day', NULL),
(9, 1, 'Bài tập 1: HTML/CSS cơ bản', 10.0, 'Xuất sắc!', 'Graded', NOW() - INTERVAL '4 days', NOW() - INTERVAL '2 days');

-- Bài nộp cho Lớp 2
INSERT INTO submissions (student_id, class_id, ten_bai_tap, diem, nhan_xet, trang_thai, submitted_at, graded_at) VALUES
(11, 2, 'Bài tập 1: SQL cơ bản', 7.5, 'Còn sai một vài câu truy vấn', 'Graded', NOW() - INTERVAL '2 days', NOW()),
(12, 2, 'Bài tập 1: SQL cơ bản', 9.0, 'Tốt lắm', 'Graded', NOW() - INTERVAL '3 days', NOW());

-- ===================================================================
-- 6. ATTENDANCE (Điểm danh)
-- ===================================================================

-- Điểm danh lớp 1 (3 buổi)
INSERT INTO attendance (class_id, date, records) VALUES
(1, CURRENT_DATE - INTERVAL '7 days', '[{"studentId":6,"present":true},{"studentId":7,"present":true},{"studentId":8,"present":false},{"studentId":9,"present":true}]'),
(1, CURRENT_DATE - INTERVAL '5 days', '[{"studentId":6,"present":true},{"studentId":7,"present":false},{"studentId":8,"present":true},{"studentId":9,"present":true}]'),
(1, CURRENT_DATE - INTERVAL '2 days', '[{"studentId":6,"present":true},{"studentId":7,"present":true},{"studentId":8,"present":true},{"studentId":9,"present":true}]');

-- Điểm danh lớp 2
INSERT INTO attendance (class_id, date, records) VALUES
(2, CURRENT_DATE - INTERVAL '6 days', '[{"studentId":11,"present":true},{"studentId":12,"present":true},{"studentId":13,"present":true}]');

-- ===================================================================
-- 7. POSTS (Bài viết trong lớp)
-- ===================================================================

INSERT INTO posts (class_id, author_id, content, created_at) VALUES
(1, 3, 'Chào mừng các bạn đến với môn Lập trình Web! Hãy tham gia lớp học và hoàn thành các bài tập đúng hạn.', NOW() - INTERVAL '10 days'),
(1, 3, 'Nhắc nhở: Bài tập 1 sắp đến hạn nộp. Các bạn chú ý hoàn thành nhé!', NOW() - INTERVAL '2 days'),
(2, 4, 'Lớp Cơ sở dữ liệu chính thức bắt đầu. Chúc các bạn học tập tốt!', NOW() - INTERVAL '8 days'),
(3, 5, 'Tài liệu về Big-O đã được upload. Các bạn tải về và đọc trước nhé.', NOW() - INTERVAL '5 days');

-- ===================================================================
-- 8. NOTIFICATIONS (Thông báo)
-- ===================================================================

-- Thông báo cho sinh viên
INSERT INTO notifications (user_id, title, description, read_status, created_at) VALUES
(6, 'Bài tập mới', 'GV. Phạm Mạnh Tuấn đã giao bài tập: Bài tập 1: HTML/CSS cơ bản', false, NOW() - INTERVAL '1 day'),
(6, 'Điểm số mới', 'Bạn đã được chấm điểm cho bài: Bài tập 1: HTML/CSS cơ bản', false, NOW() - INTERVAL '1 hour'),
(7, 'Bài viết mới', 'GV. Phạm Mạnh Tuấn đã đăng bài viết mới trong lớp Lập trình Web', false, NOW() - INTERVAL '2 hours'),
(8, 'Nhắc nhở', 'Bài tập 1: HTML/CSS cơ bản sắp hết hạn (còn 2 ngày)', false, NOW()),
(9, 'Điểm số mới', 'Bạn đã được chấm điểm cho bài: Bài tập 1: HTML/CSS cơ bản', true, NOW() - INTERVAL '2 days');

-- Thông báo cho giáo viên
INSERT INTO notifications (user_id, title, description, read_status, created_at) VALUES
(3, 'Bài nộp mới', 'Sinh viên Nguyễn Văn An đã nộp bài: Bài tập 1: HTML/CSS cơ bản', false, NOW() - INTERVAL '2 days'),
(3, 'Bài nộp mới', 'Sinh viên Trần Thị Bình đã nộp bài: Bài tập 1: HTML/CSS cơ bản', false, NOW() - INTERVAL '3 days');

-- ===================================================================
-- KẾT THÚC - Kiểm tra dữ liệu
-- ===================================================================

-- Hiển thị thống kê
SELECT 'Users' AS table_name, COUNT(*) AS count FROM users
UNION ALL SELECT 'Classes', COUNT(*) FROM classes
UNION ALL SELECT 'Students in Classes', COUNT(*) FROM class_students
UNION ALL SELECT 'Assignments', COUNT(*) FROM assignments
UNION ALL SELECT 'Submissions', COUNT(*) FROM submissions
UNION ALL SELECT 'Attendance Records', COUNT(*) FROM attendance
UNION ALL SELECT 'Posts', COUNT(*) FROM posts
UNION ALL SELECT 'Notifications', COUNT(*) FROM notifications;

COMMIT;
