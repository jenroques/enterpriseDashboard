package com.mfe.registry.web;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.registry.remotes")
public record RegistryRemoteProperties(
        String accountsStableUrl,
        String accountsCanaryUrl,
        String billingStableUrl,
        String billingCanaryUrl,
        String analyticsStableUrl,
        String analyticsCanaryUrl
) {
}
