import React, { useState } from 'react';
import { Button, Container, Box, Typography } from '@mui/material';
import RegisterFrom from './RegisterFrom';
import LoginForm from './LoginFrom';
import { useAppDispatch } from 'app/store/Store';
import { clearError, resetOtp } from 'State/features/customer/auth/slice';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const dispatch = useAppDispatch();

  const handleToggle = () => {
    dispatch(clearError());
    dispatch(resetOtp());
    setIsLogin(!isLogin);
  };

  // ✅ called after successful register
  const handleRegisterSuccess = () => {
    dispatch(resetOtp());
    setIsLogin(true); // switch to LoginForm
  };

  return (
    <Container maxWidth="xs" sx={{ mt: 10 }}>
      <Box>
        {isLogin ? (
          <LoginForm />
        ) : (
          <RegisterFrom onSuccess={handleRegisterSuccess} />
        )}
      </Box>

      <Box sx={{ mt: 3, textAlign: 'center', pt: 2 }}>
        <Typography variant="body2">
          {isLogin ? "Don't have an account?" : 'Already have an account?'}
        </Typography>

        <Button
          fullWidth
          onClick={handleToggle}
          sx={{ mt: 1, color: 'teal', fontWeight: 'bold' }}
        >
          {isLogin ? 'Create New Account' : 'Back to Login'}
        </Button>
      </Box>
    </Container>
  );
};

export default Auth;
