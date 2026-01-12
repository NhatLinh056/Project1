package com.hust.classroom.controller;

import com.hust.classroom.entity.Submission;
import com.hust.classroom.service.SubmissionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/grading")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173", "http://localhost:5174"})
public class GradingController {
    
    private final SubmissionService submissionService;
    
    @GetMapping
    public ResponseEntity<?> getSubmissions(
            @RequestParam(required = false) Integer teacherId,
            @RequestParam(required = false) Integer studentId,
            @RequestParam(required = false) Integer classId) {
        try {
            List<Submission> submissions;
            if (studentId != null) {
                // Lấy submissions của student
                if (classId != null) {
                    submissions = submissionService.getSubmissionsByStudentIdAndClassId(studentId, classId);
                } else {
                    submissions = submissionService.getSubmissionsByStudentId(studentId);
                }
            } else if (teacherId != null) {
                // Lấy submissions của teacher
                submissions = submissionService.getSubmissions(teacherId, classId);
            } else {
                // Không có filter -> lấy tất cả submissions (cho admin)
                submissions = submissionService.getAllSubmissions();
            }
            return ResponseEntity.ok(submissions);
        } catch (Exception e) {
            System.err.println("❌ Error in getSubmissions: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Lỗi khi lấy danh sách bài nộp: " + e.getMessage());
        }
    }
    
    @PostMapping
    public ResponseEntity<?> createSubmission(@RequestBody Map<String, Object> request) {
        try {
            Submission submission = new Submission();
            // Map fields from request
            Object studentIdObj = request.get("studentID");
            Object classIdObj = request.get("lopHocID") != null ? request.get("lopHocID") : request.get("classId");
            
            if (studentIdObj != null) {
                Integer studentId = studentIdObj instanceof Number 
                    ? ((Number) studentIdObj).intValue() 
                    : Integer.parseInt(studentIdObj.toString());
                submission.setStudentID(studentId);
            }
            if (classIdObj != null) {
                Integer classId = classIdObj instanceof Number 
                    ? ((Number) classIdObj).intValue() 
                    : Integer.parseInt(classIdObj.toString());
                submission.setLopHocID(classId);
            }
            if (request.get("tenBaiTap") != null) {
                submission.setTenBaiTap((String) request.get("tenBaiTap"));
            }
            if (request.get("filePath") != null) {
                submission.setFilePath((String) request.get("filePath"));
            }
            
            Submission created = submissionService.createSubmission(submission);
            return ResponseEntity.ok(created);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Lỗi: " + e.getMessage());
        }
    }
    
    @PutMapping("/{submissionId}/grade")
    public ResponseEntity<?> gradeSubmission(
            @PathVariable Integer submissionId,
            @RequestBody Map<String, Object> request) {
        try {
            BigDecimal diem = null;
            if (request.get("diem") != null) {
                if (request.get("diem") instanceof Number) {
                    diem = BigDecimal.valueOf(((Number) request.get("diem")).doubleValue());
                } else {
                    diem = new BigDecimal(request.get("diem").toString());
                }
            }
            String nhanXet = (String) request.get("nhanXet");
            
            Submission graded = submissionService.gradeSubmission(submissionId, diem, nhanXet);
            return ResponseEntity.ok(graded);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Lỗi: " + e.getMessage());
        }
    }
    
    @DeleteMapping("/cleanup-duplicates")
    public ResponseEntity<?> cleanupDuplicateSubmissions() {
        try {
            int deletedCount = submissionService.removeDuplicateSubmissions();
            Map<String, Object> response = new java.util.HashMap<>();
            response.put("message", "Đã xóa " + deletedCount + " bài nộp trùng lặp.");
            response.put("deletedCount", deletedCount);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.err.println("❌ Error cleaning up duplicates: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Lỗi khi xóa bài nộp trùng lặp: " + e.getMessage());
        }
    }
}

