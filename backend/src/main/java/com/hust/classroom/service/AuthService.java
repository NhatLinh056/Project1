package com.hust.classroom.service;

import com.hust.classroom.config.JwtUtil;
import com.hust.classroom.dto.AuthResponse;
import com.hust.classroom.dto.LoginRequest;
import com.hust.classroom.dto.RegisterRequest;
import com.hust.classroom.entity.User;
import com.hust.classroom.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AuthService {
    
    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;
    private final EmailService emailService;
    
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        // Kiểm tra email đã tồn tại
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email này đã được sử dụng!");
        }
        
        // Kiểm tra MSSV nếu là Student
        if (User.Role.Student.name().equals(request.getRole())) {
            if (request.getMssv() == null || request.getMssv().isEmpty()) {
                throw new RuntimeException("MSSV không được để trống!");
            }
            if (userRepository.existsByMssv(request.getMssv())) {
                throw new RuntimeException("MSSV này đã được sử dụng! Mỗi sinh viên chỉ có thể có một tài khoản.");
            }
        }
        
        // Tạo user mới
        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPassword(request.getPassword()); // Trong thực tế nên hash password
        user.setRole(User.Role.valueOf(request.getRole()));
        user.setMssv(request.getMssv());
        
        user = userRepository.save(user);
        
        // Tạo token
        String token = jwtUtil.generateToken(user.getId(), user.getEmail(), user.getRole().name());
        
        // Tạo response
        AuthResponse response = new AuthResponse();
        response.setToken(token);
        response.setUser(AuthResponse.UserResponse.fromUser(user));
        
        return response;
    }
    
    public AuthResponse login(LoginRequest request) {
        Optional<User> userOpt = userRepository.findByEmail(request.getEmail());
        
        if (userOpt.isEmpty()) {
            throw new RuntimeException("Không tìm thấy người dùng!");
        }
        
        User user = userOpt.get();
        
        // So sánh mật khẩu (trong thực tế nên dùng BCrypt)
        if (!user.getPassword().equals(request.getPassword())) {
            throw new RuntimeException("Sai mật khẩu!");
        }
        
        // Tạo token
        String token = jwtUtil.generateToken(user.getId(), user.getEmail(), user.getRole().name());
        
        // Tạo response
        AuthResponse response = new AuthResponse();
        response.setToken(token);
        response.setUser(AuthResponse.UserResponse.fromUser(user));
        
        return response;
    }
    
    @Transactional
    public String forgotPassword(String email) {
        Optional<User> userOpt = userRepository.findByEmail(email);
        
        if (userOpt.isEmpty()) {
            throw new RuntimeException("Không tìm thấy tài khoản với email này!");
        }
        
        User user = userOpt.get();
        
        // Tạo mật khẩu mới ngẫu nhiên (6 ký tự)
        String newPassword = generateRandomPassword(6);
        
        // Cập nhật mật khẩu mới
        user.setPassword(newPassword);
        userRepository.save(user);
        
        // Gửi email với mật khẩu mới
        emailService.sendPasswordResetEmail(email, newPassword);
        
        return newPassword;
    }
    
    private String generateRandomPassword(int length) {
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        StringBuilder password = new StringBuilder();
        java.util.Random random = new java.util.Random();
        for (int i = 0; i < length; i++) {
            password.append(chars.charAt(random.nextInt(chars.length())));
        }
        return password.toString();
    }
}


