package com.hust.classroom.service;

import com.hust.classroom.entity.Class;
import com.hust.classroom.entity.Post;
import com.hust.classroom.entity.User;
import com.hust.classroom.repository.ClassRepository;
import com.hust.classroom.repository.PostRepository;
import com.hust.classroom.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class PostService {
    
    private final PostRepository postRepository;
    private final ClassRepository classRepository;
    private final UserRepository userRepository;
    
    public List<Post> getPostsByClassId(Integer classId) {
        return postRepository.findByClassId(classId);
    }
    
    @Transactional
    public Post createPost(Integer classId, Integer authorId, String content, String filePath) {
        Class lopHoc = classRepository.findById(classId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy lớp học!"));
        
        User author = userRepository.findById(authorId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng!"));
        
        Post post = new Post();
        post.setLopHoc(lopHoc);
        post.setAuthor(author);
        post.setContent(content);
        post.setFilePath(filePath);
        post.setCreatedAt(LocalDateTime.now());
        
        return postRepository.save(post);
    }
    
    @Transactional
    public void deletePost(Integer postId) {
        if (!postRepository.existsById(postId)) {
            throw new RuntimeException("Không tìm thấy bài đăng!");
        }
        postRepository.deleteById(postId);
    }
}



