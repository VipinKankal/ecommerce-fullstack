import React, { useState } from 'react';
import {
  Avatar,
  Box,
  Button,
  IconButton,
  useMediaQuery,
  useTheme,
  Drawer,
  List,
  ListItemText,
  ListItem,
  ListItemButton,
} from '@mui/material';
import {
  Menu as MenuIcon,
  AddShoppingCart,
  FavoriteBorder,
  Search as SearchIcon,
  HomeOutlined,
  Inventory2Outlined,
  ShoppingBagOutlined,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { mainCategory } from 'shared/constants/data/Category/mainCategory';
import CategorySheet, { CategoryKey } from './CategorySheet';
import { useAppSelector } from 'app/store/Store';
import { CartItem } from 'shared/types/cart.types';

const EMPTY_CART_ITEMS: CartItem[] = [];

const Navbar = () => {
  const theme = useTheme();
  const isLarge = useMediaQuery(theme.breakpoints.up('lg'));
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey>('men');
  const [showCategorySheet, setShowCategorySheet] = useState(false);
  const [openMobileDrawer, setOpenMobileDrawer] = useState(false);

  const seller = useAppSelector((s) => s.sellerAuth.profile);
  const user = useAppSelector((s) => s.customerAuth.user);
  const cart = useAppSelector(
    (s) => s.cart.cart?.cartItems ?? EMPTY_CART_ITEMS,
  );
  const wishlistCount = useAppSelector((s) => s.wishlist.items.length);
  const mobileNavItemClass =
    'flex min-w-0 flex-1 flex-col items-center justify-center gap-1 border-none bg-transparent px-1 py-2 text-[11px] font-medium text-gray-700';

  const actionButtonSx = {
    borderRadius: '20px',
    color: 'teal',
    borderColor: 'teal',
    textTransform: 'none',
    fontWeight: 700,
    px: 3,
    '&:hover': {
      borderColor: '#004d40',
      color: '#004d40',
      bgcolor: 'rgba(0, 128, 128, 0.04)',
    },
  };

  return (
    <nav className="relative">
      <Box className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="flex items-center justify-between px-3 sm:px-5 lg:px-20 h-[64px] lg:h-[75px]">
          <div className="flex items-center gap-3 lg:gap-10 min-w-0">
            <div className="flex items-center">
              {!isLarge && (
                <IconButton
                  onClick={() => setOpenMobileDrawer(true)}
                  edge="start"
                  className="mr-2"
                >
                  <MenuIcon />
                </IconButton>
              )}
              <button
                type="button"
                onClick={() => navigate('/')}
                className="logo cursor-pointer text-xl sm:text-2xl text-teal-600 font-black tracking-tighter truncate"
              >
                SHOPPER
              </button>
            </div>

            {isLarge && (
              <ul className="flex items-center font-semibold text-gray-700 h-full">
                {mainCategory.map((item) => (
                  <li
                    key={item.categoryId}
                    onMouseEnter={() => {
                      setSelectedCategory(item.categoryId as CategoryKey);
                      setShowCategorySheet(true);
                    }}
                    className={`h-[75px] px-5 flex items-center cursor-pointer border-b-2 transition-all duration-200 ${
                      showCategorySheet && selectedCategory === item.categoryId
                        ? 'text-teal-600 border-teal-600'
                        : 'border-transparent hover:text-teal-600'
                    }`}
                  >
                    {item.name}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex gap-1 lg:gap-3 items-center">
            <IconButton className="hover:text-teal-600">
              <SearchIcon />
            </IconButton>

            {user ? (
              <Box
                component="button"
                type="button"
                onClick={() => navigate('/account/orders')}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  cursor: 'pointer',
                  px: 1,
                  py: 0.5,
                  borderRadius: 2,
                  border: 'none',
                  background: 'transparent',
                  '&:hover': { backgroundColor: '#f5f5f5' },
                }}
              >
                <Avatar
                  sx={{
                    bgcolor: 'teal',
                    width: 35,
                    height: 35,
                    fontSize: '1rem',
                  }}
                >
                  {user?.fullName?.charAt(0).toUpperCase()}
                </Avatar>

                {isLarge && (
                  <span className="font-semibold text-sm">
                    {user?.fullName}
                  </span>
                )}
              </Box>
            ) : (
              <Button
                onClick={() => navigate('/login')}
                variant="outlined"
                sx={actionButtonSx}
                className="hidden sm:flex"
              >
                Login
              </Button>
            )}

            <div className="flex gap-1 lg:gap-3 items-center">
              {seller ? (
                <Box
                  component="button"
                  type="button"
                  onClick={() => navigate('/seller/dashboard')}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    cursor: 'pointer',
                    px: 1,
                    py: 0.5,
                    borderRadius: 2,
                    border: 'none',
                    background: 'transparent',
                    '&:hover': { backgroundColor: '#f5f5f5' },
                  }}
                >
                  <Avatar
                    sx={{
                      bgcolor: 'teal',
                      width: 35,
                      height: 35,
                      fontSize: '1rem',
                    }}
                  >
                    {seller?.sellerName?.charAt(0).toUpperCase()}
                  </Avatar>

                  {isLarge && (
                    <span className="font-semibold text-sm">
                      {seller?.sellerName}
                    </span>
                  )}
                </Box>
              ) : (
                <Button
                  onClick={() => navigate('/become-seller')}
                  variant="outlined"
                  sx={actionButtonSx}
                  className="hidden lg:flex"
                >
                  seller Login
                </Button>
              )}

              <IconButton onClick={() => navigate('/checkout/cart')}>
                <div className="relative">
                  <AddShoppingCart />
                  {cart.length > 0 && (
                    <span className="absolute -top-2 -right-2 bg-teal-600 text-white text-xs px-2 rounded-full">
                      {cart.length}
                    </span>
                  )}
                </div>
              </IconButton>

              <IconButton
                onClick={() => navigate(user ? '/wishlist' : '/login')}
              >
                <div className="relative">
                  <FavoriteBorder />
                  {wishlistCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-rose-500 text-white text-xs px-2 rounded-full">
                      {wishlistCount}
                    </span>
                  )}
                </div>
              </IconButton>
            </div>
          </div>
        </div>

        {isLarge && (
          <div
            onMouseLeave={() => setShowCategorySheet(false)}
            className={`absolute left-0 right-0 top-[64px] lg:top-[75px] z-50 bg-white shadow-xl transition-all duration-300 ease-in-out ${
              showCategorySheet
                ? 'opacity-100 translate-y-0 visible'
                : 'opacity-0 -translate-y-2 invisible'
            }`}
          >
            <CategorySheet
              selectedCategory={selectedCategory}
              setShowSheet={setShowCategorySheet}
            />
          </div>
        )}
      </Box>

      {!isLarge && !user && (
        <button
          type="button"
          onClick={() => navigate('/login')}
          className="fixed right-3 top-[74px] z-[60] rounded-sm border border-[#5b84ff] bg-white px-3 py-1 text-[11px] font-medium text-gray-700 shadow-sm"
        >
          login
        </button>
      )}

      <Drawer
        anchor="left"
        open={openMobileDrawer}
        onClose={() => setOpenMobileDrawer(false)}
      >
        <Box sx={{ width: 280 }}>
          <div className="px-6 py-6 border-b">
            <p className="text-2xl font-black text-teal-600">SHOPPER</p>
          </div>
          <List sx={{ pt: 1 }}>
            <ListItem disablePadding>
              <ListItemButton
                onClick={() => {
                  navigate(user ? '/wishlist' : '/login');
                  setOpenMobileDrawer(false);
                }}
                sx={{ px: 3, py: 1.5 }}
              >
                <ListItemText
                  primary="Wishlist"
                  primaryTypographyProps={{
                    fontWeight: 600,
                    color: 'text.primary',
                  }}
                />
              </ListItemButton>
            </ListItem>
            {mainCategory.map((item) => (
              <ListItem key={item.categoryId} disablePadding>
                <ListItemButton
                  onClick={() => {
                    navigate(`/products/${item.categoryId}`);
                    setOpenMobileDrawer(false);
                  }}
                  sx={{ px: 3, py: 1.5 }}
                >
                  <ListItemText
                    primary={item.name}
                    primaryTypographyProps={{
                      fontWeight: 600,
                      color: 'text.primary',
                    }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>

          <Box className="p-5 mt-auto">
            <Button
              fullWidth
              variant="contained"
              onClick={() => navigate('/login')}
              sx={{ bgcolor: 'teal', borderRadius: '10px' }}
            >
              Login / Register
            </Button>
          </Box>
        </Box>
      </Drawer>

      {showCategorySheet && isLarge && (
        <div
          onMouseEnter={() => setShowCategorySheet(false)}
          className="fixed inset-0 bg-black/30 z-40 backdrop-blur-[2px]"
        />
      )}

      {!isLarge && (
        <div className="fixed inset-x-0 bottom-0 z-50 border-t border-gray-200 bg-white">
          <div className="mx-auto flex max-w-md items-stretch justify-between">
            <button
              type="button"
              onClick={() => navigate('/')}
              className={mobileNavItemClass}
            >
              <HomeOutlined sx={{ fontSize: 24 }} />
            </button>
            <button
              type="button"
              onClick={() => navigate('/products/men')}
              className={mobileNavItemClass}
            >
              <SearchIcon sx={{ fontSize: 24 }} />
            </button>
            <button
              type="button"
              onClick={() => navigate('/products/men')}
              className={mobileNavItemClass}
            >
              <Inventory2Outlined sx={{ fontSize: 24 }} />
            </button>
            <button
              type="button"
              onClick={() => navigate('/checkout/cart')}
              className={mobileNavItemClass}
            >
              <ShoppingBagOutlined sx={{ fontSize: 24 }} />
            </button>
            <button
              type="button"
              onClick={() => navigate(user ? '/wishlist' : '/login')}
              className={mobileNavItemClass}
            >
              <FavoriteBorder sx={{ fontSize: 24 }} />
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
