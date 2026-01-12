package com.hust.classroom.controller;

import com.hust.classroom.entity.Post;
import com.hust.classroom.service.PostService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173", "http://localhost:5174"})
public class PostController {
    
    private final PostService postService;
    
    @GetMapping("/class/{classId}")
    public ResponseEntity<?> getPostsByClass(@PathVariable Integer classId) {
        try {
            List<Post> posts = postService.getPostsByClassId(classId);
            return ResponseEntity.ok(posts);
        } catch (Exception e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Lỗi khi lấy danh sách bài đăng: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
    
    @PostMapping
    public ResponseEntity<?> createPost(@RequestBody Map<String, Object> request) {
        try {
            System.out.println("🔵 [Controller] createPost called with: " + request);
            
            Object classIdObj = request.get("classId");
            Object authorIdObj = request.get("authorId");
            Integer classId;
            Integer authorId;
            
            if (classIdObj instanceof Number) {
                classId = ((Number) classIdObj).intValue();
            } else if (classIdObj != null) {
                classId = Integer.parseInt(classIdObj.toString());
            } else {
                Map<String, String> errorResponse = new HashMap<>();
                errorResponse.put("error", "Thiếu thông tin classId!");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
            }
            
            if (authorIdObj instanceof Number) {
                authorId = ((Number) authorIdObj).intValue();
            } else if (authorIdObj != null) {
                authorId = Integer.parseInt(authorIdObj.toString());
            } else {
                Map<String, String> errorResponse = new HashMap<>();
                errorResponse.put("error", "Thiếu thông tin authorId!");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
            }
            
            String content = (String) request.get("content");
            String filePath = (String) request.get("filePath");
            
            if (content == null || content.isEmpty()) {
                Map<String, String> errorResponse = new HashMap<>();
                errorResponse.put("error", "Nội dung không được để trống!");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
            }
            
            System.out.println("🔵 [Controller] Creating post - classId: " + classId + ", authorId: " + authorId);
            Post post = postService.createPost(classId, authorId, content, filePath);
            System.out.println("🔵 [Controller] Post created successfully with ID: " + post.getPostID());
            return ResponseEntity.ok(post);
        } catch (RuntimeException e) {
            System.err.println("❌ [Controller] Error creating post: " + e.getMessage());
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        }
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletePost(@PathVariable Integer id) {
        try {
            postService.deletePost(id);
            Map<String, String> successResponse = new HashMap<>();
            successResponse.put("message", "Đã xóa bài đăng thành công!");
            return ResponseEntity.ok(successResponse);
        } catch (RuntimeException e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        }
    }
}

