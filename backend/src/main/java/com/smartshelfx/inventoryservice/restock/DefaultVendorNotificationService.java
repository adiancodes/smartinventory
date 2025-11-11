package com.smartshelfx.inventoryservice.restock;

import java.time.format.DateTimeFormatter;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.lang.Nullable;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
public class DefaultVendorNotificationService implements VendorNotificationService {

    private static final Logger LOGGER = LoggerFactory.getLogger(DefaultVendorNotificationService.class);
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ISO_LOCAL_DATE;

    private final ObjectProvider<JavaMailSender> mailSenderProvider;
    private final SmsGateway smsGateway;

    public DefaultVendorNotificationService(ObjectProvider<JavaMailSender> mailSenderProvider,
                                            SmsGateway smsGateway) {
        this.mailSenderProvider = mailSenderProvider;
        this.smsGateway = smsGateway;
    }

    @Override
    public VendorNotificationResult dispatchPurchaseOrder(PurchaseOrderEntity purchaseOrder,
                                                          PurchaseOrderNotificationOptions options) {
        boolean emailSent = false;
        boolean smsSent = false;
        String failureMessage = null;

        if (options.emailRequested()) {
            VendorDispatchOutcome emailOutcome = sendEmail(purchaseOrder);
            emailSent = emailOutcome.dispatched();
            failureMessage = mergeFailure(failureMessage, emailOutcome.errorMessage());
        }

        if (options.smsRequested()) {
            VendorDispatchOutcome smsOutcome = sendSms(purchaseOrder);
            smsSent = smsOutcome.dispatched();
            failureMessage = mergeFailure(failureMessage, smsOutcome.errorMessage());
        }

        return new VendorNotificationResult(emailSent, smsSent, failureMessage);
    }

    private VendorDispatchOutcome sendEmail(PurchaseOrderEntity order) {
        if (!StringUtils.hasText(order.getVendorEmail())) {
            return VendorDispatchOutcome.failed("Vendor email address is missing");
        }

        JavaMailSender mailSender = mailSenderProvider.getIfAvailable();
        if (mailSender == null) {
            LOGGER.warn("Email dispatch requested for {} but no JavaMailSender configured", order.getReference());
            return VendorDispatchOutcome.failed("Email gateway not configured");
        }

        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(order.getVendorEmail());
        message.setSubject("Purchase Order " + order.getReference());
        message.setText(buildEmailBody(order));

        try {
            mailSender.send(message);
            LOGGER.info("Purchase order {} emailed to {}", order.getReference(), order.getVendorEmail());
            return VendorDispatchOutcome.success();
        } catch (MailException ex) {
            LOGGER.error("Failed to email purchase order {}", order.getReference(), ex);
            return VendorDispatchOutcome.failed("Email dispatch failed: " + ex.getMessage());
        }
    }

    private VendorDispatchOutcome sendSms(PurchaseOrderEntity order) {
        if (!StringUtils.hasText(order.getVendorPhone())) {
            return VendorDispatchOutcome.failed("Vendor phone number is missing");
        }
        String message = buildSmsBody(order);
        try {
            smsGateway.sendSms(order.getVendorPhone(), message);
            LOGGER.info("Purchase order {} SMS sent to {}", order.getReference(), order.getVendorPhone());
            return VendorDispatchOutcome.success();
        } catch (Exception ex) {
            LOGGER.error("Failed to send SMS for purchase order {}", order.getReference(), ex);
            return VendorDispatchOutcome.failed("SMS dispatch failed: " + ex.getMessage());
        }
    }

    private String buildEmailBody(PurchaseOrderEntity order) {
        StringBuilder builder = new StringBuilder();
        builder.append("Hello ").append(order.getVendorName()).append(",\n\n");
        builder.append("Please review purchase order ").append(order.getReference())
                .append(" for warehouse ").append(order.getWarehouse().getName()).append(".\n\n");
        builder.append("Items:\n");
        for (var item : order.getItems()) {
            builder.append(" - ")
                    .append(item.getProductName())
                    .append(" (SKU: ")
                    .append(item.getProductSku())
                    .append(") -> ")
                    .append(item.getQuantity())
                    .append(" @ ")
                    .append(item.getUnitPrice())
                    .append(" = ")
                    .append(item.getLineTotal())
                    .append("\n");
        }

        builder.append("\nSubtotal: ").append(order.getSubtotalAmount()).append("\n");
        builder.append("Total: ").append(order.getTotalAmount()).append("\n");
        if (order.getExpectedDeliveryDate() != null) {
            builder.append("Requested delivery by: ")
                    .append(DATE_FORMATTER.format(order.getExpectedDeliveryDate().toLocalDate()))
                    .append("\n");
        }
        builder.append("\nNotes: ")
                .append(StringUtils.hasText(order.getNotes()) ? order.getNotes() : "N/A")
                .append("\n\n");
        builder.append("Thank you,\nSmartShelfX Inventory Team\n");
        return builder.toString();
    }

    private String buildSmsBody(PurchaseOrderEntity order) {
        String total = order.getTotalAmount() != null ? order.getTotalAmount().toPlainString() : "0";
        String items = order.getItems().stream()
                .limit(3)
                .map(item -> item.getProductName() + " x" + item.getQuantity())
                .collect(Collectors.joining(", "));
        if (order.getItems().size() > 3) {
            items += ", ...";
        }
        StringBuilder builder = new StringBuilder();
        builder.append("PO ").append(order.getReference())
                .append(" total ").append(total)
                .append(". Items: ").append(items);
        if (order.getExpectedDeliveryDate() != null) {
            builder.append(". Deliver by ")
                    .append(DATE_FORMATTER.format(order.getExpectedDeliveryDate().toLocalDate()));
        }
        return builder.toString();
    }

    private String mergeFailure(@Nullable String existing, @Nullable String addition) {
        if (!StringUtils.hasText(addition)) {
            return existing;
        }
        if (!StringUtils.hasText(existing)) {
            return addition;
        }
        return existing + "; " + addition;
    }

    private record VendorDispatchOutcome(boolean dispatched, String errorMessage) {
        static VendorDispatchOutcome success() {
            return new VendorDispatchOutcome(true, null);
        }

        static VendorDispatchOutcome failed(String errorMessage) {
            return new VendorDispatchOutcome(false, errorMessage);
        }
    }
}
