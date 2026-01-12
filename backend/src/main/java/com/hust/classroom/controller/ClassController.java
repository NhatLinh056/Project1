package com.hust.classroom.controller;

import com.hust.classroom.entity.Class;
import com.hust.classroom.entity.ClassStudent;
import com.hust.classroom.entity.User;
import com.hust.classroom.service.ClassService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/classes")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173", "http://localhost:5174"})
public class ClassController {
    
    private final ClassService classService;
    
    @GetMapping
    public ResponseEntity<?> getAllClasses(
            @RequestParam(required = false) Integer userId,
            @RequestParam(required = false) String role) {
        try {
            System.out.println("🔵 [Controller] getAllClasses - userId: " + userId + ", role: " + role);
            List<Class> classes = classService.getAllClasses(userId, role);
            System.out.println("🔵 [Controller] Returning " + classes.size() + " classes");
            return ResponseEntity.ok(classes);
        } catch (Exception e) {
            System.err.println("❌ [Controller] Error getting classes: " + e.getMessage());
            e.printStackTrace();
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Lỗi khi lấy danh sách lớp học: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<?> getClassById(@PathVariable Integer id) {
        Optional<Class> classOpt = classService.getClassById(id);
        if (classOpt.isPresent()) {
            return ResponseEntity.ok(classOpt.get());
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Không tìm thấy lớp học!");
        }
    }
    
    @PostMapping
    public ResponseEntity<?> createClass(@RequestBody Map<String, Object> request) {
        try {
            System.out.println("🔵 [Backend] Received create class request: " + request);
            
            Class classEntity = new Class();
            
            // Nhận cả 2 format: frontend format (name, code, description) và backend format (tenLop, maThamGia, moTa)
            String tenLop = (String) (request.get("tenLop") != null ? request.get("tenLop") : request.get("name"));
            String moTa = (String) (request.get("moTa") != null ? request.get("moTa") : request.get("description"));
            String maThamGia = (String) (request.get("maThamGia") != null ? request.get("maThamGia") : request.get("code"));
            
            System.out.println("🔵 [Backend] Parsed data - tenLop: " + tenLop + ", moTa: " + moTa + ", maThamGia: " + maThamGia);
            
            if (tenLop == null || tenLop.isEmpty()) {
                Map<String, String> errorResponse = new HashMap<>();
                errorResponse.put("error", "Tên lớp học không được để trống!");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
            }
            
            classEntity.setTenLop(tenLop);
            classEntity.setMoTa(moTa);
            classEntity.setMaThamGia(maThamGia);
            
            // Set giáo viên
            Object giaoVienIdObj = request.get("giaoVienID");
            if (giaoVienIdObj != null) {
                Integer giaoVienID;
                if (giaoVienIdObj instanceof Number) {
                    giaoVienID = ((Number) giaoVienIdObj).intValue();
                } else {
                    giaoVienID = Integer.parseInt(giaoVienIdObj.toString());
                }
                System.out.println("🔵 [Backend] Setting teacher ID: " + giaoVienID);
                User teacher = new User();
                teacher.setId(giaoVienID);
                classEntity.setGiaoVien(teacher);
            } else {
                Map<String, String> errorResponse = new HashMap<>();
                errorResponse.put("error", "Thiếu thông tin giáo viên!");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
            }
            
            System.out.println("🔵 [Backend] Calling classService.createClass...");
            Class created = classService.createClass(classEntity);
            System.out.println("🔵 [Backend] Class created successfully with ID: " + created.getClassID());
            
            return ResponseEntity.ok(created);
        } catch (NumberFormatException e) {
            System.err.println("❌ [Backend] Number format error: " + e.getMessage());
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Lỗi định dạng số: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        } catch (Exception e) {
            System.err.println("❌ [Backend] Error creating class: " + e.getMessage());
            e.printStackTrace();
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Lỗi: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        }
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<?> updateClass(@PathVariable Integer id, @RequestBody Map<String, Object> request) {
        try {
            Class classDetails = new Class();
            
            // Nhận cả 2 format: frontend format (name, code, description) và backend format (tenLop, maThamGia, moTa)
            if (request.get("tenLop") != null || request.get("name") != null) {
                String tenLop = (String) (request.get("tenLop") != null ? request.get("tenLop") : request.get("name"));
                classDetails.setTenLop(tenLop);
            }
            if (request.get("moTa") != null || request.get("description") != null) {
                String moTa = (String) (request.get("moTa") != null ? request.get("moTa") : request.get("description"));
                classDetails.setMoTa(moTa);
            }
            if (request.get("maThamGia") != null || request.get("code") != null) {
                String maThamGia = (String) (request.get("maThamGia") != null ? request.get("maThamGia") : request.get("code"));
                classDetails.setMaThamGia(maThamGia);
            }
            
            if (request.get("giaoVienID") != null) {
                Object giaoVienIdObj = request.get("giaoVienID");
                Integer giaoVienID;
                if (giaoVienIdObj instanceof Number) {
                    giaoVienID = ((Number) giaoVienIdObj).intValue();
                } else {
                    giaoVienID = Integer.parseInt(giaoVienIdObj.toString());
                }
                User teacher = new User();
                teacher.setId(giaoVienID);
                classDetails.setGiaoVien(teacher);
            }
            
            Class updated = classService.updateClass(id, classDetails);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteClass(@PathVariable Integer id) {
        try {
            classService.deleteClass(id);
            Map<String, String> successResponse = new HashMap<>();
            successResponse.put("message", "Đã xóa lớp học thành công!");
            return ResponseEntity.ok(successResponse);
        } catch (RuntimeException e) {
            System.err.println("❌ Error deleting class: " + e.getMessage());
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        } catch (Exception e) {
            System.err.println("❌ Error deleting class: " + e.getMessage());
            e.printStackTrace();
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Lỗi khi xóa lớp học: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
    
    @PostMapping("/enroll")
    public ResponseEntity<?> enrollStudent(@RequestBody Map<String, Object> request) {
        try {
            System.out.println("🔵 [Controller] enrollStudent called with: " + request);
            
            Object sinhVienIDObj = request.get("sinhVienID");
            Integer sinhVienID;
            if (sinhVienIDObj instanceof Number) {
                sinhVienID = ((Number) sinhVienIDObj).intValue();
            } else if (sinhVienIDObj != null) {
                sinhVienID = Integer.parseInt(sinhVienIDObj.toString());
            } else {
                Map<String, String> errorResponse = new HashMap<>();
                errorResponse.put("error", "Thiếu thông tin sinh viên!");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
            }
            
            String maThamGia = (String) request.get("maThamGia");
            if (maThamGia == null || maThamGia.isEmpty()) {
                Map<String, String> errorResponse = new HashMap<>();
                errorResponse.put("error", "Thiếu mã tham gia!");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
            }
            
            ClassStudent result = classService.enrollStudent(sinhVienID, maThamGia);
            
            // Trả về thông tin lớp đã tham gia
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("class", result.getLopHoc());
            response.put("message", "Đã tham gia lớp học thành công!");
            
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            System.err.println("❌ [Controller] Error enrolling student: " + e.getMessage());
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        }
    }
    
    @GetMapping("/{id}/students")
    public ResponseEntity<?> getStudents(@PathVariable Integer id) {
        try {
            System.out.println("🔵 [Controller] Getting students for class ID: " + id);
            List<User> students = classService.getStudentsByClassId(id);
            System.out.println("🔵 [Controller] Returning " + students.size() + " students");
            return ResponseEntity.ok(students);
        } catch (Exception e) {
            System.err.println("❌ [Controller] Error getting students: " + e.getMessage());
            e.printStackTrace();
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Lỗi khi lấy danh sách sinh viên: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
    
    @PostMapping("/{id}/add-student")
    public ResponseEntity<?> addStudent(@PathVariable Integer id, @RequestBody Map<String, Object> request) {
        try {
            System.out.println("🔵 [Controller] addStudent called for class ID: " + id);
            System.out.println("🔵 [Controller] Request: " + request);
            
            String email = (String) request.get("email");
            String mssv = (String) request.get("mssv");
            
            ClassStudent result = classService.addStudentToClass(id, email, mssv);
            System.out.println("🔵 [Controller] Student added successfully");
            
            // Trả về thông tin sinh viên đã thêm thay vì ClassStudent
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("student", result.getStudent());
            response.put("message", "Đã thêm sinh viên thành công!");
            
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            System.err.println("❌ [Controller] Error adding student: " + e.getMessage());
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        }
    }
}

