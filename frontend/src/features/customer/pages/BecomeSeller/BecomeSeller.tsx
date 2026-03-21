import React, { useState } from 'react';
import SellerAccountForm from './SellerAccountForm';
import SellerLoginForm from './SellerLoginForm';
import { Button } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';

const BecomeSeller = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(
    new URLSearchParams(location.search).get('login') === '1',
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 min-h-screen">
      {/* Left Side: Info/Branding */}
      <div className="bg-primary-color flex flex-col justify-center items-center text-white p-10 hidden lg:flex">
        <h1 className="text-4xl font-bold mb-5">Join our Marketplace</h1>
        <p className="text-xl">
          Thousands of sellers are growing their business with us.
        </p>
      </div>

      {/* Right Side: Form Logic */}
      <div className="flex flex-col justify-center items-center p-5">
        <div className=" max-w-xl rounded-xl p-5">
          {!isLogin ? (
            <SellerAccountForm
              onRegisterSuccess={() => navigate('/seller/verify-email')}
            />
          ) : (
            <SellerLoginForm />
          )}

          <div className="mt-10 text-center space-y-2">
            <p className="text-gray-600">
              {isLogin
                ? "Don't have an account?"
                : 'Already have a seller account?'}
            </p>
            <Button
              fullWidth
              variant="text"
              onClick={() => setIsLogin(!isLogin)}
              className="font-bold"
            >
              {isLogin ? 'Register Now' : 'Login Here'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BecomeSeller;
