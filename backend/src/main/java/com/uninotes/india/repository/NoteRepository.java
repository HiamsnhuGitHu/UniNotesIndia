package com.uninotes.india.repository;

import com.uninotes.india.entity.Note;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NoteRepository extends MongoRepository<Note, Long> {
    List<Note> findByStatus(String status);
    List<Note> findByUploadedBy(com.uninotes.india.entity.User user);
    List<Note> findByUniversityId(Long universityId);
    List<Note> findByBranchId(Long branchId);
    List<Note> findBySubjectId(Long subjectId);
    List<Note> findByBranchIdAndSemesterAndSubjectId(Long branchId, Integer semester, Long subjectId);
}
