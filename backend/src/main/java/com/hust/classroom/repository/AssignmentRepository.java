package com.hust.classroom.repository;

import com.hust.classroom.entity.Assignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AssignmentRepository extends JpaRepository<Assignment, Integer> {
    @Query("SELECT a FROM Assignment a LEFT JOIN FETCH a.lopHoc WHERE a.classID = :classId ORDER BY a.createdAt DESC")
    List<Assignment> findByClassId(@Param("classId") Integer classId);
    
    @Query("SELECT a FROM Assignment a LEFT JOIN FETCH a.lopHoc WHERE a.classID = :classId AND a.type = :type ORDER BY a.createdAt DESC")
    List<Assignment> findByClassIdAndType(@Param("classId") Integer classId, @Param("type") Assignment.Type type);
}



