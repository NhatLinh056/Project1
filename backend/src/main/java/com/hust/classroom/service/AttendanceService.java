package com.hust.classroom.service;

import com.hust.classroom.entity.Attendance;
import com.hust.classroom.entity.Class;
import com.hust.classroom.repository.AttendanceRepository;
import com.hust.classroom.repository.ClassRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AttendanceService {
    
    private final AttendanceRepository attendanceRepository;
    private final ClassRepository classRepository;
    
    public Optional<Attendance> getAttendance(Integer classId, LocalDate date) {
        return attendanceRepository.findByClassIdAndDate(classId, date);
    }
    
    public List<Attendance> getAllByClassId(Integer classId) {
        return attendanceRepository.findAllByClassId(classId);
    }
    
    @Transactional
    public Attendance saveAttendance(Integer classId, LocalDate date, String records) {
        Optional<Class> classOpt = classRepository.findById(classId);
        if (classOpt.isEmpty()) {
            throw new RuntimeException("Không tìm thấy lớp học!");
        }
        
        Optional<Attendance> existingOpt = attendanceRepository.findByClassIdAndDate(classId, date);
        
        Attendance attendance;
        if (existingOpt.isPresent()) {
            attendance = existingOpt.get();
            attendance.setRecords(records);
        } else {
            attendance = new Attendance();
            attendance.setLopHoc(classOpt.get());
            attendance.setDate(date);
            attendance.setRecords(records);
        }
        
        return attendanceRepository.save(attendance);
    }
}



