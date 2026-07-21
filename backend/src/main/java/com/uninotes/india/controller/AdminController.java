package com.uninotes.india.controller;

import com.uninotes.india.dto.AdminStatsDto;
import com.uninotes.india.entity.*;
import com.uninotes.india.repository.*;
import com.uninotes.india.service.NoteService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
public class AdminController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UniversityRepository universityRepository;

    @Autowired
    private NoteRepository noteRepository;

    @Autowired
    private NoteService noteService;

    @Autowired
    private DownloadHistoryRepository downloadHistoryRepository;

    @Autowired
    private ReportRepository reportRepository;

    @Autowired
    private BookmarkRepository bookmarkRepository;

    @Autowired
    private ReviewRepository reviewRepository;

    @Autowired
    private PasswordResetTokenRepository passwordResetTokenRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private BranchRepository branchRepository;

    @Autowired
    private SubjectRepository subjectRepository;

    @Autowired
    private DeleteRequestRepository deleteRequestRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    // Statistics
    @GetMapping("/api/admin/stats")
    public ResponseEntity<AdminStatsDto> getStats() {
        long totalUsers = userRepository.count();
        long totalUniversities = universityRepository.count();
        long totalNotes = noteRepository.count();
        // sum downloads
        long totalDownloads = noteRepository.findAll().stream()
                .mapToLong(Note::getDownloadCount).sum();

        return ResponseEntity.ok(new AdminStatsDto(totalUsers, totalUniversities, totalNotes, totalDownloads));
    }

    // User management CRUD
    @GetMapping("/api/admin/users")
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    @PostMapping("/api/admin/users")
    public ResponseEntity<?> createOrUpdateUser(@RequestBody User userDetails) {
        if (userDetails.getId() == null) {
            // New user via admin
            if (userRepository.findByUsername(userDetails.getUsername()).isPresent()) {
                throw new RuntimeException("Username already exists");
            }
            if (userRepository.findByEmail(userDetails.getEmail()).isPresent()) {
                throw new RuntimeException("Email already exists");
            }
            userDetails.setPassword(passwordEncoder.encode(userDetails.getPassword()));
            userDetails.setEnabled(true);
            userDetails.setCreatedAt(LocalDateTime.now());
            return ResponseEntity.ok(userRepository.save(userDetails));
        } else {
            // Update all student details
            return userRepository.findById(userDetails.getId()).map(user -> {
                if (!user.getUsername().equals(userDetails.getUsername())) {
                    if (userRepository.findByUsername(userDetails.getUsername()).isPresent()) {
                        throw new RuntimeException("Username already taken");
                    }
                    user.setUsername(userDetails.getUsername());
                }
                
                if (!user.getEmail().equalsIgnoreCase(userDetails.getEmail())) {
                    if (userRepository.findByEmail(userDetails.getEmail()).isPresent()) {
                        throw new RuntimeException("Email already taken");
                    }
                    user.setEmail(userDetails.getEmail());
                }

                user.setFullName(userDetails.getFullName());
                user.setMobileNumber(userDetails.getMobileNumber());
                user.setCity(userDetails.getCity());
                user.setCollegeName(userDetails.getCollegeName());
                user.setRole(userDetails.getRole());

                // Reset password if provided
                if (userDetails.getPassword() != null && !userDetails.getPassword().trim().isEmpty()) {
                    user.setPassword(passwordEncoder.encode(userDetails.getPassword()));
                }

                return ResponseEntity.ok(userRepository.save(user));
            }).orElseThrow(() -> new RuntimeException("User not found"));
        }
    }

    @PutMapping("/api/admin/users/{id}/toggle-status")
    public ResponseEntity<?> toggleUserStatus(@PathVariable Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setEnabled(!user.isEnabled());

        // Suspending user removes their physical files and uploaded notes
        if (!user.isEnabled()) {
            noteService.deleteNotesByUserAndCascade(user.getId());
        }

        userRepository.save(user);
        return ResponseEntity.ok(user);
    }

    @DeleteMapping("/api/admin/users/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        // Deleting user removes their physical files and uploaded notes
        noteService.deleteNotesByUserAndCascade(id);

        // Delete cascade user refs
        bookmarkRepository.deleteByUserId(id);
        downloadHistoryRepository.deleteByUserId(id);
        reportRepository.deleteByUserId(id);
        reviewRepository.deleteByUserId(id);
        passwordResetTokenRepository.deleteByUserId(id);

        userRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "User and all their uploads deleted successfully."));
    }

    // Pending note approvals workflow
    @GetMapping("/api/admin/notes/pending")
    public List<Note> getPendingNotes() {
        return noteRepository.findByStatus("PENDING");
    }

    @PutMapping("/api/admin/notes/{id}/approve")
    public ResponseEntity<?> approveNote(@PathVariable Long id) {
        Note note = noteService.getNoteOrThrow(id);
        note.setStatus("APPROVED");
        noteRepository.save(note);
        return ResponseEntity.ok(note);
    }

    @PutMapping("/api/admin/notes/{id}/reject")
    public ResponseEntity<?> rejectNote(@PathVariable Long id) {
        // Rejecting deletes note files from storage and document from DB
        noteService.deleteNoteAndCascade(id);
        return ResponseEntity.ok(Map.of("message", "Note rejected and file deleted."));
    }

    @DeleteMapping("/api/admin/notes/{id}")
    public ResponseEntity<?> deleteNoteAdmin(@PathVariable Long id) {
        noteService.deleteNoteAndCascade(id);
        return ResponseEntity.ok(Map.of("message", "Note deleted successfully."));
    }

    // Reports / Flagged listings
    @GetMapping("/api/admin/reports")
    public List<Report> getAllReports() {
        return reportRepository.findAll();
    }

    @DeleteMapping("/api/admin/reports/{id}")
    public ResponseEntity<?> dismissReport(@PathVariable Long id) {
        reportRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Report dismissed successfully."));
    }

    // Dispatch system notifications
    @PostMapping("/api/admin/notifications")
    public Notification dispatchNotification(@RequestBody Map<String, String> payload) {
        Notification notification = new Notification();
        notification.setTitle(payload.get("title"));
        notification.setMessage(payload.get("message"));
        notification.setCreatedAt(LocalDateTime.now());
        return notificationRepository.save(notification);
    }

    // Public list notifications
    @GetMapping("/api/notifications")
    public List<Notification> getNotifications() {
        return notificationRepository.findAll();
    }

    // Delete platform notifications (Restricted to ROLE_ADMIN only)
    @DeleteMapping("/api/admin/notifications/{id}")
    public ResponseEntity<?> deleteNotification(@PathVariable Long id) {
        User user = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (user.getRole() != UserRole.ROLE_ADMIN) {
            return ResponseEntity.status(403).body(Map.of("error", "Only administrator accounts can delete system notifications."));
        }
        notificationRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Platform announcement deleted successfully."));
    }

    // Sub Admin deletion requests mappings
    @PostMapping("/api/admin/delete-requests")
    public ResponseEntity<?> submitDeleteRequest(@RequestBody DeleteRequest request) {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (!(principal instanceof User)) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }
        User user = (User) principal;
        request.setRequestedBy(user);
        request.setCreatedAt(LocalDateTime.now());
        request.setStatus("PENDING");
        return ResponseEntity.ok(deleteRequestRepository.save(request));
    }

    @GetMapping("/api/admin/delete-requests")
    public ResponseEntity<?> getDeleteRequests() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (!(principal instanceof User)) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }
        User user = (User) principal;
        if (user.getRole() != UserRole.ROLE_ADMIN) {
            return ResponseEntity.status(403).body(Map.of("error", "Only administrator accounts can review delete requests."));
        }
        return ResponseEntity.ok(deleteRequestRepository.findByStatus("PENDING"));
    }

    @PutMapping("/api/admin/delete-requests/{id}/reject")
    public ResponseEntity<?> rejectDeleteRequest(@PathVariable Long id) {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (!(principal instanceof User)) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }
        User user = (User) principal;
        if (user.getRole() != UserRole.ROLE_ADMIN) {
            return ResponseEntity.status(403).body(Map.of("error", "Only administrator accounts can reject delete requests."));
        }
        return deleteRequestRepository.findById(id).map(req -> {
            req.setStatus("REJECTED");
            deleteRequestRepository.save(req);
            return ResponseEntity.ok(Map.of("message", "Request rejected successfully."));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/api/admin/delete-requests/{id}/approve")
    public ResponseEntity<?> approveDeleteRequest(@PathVariable Long id) {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (!(principal instanceof User)) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }
        User user = (User) principal;
        if (user.getRole() != UserRole.ROLE_ADMIN) {
            return ResponseEntity.status(403).body(Map.of("error", "Only administrator accounts can approve delete requests."));
        }

        return deleteRequestRepository.findById(id).map(req -> {
            Long targetId = req.getTargetId();
            String type = req.getRequestType();

            try {
                if ("UNIVERSITY".equalsIgnoreCase(type)) {
                    noteService.deleteNotesByUniversityAndCascade(targetId);
                    universityRepository.deleteById(targetId);
                } else if ("BRANCH".equalsIgnoreCase(type)) {
                    noteService.deleteNotesByBranchAndCascade(targetId);
                    branchRepository.deleteById(targetId);
                } else if ("SUBJECT".equalsIgnoreCase(type)) {
                    noteService.deleteNotesBySubjectAndCascade(targetId);
                    subjectRepository.deleteById(targetId);
                } else if ("NOTE".equalsIgnoreCase(type)) {
                    noteService.deleteNoteAndCascade(targetId);
                }

                req.setStatus("APPROVED");
                deleteRequestRepository.save(req);
                return ResponseEntity.ok(Map.of("message", "Deletion request approved and executed successfully."));
            } catch (Exception e) {
                return ResponseEntity.internalServerError().body(Map.of("error", "Failed to execute cascading delete: " + e.getMessage()));
            }
        }).orElse(ResponseEntity.notFound().build());
    }
}
