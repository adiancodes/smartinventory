package com.smartshelfx.inventoryservice.auth;

public record AuthResponse(String accessToken, long expiresInSeconds, UserProfileResponse user) {}
