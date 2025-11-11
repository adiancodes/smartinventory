package com.smartshelfx.inventoryservice.config;

import java.util.HashMap;
import java.util.Map;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "seed")
public class SeedProperties {

    private String adminEmail;
    private String adminPassword = "ChangeMe123!";
    private String adminName = "System Admin";
    private Map<String, String> defaultWarehouses = new HashMap<>();

    public String adminEmail() {
        return adminEmail;
    }

    public void setAdminEmail(String adminEmail) {
        this.adminEmail = adminEmail;
    }

    public String adminPassword() {
        return adminPassword;
    }

    public void setAdminPassword(String adminPassword) {
        this.adminPassword = adminPassword;
    }

    public String adminName() {
        return adminName;
    }

    public void setAdminName(String adminName) {
        this.adminName = adminName;
    }

    public Map<String, String> defaultWarehouses() {
        return defaultWarehouses;
    }

    public void setDefaultWarehouses(Map<String, String> defaultWarehouses) {
        this.defaultWarehouses = defaultWarehouses;
    }
}
