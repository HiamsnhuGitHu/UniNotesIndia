package com.uninotes.india.service;

import com.uninotes.india.entity.User;
import com.uninotes.india.entity.UserHistoryLog;
import com.uninotes.india.repository.UserHistoryLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;

@Service
public class UserHistoryService {

    @Autowired
    private UserHistoryLogRepository logRepository;

    public void logChange(Long userId, String changedBy, String fieldName, Object oldValue, Object newValue) {
        String oldStr = oldValue == null ? "N/A" : String.valueOf(oldValue);
        String newStr = newValue == null ? "N/A" : String.valueOf(newValue);
        if (!Objects.equals(oldStr, newStr)) {
            UserHistoryLog log = new UserHistoryLog(userId, changedBy, LocalDateTime.now(), fieldName, oldStr, newStr);
            logRepository.save(log);
        }
    }

    public void logAllChanges(User oldUser, User newUser, String changedBy) {
        logChange(newUser.getId(), changedBy, "Full Name", oldUser.getFullName(), newUser.getFullName());
        logChange(newUser.getId(), changedBy, "Username", oldUser.getUsername(), newUser.getUsername());
        logChange(newUser.getId(), changedBy, "Role", oldUser.getRole(), newUser.getRole());
        logChange(newUser.getId(), changedBy, "Email", oldUser.getEmail(), newUser.getEmail());
        logChange(newUser.getId(), changedBy, "Mobile Number", oldUser.getMobileNumber(), newUser.getMobileNumber());
        logChange(newUser.getId(), changedBy, "College Name", oldUser.getCollegeName(), newUser.getCollegeName());
        logChange(newUser.getId(), changedBy, "City / Address", oldUser.getCity(), newUser.getCity());
    }

    public List<UserHistoryLog> getHistory(Long userId) {
        return logRepository.findByUserIdOrderByTimestampDesc(userId);
    }
}
