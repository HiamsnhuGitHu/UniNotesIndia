package com.uninotes.india.controller;

import com.uninotes.india.entity.Branch;
import com.uninotes.india.repository.BranchRepository;
import com.uninotes.india.service.NoteService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
public class BranchController {

    @Autowired
    private BranchRepository branchRepository;

    @Autowired
    private NoteService noteService;

    @GetMapping("/api/branches")
    public List<Branch> getAll() {
        return branchRepository.findAll();
    }

    @GetMapping("/api/branches/{id}")
    public ResponseEntity<Branch> getById(@PathVariable Long id) {
        return branchRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/api/admin/branches")
    public Branch create(@RequestBody Branch branch) {
        return branchRepository.save(branch);
    }

    @PutMapping("/api/admin/branches/{id}")
    public ResponseEntity<Branch> update(@PathVariable Long id, @RequestBody Branch branchDetails) {
        return branchRepository.findById(id).map(branch -> {
            branch.setName(branchDetails.getName());
            return ResponseEntity.ok(branchRepository.save(branch));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/api/admin/branches/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        noteService.deleteNotesByBranchAndCascade(id);
        branchRepository.deleteById(id);
        Map<String, String> response = new HashMap<>();
        response.put("message", "Branch and associated notes wiped successfully.");
        return ResponseEntity.ok(response);
    }
}
