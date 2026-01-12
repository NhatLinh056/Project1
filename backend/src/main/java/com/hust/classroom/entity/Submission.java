package com.hust.classroom.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "submissions")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Submission {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "submission_id")
    private Integer submissionID;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "password", "classes", "submissions"})
    private User student;

    @Column(name = "student_id", insertable = false, updatable = false)
    private Integer studentID;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "class_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "students", "assignments", "posts", "submissions"})
    private Class lopHoc;

    @Column(name = "class_id", insertable = false, updatable = false)
    private Integer lopHocID;

    @Column(name = "ten_bai_tap")
    private String tenBaiTap;

    @Column(name = "file_path")
    private String filePath;

    @Column(name = "diem", precision = 3, scale = 1)
    private BigDecimal diem;

    @Column(name = "nhan_xet", columnDefinition = "TEXT")
    private String nhanXet;

    @Column(name = "trang_thai")
    private String trangThai; // Pending, Graded, Late

    @Column(name = "submitted_at")
    private LocalDateTime submittedAt;

    @Column(name = "graded_at")
    private LocalDateTime gradedAt;
}


