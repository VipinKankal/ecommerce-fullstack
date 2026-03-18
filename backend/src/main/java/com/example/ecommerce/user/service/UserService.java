package com.example.ecommerce.user.service;

import com.example.ecommerce.common.domain.AccountStatus;
import com.example.ecommerce.modal.User;

import java.util.List;

public interface UserService {
    User findUserByJwtToken(String jwt) throws Exception;
    User findUserByEmail(String email) throws Exception;
    User saveUser(User user);
    List<User> getAllUsers();
    User updateUserAccountStatus(Long id, AccountStatus status) throws Exception;
}




