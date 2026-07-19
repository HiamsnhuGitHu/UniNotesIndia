package com.uninotes.india.repository;

import com.uninotes.india.entity.DownloadHistory;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DownloadHistoryRepository extends MongoRepository<DownloadHistory, Long> {
    List<DownloadHistory> findByUserId(Long userId);
    void deleteByNoteId(Long noteId);
    void deleteByUserId(Long userId);
}
