package com.smartshelfx.inventoryservice.address;

import com.smartshelfx.inventoryservice.security.SecurityUserDetails;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/users/me/addresses")
@PreAuthorize("hasRole('USER')")
public class UserAddressController {

    private final UserAddressService addressService;

    public UserAddressController(UserAddressService addressService) {
        this.addressService = addressService;
    }

    @GetMapping
    public UserAddressesResponse fetchAddresses(@AuthenticationPrincipal SecurityUserDetails currentUser) {
        return addressService.getAddresses(currentUser.id());
    }

    @PutMapping
    public UserAddressesResponse updateAddresses(@AuthenticationPrincipal SecurityUserDetails currentUser,
                                                 @Valid @RequestBody UserAddressesUpdateRequest request) {
        return addressService.saveAddresses(currentUser.id(), request);
    }
}
