package com.uninotes.india.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.DBRef;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "delete_requests")
public class DeleteRequest {

    @Id
    private Long id;
    private String requestType; // "UNIVERSITY", "BRANCH", "SUBJECT", "NOTE"
    private Long targetId;
    private String targetName; // displays name/title of target
    
    @DBRef
    private User requestedBy;
    
    private LocalDateTime createdAt;
    private String status; // "PENDING", "APPROVED", "REJECTED"

    public DeleteRequest() {
    }

    public DeleteRequest(Long id, String requestType, Long targetId, String targetName, User requestedBy, LocalDateTime createdAt, String status) {
        this.id = id;
        this.requestType = requestType;
        this.targetId = targetId;
        this.targetName = targetName;
        this.requestedBy = requestedBy;
        this.createdAt = createdAt;
        this.status = status;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getRequestType() {
        return requestType;
    }

    public void setRequestType(String requestType) {
        this.requestType = requestType;
    }

    public Long getTargetId() {
        return targetId;
    }

    public void setTargetId(Long targetId) {
        this.targetId = targetId;
    }

    public String getTargetName() {
        return targetName;
    }

    public void setTargetName(String targetName) {
        this.targetName = targetName;
    }

    public User getRequestedBy() {
        return requestedBy;
    }

    public void setRequestedBy(User requestedBy) {
        this.requestedBy = requestedBy;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
