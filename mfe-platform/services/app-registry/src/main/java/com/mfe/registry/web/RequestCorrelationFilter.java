package com.mfe.registry.web;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Optional;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class RequestCorrelationFilter extends OncePerRequestFilter {

    private static final Logger logger = LoggerFactory.getLogger(RequestCorrelationFilter.class);

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String correlationId = Optional.ofNullable(request.getHeader("X-Correlation-Id"))
                .filter(value -> !value.isBlank())
                .orElseGet(() -> "corr-" + UUID.randomUUID());
        String requestId = Optional.ofNullable(request.getHeader("X-Request-Id"))
                .filter(value -> !value.isBlank())
                .orElseGet(() -> "req-" + UUID.randomUUID());
        String sessionId = Optional.ofNullable(request.getHeader("X-Session-Id"))
                .filter(value -> !value.isBlank())
                .orElse("session-unknown");

        response.setHeader("X-Correlation-Id", correlationId);

        MDC.put("correlationId", correlationId);
        MDC.put("requestId", requestId);
        MDC.put("sessionId", sessionId);

        long startedAt = System.currentTimeMillis();
        try {
            filterChain.doFilter(request, response);
        } finally {
            long durationMs = System.currentTimeMillis() - startedAt;
            logger.info("{{\"event\":\"http_request\",\"method\":\"{}\",\"path\":\"{}\",\"status\":{},\"durationMs\":{},\"correlationId\":\"{}\",\"requestId\":\"{}\",\"sessionId\":\"{}\"}}",
                    request.getMethod(),
                    request.getRequestURI(),
                    response.getStatus(),
                    durationMs,
                    correlationId,
                    requestId,
                    sessionId);
            MDC.clear();
        }
    }
}
