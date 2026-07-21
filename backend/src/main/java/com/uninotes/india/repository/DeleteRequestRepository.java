package com.uninotes.india.repository;

import com.uninotes.india.entity.DeleteRequest;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DeleteRequestRepository extends MongoRepository<DeleteRequest, Long> {
    List<DeleteRequest> findByStatus(String status);
    void deleteByRequestedById(Long requestedById);
    void deleteByTargetIdAndRequestType(Long targetId, String requestType);
}
