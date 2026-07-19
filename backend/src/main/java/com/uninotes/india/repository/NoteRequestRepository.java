package com.uninotes.india.repository;

import com.uninotes.india.entity.NoteRequest;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NoteRequestRepository extends MongoRepository<NoteRequest, Long> {
    List<NoteRequest> findByStatus(String status);
    List<NoteRequest> findByRequestedById(Long userId);
}
