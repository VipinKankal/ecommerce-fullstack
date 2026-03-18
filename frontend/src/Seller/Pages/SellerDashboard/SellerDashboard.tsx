import React, { useState } from 'react';
import { Drawer, IconButton } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import SellerDrawerList from '../../Components/SellerDrawerList';
import SellerRoutes from '../../../Routes/SellerRoutes';

const SellerDashboard = () => {
    const [mobileOpen, setMobileOpen] = useState(false);

    const toggleDrawer = () => {
        setMobileOpen(!mobileOpen);
    };

    return (
        <div className='flex h-screen overflow-hidden'>
            {/* Mobile Drawer (Temporary) */}
            <Drawer
                variant="temporary"
                open={mobileOpen}
                onClose={toggleDrawer}
                ModalProps={{ keepMounted: true }} 
                sx={{
                    display: { xs: 'block', lg: 'none' },
                    '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 260 },
                }}
            >
                <SellerDrawerList toggleDrawer={toggleDrawer} />
            </Drawer>

            {/* Desktop Sidebar (Permanent) */}
            <section className='hidden lg:block w-64 border-r h-full bg-white'>
                <SellerDrawerList />
            </section>

            {/* Main Content Area */}
            <section className='flex-1 flex flex-col h-full overflow-hidden bg-gray-50'>
                {/* Mobile Header */}
                <header className="lg:hidden flex items-center p-4 bg-white border-b">
                    <IconButton onClick={toggleDrawer} color="primary">
                        <MenuIcon />
                    </IconButton>
                    <h1 className="ml-4 text-xl font-bold text-primary-color">Seller Panel</h1>
                </header>

                {/* Content Section */}
                <main className='p-5 lg:p-10 overflow-y-auto h-full'>
                    <SellerRoutes />
                </main>
            </section>
        </div>
    );
};

export default SellerDashboard;