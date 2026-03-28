package com.example.ecommerce.user.service.impl;

import com.example.ecommerce.common.configuration.AuthenticatedPrincipalService;
import com.example.ecommerce.common.configuration.JwtProvider;
import com.example.ecommerce.common.domain.AccountStatus;
import com.example.ecommerce.common.exceptions.UserNotFoundException;
import com.example.ecommerce.modal.User;
import com.example.ecommerce.repository.UserRepository;
import com.example.ecommerce.user.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final JwtProvider jwtProvider;
    private final AuthenticatedPrincipalService authenticatedPrincipalService;

    @Override
    public User findUserByJwtToken(String jwt) throws Exception {
        String email = (jwt != null && !jwt.isBlank())
                ? jwtProvider.getEmailFromToken(jwt)
                : authenticatedPrincipalService.currentEmail();
        return this.findUserByEmail(email);
    }

    @Override
    public User findUserByEmail(String email) throws Exception {
        String normalizedEmail = email == null ? null : email.trim().toLowerCase();
        return userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> UserNotFoundException.byEmail(normalizedEmail));
    }

    @Override
    public User saveUser(User user) {
        return userRepository.save(user);
    }

    @Override
    public List<User> getAllUsers() {
        return userRepository.findAllByOrderByIdDesc();
    }

    @Override
    public User updateUserAccountStatus(Long id, AccountStatus status) throws Exception {
        User user = userRepository.findById(id)
                .orElseThrow(() -> UserNotFoundException.byId(id));
        user.setAccountStatus(status);
        return userRepository.save(user);
    }
}
