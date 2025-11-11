package com.smartshelfx.inventoryservice.address;

import com.smartshelfx.inventoryservice.user.UserEntity;
import com.smartshelfx.inventoryservice.user.UserRepository;
import jakarta.transaction.Transactional;
import java.util.Optional;
import org.springframework.stereotype.Service;

@Service
public class UserAddressService {

    private final UserRepository userRepository;
    private final UserAddressRepository addressRepository;

    public UserAddressService(UserRepository userRepository, UserAddressRepository addressRepository) {
        this.userRepository = userRepository;
        this.addressRepository = addressRepository;
    }

    @Transactional(Transactional.TxType.SUPPORTS)
    public UserAddressesResponse getAddresses(Long userId) {
        UserAddressResponse delivery = addressRepository.findByUser_IdAndType(userId, AddressType.DELIVERY)
                .map(UserAddressService::toResponse)
                .orElse(null);
        UserAddressResponse billing = addressRepository.findByUser_IdAndType(userId, AddressType.BILLING)
                .map(UserAddressService::toResponse)
                .orElse(null);
        return new UserAddressesResponse(delivery, billing);
    }

    @Transactional
    public UserAddressesResponse saveAddresses(Long userId, UserAddressesUpdateRequest request) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (request.delivery() != null) {
            UserAddressEntity delivery = addressRepository.findByUser_IdAndType(userId, AddressType.DELIVERY)
                    .orElseGet(() -> {
                        UserAddressEntity entity = new UserAddressEntity();
                        entity.setUser(user);
                        entity.setType(AddressType.DELIVERY);
                        return entity;
                    });
            updateEntity(delivery, request.delivery());
            addressRepository.save(delivery);
        }

        if (request.billing() != null) {
            UserAddressEntity billing = addressRepository.findByUser_IdAndType(userId, AddressType.BILLING)
                    .orElseGet(() -> {
                        UserAddressEntity entity = new UserAddressEntity();
                        entity.setUser(user);
                        entity.setType(AddressType.BILLING);
                        return entity;
                    });
            updateEntity(billing, request.billing());
            addressRepository.save(billing);
        }

        return getAddresses(userId);
    }

    private static void updateEntity(UserAddressEntity entity, AddressPayload payload) {
        entity.setLine1(payload.line1().trim());
        entity.setLine2(Optional.ofNullable(payload.line2()).map(String::trim).orElse(null));
        entity.setCity(payload.city().trim());
        entity.setState(payload.state().trim());
        entity.setPostalCode(payload.postalCode().trim());
        entity.setCountry(payload.country().trim());
    }

    private static UserAddressResponse toResponse(UserAddressEntity entity) {
        return new UserAddressResponse(
                entity.getId(),
                entity.getType(),
                entity.getLine1(),
                entity.getLine2(),
                entity.getCity(),
                entity.getState(),
                entity.getPostalCode(),
                entity.getCountry()
        );
    }
}
