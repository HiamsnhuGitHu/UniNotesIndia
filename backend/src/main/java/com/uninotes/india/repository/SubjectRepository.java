package com.uninotes.india.repository;

import com.uninotes.india.entity.Subject;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SubjectRepository extends MongoRepository<Subject, Long> {
    List<Subject> findByBranchId(Long branchId);
    List<Subject> findByBranchIdAndSemester(Long branchId, Integer semester);
}
