import React from 'react';
import {
  FavoriteBorder,
  Home,
  Search,
  ShoppingBagOutlined,
  StorefrontOutlined,
} from '@mui/icons-material';

const navItems = [
  { id: 'home', icon: Home },
  { id: 'search', icon: Search },
  { id: 'product', icon: StorefrontOutlined },
  { id: 'cart', icon: ShoppingBagOutlined },
  { id: 'wishlist', icon: FavoriteBorder },
];

const BottomNav = ({ active = 'product' }) => {
  return (
    <nav className="fixed bottom-0 left-1/2 z-50 flex h-16 w-full max-w-[400px] -translate-x-1/2 items-center border-t border-gray-200 bg-white px-2 shadow-[0_-8px_24px_rgba(15,23,42,0.08)]">
      <div className="grid w-full grid-cols-5 items-center">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.id === active;

          return (
            <button
              key={item.id}
              type="button"
              className={`flex items-center justify-center rounded-2xl px-2 py-1 transition ${
                isActive
                  ? 'text-black'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
              aria-label={item.id}
            >
              <span
                className={`flex h-10 w-10 items-center justify-center rounded-2xl ${
                  isActive ? 'bg-gray-100 shadow-sm' : ''
                }`}
              >
                <Icon sx={{ fontSize: isActive ? 24 : 23 }} />
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
