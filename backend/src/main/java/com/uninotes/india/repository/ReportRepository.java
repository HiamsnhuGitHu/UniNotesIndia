package com.uninotes.india.repository;

import com.uninotes.india.entity.Report;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReportRepository extends MongoRepository<Report, Long> {
    void deleteByNoteId(Long noteId);
    void deleteByUserId(Long userId);
    List<Report> findByNoteId(Long noteId);
}
