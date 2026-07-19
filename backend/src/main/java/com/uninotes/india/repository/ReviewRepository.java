package com.uninotes.india.repository;

import com.uninotes.india.entity.Review;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReviewRepository extends MongoRepository<Review, Long> {
    List<Review> findByNoteId(Long noteId);
    void deleteByNoteId(Long noteId);
    void deleteByUserId(Long userId);
}
