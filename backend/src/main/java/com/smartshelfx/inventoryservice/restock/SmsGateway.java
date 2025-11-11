package com.smartshelfx.inventoryservice.restock;

public interface SmsGateway {
    void sendSms(String phoneNumber, String message) throws Exception;
}
