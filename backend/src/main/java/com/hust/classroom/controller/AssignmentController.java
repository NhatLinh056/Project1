package com.hust.classroom.controller;

import com.hust.classroom.entity.Assignment;
import com.hust.classroom.service.AssignmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/assignments")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173", "http://localhost:5174"})
public class AssignmentController {
    
    private final AssignmentService assignmentService;
    
    @GetMapping("/class/{classId}")
    public ResponseEntity<?> getAssignmentsByClass(
            @PathVariable Integer classId,
            @RequestParam(required = false) String type) {
        try {
            List<Assignment> assignments;
            if (type != null && (type.equals("ASSIGNMENT") || type.equals("MATERIAL"))) {
                assignments = assignmentService.getAssignmentsByClassIdAndType(
                    classId, Assignment.Type.valueOf(type));
            } else {
                assignments = assignmentService.getAssignmentsByClassId(classId);
            }
            return ResponseEntity.ok(assignments);
        } catch (Exception e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Lỗi khi lấy danh sách bài tập: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<?> getAssignmentById(@PathVariable Integer id) {
        try {
            Optional<Assignment> assignmentOpt = assignmentService.getAssignmentById(id);
            if (assignmentOpt.isPresent()) {
                return ResponseEntity.ok(assignmentOpt.get());
            } else {
                Map<String, String> errorResponse = new HashMap<>();
                errorResponse.put("error", "Không tìm thấy bài tập!");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
            }
        } catch (Exception e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Lỗi: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
    
    @PostMapping
    public ResponseEntity<?> createAssignment(@RequestBody Map<String, Object> request) {
        try {
            System.out.println("🔵 [Controller] createAssignment called with: " + request);
            System.out.println("🔵 [Controller] Request keys: " + request.keySet());
            System.out.println("🔵 [Controller] classId value: " + request.get("classId") + " (type: " + (request.get("classId") != null ? request.get("classId").getClass().getName() : "null") + ")");
            System.out.println("🔵 [Controller] filePath value: " + request.get("filePath") + " (type: " + (request.get("filePath") != null ? request.get("filePath").getClass().getName() : "null") + ")");
            System.out.println("🔵 [Controller] maxScore value: " + request.get("maxScore") + " (type: " + (request.get("maxScore") != null ? request.get("maxScore").getClass().getName() : "null") + ")");
            
            Object classIdObj = request.get("classId");
            Integer classId;
            if (classIdObj instanceof Number) {
                classId = ((Number) classIdObj).intValue();
            } else if (classIdObj != null) {
                try {
                    classId = Integer.parseInt(classIdObj.toString());
                } catch (NumberFormatException e) {
                    System.err.println("❌ [Controller] Cannot parse classId: " + classIdObj);
                    Map<String, String> errorResponse = new HashMap<>();
                    errorResponse.put("error", "classId không hợp lệ: " + classIdObj);
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
                }
            } else {
                Map<String, String> errorResponse = new HashMap<>();
                errorResponse.put("error", "Thiếu thông tin classId!");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
            }
            
            String title = (String) request.get("title");
            if (title == null || title.isEmpty()) {
                Map<String, String> errorResponse = new HashMap<>();
                errorResponse.put("error", "Tiêu đề không được để trống!");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
            }
            
            String description = (String) request.get("description");
            String typeStr = (String) request.get("type");
            Assignment.Type type = typeStr != null && typeStr.equals("MATERIAL") 
                ? Assignment.Type.MATERIAL 
                : Assignment.Type.ASSIGNMENT;
            String filePath = (String) request.get("filePath");
            
            LocalDate dueDate = null;
            if (request.get("dueDate") != null) {
                String dueDateStr = request.get("dueDate").toString();
                dueDate = LocalDate.parse(dueDateStr);
            }
            
            Integer maxScore = null;
            if (request.get("maxScore") != null) {
                Object maxScoreObj = request.get("maxScore");
                if (maxScoreObj instanceof Number) {
                    maxScore = ((Number) maxScoreObj).intValue();
                } else {
                    String maxScoreStr = maxScoreObj.toString().trim();
                    if (!maxScoreStr.isEmpty() && !maxScoreStr.equals("null") && !maxScoreStr.equals("undefined")) {
                        try {
                            maxScore = Integer.parseInt(maxScoreStr);
                        } catch (NumberFormatException e) {
                            // Nếu không parse được, giữ null (có thể là MATERIAL không cần maxScore)
                            System.out.println("⚠️ [Controller] Cannot parse maxScore: " + maxScoreStr + ", setting to null");
                            maxScore = null;
                        }
                    }
                }
            }
            
            System.out.println("🔵 [Controller] Creating assignment - classId: " + classId + ", title: " + title + ", type: " + type + ", maxScore: " + maxScore);
            Assignment assignment = assignmentService.createAssignment(
                classId, title, description, type, filePath, dueDate, maxScore);
            System.out.println("🔵 [Controller] Assignment created successfully with ID: " + assignment.getAssignmentID());
            return ResponseEntity.ok(assignment);
        } catch (RuntimeException e) {
            System.err.println("❌ [Controller] Error creating assignment: " + e.getMessage());
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        } catch (Exception e) {
            System.err.println("❌ [Controller] Unexpected error: " + e.getMessage());
            e.printStackTrace();
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Lỗi không xác định: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<?> updateAssignment(@PathVariable Integer id, @RequestBody Map<String, Object> request) {
        try {
            String title = (String) request.get("title");
            String description = (String) request.get("description");
            String filePath = (String) request.get("filePath");
            
            LocalDate dueDate = null;
            if (request.get("dueDate") != null) {
                String dueDateStr = request.get("dueDate").toString();
                dueDate = LocalDate.parse(dueDateStr);
            }
            
            Integer maxScore = null;
            if (request.get("maxScore") != null) {
                if (request.get("maxScore") instanceof Number) {
                    maxScore = ((Number) request.get("maxScore")).intValue();
                } else {
                    maxScore = Integer.parseInt(request.get("maxScore").toString());
                }
            }
            
            Assignment assignment = assignmentService.updateAssignment(
                id, title, description, filePath, dueDate, maxScore);
            return ResponseEntity.ok(assignment);
        } catch (RuntimeException e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        }
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteAssignment(@PathVariable Integer id) {
        try {
            assignmentService.deleteAssignment(id);
            Map<String, String> successResponse = new HashMap<>();
            successResponse.put("message", "Đã xóa bài tập thành công!");
            return ResponseEntity.ok(successResponse);
        } catch (RuntimeException e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        }
    }
}

