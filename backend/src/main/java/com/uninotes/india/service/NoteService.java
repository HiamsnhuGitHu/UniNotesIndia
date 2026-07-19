package com.uninotes.india.service;

import com.uninotes.india.entity.*;
import com.uninotes.india.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class NoteService {

    @Autowired
    private NoteRepository noteRepository;

    @Autowired
    private BookmarkRepository bookmarkRepository;

    @Autowired
    private DownloadHistoryRepository downloadHistoryRepository;

    @Autowired
    private ReviewRepository reviewRepository;

    @Autowired
    private ReportRepository reportRepository;

    @Autowired
    private FileStorageService fileStorageService;

    @Autowired
    private MongoTemplate mongoTemplate;

    public List<Note> searchNotes(Long universityId, Long branchId, Integer semester, Long subjectId, String query) {
        Query mongoQuery = new Query();
        mongoQuery.addCriteria(Criteria.where("status").is("APPROVED"));

        if (universityId != null) {
            mongoQuery.addCriteria(Criteria.where("university.$id").is(universityId));
        }
        if (branchId != null) {
            mongoQuery.addCriteria(Criteria.where("branch.$id").is(branchId));
        }
        if (semester != null) {
            mongoQuery.addCriteria(Criteria.where("semester").is(semester));
        }
        if (subjectId != null) {
            mongoQuery.addCriteria(Criteria.where("subject.$id").is(subjectId));
        }

        if (query != null && !query.trim().isEmpty()) {
            String regexPattern = ".*" + query.trim() + ".*";
            Criteria textCriteria = new Criteria().orOperator(
                    Criteria.where("title").regex(regexPattern, "i"),
                    Criteria.where("description").regex(regexPattern, "i")
            );

            Query branchQuery = new Query(Criteria.where("name").regex(regexPattern, "i"));
            List<Long> branchIds = mongoTemplate.find(branchQuery, Branch.class)
                    .stream().map(Branch::getId).toList();

            Query subjectQuery = new Query(Criteria.where("name").regex(regexPattern, "i"));
            List<Long> subjectIds = mongoTemplate.find(subjectQuery, Subject.class)
                    .stream().map(Subject::getId).toList();

            if (!branchIds.isEmpty() || !subjectIds.isEmpty()) {
                Criteria dbrefCriteria = new Criteria().orOperator(
                        Criteria.where("branch.$id").in(branchIds),
                        Criteria.where("subject.$id").in(subjectIds)
                );
                mongoQuery.addCriteria(new Criteria().orOperator(textCriteria, dbrefCriteria));
            } else {
                mongoQuery.addCriteria(textCriteria);
            }
        }

        return mongoTemplate.find(mongoQuery, Note.class);
    }

    public Note uploadNote(Note note, MultipartFile file, User user) {
        String storedFileName = fileStorageService.storeFile(file);
        
        note.setUploadedBy(user);
        note.setFilePath(storedFileName);
        note.setFileName(file.getOriginalFilename());
        note.setFileType(file.getContentType());
        note.setUploadDate(LocalDateTime.now());
        note.setDownloadCount(0);

        if (user.getRole() == UserRole.ROLE_ADMIN || user.getRole() == UserRole.ROLE_SUBADMIN) {
            note.setStatus("APPROVED");
        } else {
            note.setStatus("PENDING");
        }

        return noteRepository.save(note);
    }

    public Note getNoteOrThrow(Long id) {
        return noteRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Note not found with id: " + id));
    }

    public void incrementDownload(Long noteId, User user) {
        Note note = getNoteOrThrow(noteId);
        note.setDownloadCount(note.getDownloadCount() + 1);
        noteRepository.save(note);

        DownloadHistory history = new DownloadHistory();
        history.setUser(user);
        history.setNote(note);
        history.setDownloadedAt(LocalDateTime.now());
        downloadHistoryRepository.save(history);
    }

    public void deleteNoteAndCascade(Long noteId) {
        Optional<Note> noteOpt = noteRepository.findById(noteId);
        if (noteOpt.isPresent()) {
            Note note = noteOpt.get();
            // Delete physical file
            fileStorageService.deleteFile(note.getFilePath());

            // Delete cascading data
            bookmarkRepository.deleteByNoteId(noteId);
            downloadHistoryRepository.deleteByNoteId(noteId);
            reviewRepository.deleteByNoteId(noteId);
            reportRepository.deleteByNoteId(noteId);

            // Delete the document itself
            noteRepository.deleteById(noteId);
        }
    }

    public void deleteNotesByUserAndCascade(Long userId) {
        List<Note> userNotes = noteRepository.findByUploadedById(userId);
        for (Note note : userNotes) {
            deleteNoteAndCascade(note.getId());
        }
    }

    public void deleteNotesByUniversityAndCascade(Long universityId) {
        List<Note> notes = noteRepository.findByUniversityId(universityId);
        for (Note note : notes) {
            deleteNoteAndCascade(note.getId());
        }
    }

    public void deleteNotesByBranchAndCascade(Long branchId) {
        List<Note> notes = noteRepository.findByBranchId(branchId);
        for (Note note : notes) {
            deleteNoteAndCascade(note.getId());
        }
    }

    public void deleteNotesBySubjectAndCascade(Long subjectId) {
        List<Note> notes = noteRepository.findBySubjectId(subjectId);
        for (Note note : notes) {
            deleteNoteAndCascade(note.getId());
        }
    }
}
