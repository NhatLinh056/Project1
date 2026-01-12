package com.hust.classroom.repository;

import com.hust.classroom.entity.Submission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SubmissionRepository extends JpaRepository<Submission, Integer> {
    @Query("SELECT s FROM Submission s WHERE s.lopHocID = :classId")
    List<Submission> findByClassId(@Param("classId") Integer classId);
    
    @Query("SELECT DISTINCT s FROM Submission s " +
           "LEFT JOIN FETCH s.student " +
           "LEFT JOIN FETCH s.lopHoc " +
           "LEFT JOIN FETCH s.lopHoc.giaoVien " +
           "WHERE s.studentID = :studentId")
    List<Submission> findByStudentId(@Param("studentId") Integer studentId);
    
    @Query("SELECT DISTINCT s FROM Submission s " +
           "LEFT JOIN FETCH s.student " +
           "LEFT JOIN FETCH s.lopHoc " +
           "LEFT JOIN FETCH s.lopHoc.giaoVien " +
           "WHERE s.studentID = :studentId AND s.lopHocID = :classId")
    List<Submission> findByStudentIdAndClassId(@Param("studentId") Integer studentId, @Param("classId") Integer classId);
    
    @Query("SELECT DISTINCT s FROM Submission s " +
           "LEFT JOIN FETCH s.student " +
           "LEFT JOIN FETCH s.lopHoc " +
           "LEFT JOIN FETCH s.lopHoc.giaoVien " +
           "WHERE s.lopHoc.giaoVien.id = :teacherId")
    List<Submission> findByTeacherId(@Param("teacherId") Integer teacherId);
    
    @Query("SELECT DISTINCT s FROM Submission s " +
           "LEFT JOIN FETCH s.student " +
           "LEFT JOIN FETCH s.lopHoc " +
           "LEFT JOIN FETCH s.lopHoc.giaoVien " +
           "WHERE s.lopHoc.giaoVien.id = :teacherId AND s.lopHocID = :classId")
    List<Submission> findByTeacherIdAndClassId(@Param("teacherId") Integer teacherId, @Param("classId") Integer classId);
    
    @Query("SELECT s FROM Submission s WHERE s.studentID = :studentId AND s.lopHocID = :classId AND s.tenBaiTap = :tenBaiTap")
    List<Submission> findByStudentIdAndClassIdAndTenBaiTap(
        @Param("studentId") Integer studentId, 
        @Param("classId") Integer classId, 
        @Param("tenBaiTap") String tenBaiTap
    );
}

