package com.uninotes.india.repository;

import com.uninotes.india.entity.UserHistoryLog;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserHistoryLogRepository extends MongoRepository<UserHistoryLog, Long> {
    List<UserHistoryLog> findByUserIdOrderByTimestampDesc(Long userId);
}
