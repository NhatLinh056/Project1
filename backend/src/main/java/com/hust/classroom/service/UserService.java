package com.hust.classroom.service;

import com.hust.classroom.entity.User;
import com.hust.classroom.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class UserService {
    
    private final UserRepository userRepository;
    private final SubmissionRepository submissionRepository;
    private final ClassStudentRepository classStudentRepository;
    private final NotificationRepository notificationRepository;
    private final ClassRepository classRepository;
    
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }
    
    public Optional<User> getUserById(Integer id) {
        return userRepository.findById(id);
    }
    
    @Transactional
    public User createUser(User user) {
        if (user.getEmail() == null || user.getEmail().isEmpty()) {
            throw new RuntimeException("Email không được để trống!");
        }
        if (userRepository.existsByEmail(user.getEmail())) {
            throw new RuntimeException("Email này đã được sử dụng!");
        }
        if (user.getPassword() == null || user.getPassword().isEmpty()) {
            throw new RuntimeException("Mật khẩu không được để trống!");
        }
        if (user.getName() == null || user.getName().isEmpty()) {
            throw new RuntimeException("Tên không được để trống!");
        }
        if (user.getRole() == null) {
            throw new RuntimeException("Vai trò không được để trống!");
        }
        
        // Kiểm tra MSSV trùng lặp nếu là Student và có MSSV
        if (user.getRole() == User.Role.Student && user.getMssv() != null && !user.getMssv().isEmpty()) {
            if (userRepository.existsByMssv(user.getMssv())) {
                throw new RuntimeException("MSSV này đã được sử dụng! Mỗi sinh viên chỉ có thể có một tài khoản.");
            }
        }
        
        return userRepository.save(user);
    }
    
    @Transactional
    public User updateUser(Integer id, User userDetails) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng!"));
        
        if (userDetails.getName() != null) {
            user.setName(userDetails.getName());
        }
        if (userDetails.getEmail() != null && !userDetails.getEmail().equals(user.getEmail())) {
            if (userRepository.existsByEmail(userDetails.getEmail())) {
                throw new RuntimeException("Email này đã được sử dụng!");
            }
            user.setEmail(userDetails.getEmail());
        }
        if (userDetails.getMssv() != null) {
            // Kiểm tra MSSV trùng lặp nếu là Student và có MSSV
            if (user.getRole() == User.Role.Student && !userDetails.getMssv().isEmpty()) {
                // Chỉ check nếu MSSV mới khác MSSV hiện tại
                if (!userDetails.getMssv().equals(user.getMssv())) {
                    if (userRepository.existsByMssv(userDetails.getMssv())) {
                        throw new RuntimeException("MSSV này đã được sử dụng! Mỗi sinh viên chỉ có thể có một tài khoản.");
                    }
                }
            }
            user.setMssv(userDetails.getMssv());
        }
        if (userDetails.getAvatar() != null) {
            user.setAvatar(userDetails.getAvatar());
        }
        if (userDetails.getRole() != null) {
            user.setRole(userDetails.getRole());
        }
        
        // KHÔNG cập nhật password ở đây - phải dùng changePassword method riêng
        // if (userDetails.getPassword() != null) {
        //     user.setPassword(userDetails.getPassword());
        // }
        
        return userRepository.save(user);
    }
    
    @Transactional
    public void deleteUser(Integer id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng!"));
        
        // Kiểm tra nếu user là giáo viên và có lớp học
        if (user.getRole() == User.Role.Teacher) {
            List<com.hust.classroom.entity.Class> classes = classRepository.findByGiaoVienId(id);
            if (!classes.isEmpty()) {
                throw new RuntimeException("Không thể xóa giáo viên này! Giáo viên đang quản lý " + classes.size() + " lớp học. Vui lòng xóa hoặc chuyển giao các lớp học trước.");
            }
        }
        
        try {
            // Xóa các bản ghi liên quan trước
            // 1. Xóa submissions
            List<com.hust.classroom.entity.Submission> submissions = submissionRepository.findByStudentId(id);
            if (!submissions.isEmpty()) {
                submissionRepository.deleteAll(submissions);
                System.out.println("✅ Đã xóa " + submissions.size() + " bài nộp liên quan");
            }
            
            // 2. Xóa class enrollments
            List<com.hust.classroom.entity.ClassStudent> enrollments = classStudentRepository.findByStudentId(id);
            if (!enrollments.isEmpty()) {
                classStudentRepository.deleteAll(enrollments);
                System.out.println("✅ Đã xóa " + enrollments.size() + " đăng ký lớp học liên quan");
            }
            
            // 3. Xóa notifications
            List<com.hust.classroom.entity.Notification> notifications = notificationRepository.findByUserId(id);
            if (!notifications.isEmpty()) {
                notificationRepository.deleteAll(notifications);
                System.out.println("✅ Đã xóa " + notifications.size() + " thông báo liên quan");
            }
            
            // 4. Cuối cùng mới xóa user
            userRepository.deleteById(id);
            System.out.println("✅ Đã xóa người dùng ID: " + id);
        } catch (Exception e) {
            System.err.println("❌ Lỗi khi xóa người dùng: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Không thể xóa người dùng: " + e.getMessage());
        }
    }
    
    public Optional<User> getUserByEmail(String email) {
        return userRepository.findByEmail(email);
    }
    
    public Optional<User> getUserByMssv(String mssv) {
        return userRepository.findByMssv(mssv);
    }
    
    @Transactional
    public void changePassword(Integer userId, String oldPassword, String newPassword) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng!"));
        
        // Kiểm tra mật khẩu cũ
        if (!user.getPassword().equals(oldPassword)) {
            throw new RuntimeException("Mật khẩu cũ không đúng!");
        }
        
        // Kiểm tra mật khẩu mới
        if (newPassword == null || newPassword.isEmpty() || newPassword.length() < 6) {
            throw new RuntimeException("Mật khẩu mới phải có ít nhất 6 ký tự!");
        }
        
        // Cập nhật mật khẩu mới (trong thực tế nên hash password)
        user.setPassword(newPassword);
        userRepository.save(user);
    }
}

