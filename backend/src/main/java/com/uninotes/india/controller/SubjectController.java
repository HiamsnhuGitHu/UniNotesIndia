package com.uninotes.india.controller;

import com.uninotes.india.entity.Subject;
import com.uninotes.india.repository.SubjectRepository;
import com.uninotes.india.service.NoteService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
public class SubjectController {

    @Autowired
    private SubjectRepository subjectRepository;

    @Autowired
    private NoteService noteService;

    @GetMapping("/api/subjects")
    public List<Subject> getAll() {
        return subjectRepository.findAll();
    }

    @GetMapping("/api/subjects/{id}")
    public ResponseEntity<Subject> getById(@PathVariable Long id) {
        return subjectRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/api/subjects/branch/{branchId}")
    public List<Subject> getByBranch(@PathVariable Long branchId) {
        return subjectRepository.findByBranchId(branchId);
    }

    @GetMapping("/api/subjects/branch/{branchId}/semester/{semester}")
    public List<Subject> getByBranchAndSemester(@PathVariable Long branchId, @PathVariable Integer semester) {
        return subjectRepository.findByBranchIdAndSemester(branchId, semester);
    }

    // Creating subjects (available for Student and above)
    @PostMapping("/api/subjects")
    public Subject createPublic(@RequestBody Subject subject) {
        return subjectRepository.save(subject);
    }

    // Admin CRUD mappings
    @PostMapping("/api/admin/subjects")
    public Subject createAdmin(@RequestBody Subject subject) {
        return subjectRepository.save(subject);
    }

    @PutMapping("/api/admin/subjects/{id}")
    public ResponseEntity<Subject> updateAdmin(@PathVariable Long id, @RequestBody Subject subjectDetails) {
        return subjectRepository.findById(id).map(subject -> {
            subject.setName(subjectDetails.getName());
            subject.setBranch(subjectDetails.getBranch());
            subject.setSemester(subjectDetails.getSemester());
            return ResponseEntity.ok(subjectRepository.save(subject));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/api/admin/subjects/{id}")
    public ResponseEntity<?> deleteAdmin(@PathVariable Long id) {
        noteService.deleteNotesBySubjectAndCascade(id);
        subjectRepository.deleteById(id);
        Map<String, String> response = new HashMap<>();
        response.put("message", "Subject and associated notes wiped successfully.");
        return ResponseEntity.ok(response);
    }
}
