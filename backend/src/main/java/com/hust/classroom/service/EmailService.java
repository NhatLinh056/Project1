package com.hust.classroom.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailService {
    
    private final JavaMailSender mailSender;
    
    @Value("${spring.mail.username:}")
    private String fromEmail;
    
    public void sendPasswordResetEmail(String toEmail, String newPassword) {
        try {
            // Kiểm tra xem email đã được cấu hình chưa
            if (fromEmail == null || fromEmail.isEmpty() || fromEmail.equals("your-email@gmail.com")) {
                System.err.println("⚠️ Email chưa được cấu hình! Vui lòng cấu hình email trong application.properties");
                System.err.println("📧 Mật khẩu mới cho " + toEmail + ": " + newPassword);
                return;
            }
            
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(toEmail);
            message.setSubject("🔐 Khôi phục mật khẩu - HUST Classroom");
            message.setText(
                "Xin chào,\n\n" +
                "Bạn đã yêu cầu khôi phục mật khẩu cho tài khoản HUST Classroom.\n\n" +
                "Mật khẩu mới của bạn là: " + newPassword + "\n\n" +
                "Vui lòng đăng nhập và đổi mật khẩu ngay sau khi nhận được email này.\n\n" +
                "Nếu bạn không yêu cầu khôi phục mật khẩu, vui lòng bỏ qua email này.\n\n" +
                "Trân trọng,\n" +
                "HUST Classroom Team"
            );
            
            mailSender.send(message);
            System.out.println("✅ Email đã được gửi thành công đến: " + toEmail);
        } catch (Exception e) {
            System.err.println("❌ Lỗi khi gửi email: " + e.getMessage());
            e.printStackTrace();
            // Fallback: log ra console
            System.err.println("📧 Mật khẩu mới cho " + toEmail + ": " + newPassword);
        }
    }
}


