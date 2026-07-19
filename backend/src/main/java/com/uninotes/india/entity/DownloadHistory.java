package com.uninotes.india.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.DBRef;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "download_histories")
public class DownloadHistory {

    @Id
    private Long id;

    @DBRef
    private User user;

    @DBRef
    private Note note;

    private LocalDateTime downloadedAt;

    public DownloadHistory() {
    }

    public DownloadHistory(Long id, User user, Note note, LocalDateTime downloadedAt) {
        this.id = id;
        this.user = user;
        this.note = note;
        this.downloadedAt = downloadedAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public Note getNote() {
        return note;
    }

    public void setNote(Note note) {
        this.note = note;
    }

    public LocalDateTime getDownloadedAt() {
        return downloadedAt;
    }

    public void setDownloadedAt(LocalDateTime downloadedAt) {
        this.downloadedAt = downloadedAt;
    }
}
