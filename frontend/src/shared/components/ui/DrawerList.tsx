import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Divider } from '@mui/material';
import { useAppDispatch } from 'app/store/Store';
import { logout } from 'State/features/seller/auth/thunks';

interface MenuItem {
  name: string;
  path: string;
  icon: React.ReactNode;
  activeIcon?: React.ReactNode;
}

interface DrawerListProp {
  menu: MenuItem[];
  menu2?: MenuItem[];
  toggleDrawer?: () => void;
  onLogout?: () => void;
}

const DrawerList = ({
  menu,
  menu2,
  toggleDrawer,
  onLogout,
}: DrawerListProp) => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
      return;
    }
    dispatch(logout(navigate));
    if (toggleDrawer) toggleDrawer();
  };

  return (
    <div className="w-64 h-full flex flex-col justify-between py-5">
      <div className="space-y-2">
        {menu.map((item) => (
          <NavLink
            to={item.path}
            key={item.path}
            onClick={toggleDrawer}
            className={({ isActive }) =>
              `flex items-center px-6 py-3 transition-colors duration-200 group ${
                isActive
                  ? 'bg-teal-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`
            }
          >
            <div className="flex items-center gap-4">
              <div
                className={`${location.pathname === item.path ? 'text-white' : 'text-teal-600'}`}
              >
                {location.pathname === item.path ? item.activeIcon : item.icon}
              </div>
              <span className="font-medium">{item.name}</span>
            </div>
          </NavLink>
        ))}
      </div>

      <div>
        <Divider />
        <div className="space-y-2 mt-4">
          {menu2?.map((item) => (
            <button
              type="button"
              key={`${item.path}-${item.name}`}
              onClick={() =>
                item.name.toLowerCase() === 'logout'
                  ? handleLogout()
                  : navigate(item.path)
              }
              className="flex w-full items-center px-6 py-3 text-left text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="text-teal-600 group-hover:text-red-600">
                  {item.icon}
                </div>
                <span className="font-medium">{item.name}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DrawerList;
