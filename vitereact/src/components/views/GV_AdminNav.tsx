import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch, auth_actions } from "@/store/main";

const GV_AdminNav: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const authState = useSelector((state: RootState) => state.auth);

  // Initialize the admin navigation links with their default values.
  const [adminNavLinks] = useState([
    { label: "Dashboard", href: "/admin/dashboard" },
    { label: "Time Slot Management", href: "/admin/time_slots" },
    { label: "Appointment Management", href: "/admin/appointments" }
  ]);

  // State to track which navigation link is currently active.
  const [activeLink, setActiveLink] = useState<{ link: string }>({ link: "" });

  // Function to handle a click on any navigation link.
  const handleAdminNavClick = (href: string) => {
    setActiveLink({ link: href });
    navigate(href);
  };

  // Function to handle the logout button click.
  const handleLogout = () => {
    dispatch(auth_actions.clear_auth_state());
    navigate("/admin/login");
  };

  return (
    <>
      <nav className="bg-gray-800 text-white flex items-center justify-between px-6 py-4">
        <div className="flex space-x-4">
          {adminNavLinks.map((link, index) => (
            <Link
              key={index}
              to={link.href}
              onClick={() => handleAdminNavClick(link.href)}
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                activeLink.link === link.href ? "bg-gray-600" : "hover:bg-gray-700"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
        <div className="flex items-center space-x-4">
          {authState.is_authenticated && authState.name ? (
            <span className="text-sm">Welcome, {authState.name}</span>
          ) : null}
          <button
            onClick={handleLogout}
            className="px-3 py-2 rounded-md text-sm font-medium bg-red-600 hover:bg-red-700"
          >
            Logout
          </button>
        </div>
      </nav>
    </>
  );
};

export default GV_AdminNav;