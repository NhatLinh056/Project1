package com.hust.classroom.repository;

import com.hust.classroom.entity.Class;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ClassRepository extends JpaRepository<Class, Integer> {
    Optional<Class> findByMaThamGia(String maThamGia);
    
    @Query("SELECT DISTINCT c FROM Class c LEFT JOIN FETCH c.giaoVien WHERE c.giaoVien.id = :teacherId ORDER BY c.classID DESC")
    List<Class> findByGiaoVienId(@Param("teacherId") Integer teacherId);
    
    @Query("SELECT DISTINCT c FROM Class c LEFT JOIN FETCH c.giaoVien JOIN c.students cs WHERE cs.student.id = :studentId")
    List<Class> findByStudentId(@Param("studentId") Integer studentId);
}

