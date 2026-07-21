package com.uninotes.india.controller;

import com.uninotes.india.entity.University;
import com.uninotes.india.repository.UniversityRepository;
import com.uninotes.india.service.NoteService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
public class UniversityController {

    @Autowired
    private UniversityRepository universityRepository;

    @Autowired
    private NoteService noteService;

    @GetMapping("/api/universities")
    @Cacheable(value = "universities")
    public List<University> getAll() {
        return universityRepository.findAll();
    }

    @GetMapping("/api/universities/{id}")
    @Cacheable(value = "universities", key = "#id")
    public ResponseEntity<University> getById(@PathVariable Long id) {
        return universityRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/api/admin/universities")
    @CacheEvict(value = "universities", allEntries = true)
    public University create(@RequestBody University university) {
        return universityRepository.save(university);
    }

    @PutMapping("/api/admin/universities/{id}")
    @CacheEvict(value = "universities", allEntries = true)
    public ResponseEntity<University> update(@PathVariable Long id, @RequestBody University universityDetails) {
        return universityRepository.findById(id).map(uni -> {
            uni.setName(universityDetails.getName());
            uni.setCity(universityDetails.getCity());
            return ResponseEntity.ok(universityRepository.save(uni));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/api/admin/universities/{id}")
    @CacheEvict(value = "universities", allEntries = true)
    public ResponseEntity<?> delete(@PathVariable Long id) {
        com.uninotes.india.entity.User currentUser = (com.uninotes.india.entity.User) org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (currentUser.getRole() != com.uninotes.india.entity.UserRole.ROLE_ADMIN) {
            return ResponseEntity.status(403).body(Map.of("error", "Access denied: Only administrators can delete universities directly."));
        }
        noteService.deleteNotesByUniversityAndCascade(id);
        universityRepository.deleteById(id);
        Map<String, String> response = new HashMap<>();
        response.put("message", "University and associated notes wiped successfully.");
        return ResponseEntity.ok(response);
    }
}
