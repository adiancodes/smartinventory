package com.smartshelfx.inventoryservice.auth;

import com.smartshelfx.inventoryservice.role.RoleEntity;
import com.smartshelfx.inventoryservice.role.RoleName;
import com.smartshelfx.inventoryservice.role.RoleRepository;
import com.smartshelfx.inventoryservice.security.JwtService;
import com.smartshelfx.inventoryservice.security.SecurityUserDetails;
import com.smartshelfx.inventoryservice.user.UserEntity;
import com.smartshelfx.inventoryservice.user.UserRepository;
import com.smartshelfx.inventoryservice.warehouse.WarehouseEntity;
import com.smartshelfx.inventoryservice.warehouse.WarehouseRepository;
import jakarta.transaction.Transactional;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final WarehouseRepository warehouseRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    public AuthService(UserRepository userRepository,
                       RoleRepository roleRepository,
                       WarehouseRepository warehouseRepository,
                       PasswordEncoder passwordEncoder,
                       AuthenticationManager authenticationManager,
                       JwtService jwtService) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.warehouseRepository = warehouseRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
    }

    @Transactional
    public UserProfileResponse register(RegisterRequest request) {
        if (userRepository.existsByOfficialEmail(request.officialEmail())) {
            throw new IllegalArgumentException("Email already registered");
        }

        RoleName roleName = RoleName.valueOf(request.role().trim().toUpperCase(Locale.ROOT));
        RoleEntity role = roleRepository.findByName(roleName)
                .orElseThrow(() -> new IllegalArgumentException("Role not configured"));

        WarehouseEntity warehouse = null;
        if (roleName == RoleName.MANAGER || roleName == RoleName.USER) {
            if (!StringUtils.hasText(request.warehouseLocationCode())) {
                throw new IllegalArgumentException("Warehouse code is required for managers and users");
            }
            if (!StringUtils.hasText(request.warehouseLocationName())) {
                throw new IllegalArgumentException("Warehouse name is required for managers and users");
            }
            warehouse = warehouseRepository.findByLocationCode(request.warehouseLocationCode())
                    .orElseGet(() -> {
                        WarehouseEntity entity = new WarehouseEntity();
                        entity.setName(request.warehouseLocationName());
                        entity.setLocationCode(request.warehouseLocationCode());
                        return warehouseRepository.save(entity);
                    });
        }

        UserEntity user = new UserEntity();
        user.setFullName(request.fullName());
        user.setCompanyName(request.companyName());
        user.setOfficialEmail(request.officialEmail().toLowerCase(Locale.ROOT));
        user.setContactNumber(request.contactNumber());
        user.setPassword(passwordEncoder.encode(request.password()));
        user.setRole(role);
        user.setWarehouse(warehouse);

        UserEntity saved = userRepository.save(user);
        return toProfile(saved);
    }

    public AuthResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.email(), request.password())
        );
        SecurityUserDetails principal = (SecurityUserDetails) authentication.getPrincipal();
        UserEntity user = userRepository.findByOfficialEmail(principal.getUsername())
                .orElseThrow(() -> new IllegalStateException("Authenticated user not found"));

        String token = jwtService.generateToken(principal.getUsername(), Map.of(
                "role", principal.role(),
                "warehouseId", principal.warehouseId() == null ? "" : principal.warehouseId().toString()
        ));
        return new AuthResponse(token, jwtService.getExpirationSeconds(), toProfile(user));
    }

    public UserProfileResponse me(String email) {
        UserEntity user = userRepository.findByOfficialEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        return toProfile(user);
    }

    public List<ManagerSummaryResponse> listManagers() {
        return userRepository.findAllByRole_Name(RoleName.MANAGER).stream()
                .map(user -> new ManagerSummaryResponse(
                        user.getId(),
                        user.getFullName(),
                        user.getOfficialEmail(),
                        user.getWarehouse() != null ? user.getWarehouse().getName() : null,
                        user.getWarehouse() != null ? user.getWarehouse().getLocationCode() : null
                ))
                .toList();
    }

    private UserProfileResponse toProfile(UserEntity user) {
        Long warehouseId = user.getWarehouse() != null ? user.getWarehouse().getId() : null;
        String warehouseName = user.getWarehouse() != null ? user.getWarehouse().getName() : null;
        String warehouseCode = user.getWarehouse() != null ? user.getWarehouse().getLocationCode() : null;
        return new UserProfileResponse(
                user.getId(),
                user.getFullName(),
                user.getOfficialEmail(),
                user.getRole().getName().name(),
                warehouseId,
                warehouseName,
                warehouseCode
        );
    }
}
