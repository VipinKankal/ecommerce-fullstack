import React, { useState } from "react";
import { Drawer, IconButton } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { Navigate } from "react-router-dom";
import AdminDrawerList from "../../components/AdminDrawerList";
import AdminRoutes from "../../../Routes/AdminRoutes";
import { getAuthRole } from "../../../Config/Api";
import { useAppSelector } from "../../../State/Store";

const AdminDashboard = () => {
  const authRole = getAuthRole();
  const admin = useAppSelector((state) => state.adminAuth.user);
  // State to manage mobile drawer visibility
  const [mobileOpen, setMobileOpen] = useState(false);

  // Function to toggle drawer state
  const toggleDrawer = () => {
    setMobileOpen(!mobileOpen);
  };

  if (authRole !== "admin" || !admin) {
    return <Navigate to="/admin/login" replace />;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile Drawer (Temporary) */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={toggleDrawer}
        ModalProps={{ keepMounted: true }} // Better open performance on mobile.
        sx={{
          display: { xs: "block", lg: "none" },
          "& .MuiDrawer-paper": { boxSizing: "border-box", width: 260 },
        }}
      >
        <AdminDrawerList toggleDrawer={toggleDrawer} />
      </Drawer>

      <aside className="hidden lg:block h-full w-64 border-r bg-white">
        <AdminDrawerList />
      </aside>

      <section className="flex h-full flex-1 flex-col overflow-hidden bg-gray-50">
        <header className="lg:hidden flex items-center p-4 bg-white border-b">
          <IconButton onClick={toggleDrawer} color="primary">
            <MenuIcon />
          </IconButton>
          <h1 className="ml-4 text-xl font-bold text-slate-800">Admin Panel</h1>
        </header>

        <main className="h-full overflow-y-auto p-4 lg:p-8">
          <AdminRoutes />
        </main>
      </section>
    </div>
  );
};

export default AdminDashboard;
