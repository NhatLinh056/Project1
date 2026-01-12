package com.hust.classroom.repository;

import com.hust.classroom.entity.ClassStudent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ClassStudentRepository extends JpaRepository<ClassStudent, Integer> {
    @Query("SELECT cs FROM ClassStudent cs LEFT JOIN FETCH cs.student WHERE cs.classID = :classId")
    List<ClassStudent> findByClassId(@Param("classId") Integer classId);
    
    @Query("SELECT cs FROM ClassStudent cs WHERE cs.studentID = :studentId")
    List<ClassStudent> findByStudentId(@Param("studentId") Integer studentId);
    
    @Query("SELECT cs FROM ClassStudent cs WHERE cs.classID = :classId AND cs.studentID = :studentId")
    Optional<ClassStudent> findByClassIdAndStudentId(@Param("classId") Integer classId, @Param("studentId") Integer studentId);
    
    boolean existsByClassIDAndStudentID(Integer classId, Integer studentId);
}

