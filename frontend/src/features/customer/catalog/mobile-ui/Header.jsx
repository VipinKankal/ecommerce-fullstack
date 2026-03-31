import React, { useEffect, useRef, useState } from 'react';
import { AccountCircleOutlined } from '@mui/icons-material';

const Header = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogin = () => {
    setIsLoggedIn(true);
    setIsMenuOpen(false);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setIsMenuOpen(false);
  };

  return (
    <header className="fixed left-1/2 top-0 z-50 flex h-14 w-full max-w-[400px] -translate-x-1/2 items-center justify-between border-b border-gray-200 bg-white px-4">
      <div className="min-w-0">
        <p className="truncate text-xs font-semibold uppercase tracking-[0.22em] text-gray-800">
          BRAND NAME
        </p>
      </div>

      <div ref={menuRef} className="relative flex items-center gap-2">
        {!isLoggedIn ? (
          <button
            type="button"
            onClick={handleLogin}
            className="rounded-md border border-sky-400 px-3 py-1 text-[11px] font-medium text-gray-700 transition hover:bg-sky-50"
          >
            Login
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setIsMenuOpen((current) => !current)}
              className="flex h-9 w-9 items-center justify-center rounded-full text-gray-700 transition hover:bg-gray-100"
              aria-label="Open profile menu"
            >
              <AccountCircleOutlined sx={{ fontSize: 28 }} />
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 top-11 w-40 overflow-hidden rounded-2xl border border-gray-200 bg-white py-1 shadow-[0_18px_40px_rgba(15,23,42,0.14)]">
                <button
                  type="button"
                  className="block w-full px-4 py-2 text-left text-sm text-gray-700 transition hover:bg-gray-50"
                >
                  My Profile
                </button>
                <button
                  type="button"
                  className="block w-full px-4 py-2 text-left text-sm text-gray-700 transition hover:bg-gray-50"
                >
                  Orders
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="block w-full px-4 py-2 text-left text-sm text-rose-600 transition hover:bg-rose-50"
                >
                  Logout
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </header>
  );
};

export default Header;
