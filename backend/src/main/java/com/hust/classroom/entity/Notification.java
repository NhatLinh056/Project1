package com.hust.classroom.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Notification {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Integer id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnoreProperties({ "password", "classesTaught", "classEnrollments", "submissions", "notifications",
            "attendances" })
    private User user;

    @Column(name = "user_id", insertable = false, updatable = false)
    @JsonProperty("userId")
    private Integer userID;

    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "read_status", nullable = false)
    @JsonProperty("read")
    private Boolean read = false;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "role")
    private String role; // Admin, Teacher, Student
}
