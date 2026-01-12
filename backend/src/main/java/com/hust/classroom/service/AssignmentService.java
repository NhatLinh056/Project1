package com.hust.classroom.service;

import com.hust.classroom.entity.Assignment;
import com.hust.classroom.entity.Class;
import com.hust.classroom.repository.AssignmentRepository;
import com.hust.classroom.repository.ClassRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AssignmentService {
    
    private final AssignmentRepository assignmentRepository;
    private final ClassRepository classRepository;
    
    public List<Assignment> getAssignmentsByClassId(Integer classId) {
        return assignmentRepository.findByClassId(classId);
    }
    
    public List<Assignment> getAssignmentsByClassIdAndType(Integer classId, Assignment.Type type) {
        return assignmentRepository.findByClassIdAndType(classId, type);
    }
    
    public Optional<Assignment> getAssignmentById(Integer id) {
        return assignmentRepository.findById(id);
    }
    
    @Transactional
    public Assignment createAssignment(Integer classId, String title, String description, 
                                       Assignment.Type type, String filePath, 
                                       LocalDate dueDate, Integer maxScore) {
        Class lopHoc = classRepository.findById(classId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy lớp học!"));
        
        Assignment assignment = new Assignment();
        assignment.setLopHoc(lopHoc);
        assignment.setTitle(title);
        assignment.setDescription(description);
        assignment.setType(type);
        assignment.setFilePath(filePath);
        assignment.setDueDate(dueDate);
        assignment.setMaxScore(maxScore);
        assignment.setCreatedAt(LocalDateTime.now());
        assignment.setUpdatedAt(LocalDateTime.now());
        
        return assignmentRepository.save(assignment);
    }
    
    @Transactional
    public Assignment updateAssignment(Integer id, String title, String description, 
                                       String filePath, LocalDate dueDate, Integer maxScore) {
        Assignment assignment = assignmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bài tập!"));
        
        if (title != null) assignment.setTitle(title);
        if (description != null) assignment.setDescription(description);
        if (filePath != null) assignment.setFilePath(filePath);
        if (dueDate != null) assignment.setDueDate(dueDate);
        if (maxScore != null) assignment.setMaxScore(maxScore);
        assignment.setUpdatedAt(LocalDateTime.now());
        
        return assignmentRepository.save(assignment);
    }
    
    @Transactional
    public void deleteAssignment(Integer id) {
        if (!assignmentRepository.existsById(id)) {
            throw new RuntimeException("Không tìm thấy bài tập!");
        }
        assignmentRepository.deleteById(id);
    }
}



