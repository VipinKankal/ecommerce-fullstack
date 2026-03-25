package com.example.ecommerce.auth.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.mail.MailException;
import org.springframework.mail.MailSendException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.util.Arrays;

@Service
public class EmailService {
    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender javaMailSender;
    private final Environment environment;
    private final boolean devFallbackEnabled;
    private final boolean devOtpLogEnabled;

    public EmailService(
            JavaMailSender javaMailSender,
            Environment environment,
            @Value("${app.email.dev-fallback-enabled:true}") boolean devFallbackEnabled,
            @Value("${app.email.dev-log-otp:true}") boolean devOtpLogEnabled
    ) {
        this.javaMailSender = javaMailSender;
        this.environment = environment;
        this.devFallbackEnabled = devFallbackEnabled;
        this.devOtpLogEnabled = devOtpLogEnabled;
    }

    public void sendVerificationEmail(String userEmail, String subject, String otp, String text) throws MessagingException {

        try {

            MimeMessage mimeMessage = javaMailSender.createMimeMessage();
            MimeMessageHelper mimeMessageHelper = new MimeMessageHelper(mimeMessage, "utf-8");

            mimeMessageHelper.setSubject(subject);
            mimeMessageHelper.setText(text);
            mimeMessageHelper.setTo(userEmail);
            javaMailSender.send(mimeMessage);

        } catch (MailException e) {
            if (shouldUseDevelopmentFallback()) {
                log.warn("Email delivery failed for {} but dev fallback is enabled. OTP remains valid for local testing.", userEmail, e);
                if (devOtpLogEnabled) {
                    log.warn("DEV_OTP_FALLBACK email={} subject={} otp={}", userEmail, subject, otp);
                }
                return;
            }
            log.error("Failed to send verification email to {}", userEmail, e);
            throw new MailSendException("Failed to send verification email", e);
        }
    }

    private boolean shouldUseDevelopmentFallback() {
        boolean prodProfile = Arrays.stream(environment.getActiveProfiles())
                .anyMatch(profile -> "prod".equalsIgnoreCase(profile));
        return devFallbackEnabled && !prodProfile;
    }

}




