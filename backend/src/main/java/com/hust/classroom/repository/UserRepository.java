package com.hust.classroom.repository;

import com.hust.classroom.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Integer> {
    Optional<User> findByEmail(String email);
    Optional<User> findByMssv(String mssv);
    boolean existsByEmail(String email);
    boolean existsByMssv(String mssv);
}



