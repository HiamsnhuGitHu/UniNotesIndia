package com.uninotes.india.repository;

import com.uninotes.india.entity.Branch;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BranchRepository extends MongoRepository<Branch, Long> {
}
