package com.uninotes.india.config;

import com.uninotes.india.entity.*;
import com.uninotes.india.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Component
public class DatabaseSeeder implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UniversityRepository universityRepository;

    @Autowired
    private BranchRepository branchRepository;

    @Autowired
    private SubjectRepository subjectRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private com.uninotes.india.service.NoteService noteService;

    @Override
    public void run(String... args) throws Exception {
        cleanupTestUsers();
        seedUniversities();
        seedBranches();
        seedSubjects();
    }

    private void cleanupTestUsers() {
        String[] testUsernames = {"admin", "subadmin", "student"};
        for (String username : testUsernames) {
            userRepository.findByUsernameIgnoreCase(username).ifPresent(user -> {
                try {
                    noteService.deleteNotesByUserAndCascade(user.getId());
                } catch (Exception e) {
                    System.err.println("Failed to cascade delete test user notes: " + e.getMessage());
                }
                userRepository.delete(user);
                System.out.println("Permanently deleted test user account: " + username);
            });
        }
    }

    private void seedUniversities() {
        if (universityRepository.count() == 0) {
            String[] unis = {
                "Malaviya National Institute of Technology (MNIT) Jaipur",
                "Rajasthan Technical University (RTU) - Jaipur Campus",
                "LNM Institute of Information Technology (LNMIIT)",
                "Manipal University Jaipur (MUJ)",
                "JECRC University Jaipur",
                "Amity University Jaipur",
                "Poornima University Jaipur",
                "The IIS University Jaipur",
                "NIMS University Jaipur",
                "Suresh Gyan Vihar University"
            };

            for (String uniName : unis) {
                University uni = new University();
                uni.setName(uniName);
                uni.setCity("Jaipur");
                universityRepository.save(uni);
            }
            System.out.println("10 Jaipur-based universities seeded");
        }
    }

    private void seedBranches() {
        if (branchRepository.count() == 0) {
            String[] branches = {
                "Computer Science Engineering",
                "Information Technology",
                "Electronics & Communication Engineering",
                "Electrical Engineering",
                "Mechanical Engineering",
                "Civil Engineering",
                "Chemical Engineering",
                "Artificial Intelligence & Machine Learning",
                "Data Science Engineering",
                "Software Engineering",
                "Mechatronics Engineering",
                "Biotechnology Engineering",
                "Automobile Engineering",
                "Aerospace Engineering",
                "Mining Engineering"
            };

            for (String name : branches) {
                Branch branch = new Branch();
                branch.setName(name);
                branchRepository.save(branch);
            }
            System.out.println("15 engineering branches seeded");
        }
    }

    private void seedSubjects() {
        if (subjectRepository.count() == 0) {
            Branch cse = branchRepository.findAll().stream()
                    .filter(b -> b.getName().equals("Computer Science Engineering"))
                    .findFirst()
                    .orElse(null);

            if (cse == null) {
                return;
            }

            // Subject definitions [semester][subject name]
            List<SubjectSeed> list = new ArrayList<>();
            // Sem 1
            list.add(new SubjectSeed(1, "Engineering Mathematics - I"));
            list.add(new SubjectSeed(1, "Engineering Physics"));
            list.add(new SubjectSeed(1, "Basic Electrical Engineering"));
            list.add(new SubjectSeed(1, "Communication Skills"));

            // Sem 2
            list.add(new SubjectSeed(2, "Engineering Mathematics - II"));
            list.add(new SubjectSeed(2, "Engineering Chemistry"));
            list.add(new SubjectSeed(2, "Computer Programming in C"));
            list.add(new SubjectSeed(2, "Basic Electronics"));

            // Sem 3
            list.add(new SubjectSeed(3, "Data Structures and Algorithms"));
            list.add(new SubjectSeed(3, "Digital Electronics"));
            list.add(new SubjectSeed(3, "Discrete Mathematical Structures"));
            list.add(new SubjectSeed(3, "Object Oriented Programming in C++"));

            // Sem 4
            list.add(new SubjectSeed(4, "Database Management Systems"));
            list.add(new SubjectSeed(4, "Software Engineering"));
            list.add(new SubjectSeed(4, "Operating Systems"));
            list.add(new SubjectSeed(4, "Theory of Computation"));

            // Sem 5
            list.add(new SubjectSeed(5, "Computer Networks"));
            list.add(new SubjectSeed(5, "Design and Analysis of Algorithms"));
            list.add(new SubjectSeed(5, "Microprocessors & Interfaces"));
            list.add(new SubjectSeed(5, "Formal Languages & Automata Theory"));

            // Sem 6
            list.add(new SubjectSeed(6, "Compiler Design"));
            list.add(new SubjectSeed(6, "Computer Graphics"));
            list.add(new SubjectSeed(6, "Artificial Intelligence"));
            list.add(new SubjectSeed(6, "Information Security"));

            // Sem 7
            list.add(new SubjectSeed(7, "Cloud Computing"));
            list.add(new SubjectSeed(7, "Big Data Analytics"));
            list.add(new SubjectSeed(7, "Machine Learning"));
            list.add(new SubjectSeed(7, "Cryptography"));

            // Sem 8
            list.add(new SubjectSeed(8, "Cyber Security"));
            list.add(new SubjectSeed(8, "Distributed Systems"));
            list.add(new SubjectSeed(8, "Entrepreneurship Development"));
            list.add(new SubjectSeed(8, "Project Work & Seminar"));

            for (SubjectSeed seed : list) {
                Subject sub = new Subject();
                sub.setName(seed.name);
                sub.setBranch(cse);
                sub.setSemester(seed.sem);
                subjectRepository.save(sub);
            }
            System.out.println("Core CSE subjects for 8 semesters seeded");
        }
    }

    private static class SubjectSeed {
        int sem;
        String name;
        SubjectSeed(int sem, String name) {
            this.sem = sem;
            this.name = name;
        }
    }
}
