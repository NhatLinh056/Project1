package com.hust.classroom.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Entity
@Table(name = "classes")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Class {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "class_id")
    private Integer classID;

    @Column(name = "ten_lop", nullable = false)
    private String tenLop;

    @Column(name = "mo_ta", columnDefinition = "TEXT")
    private String moTa;

    @Column(name = "ma_tham_gia", unique = true)
    private String maThamGia;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "giao_vien_id", nullable = false)
    @JsonIgnoreProperties({"classesTaught", "classEnrollments", "submissions", "notifications", "password"})
    private User giaoVien;

    @Column(name = "giao_vien_id", insertable = false, updatable = false)
    private Integer giaoVienID;

    @OneToMany(mappedBy = "lopHoc", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    private List<ClassStudent> students;

    @OneToMany(mappedBy = "lopHoc", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    private List<Attendance> attendances;

    @OneToMany(mappedBy = "lopHoc", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    private List<Submission> submissions;
}

