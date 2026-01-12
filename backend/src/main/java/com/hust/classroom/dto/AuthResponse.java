package com.hust.classroom.dto;

import com.hust.classroom.entity.User;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {
    private String token;
    private UserResponse user;
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserResponse {
        private Integer id;
        private String name;
        private String email;
        private String role;
        private String mssv;
        private String avatar;
        
        public static UserResponse fromUser(User user) {
            UserResponse response = new UserResponse();
            response.setId(user.getId());
            response.setName(user.getName());
            response.setEmail(user.getEmail());
            response.setRole(user.getRole().name());
            response.setMssv(user.getMssv());
            response.setAvatar(user.getAvatar());
            return response;
        }
    }
}



