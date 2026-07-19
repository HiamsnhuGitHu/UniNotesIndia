package com.uninotes.india.repository;

import com.uninotes.india.entity.Bookmark;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BookmarkRepository extends MongoRepository<Bookmark, Long> {
    List<Bookmark> findByUserId(Long userId);
    Optional<Bookmark> findByUserIdAndNoteId(Long userId, Long noteId);
    void deleteByNoteId(Long noteId);
    void deleteByUserId(Long userId);
}
