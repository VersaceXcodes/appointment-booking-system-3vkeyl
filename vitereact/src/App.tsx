import React from "react";
import { Route, Routes, useLocation } from "react-router-dom";

/* Global Shared Views */
import GV_TopNav from '@/components/views/GV_TopNav.tsx';
import GV_Footer from '@/components/views/GV_Footer.tsx';
import GV_AdminNav from '@/components/views/GV_AdminNav.tsx';

/* Unique Views for Public Users */
import UV_Homepage from '@/components/views/UV_Homepage.tsx';
import UV_Login from '@/components/views/UV_Login.tsx';
import UV_Register from '@/components/views/UV_Register.tsx';
import UV_ForgotPassword from '@/components/views/UV_ForgotPassword.tsx';
import UV_BookingPage from '@/components/views/UV_BookingPage.tsx';
import UV_BookingConfirmation from '@/components/views/UV_BookingConfirmation.tsx';
import UV_UserDashboard from '@/components/views/UV_UserDashboard.tsx';
import UV_AppointmentDetail from '@/components/views/UV_AppointmentDetail.tsx';
import UV_Reschedule from '@/components/views/UV_Reschedule.tsx';
import UV_Cancellation from '@/components/views/UV_Cancellation.tsx';

/* Unique Views for Admin Users */
import UV_AdminLogin from '@/components/views/UV_AdminLogin.tsx';
import UV_AdminDashboard from '@/components/views/UV_AdminDashboard.tsx';
import UV_AdminTimeSlotManagement from '@/components/views/UV_AdminTimeSlotManagement.tsx';
import UV_AdminUpdateAppointment from '@/components/views/UV_AdminUpdateAppointment.tsx';

const App: React.FC = () => {
  const location = useLocation();

  // Check if the current route is for an admin page
  const isAdminRoute = location.pathname.startsWith("/admin");
  // For admin login, do not show admin nav
  const isAdminLoginRoute = location.pathname === "/admin/login";

  return (
    <div className="flex flex-col min-h-screen">
      {/* Global Navigation */}
      {isAdminRoute ? (
        // For admin pages (except the login page), show the admin nav bar.
        !isAdminLoginRoute && (
          <header className="shadow-md">
            <GV_AdminNav />
          </header>
        )
      ) : (
        // For public pages, show the public top navigation.
        <header className="shadow-md">
          <GV_TopNav />
        </header>
      )}

      {/* Main Content */}
      <main className="flex-1">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<UV_Homepage />} />
          <Route path="/login" element={<UV_Login />} />
          <Route path="/register" element={<UV_Register />} />
          <Route path="/forgot_password" element={<UV_ForgotPassword />} />
          <Route path="/book_appointment" element={<UV_BookingPage />} />
          <Route path="/booking_confirmation" element={<UV_BookingConfirmation />} />
          <Route path="/dashboard" element={<UV_UserDashboard />} />
          <Route path="/appointment_detail/:appointment_uid" element={<UV_AppointmentDetail />} />
          <Route path="/reschedule/:appointment_uid" element={<UV_Reschedule />} />
          <Route path="/cancellation/:appointment_uid" element={<UV_Cancellation />} />

          {/* Admin Routes */}
          <Route path="/admin/login" element={<UV_AdminLogin />} />
          <Route path="/admin/dashboard" element={<UV_AdminDashboard />} />
          <Route path="/admin/time_slots" element={<UV_AdminTimeSlotManagement />} />
          <Route path="/admin/update_appointment/:appointment_uid" element={<UV_AdminUpdateAppointment />} />
        </Routes>
      </main>

      {/* Global Footer for public pages only */}
      {!isAdminRoute && (
        <footer className="mt-auto">
          <GV_Footer />
        </footer>
      )}
    </div>
  );
};

export default App;