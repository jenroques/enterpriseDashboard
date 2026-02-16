package com.mfe.registry.auth;

import io.jsonwebtoken.Claims;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AdminAuthorizationService {

    private final JwtService jwtService;

    public AdminAuthorizationService(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    public Claims validateBearerToken(String authorizationHeader) {
        if (authorizationHeader == null || !authorizationHeader.startsWith("Bearer ")) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Missing bearer token");
        }

        String token = authorizationHeader.substring("Bearer ".length());
        try {
            return jwtService.validate(token);
        } catch (Exception ex) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid JWT token");
        }
    }

    public void requireAdmin(String authorizationHeader) {
        Claims claims = validateBearerToken(authorizationHeader);
        List<?> roles = claims.get("roles", List.class);
        if (roles == null || !roles.contains("ADMIN")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "ADMIN role required");
        }
    }
}
