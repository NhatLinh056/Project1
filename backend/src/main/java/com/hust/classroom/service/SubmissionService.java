package com.hust.classroom.service;

import com.hust.classroom.entity.Class;
import com.hust.classroom.entity.Submission;
import com.hust.classroom.entity.User;
import com.hust.classroom.repository.ClassRepository;
import com.hust.classroom.repository.SubmissionRepository;
import com.hust.classroom.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class SubmissionService {
    
    private final SubmissionRepository submissionRepository;
    private final UserRepository userRepository;
    private final ClassRepository classRepository;
    
    public List<Submission> getSubmissions(Integer teacherId, Integer classId) {
        if (classId != null) {
            return submissionRepository.findByTeacherIdAndClassId(teacherId, classId);
        }
        return submissionRepository.findByTeacherId(teacherId);
    }
    
    public List<Submission> getSubmissionsByStudentId(Integer studentId) {
        return submissionRepository.findByStudentId(studentId);
    }
    
    public List<Submission> getSubmissionsByStudentIdAndClassId(Integer studentId, Integer classId) {
        return submissionRepository.findByStudentIdAndClassId(studentId, classId);
    }
    
    public Optional<Submission> getSubmissionById(Integer id) {
        return submissionRepository.findById(id);
    }
    
    public List<Submission> getAllSubmissions() {
        return submissionRepository.findAll();
    }
    
    @Transactional
    public Submission createSubmission(Submission submission) {
        // Kiểm tra xem sinh viên đã nộp bài tập này chưa
        if (submission.getStudentID() != null && submission.getLopHocID() != null && submission.getTenBaiTap() != null) {
            List<Submission> existingSubmissions = submissionRepository.findByStudentIdAndClassIdAndTenBaiTap(
                submission.getStudentID(),
                submission.getLopHocID(),
                submission.getTenBaiTap()
            );
            
            if (!existingSubmissions.isEmpty()) {
                throw new RuntimeException("Bạn đã nộp bài tập này rồi! Mỗi bài tập chỉ được nộp một lần.");
            }
        }
        
        // Set relationships if IDs are provided
        if (submission.getStudentID() != null) {
            User student = userRepository.findById(submission.getStudentID())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy sinh viên!"));
            submission.setStudent(student);
        }
        if (submission.getLopHocID() != null) {
            Class lopHoc = classRepository.findById(submission.getLopHocID())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy lớp học!"));
            submission.setLopHoc(lopHoc);
        }
        
        submission.setSubmittedAt(LocalDateTime.now());
        submission.setTrangThai("Pending");
        return submissionRepository.save(submission);
    }
    
    @Transactional
    public Submission gradeSubmission(Integer submissionId, BigDecimal diem, String nhanXet) {
        Submission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bài nộp!"));
        
        submission.setDiem(diem);
        submission.setNhanXet(nhanXet);
        submission.setTrangThai("Graded");
        submission.setGradedAt(LocalDateTime.now());
        
        return submissionRepository.save(submission);
    }
    
    @Transactional
    public int removeDuplicateSubmissions() {
        int totalDeleted = 0;
        
        // Lấy tất cả submissions
        List<Submission> allSubmissions = submissionRepository.findAll();
        
        // Nhóm submissions theo (studentID, lopHocID, tenBaiTap)
        Map<String, List<Submission>> groupedSubmissions = new HashMap<>();
        
        for (Submission submission : allSubmissions) {
            if (submission.getStudentID() != null && submission.getLopHocID() != null && submission.getTenBaiTap() != null) {
                String key = submission.getStudentID() + "_" + submission.getLopHocID() + "_" + submission.getTenBaiTap();
                groupedSubmissions.computeIfAbsent(key, k -> new ArrayList<>()).add(submission);
            }
        }
        
        // Xử lý từng nhóm
        for (List<Submission> group : groupedSubmissions.values()) {
            if (group.size() > 1) {
                // Có trùng lặp
                // Tìm submission đã được chấm (Graded)
                Submission gradedSubmission = group.stream()
                    .filter(s -> "Graded".equals(s.getTrangThai()) && s.getDiem() != null)
                    .findFirst()
                    .orElse(null);
                
                Submission toKeep;
                if (gradedSubmission != null) {
                    // Giữ lại submission đã chấm
                    toKeep = gradedSubmission;
                } else {
                    // Nếu không có submission đã chấm, giữ lại submission mới nhất
                    toKeep = group.stream()
                        .max((s1, s2) -> {
                            if (s1.getSubmittedAt() == null && s2.getSubmittedAt() == null) return 0;
                            if (s1.getSubmittedAt() == null) return -1;
                            if (s2.getSubmittedAt() == null) return 1;
                            return s1.getSubmittedAt().compareTo(s2.getSubmittedAt());
                        })
                        .orElse(null);
                }
                
                // Xóa các submission còn lại
                if (toKeep != null) {
                    for (Submission submission : group) {
                        if (!submission.getSubmissionID().equals(toKeep.getSubmissionID())) {
                            submissionRepository.delete(submission);
                            totalDeleted++;
                        }
                    }
                }
            }
        }
        
        return totalDeleted;
    }
}

