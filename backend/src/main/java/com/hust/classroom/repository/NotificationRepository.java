package com.hust.classroom.repository;

import com.hust.classroom.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Integer> {
    @Query("SELECT n FROM Notification n WHERE n.userID = :userId ORDER BY n.createdAt DESC")
    List<Notification> findByUserId(@Param("userId") Integer userId);
    
    @Query("SELECT n FROM Notification n WHERE n.userID = :userId AND n.read = false ORDER BY n.createdAt DESC")
    List<Notification> findUnreadByUserId(@Param("userId") Integer userId);
}



