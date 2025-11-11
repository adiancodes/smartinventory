package com.smartshelfx.inventoryservice.config;

import com.smartshelfx.inventoryservice.role.RoleEntity;
import com.smartshelfx.inventoryservice.role.RoleName;
import com.smartshelfx.inventoryservice.role.RoleRepository;
import com.smartshelfx.inventoryservice.user.UserEntity;
import com.smartshelfx.inventoryservice.user.UserRepository;
import com.smartshelfx.inventoryservice.warehouse.WarehouseEntity;
import com.smartshelfx.inventoryservice.warehouse.WarehouseRepository;
import jakarta.transaction.Transactional;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    private final RoleRepository roleRepository;
    private final WarehouseRepository warehouseRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final SeedProperties seedProperties;

    public DataSeeder(RoleRepository roleRepository,
                      WarehouseRepository warehouseRepository,
                      UserRepository userRepository,
                      PasswordEncoder passwordEncoder,
                      SeedProperties seedProperties) {
        this.roleRepository = roleRepository;
        this.warehouseRepository = warehouseRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.seedProperties = seedProperties;
    }

    @Override
    @Transactional
    public void run(String... args) {
        for (RoleName roleName : RoleName.values()) {
            roleRepository.findByName(roleName).orElseGet(() -> roleRepository.save(new RoleEntity(roleName)));
        }

        seedProperties.defaultWarehouses().forEach((code, name) -> {
            warehouseRepository.findByLocationCode(code).orElseGet(() -> {
                WarehouseEntity warehouse = new WarehouseEntity();
                warehouse.setLocationCode(code);
                warehouse.setName(name);
                warehouse.setActive(true);
                log.info("Seeding warehouse {}", code);
                return warehouseRepository.save(warehouse);
            });
        });

        if (seedProperties.adminEmail() != null && !seedProperties.adminEmail().isBlank()) {
            userRepository.findByOfficialEmail(seedProperties.adminEmail()).orElseGet(() -> {
                RoleEntity adminRole = roleRepository.findByName(RoleName.ADMIN).orElseThrow();
                UserEntity admin = new UserEntity();
                admin.setFullName(seedProperties.adminName());
                admin.setOfficialEmail(seedProperties.adminEmail());
                admin.setPassword(passwordEncoder.encode(seedProperties.adminPassword()));
                admin.setRole(adminRole);
                admin.setEnabled(true);
                log.info("Seeding default admin {}", seedProperties.adminEmail());
                return userRepository.save(admin);
            });
        }
    }
}
