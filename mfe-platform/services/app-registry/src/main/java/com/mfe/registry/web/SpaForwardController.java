package com.mfe.registry.web;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.server.ResponseStatusException;

@Controller
public class SpaForwardController {

    @GetMapping({"/", "/{*path}"})
    public String forwardSpaRoutes(HttpServletRequest request) {
        String uri = request.getRequestURI();

        if (uri.equals("/api") || uri.startsWith("/api/") || uri.contains(".")) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        }

        return "forward:/index.html";
    }
}
