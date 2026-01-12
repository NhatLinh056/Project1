package com.hust.classroom.repository;

import com.hust.classroom.entity.Post;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PostRepository extends JpaRepository<Post, Integer> {
    @Query("SELECT p FROM Post p LEFT JOIN FETCH p.author WHERE p.classID = :classId ORDER BY p.createdAt DESC")
    List<Post> findByClassId(@Param("classId") Integer classId);
}



