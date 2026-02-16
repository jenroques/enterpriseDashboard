package com.mfe.registry;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class AppRegistryApplication {

    public static void main(String[] args) {
        SpringApplication.run(AppRegistryApplication.class, args);
    }
}
