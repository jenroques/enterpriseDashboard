package com.mfe.registry.web;

import com.mfe.registry.auth.AdminAuthorizationService;
import io.jsonwebtoken.Claims;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.http.HttpHeaders;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "${app.cors.allowed-origins:http://localhost:5173}")
public class TelemetryController {

    private static final Logger logger = LoggerFactory.getLogger(TelemetryController.class);

    private final AdminAuthorizationService adminAuthorizationService;
    private final TelemetryStore telemetryStore;

    public TelemetryController(AdminAuthorizationService adminAuthorizationService, TelemetryStore telemetryStore) {
        this.adminAuthorizationService = adminAuthorizationService;
        this.telemetryStore = telemetryStore;
    }

    public record TelemetryEventRequest(
            String eventType,
            String remoteId,
            String routeId,
            String level,
            Long durationMs,
            String message,
            Map<String, Object> metadata
    ) {
    }

    public record TelemetryRecord(
            String timestamp,
            String correlationId,
            String requestId,
            String sessionId,
            String userId,
            String eventType,
            String remoteId,
            String routeId,
            String level,
            Long durationMs,
            String message,
            Map<String, Object> metadata
    ) {
    }

    @PostMapping("/telemetry")
    public Map<String, String> collect(
            @RequestHeader(value = "X-Session-Id", required = false) String sessionId,
            @RequestHeader(value = "X-Request-Id", required = false) String requestId,
            @RequestHeader(value = "X-Correlation-Id", required = false) String correlationId,
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorizationHeader,
            @RequestBody TelemetryEventRequest body
    ) {
        String resolvedUserId = resolveUser(userId, authorizationHeader);

        TelemetryRecord record = new TelemetryRecord(
                Instant.now().toString(),
                valueOrDefault(correlationId, valueOrDefault(MDC.get("correlationId"), "corr-unknown")),
                valueOrDefault(requestId, valueOrDefault(MDC.get("requestId"), "req-unknown")),
                valueOrDefault(sessionId, valueOrDefault(MDC.get("sessionId"), "session-unknown")),
                valueOrDefault(resolvedUserId, "anonymous"),
                valueOrDefault(body.eventType(), "unknown_event"),
                body.remoteId(),
                body.routeId(),
                valueOrDefault(body.level(), "INFO"),
                body.durationMs(),
                body.message(),
                body.metadata()
        );

        telemetryStore.add(record);
        logger.info("{{\"event\":\"telemetry_received\",\"eventType\":\"{}\",\"remoteId\":\"{}\",\"routeId\":\"{}\",\"durationMs\":{},\"correlationId\":\"{}\",\"requestId\":\"{}\",\"sessionId\":\"{}\",\"userId\":\"{}\"}}",
                record.eventType(),
                valueOrDefault(record.remoteId(), ""),
                valueOrDefault(record.routeId(), ""),
                record.durationMs() == null ? 0 : record.durationMs(),
                record.correlationId(),
                record.requestId(),
                record.sessionId(),
                record.userId());

        return Map.of("status", "accepted");
    }

    @GetMapping("/admin/telemetry")
    public List<TelemetryRecord> getTelemetry(@RequestHeader(HttpHeaders.AUTHORIZATION) String authorizationHeader) {
        adminAuthorizationService.requireAdmin(authorizationHeader);
        return telemetryStore.list();
    }

    private String resolveUser(String headerUserId, String authorizationHeader) {
        if (headerUserId != null && !headerUserId.isBlank()) {
            return headerUserId;
        }

        if (authorizationHeader == null || authorizationHeader.isBlank()) {
            return "anonymous";
        }

        try {
            Claims claims = adminAuthorizationService.validateBearerToken(authorizationHeader);
            return claims.getSubject();
        } catch (Exception ignored) {
            return "anonymous";
        }
    }

    private String valueOrDefault(String value, String fallback) {
        if (value == null || value.isBlank()) {
            return fallback;
        }
        return value;
    }
}
