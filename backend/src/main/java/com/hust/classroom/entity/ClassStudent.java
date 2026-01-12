package com.hust.classroom.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "class_students", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"class_id", "student_id"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ClassStudent {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "class_id", nullable = false)
    private Class lopHoc;

    @Column(name = "class_id", insertable = false, updatable = false)
    private Integer classID;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    @Column(name = "student_id", insertable = false, updatable = false)
    private Integer studentID;

    @Column(name = "enrolled_at")
    private java.sql.Timestamp enrolledAt;
}



