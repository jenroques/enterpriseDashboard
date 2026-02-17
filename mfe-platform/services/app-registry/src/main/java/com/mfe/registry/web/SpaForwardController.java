package com.mfe.registry.web;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class SpaForwardController {

    @GetMapping({"/", "/{path:[^\\.]*}", "/**/{path:[^\\.]*}"})
    public String forwardSpaRoutes() {
        return "forward:/index.html";
    }
}
