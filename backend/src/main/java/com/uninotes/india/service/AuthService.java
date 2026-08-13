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
        String normalizedUsername = request.getUsername().trim();
        if (normalizedUsername.isEmpty()) {
            throw new RuntimeException("Username must not be empty");
        }
        // Normalize to lowercase for storage to make lookups deterministic and index-friendly
        normalizedUsername = normalizedUsername.toLowerCase();

        if (userRepository.findByUsername(normalizedUsername).isPresent()) {
            throw new RuntimeException("Username is already taken");
        }
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new RuntimeException("Email is already registered");
        }
        if (request.getMobileNumber() != null && !request.getMobileNumber().trim().isEmpty() &&
            userRepository.findByMobileNumber(request.getMobileNumber().trim()).isPresent()) {
            throw new RuntimeException("Mobile number is already registered");
        }

        User user = new User();
        user.setFullName(request.getFullName());
        user.setMobileNumber(request.getMobileNumber());
        user.setEmail(request.getEmail());
        user.setCity(request.getCity());
        user.setCollegeName(request.getCollegeName());
        user.setUsername(normalizedUsername);
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
        String usernameInput = request.getUsername() == null ? "" : request.getUsername().trim();
        if (usernameInput.isEmpty()) {
            throw new RuntimeException("Invalid username or password");
        }

        String lookupUsername = usernameInput;
        long start = System.currentTimeMillis();

        // Try exact lookup (fast, will use index if username stored normalized)
        Optional<User> maybeUser = userRepository.findByUsername(lookupUsername);

        // Fallback to case-insensitive search only if exact lookup failed
        if (maybeUser.isEmpty()) {
            maybeUser = userRepository.findByUsernameIgnoreCase(lookupUsername);
        }

        long afterLookup = System.currentTimeMillis();
        org.slf4j.LoggerFactory.getLogger(AuthService.class).info("Login lookup took {} ms for username={}", (afterLookup - start), usernameInput);

        User user = maybeUser.orElseThrow(() -> new RuntimeException("Invalid username or password"));

        // Password matching (bcrypt) — log time for diagnostics
        long pwStart = System.currentTimeMillis();
        boolean matches = passwordEncoder.matches(request.getPassword(), user.getPassword());
        long pwEnd = System.currentTimeMillis();
        org.slf4j.LoggerFactory.getLogger(AuthService.class).info("Password match took {} ms for username={}", (pwEnd - pwStart), usernameInput);

        if (!matches) {
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
