package com.hust.classroom.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Entity
@Table(name = "attendance", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"class_id", "date"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Attendance {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "class_id", nullable = false)
    private Class lopHoc;

    @Column(name = "class_id", insertable = false, updatable = false)
    private Integer classID;

    @Column(name = "date", nullable = false)
    private LocalDate date;

    @Column(name = "records", columnDefinition = "TEXT")
    private String records; // JSON string chứa danh sách điểm danh
}



