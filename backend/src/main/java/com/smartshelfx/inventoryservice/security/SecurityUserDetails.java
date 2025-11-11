package com.smartshelfx.inventoryservice.security;

import com.smartshelfx.inventoryservice.user.UserEntity;
import java.util.Collection;
import java.util.List;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

public record SecurityUserDetails(Long id, String email, String password,
                                  Collection<? extends GrantedAuthority> authorities,
                                  Long warehouseId, String role) implements UserDetails {

    public static SecurityUserDetails fromEntity(UserEntity user) {
        List<SimpleGrantedAuthority> authorities =
                List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().getName().name()));
        Long warehouseId = user.getWarehouse() != null ? user.getWarehouse().getId() : null;
        return new SecurityUserDetails(
                user.getId(),
                user.getOfficialEmail(),
                user.getPassword(),
                authorities,
                warehouseId,
                user.getRole().getName().name()
        );
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    @Override
    public String getPassword() {
        return password;
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }
}
