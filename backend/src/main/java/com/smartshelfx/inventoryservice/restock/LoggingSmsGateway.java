package com.smartshelfx.inventoryservice.restock;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class LoggingSmsGateway implements SmsGateway {

    private static final Logger LOGGER = LoggerFactory.getLogger(LoggingSmsGateway.class);

    @Override
    public void sendSms(String phoneNumber, String message) {
        LOGGER.info("[SMS] Sending message to {}: {}", phoneNumber, message);
    }
}
