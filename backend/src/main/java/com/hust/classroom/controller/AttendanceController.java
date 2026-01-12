package com.hust.classroom.controller;

import com.hust.classroom.entity.Attendance;
import com.hust.classroom.service.AttendanceService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/attendance")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173", "http://localhost:5174"})
public class AttendanceController {
    
    private final AttendanceService attendanceService;
    
    @GetMapping
    public ResponseEntity<?> getAttendance(
            @RequestParam Integer classId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return attendanceService.getAttendance(classId, date)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.ok(new Attendance()));
    }
    
    @GetMapping("/class/{classId}")
    public ResponseEntity<List<Attendance>> getAllByClass(@PathVariable Integer classId) {
        return ResponseEntity.ok(attendanceService.getAllByClassId(classId));
    }
    
    @PostMapping
    public ResponseEntity<?> saveAttendance(@RequestBody Map<String, Object> request) {
        try {
            System.out.println("🔵 [Controller] saveAttendance called with request: " + request);
            
            Object classIdObj = request.get("class_id");
            Integer classId;
            if (classIdObj instanceof Number) {
                classId = ((Number) classIdObj).intValue();
            } else if (classIdObj != null) {
                classId = Integer.parseInt(classIdObj.toString());
            } else {
                Map<String, String> errorResponse = new HashMap<>();
                errorResponse.put("error", "Thiếu thông tin class_id!");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
            }
            
            String dateStr = (String) request.get("date");
            if (dateStr == null || dateStr.isEmpty()) {
                Map<String, String> errorResponse = new HashMap<>();
                errorResponse.put("error", "Thiếu thông tin date!");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
            }
            
            LocalDate date = LocalDate.parse(dateStr);
            
            // Convert records to JSON string
            Object recordsObj = request.get("records");
            String records;
            if (recordsObj instanceof List || recordsObj instanceof Map) {
                // In a real app, use Jackson ObjectMapper
                records = recordsObj.toString();
            } else {
                records = recordsObj != null ? recordsObj.toString() : "[]";
            }
            
            System.out.println("🔵 [Controller] Saving attendance - classId: " + classId + ", date: " + date);
            Attendance attendance = attendanceService.saveAttendance(classId, date, records);
            System.out.println("🔵 [Controller] Attendance saved successfully");
            return ResponseEntity.ok(attendance);
        } catch (IllegalArgumentException e) {
            System.err.println("❌ [Controller] Invalid argument: " + e.getMessage());
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Lỗi định dạng dữ liệu: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        } catch (Exception e) {
            System.err.println("❌ [Controller] Error saving attendance: " + e.getMessage());
            e.printStackTrace();
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Lỗi: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        }
    }
}

