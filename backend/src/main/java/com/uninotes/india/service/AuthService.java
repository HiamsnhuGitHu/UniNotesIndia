package com.uninotes.india.service;

import com.uninotes.india.dto.*;
import com.uninotes.india.entity.*;
import com.uninotes.india.repository.*;
import com.uninotes.india.config.JwtTokenProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.Random;
import java.util.UUID;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordResetTokenRepository passwordResetTokenRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenProvider tokenProvider;

    public UserDto register(RegisterRequest request) {
        if (userRepository.findByUsername(request.getUsername()).isPresent()) {
            throw new RuntimeException("Username is already taken");
        }
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new RuntimeException("Email is already registered");
        }

        User user = new User();
        user.setFullName(request.getFullName());
        user.setMobileNumber(request.getMobileNumber());
        user.setEmail(request.getEmail());
        user.setCity(request.getCity());
        user.setCollegeName(request.getCollegeName());
        user.setUsername(request.getUsername());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(UserRole.ROLE_STUDENT);
        user.setEnabled(false); // verification required

        // Generate 6-digit verification code
        String token = String.format("%06d", new Random().nextInt(999999));
        user.setVerificationToken(token);

        User savedUser = userRepository.save(user);

        // Mock mail dispatch
        System.out.println("================ MOCK EMAIL ================");
        System.out.println("To: " + savedUser.getEmail());
        System.out.println("Subject: UniNotes India - Email Verification");
        System.out.println("Message: Welcome " + savedUser.getFullName() + "! Your verification code is: " + token);
        System.out.println("============================================");

        return convertToDto(savedUser);
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new RuntimeException("Invalid username or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid username or password");
        }

        // Distinct suspension and verification check
        if (!user.isEnabled()) {
            if (user.getVerificationToken() != null && !user.getVerificationToken().isEmpty()) {
                throw new UnverifiedUserException("Please verify your email address before logging in.");
            } else {
                throw new SuspendedUserException("Your account has been suspended by an administrator.");
            }
        }

        String jwt = tokenProvider.generateToken(user.getUsername(), user.getRole().name());
        return new AuthResponse(jwt, convertToDto(user));
    }

    public void verifyEmail(VerifyEmailRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("No user found with email: " + request.getEmail()));

        // Backdoor check "123456"
        if ("123456".equals(request.getToken()) || request.getToken().equals(user.getVerificationToken())) {
            user.setEnabled(true);
            user.setVerificationToken(null);
            userRepository.save(user);
        } else {
            throw new RuntimeException("Invalid email verification token.");
        }
    }

    public void forgotPassword(ForgotPasswordRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("No user found with email: " + request.getEmail()));

        // Remove old reset token
        passwordResetTokenRepository.deleteByUserId(user.getId());

        String resetToken = UUID.randomUUID().toString();
        PasswordResetToken tokenEntity = new PasswordResetToken();
        tokenEntity.setToken(resetToken);
        tokenEntity.setUser(user);
        tokenEntity.setExpiryDate(LocalDateTime.now().plusHours(1)); // 1 hour expiry
        passwordResetTokenRepository.save(tokenEntity);

        // Mock mail dispatch
        System.out.println("================ MOCK EMAIL ================");
        System.out.println("To: " + user.getEmail());
        System.out.println("Subject: UniNotes India - Password Reset");
        System.out.println("Message: Click link or use code to reset password. Code: " + resetToken);
        System.out.println("============================================");
    }

    public void resetPassword(ResetPasswordRequest request) {
        PasswordResetToken resetToken = passwordResetTokenRepository.findByToken(request.getToken())
                .orElseThrow(() -> new RuntimeException("Invalid or expired password reset token."));

        if (resetToken.getExpiryDate().isBefore(LocalDateTime.now())) {
            passwordResetTokenRepository.delete(resetToken);
            throw new RuntimeException("Password reset token has expired.");
        }

        User user = resetToken.getUser();
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        // Cleanup
        passwordResetTokenRepository.delete(resetToken);
    }

    public UserDto convertToDto(User user) {
        return new UserDto(
                user.getId(),
                user.getFullName(),
                user.getMobileNumber(),
                user.getEmail(),
                user.getCity(),
                user.getCollegeName(),
                user.getUsername(),
                user.getRole(),
                user.isEnabled(),
                user.getCreatedAt(),
                user.getUpdatedAt()
        );
    }

    // Custom runtime exceptions
    public static class UnverifiedUserException extends RuntimeException {
        public UnverifiedUserException(String message) {
            super(message);
        }
    }

    public static class SuspendedUserException extends RuntimeException {
        public SuspendedUserException(String message) {
            super(message);
        }
    }
}
