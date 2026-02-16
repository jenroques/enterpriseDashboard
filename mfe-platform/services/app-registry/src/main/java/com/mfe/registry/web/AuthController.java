package com.mfe.registry.web;

import com.mfe.registry.auth.JwtService;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:5173")
public class AuthController {

    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);

    private final JwtService jwtService;

    public AuthController(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    public record LoginRequest(String username, String password) {
    }

    public record LoginResponse(String accessToken, String tokenType, long expiresInSeconds, List<String> roles) {
    }

    @PostMapping("/login")
    public LoginResponse login(@RequestBody LoginRequest request) {
        if (request == null || request.username() == null || request.username().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "username is required");
        }

        List<String> roles = request.username().equalsIgnoreCase("admin")
                ? List.of("ADMIN", "USER")
                : List.of("USER");

        String token = jwtService.issueToken(request.username(), roles);
        logger.info("{{\"event\":\"auth_login_issued\",\"username\":\"{}\",\"roles\":\"{}\",\"correlationId\":\"{}\",\"requestId\":\"{}\",\"sessionId\":\"{}\"}}",
            request.username(),
            String.join(",", roles),
            MDC.get("correlationId"),
            MDC.get("requestId"),
            MDC.get("sessionId"));
        return new LoginResponse(token, "Bearer", 3600, roles);
    }
}
