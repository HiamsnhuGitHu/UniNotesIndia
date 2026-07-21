package com.uninotes.india;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;

@SpringBootApplication
@EnableCaching
public class UniNotesApplication {
    public static void main(String[] args) {
        SpringApplication.run(UniNotesApplication.class, args);
    }
}
