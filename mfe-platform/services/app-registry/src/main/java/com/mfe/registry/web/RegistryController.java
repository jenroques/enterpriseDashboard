package com.mfe.registry.web;

import com.mfe.registry.auth.AdminAuthorizationService;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/registry")
@CrossOrigin(origins = "http://localhost:5173")
public class RegistryController {

        private static final Logger logger = LoggerFactory.getLogger(RegistryController.class);

        private final AdminAuthorizationService adminAuthorizationService;
    private final RegistryRemoteProperties remoteProperties;
    private final Map<String, CanaryFlag> canaryFlags = new ConcurrentHashMap<>();

    private final List<RouteSeed> routeSeeds;

        public RegistryController(AdminAuthorizationService adminAuthorizationService, RegistryRemoteProperties remoteProperties) {
                this.adminAuthorizationService = adminAuthorizationService;
        this.remoteProperties = remoteProperties;
        this.routeSeeds = List.of(
            new RouteSeed(
                "remote-accounts",
                "Accounts",
                "/accounts",
                List.of("USER", "ADMIN"),
                "remote_accounts",
                "./App",
                new RemoteVersion(remoteProperties.accountsStableUrl(), "1.0.0-stable"),
                new RemoteVersion(remoteProperties.accountsCanaryUrl(), "1.0.0-canary")
            ),
            new RouteSeed(
                "remote-billing",
                "Billing",
                "/billing",
                List.of("USER", "ADMIN"),
                "remote_billing",
                "./App",
                new RemoteVersion(remoteProperties.billingStableUrl(), "1.0.0-stable"),
                new RemoteVersion(remoteProperties.billingCanaryUrl(), "1.0.0-canary")
            ),
            new RouteSeed(
                "remote-analytics",
                "Analytics",
                "/analytics",
                List.of("ADMIN"),
                "remote_analytics",
                "./App",
                new RemoteVersion(remoteProperties.analyticsStableUrl(), "1.0.0-stable"),
                new RemoteVersion(remoteProperties.analyticsCanaryUrl(), "1.0.0-canary")
            )
        );
        canaryFlags.put("remote-accounts", new CanaryFlag("remote-accounts", false, 0));
        canaryFlags.put("remote-billing", new CanaryFlag("remote-billing", false, 0));
        canaryFlags.put("remote-analytics", new CanaryFlag("remote-analytics", false, 0));
    }

    public record RemoteVersion(String url, String version) {
    }

    public record RolloutConfig(boolean canaryEnabled, int canaryPercentage) {
    }

    public record RemoteConfig(String scope, String module, RemoteVersion stable, RemoteVersion canary, RolloutConfig rollout) {
    }

    public record RouteConfig(String id, String title, String path, List<String> requiredRoles, RemoteConfig remote) {
    }

    public record CanaryFlag(String remoteId, boolean enabled, int rolloutPercentage) {
    }

    public record UpdateCanaryFlagRequest(Boolean enabled, Integer rolloutPercentage) {
    }

    private record RouteSeed(
            String id,
            String title,
            String path,
            List<String> requiredRoles,
            String scope,
            String module,
            RemoteVersion stable,
            RemoteVersion canary
    ) {
    }

    public record RegistryResponse(String platform, List<RouteConfig> routes) {
    }

    @GetMapping
    public RegistryResponse getRegistry() {
        List<RouteConfig> routes = routeSeeds.stream().map(this::buildRoute).toList();

        return new RegistryResponse(
                "mfe-platform",
                routes
        );
    }

    @GetMapping("/admin/routes")
    public RegistryResponse getAdminRoutes(@RequestHeader(HttpHeaders.AUTHORIZATION) String authorizationHeader) {
                adminAuthorizationService.requireAdmin(authorizationHeader);
        return getRegistry();
    }

        @GetMapping("/admin/canary-flags")
        public List<CanaryFlag> getCanaryFlags(@RequestHeader(HttpHeaders.AUTHORIZATION) String authorizationHeader) {
                adminAuthorizationService.requireAdmin(authorizationHeader);
                return routeSeeds.stream()
                                .map(seed -> canaryFlags.getOrDefault(seed.id(), new CanaryFlag(seed.id(), false, 0)))
                                .toList();
        }

        @PutMapping("/admin/canary-flags/{remoteId}")
        public CanaryFlag updateCanaryFlag(
                        @RequestHeader(HttpHeaders.AUTHORIZATION) String authorizationHeader,
                        @PathVariable String remoteId,
                        @RequestBody UpdateCanaryFlagRequest request
        ) {
                adminAuthorizationService.requireAdmin(authorizationHeader);

                if (request == null || request.enabled() == null || request.rolloutPercentage() == null) {
                        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "enabled and rolloutPercentage are required");
                }

                if (request.rolloutPercentage() < 0 || request.rolloutPercentage() > 100) {
                        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "rolloutPercentage must be between 0 and 100");
                }

                boolean knownRemote = routeSeeds.stream().anyMatch(seed -> seed.id().equals(remoteId));
                if (!knownRemote) {
                        throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Unknown remoteId");
                }

                CanaryFlag updated = new CanaryFlag(remoteId, request.enabled(), request.rolloutPercentage());
                canaryFlags.put(remoteId, updated);
                logger.info("{{\"event\":\"canary_flag_updated\",\"remoteId\":\"{}\",\"enabled\":{},\"rolloutPercentage\":{},\"correlationId\":\"{}\",\"requestId\":\"{}\",\"sessionId\":\"{}\"}}",
                        remoteId,
                        updated.enabled(),
                        updated.rolloutPercentage(),
                        MDC.get("correlationId"),
                        MDC.get("requestId"),
                        MDC.get("sessionId"));
                return updated;
        }

    @GetMapping("/health")
    public Map<String, String> health() {
        return Map.of("status", "UP");
    }

        private RouteConfig buildRoute(RouteSeed seed) {
                CanaryFlag flag = canaryFlags.getOrDefault(seed.id(), new CanaryFlag(seed.id(), false, 0));

                return new RouteConfig(
                                seed.id(),
                                seed.title(),
                                seed.path(),
                                seed.requiredRoles(),
                                new RemoteConfig(
                                                seed.scope(),
                                                seed.module(),
                                                seed.stable(),
                                                seed.canary(),
                                                new RolloutConfig(flag.enabled(), flag.rolloutPercentage())
                                )
                );
        }

}
