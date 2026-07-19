package com.uninotes.india.controller;

import com.uninotes.india.entity.*;
import com.uninotes.india.repository.*;
import com.uninotes.india.service.FileStorageService;
import com.uninotes.india.service.NoteService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.net.MalformedURLException;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
public class NoteController {

    @Autowired
    private NoteService noteService;

    @Autowired
    private NoteRepository noteRepository;

    @Autowired
    private UniversityRepository universityRepository;

    @Autowired
    private BranchRepository branchRepository;

    @Autowired
    private SubjectRepository subjectRepository;

    @Autowired
    private BookmarkRepository bookmarkRepository;

    @Autowired
    private ReviewRepository reviewRepository;

    @Autowired
    private ReportRepository reportRepository;

    @Autowired
    private FileStorageService fileStorageService;

    @GetMapping("/api/notes/search")
    public List<Note> searchNotes(
            @RequestParam(required = false) Long universityId,
            @RequestParam(required = false) Long branchId,
            @RequestParam(required = false) Integer semester,
            @RequestParam(required = false) Long subjectId,
            @RequestParam(required = false) String query
    ) {
        return noteService.searchNotes(universityId, branchId, semester, subjectId, query);
    }

    @PostMapping(value = "/api/notes/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> uploadNote(
            @RequestParam("file") MultipartFile file,
            @RequestParam("title") String title,
            @RequestParam("description") String description,
            @RequestParam("universityId") Long universityId,
            @RequestParam("branchId") Long branchId,
            @RequestParam("semester") Integer semester,
            @RequestParam("subjectId") Long subjectId,
            @RequestParam("noteType") String noteType
    ) {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (!(principal instanceof User)) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }
        User user = (User) principal;

        Note note = new Note();
        note.setTitle(title);
        note.setDescription(description);
        note.setSemester(semester);
        note.setNoteType(noteType);

        note.setUniversity(universityRepository.findById(universityId)
                .orElseThrow(() -> new RuntimeException("University not found")));
        note.setBranch(branchRepository.findById(branchId)
                .orElseThrow(() -> new RuntimeException("Branch not found")));
        note.setSubject(subjectRepository.findById(subjectId)
                .orElseThrow(() -> new RuntimeException("Subject not found")));

        Note savedNote = noteService.uploadNote(note, file, user);
        return ResponseEntity.ok(savedNote);
    }

    @GetMapping("/api/notes/download/{id}")
    public ResponseEntity<Resource> downloadNote(@PathVariable Long id) {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        User user = (principal instanceof User) ? (User) principal : null;

        Note note = noteService.getNoteOrThrow(id);
        if (user != null) {
            noteService.incrementDownload(id, user);
        } else {
            // increment count even if anonymous
            note.setDownloadCount(note.getDownloadCount() + 1);
            noteRepository.save(note);
        }

        Path filePath = fileStorageService.getFileLocation(note.getFilePath());
        Resource resource;
        try {
            resource = new UrlResource(filePath.toUri());
        } catch (MalformedURLException ex) {
            throw new RuntimeException("File path invalid", ex);
        }

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("application/octet-stream"))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + note.getFileName() + "\"")
                .body(resource);
    }

    @GetMapping("/api/notes/preview/{id}")
    public ResponseEntity<Resource> previewNote(@PathVariable Long id) {
        Note note = noteService.getNoteOrThrow(id);
        Path filePath = fileStorageService.getFileLocation(note.getFilePath());
        Resource resource;
        try {
            resource = new UrlResource(filePath.toUri());
        } catch (MalformedURLException ex) {
            throw new RuntimeException("File path invalid", ex);
        }

        String contentType = note.getFileType();
        if (contentType == null) {
            contentType = "application/octet-stream";
        }

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + note.getFileName() + "\"")
                .body(resource);
    }

    // Bookmark endpoints
    @PostMapping("/api/notes/{id}/bookmark")
    public ResponseEntity<?> addBookmark(@PathVariable Long id) {
        User user = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        Note note = noteService.getNoteOrThrow(id);

        Optional<Bookmark> existing = bookmarkRepository.findByUserIdAndNoteId(user.getId(), id);
        if (existing.isPresent()) {
            return ResponseEntity.ok(Map.of("message", "Already bookmarked"));
        }

        Bookmark bookmark = new Bookmark();
        bookmark.setUser(user);
        bookmark.setNote(note);
        bookmark.setCreatedAt(LocalDateTime.now());
        bookmarkRepository.save(bookmark);

        return ResponseEntity.ok(Map.of("message", "Bookmarked successfully"));
    }

    @DeleteMapping("/api/notes/{id}/bookmark")
    public ResponseEntity<?> removeBookmark(@PathVariable Long id) {
        User user = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        Optional<Bookmark> bookmark = bookmarkRepository.findByUserIdAndNoteId(user.getId(), id);
        bookmark.ifPresent(bookmarkRepository::delete);
        return ResponseEntity.ok(Map.of("message", "Bookmark removed"));
    }

    @GetMapping("/api/notes/bookmarks")
    public List<Bookmark> getBookmarks() {
        User user = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return bookmarkRepository.findByUserId(user.getId());
    }

    // Review endpoints
    @PostMapping("/api/notes/{id}/reviews")
    public ResponseEntity<?> addReview(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        User user = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        Note note = noteService.getNoteOrThrow(id);

        Integer rating = (Integer) payload.get("rating");
        String reviewText = (String) payload.get("reviewText");

        if (rating == null || rating < 1 || rating > 5) {
            throw new RuntimeException("Rating must be an integer between 1 and 5");
        }

        Review review = new Review();
        review.setNote(note);
        review.setUser(user);
        review.setRating(rating);
        review.setReviewText(reviewText);
        review.setCreatedAt(LocalDateTime.now());
        Review saved = reviewRepository.save(review);

        return ResponseEntity.ok(saved);
    }

    @GetMapping("/api/notes/{id}/reviews")
    public List<Review> getReviewsForNote(@PathVariable Long id) {
        return reviewRepository.findByNoteId(id);
    }

    // Report/Flag endpoints
    @PostMapping("/api/notes/{id}/reports")
    public ResponseEntity<?> reportNote(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        User user = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        Note note = noteService.getNoteOrThrow(id);

        String reason = payload.get("reason");
        if (reason == null || reason.trim().isEmpty()) {
            throw new RuntimeException("Reason is required");
        }

        Report report = new Report();
        report.setNote(note);
        report.setUser(user);
        report.setReason(reason);
        report.setCreatedAt(LocalDateTime.now());
        Report saved = reportRepository.save(report);

        return ResponseEntity.ok(saved);
    }
}
