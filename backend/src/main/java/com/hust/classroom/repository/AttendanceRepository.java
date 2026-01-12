package com.hust.classroom.repository;

import com.hust.classroom.entity.Attendance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface AttendanceRepository extends JpaRepository<Attendance, Integer> {
    @Query("SELECT a FROM Attendance a WHERE a.classID = :classId AND a.date = :date")
    Optional<Attendance> findByClassIdAndDate(@Param("classId") Integer classId, @Param("date") LocalDate date);
    
    @Query("SELECT a FROM Attendance a WHERE a.classID = :classId ORDER BY a.date DESC")
    List<Attendance> findAllByClassId(@Param("classId") Integer classId);
}



