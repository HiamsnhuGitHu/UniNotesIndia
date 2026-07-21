package com.uninotes.india.controller;

import com.uninotes.india.dto.*;
import com.uninotes.india.service.AuthService;
import com.uninotes.india.service.UserHistoryService;
import com.uninotes.india.repository.UserRepository;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserHistoryService userHistoryService;

    @GetMapping("/me")
    public ResponseEntity<?> getMe() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof UserDetails) {
            String username = ((UserDetails) principal).getUsername();
            return userRepository.findByUsername(username)
                    .map(user -> ResponseEntity.ok(authService.convertToDto(user)))
                    .orElse(ResponseEntity.status(401).build());
        }
        return ResponseEntity.status(401).build();
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@Valid @RequestBody RegisterRequest request) {
        UserDto userDto = authService.register(request);
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Registration successful. Please verify your email with the 6-digit code sent.");
        response.put("user", userDto);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> loginUser(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/verify-email")
    public ResponseEntity<?> verifyEmail(@Valid @RequestBody VerifyEmailRequest request) {
        authService.verifyEmail(request);
        Map<String, String> response = new HashMap<>();
        response.put("message", "Email verified successfully. You can now log in.");
        return ResponseEntity.ok(response);
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        authService.forgotPassword(request);
        Map<String, String> response = new HashMap<>();
        response.put("message", "If an account matches that email, a reset code has been dispatched.");
        return ResponseEntity.ok(response);
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request);
        Map<String, String> response = new HashMap<>();
        response.put("message", "Password has been updated successfully.");
        return ResponseEntity.ok(response);
    }

    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(@RequestBody UserDto profileDetails) {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (!(principal instanceof com.uninotes.india.entity.User)) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }
        com.uninotes.india.entity.User user = (com.uninotes.india.entity.User) principal;

        // Take a snapshot of the old user details before updating
        com.uninotes.india.entity.User oldUserCopy = new com.uninotes.india.entity.User();
        oldUserCopy.setId(user.getId());
        oldUserCopy.setFullName(user.getFullName());
        oldUserCopy.setUsername(user.getUsername());
        oldUserCopy.setRole(user.getRole());
        oldUserCopy.setEmail(user.getEmail());
        oldUserCopy.setMobileNumber(user.getMobileNumber());
        oldUserCopy.setCollegeName(user.getCollegeName());
        oldUserCopy.setCity(user.getCity());

        // Verify if username is changed and if it is taken
        if (profileDetails.getUsername() != null && !profileDetails.getUsername().trim().isEmpty() && !user.getUsername().equalsIgnoreCase(profileDetails.getUsername())) {
            // Students/Subadmins cannot change username!
            if (user.getRole() != com.uninotes.india.entity.UserRole.ROLE_ADMIN) {
                return ResponseEntity.status(403).body(Map.of("error", "Access denied: Students cannot change username."));
            }
            if (userRepository.findByUsernameIgnoreCase(profileDetails.getUsername()).isPresent()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Username is already taken."));
            }
            user.setUsername(profileDetails.getUsername());
        }

        // Verify if email is changed and if it is taken
        if (profileDetails.getEmail() != null && !profileDetails.getEmail().trim().isEmpty() && !user.getEmail().equalsIgnoreCase(profileDetails.getEmail())) {
            // Students/Subadmins cannot change email!
            if (user.getRole() != com.uninotes.india.entity.UserRole.ROLE_ADMIN) {
                return ResponseEntity.status(403).body(Map.of("error", "Access denied: Students cannot change email."));
            }
            if (userRepository.findByEmail(profileDetails.getEmail()).isPresent()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Email is already taken."));
            }
            user.setEmail(profileDetails.getEmail());
        }

        // Verify role change
        if (profileDetails.getRole() != null) {
            if (user.getRole() != profileDetails.getRole()) {
                // Students/Subadmins cannot change role!
                if (user.getRole() != com.uninotes.india.entity.UserRole.ROLE_ADMIN) {
                    return ResponseEntity.status(403).body(Map.of("error", "Access denied: Students cannot change role."));
                }
                user.setRole(profileDetails.getRole());
            }
        }

        // Editable fields by anyone (Student / Sub-admin / Admin)
        if (profileDetails.getFullName() != null) {
            user.setFullName(profileDetails.getFullName());
        }
        if (profileDetails.getMobileNumber() != null) {
            user.setMobileNumber(profileDetails.getMobileNumber());
        }
        if (profileDetails.getCity() != null) {
            user.setCity(profileDetails.getCity());
        }
        if (profileDetails.getCollegeName() != null) {
            user.setCollegeName(profileDetails.getCollegeName());
        }

        user.setUpdatedAt(java.time.LocalDateTime.now());
        com.uninotes.india.entity.User savedUser = userRepository.save(user);

        // Log the field-level updates to the history logs collection
        userHistoryService.logAllChanges(oldUserCopy, savedUser, savedUser.getUsername());

        return ResponseEntity.ok(authService.convertToDto(savedUser));
    }
}
