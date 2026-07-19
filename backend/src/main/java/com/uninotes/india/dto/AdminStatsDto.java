package com.uninotes.india.dto;

public class AdminStatsDto {
    private long totalUsers;
    private long totalUniversities;
    private long totalNotes;
    private long totalDownloads;

    public AdminStatsDto() {
    }

    public AdminStatsDto(long totalUsers, long totalUniversities, long totalNotes, long totalDownloads) {
        this.totalUsers = totalUsers;
        this.totalUniversities = totalUniversities;
        this.totalNotes = totalNotes;
        this.totalDownloads = totalDownloads;
    }

    public long getTotalUsers() {
        return totalUsers;
    }

    public void setTotalUsers(long totalUsers) {
        this.totalUsers = totalUsers;
    }

    public long getTotalUniversities() {
        return totalUniversities;
    }

    public void setTotalUniversities(long totalUniversities) {
        this.totalUniversities = totalUniversities;
    }

    public long getTotalNotes() {
        return totalNotes;
    }

    public void setTotalNotes(long totalNotes) {
        this.totalNotes = totalNotes;
    }

    public long getTotalDownloads() {
        return totalDownloads;
    }

    public void setTotalDownloads(long totalDownloads) {
        this.totalDownloads = totalDownloads;
    }
}
