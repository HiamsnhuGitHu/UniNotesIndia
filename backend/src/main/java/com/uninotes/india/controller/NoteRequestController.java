package com.uninotes.india.controller;

import com.uninotes.india.entity.*;
import com.uninotes.india.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/requests")
public class NoteRequestController {

    @Autowired
    private NoteRequestRepository noteRequestRepository;

    @Autowired
    private UniversityRepository universityRepository;

    @Autowired
    private BranchRepository branchRepository;

    @Autowired
    private SubjectRepository subjectRepository;

    @GetMapping
    public List<NoteRequest> getActiveRequests() {
        return noteRequestRepository.findByStatus("PENDING");
    }

    @PostMapping
    public ResponseEntity<?> submitRequest(@RequestBody Map<String, Object> payload) {
        User user = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();

        String title = (String) payload.get("title");
        String description = (String) payload.get("description");
        Long universityId = Long.valueOf(payload.get("universityId").toString());
        Long branchId = Long.valueOf(payload.get("branchId").toString());
        Integer semester = Integer.valueOf(payload.get("semester").toString());
        Long subjectId = Long.valueOf(payload.get("subjectId").toString());

        University uni = universityRepository.findById(universityId)
                .orElseThrow(() -> new RuntimeException("University not found"));
        Branch branch = branchRepository.findById(branchId)
                .orElseThrow(() -> new RuntimeException("Branch not found"));
        Subject subject = subjectRepository.findById(subjectId)
                .orElseThrow(() -> new RuntimeException("Subject not found"));

        NoteRequest req = new NoteRequest();
        req.setTitle(title);
        req.setDescription(description);
        req.setUniversity(uni);
        req.setBranch(branch);
        req.setSemester(semester);
        req.setSubject(subject);
        req.setRequestedBy(user);
        req.setStatus("PENDING");
        req.setCreatedAt(LocalDateTime.now());

        NoteRequest saved = noteRequestRepository.save(req);
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteRequest(@PathVariable Long id) {
        User user = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        NoteRequest req = noteRequestRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Request not found"));

        if (user.getRole() == UserRole.ROLE_ADMIN || 
            user.getRole() == UserRole.ROLE_SUBADMIN || 
            req.getRequestedBy().getId().equals(user.getId())) {
            
            noteRequestRepository.delete(req);
            return ResponseEntity.ok(Map.of("message", "Request deleted successfully"));
        } else {
            return ResponseEntity.status(403).body(Map.of("error", "You do not have permission to delete this request"));
        }
    }
}
