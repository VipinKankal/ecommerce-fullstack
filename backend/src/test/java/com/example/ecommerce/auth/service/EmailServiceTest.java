package com.example.ecommerce.auth.service;

import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.env.Environment;
import org.springframework.mail.MailSendException;
import org.springframework.mail.javamail.JavaMailSender;

import java.util.Properties;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EmailServiceTest {

    @Mock
    private JavaMailSender javaMailSender;

    @Mock
    private Environment environment;

    @Test
    void shouldAllowDevelopmentFallbackWhenMailSendFails() throws Exception {
        EmailService emailService = new EmailService(javaMailSender, environment, true, true);
        MimeMessage mimeMessage = new MimeMessage(Session.getInstance(new Properties()));

        when(environment.getActiveProfiles()).thenReturn(new String[0]);
        when(javaMailSender.createMimeMessage()).thenReturn(mimeMessage);
        doThrow(new MailSendException("smtp failed")).when(javaMailSender).send(any(MimeMessage.class));

        assertDoesNotThrow(() ->
                emailService.sendVerificationEmail("dev@example.com", "OTP", "123456", "Your OTP is 123456"));
    }

    @Test
    void shouldThrowWhenProdMailSendFails() throws Exception {
        EmailService emailService = new EmailService(javaMailSender, environment, true, true);
        MimeMessage mimeMessage = new MimeMessage(Session.getInstance(new Properties()));

        when(environment.getActiveProfiles()).thenReturn(new String[]{"prod"});
        when(javaMailSender.createMimeMessage()).thenReturn(mimeMessage);
        doThrow(new MailSendException("smtp failed")).when(javaMailSender).send(any(MimeMessage.class));

        assertThrows(MailSendException.class, () ->
                emailService.sendVerificationEmail("prod@example.com", "OTP", "123456", "Your OTP is 123456"));
    }
}
