package com.mfe.registry.web;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class SpaForwardController {

    @GetMapping({
            "/",
            "/accounts",
            "/billing",
            "/analytics",
            "/debug/remotes",
            "/admin/canary-control",
            "/admin/telemetry"
    })
    public String forwardSpaRoutes() {
        return "forward:/index.html";
    }
}
