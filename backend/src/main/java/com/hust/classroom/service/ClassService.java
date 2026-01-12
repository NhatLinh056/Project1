package com.hust.classroom.service;

import com.hust.classroom.entity.Class;
import com.hust.classroom.entity.ClassStudent;
import com.hust.classroom.entity.User;
import com.hust.classroom.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ClassService {
    
    private final ClassRepository classRepository;
    private final UserRepository userRepository;
    private final ClassStudentRepository classStudentRepository;
    private final PostRepository postRepository;
    private final AssignmentRepository assignmentRepository;
    private final SubmissionRepository submissionRepository;
    
    @Transactional(readOnly = true)
    public List<Class> getAllClasses(Integer userId, String role) {
        System.out.println("🔵 [Service] getAllClasses - userId: " + userId + ", role: " + role);
        
        List<Class> classes;
        if (role != null && role.equals("Teacher")) {
            System.out.println("🔵 [Service] Finding classes for teacher ID: " + userId);
            if (userId == null) {
                System.err.println("❌ [Service] userId is null for Teacher role!");
                return List.of();
            }
            classes = classRepository.findByGiaoVienId(userId);
            System.out.println("🔵 [Service] Found " + classes.size() + " classes for teacher");
        } else if (role != null && role.equals("Student")) {
            System.out.println("🔵 [Service] Finding classes for student ID: " + userId);
            if (userId == null) {
                System.err.println("❌ [Service] userId is null for Student role!");
                return List.of();
            }
            classes = classRepository.findByStudentId(userId);
            System.out.println("🔵 [Service] Found " + classes.size() + " classes for student");
        } else {
            System.out.println("🔵 [Service] Finding all classes");
            classes = classRepository.findAll();
            System.out.println("🔵 [Service] Found " + classes.size() + " total classes");
        }
        
        // Force load để tránh lazy loading issues khi serialize JSON
        // Không cần load lazy collections vì đã được @JsonIgnore
        classes.forEach(c -> {
            if (c.getGiaoVien() != null) {
                // Đảm bảo giaoVien được load (đã là EAGER nhưng để chắc chắn)
                c.getGiaoVien().getName();
                c.getGiaoVien().getEmail();
            }
            // Log để debug
            System.out.println("🔵 [Service] Class: " + c.getTenLop() + " (ID: " + c.getClassID() + "), MaThamGia: " + 
                c.getMaThamGia() + ", Teacher: " + (c.getGiaoVien() != null ? c.getGiaoVien().getName() : "null"));
        });
        
        return classes;
    }
    
    public Optional<Class> getClassById(Integer id) {
        return classRepository.findById(id);
    }
    
    @Transactional
    public Class createClass(Class classEntity) {
        System.out.println("🔵 [Service] createClass called with: " + classEntity.getTenLop());
        
        // Kiểm tra mã tham gia đã tồn tại chưa
        if (classEntity.getMaThamGia() != null && !classEntity.getMaThamGia().isEmpty()) {
            Optional<Class> existing = classRepository.findByMaThamGia(classEntity.getMaThamGia());
            if (existing.isPresent()) {
                System.err.println("❌ [Service] MaThamGia already exists: " + classEntity.getMaThamGia());
                throw new RuntimeException("Mã tham gia '" + classEntity.getMaThamGia() + "' đã được sử dụng! Vui lòng chọn mã khác.");
            }
        } else {
            // Tạo mã tham gia nếu chưa có
            String generatedCode;
            int attempts = 0;
            do {
                generatedCode = UUID.randomUUID().toString().substring(0, 8).toUpperCase();
                attempts++;
                if (attempts > 10) {
                    throw new RuntimeException("Không thể tạo mã tham gia duy nhất!");
                }
            } while (classRepository.findByMaThamGia(generatedCode).isPresent());
            
            classEntity.setMaThamGia(generatedCode);
            System.out.println("🔵 [Service] Generated maThamGia: " + generatedCode);
        }
        
        // Đảm bảo User entity được load đúng
        if (classEntity.getGiaoVien() == null || classEntity.getGiaoVien().getId() == null) {
            System.err.println("❌ [Service] No teacher ID provided!");
            throw new RuntimeException("Thiếu thông tin giáo viên!");
        }
        
        Integer teacherId = classEntity.getGiaoVien().getId();
        System.out.println("🔵 [Service] Looking for teacher with ID: " + teacherId);
        
        // Kiểm tra user có tồn tại không
        if (!userRepository.existsById(teacherId)) {
            System.err.println("❌ [Service] Teacher not found with ID: " + teacherId);
            throw new RuntimeException("Không tìm thấy giáo viên với ID: " + teacherId + ". Vui lòng kiểm tra lại thông tin đăng nhập!");
        }
        
        User teacher = userRepository.findById(teacherId)
                .orElseThrow(() -> {
                    System.err.println("❌ [Service] Teacher not found with ID: " + teacherId);
                    return new RuntimeException("Không tìm thấy giáo viên với ID: " + teacherId);
                });
        
        // Kiểm tra role
        if (teacher.getRole() != User.Role.Teacher && teacher.getRole() != User.Role.Admin) {
            System.err.println("❌ [Service] User is not a teacher! Role: " + teacher.getRole());
            throw new RuntimeException("Người dùng này không phải là giáo viên!");
        }
        
        System.out.println("🔵 [Service] Found teacher: " + teacher.getName() + " (" + teacher.getEmail() + "), Role: " + teacher.getRole());
        classEntity.setGiaoVien(teacher);
        
        System.out.println("🔵 [Service] Saving class to database...");
        Class saved = classRepository.save(classEntity);
        // Flush để đảm bảo ID được generate
        classRepository.flush();
        System.out.println("🔵 [Service] Class saved with ID: " + saved.getClassID());
        
        return saved;
    }
    
    @Transactional
    public Class updateClass(Integer id, Class classDetails) {
        Class classEntity = classRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy lớp học!"));
        
        if (classDetails.getTenLop() != null) {
            classEntity.setTenLop(classDetails.getTenLop());
        }
        if (classDetails.getMoTa() != null) {
            classEntity.setMoTa(classDetails.getMoTa());
        }
        if (classDetails.getMaThamGia() != null) {
            classEntity.setMaThamGia(classDetails.getMaThamGia());
        }
        if (classDetails.getGiaoVien() != null) {
            classEntity.setGiaoVien(classDetails.getGiaoVien());
        }
        
        return classRepository.save(classEntity);
    }
    
    @Transactional
    public void deleteClass(Integer id) {
        Class classEntity = classRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy lớp học!"));
        
        try {
            // Xóa các bản ghi liên quan trước
            // 1. Xóa posts
            List<com.hust.classroom.entity.Post> posts = postRepository.findByClassId(id);
            if (!posts.isEmpty()) {
                postRepository.deleteAll(posts);
                System.out.println("✅ Đã xóa " + posts.size() + " bài đăng liên quan");
            }
            
            // 2. Xóa assignments
            List<com.hust.classroom.entity.Assignment> assignments = assignmentRepository.findByClassId(id);
            if (!assignments.isEmpty()) {
                assignmentRepository.deleteAll(assignments);
                System.out.println("✅ Đã xóa " + assignments.size() + " bài tập/tài liệu liên quan");
            }
            
            // 3. Xóa submissions (cascade sẽ xử lý nhưng để chắc chắn)
            List<com.hust.classroom.entity.Submission> submissions = submissionRepository.findByClassId(id);
            if (!submissions.isEmpty()) {
                submissionRepository.deleteAll(submissions);
                System.out.println("✅ Đã xóa " + submissions.size() + " bài nộp liên quan");
            }
            
            // 4. Xóa class enrollments (cascade sẽ xử lý nhưng để chắc chắn)
            List<ClassStudent> enrollments = classStudentRepository.findByClassId(id);
            if (!enrollments.isEmpty()) {
                classStudentRepository.deleteAll(enrollments);
                System.out.println("✅ Đã xóa " + enrollments.size() + " đăng ký lớp học liên quan");
            }
            
            // 5. Cuối cùng mới xóa class
            classRepository.deleteById(id);
            System.out.println("✅ Đã xóa lớp học ID: " + id);
        } catch (Exception e) {
            System.err.println("❌ Lỗi khi xóa lớp học: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Không thể xóa lớp học: " + e.getMessage());
        }
    }
    
    @Transactional
    public ClassStudent enrollStudent(Integer studentId, String maThamGia) {
        // Tìm lớp theo mã tham gia
        Optional<Class> classOpt = classRepository.findByMaThamGia(maThamGia);
        if (classOpt.isEmpty()) {
            throw new RuntimeException("Mã tham gia không hợp lệ!");
        }
        
        Class classEntity = classOpt.get();
        
        // Kiểm tra đã tham gia chưa
        if (classStudentRepository.existsByClassIDAndStudentID(classEntity.getClassID(), studentId)) {
            throw new RuntimeException("Sinh viên đã tham gia lớp này!");
        }
        
        // Tạo ClassStudent
        ClassStudent classStudent = new ClassStudent();
        classStudent.setLopHoc(classEntity);
        classStudent.setStudent(userRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy sinh viên!")));
        classStudent.setEnrolledAt(Timestamp.valueOf(LocalDateTime.now()));
        
        return classStudentRepository.save(classStudent);
    }
    
    public List<User> getStudentsByClassId(Integer classId) {
        System.out.println("🔵 [Service] Getting students for class ID: " + classId);
        List<ClassStudent> classStudents = classStudentRepository.findByClassId(classId);
        System.out.println("🔵 [Service] Found " + classStudents.size() + " class students");
        
        List<User> students = classStudents.stream()
                .map(cs -> {
                    User student = cs.getStudent();
                    // Force load để đảm bảo dữ liệu được load đầy đủ
                    if (student != null) {
                        student.getName();
                        student.getEmail();
                        student.getMssv();
                    }
                    return student;
                })
                .filter(s -> s != null)
                .toList();
        
        System.out.println("🔵 [Service] Returning " + students.size() + " students");
        return students;
    }
    
    @Transactional
    public ClassStudent addStudentToClass(Integer classId, String email, String mssv) {
        System.out.println("🔵 [Service] addStudentToClass - classId: " + classId + ", email: " + email + ", mssv: " + mssv);
        
        Optional<Class> classOpt = classRepository.findById(classId);
        if (classOpt.isEmpty()) {
            System.err.println("❌ [Service] Class not found with ID: " + classId);
            throw new RuntimeException("Không tìm thấy lớp học!");
        }
        
        Class classEntity = classOpt.get();
        Optional<User> studentOpt;
        
        if (email != null && !email.isEmpty()) {
            System.out.println("🔵 [Service] Looking for student by email: " + email);
            studentOpt = userRepository.findByEmail(email);
        } else if (mssv != null && !mssv.isEmpty()) {
            System.out.println("🔵 [Service] Looking for student by MSSV: " + mssv);
            studentOpt = userRepository.findByMssv(mssv);
        } else {
            System.err.println("❌ [Service] Both email and MSSV are empty!");
            throw new RuntimeException("Vui lòng cung cấp email hoặc MSSV!");
        }
        
        if (studentOpt.isEmpty()) {
            System.err.println("❌ [Service] Student not found!");
            throw new RuntimeException("Không tìm thấy sinh viên với " + (email != null ? "email: " + email : "MSSV: " + mssv) + "!");
        }
        
        User student = studentOpt.get();
        System.out.println("🔵 [Service] Found student: " + student.getName() + " (ID: " + student.getId() + ")");
        
        // Kiểm tra đã tham gia chưa
        if (classStudentRepository.existsByClassIDAndStudentID(classId, student.getId())) {
            System.err.println("❌ [Service] Student already enrolled!");
            throw new RuntimeException("Sinh viên đã tham gia lớp này!");
        }
        
        // Tạo ClassStudent
        ClassStudent classStudent = new ClassStudent();
        classStudent.setLopHoc(classEntity);
        classStudent.setStudent(student);
        classStudent.setEnrolledAt(Timestamp.valueOf(LocalDateTime.now()));
        
        System.out.println("🔵 [Service] Saving ClassStudent...");
        ClassStudent saved = classStudentRepository.save(classStudent);
        classStudentRepository.flush();
        System.out.println("🔵 [Service] ClassStudent saved with ID: " + saved.getId());
        
        return saved;
    }
}

