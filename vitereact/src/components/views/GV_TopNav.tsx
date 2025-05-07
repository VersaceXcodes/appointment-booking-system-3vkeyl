import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import type { RootState } from "@/store/main";
import { auth_actions } from "@/store/main";

const GV_TopNav: React.FC = () => {
  const auth = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();
  const [userDropdownVisible, setUserDropdownVisible] = useState(false);

  // Default navigation links as per datamap
  const navigationLinks = [
    { label: "Home", href: "/" },
    { label: "Book Appointment", href: "/book_appointment" },
    { label: "FAQ", href: "/faq" },
    { label: "Contact", href: "/contact" }
  ];

  // Default auth actions for unauthenticated users
  const unauthActions = [
    { label: "Login", href: "/login" },
    { label: "Register", href: "/register" }
  ];

  // For authenticated users, show Dashboard link
  const authenticatedActions = [{ label: "Dashboard", href: "/dashboard" }];

  // Handler for toggling the user dropdown menu
  const toggleUserDropdown = () => {
    setUserDropdownVisible(!userDropdownVisible);
  };

  // Handler for logout (clears auth state)
  const handleLogout = () => {
    dispatch(auth_actions.clear_auth_state());
    setUserDropdownVisible(false);
  };

  return (
    <>
      <nav className="bg-white shadow-md px-4 py-3 flex items-center justify-between relative">
        <div className="flex items-center space-x-4">
          <Link
            to="/"
            className="text-xl font-bold hover:text-blue-600"
          >
            Logo
          </Link>
          <div className="hidden md:flex space-x-4">
            {navigationLinks.map((link, index) => (
              <Link
                key={index}
                to={link.href}
                className="text-gray-700 hover:text-blue-600"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="flex items-center space-x-4">
          {auth.is_authenticated ? (
            <div className="relative">
              <button
                onClick={toggleUserDropdown}
                className="flex items-center space-x-2 focus:outline-none"
              >
                <span className="font-medium text-gray-700">
                  {auth.name}
                </span>
                <svg
                  className="w-4 h-4 fill-current text-gray-700"
                  viewBox="0 0 20 20"
                >
                  <path d="M5.516 7.548L10 12.03l4.484-4.482L16 8.07 10 14.07 4 8.07l1.516-1.522z"/>
                </svg>
              </button>
              {userDropdownVisible && (
                <div className="absolute right-0 mt-2 w-48 bg-white border rounded shadow-md z-10">
                  <Link
                    to="/dashboard"
                    onClick={() => setUserDropdownVisible(false)}
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex space-x-4">
              {unauthActions.map((action, index) => (
                <Link
                  key={index}
                  to={action.href}
                  className="text-gray-700 hover:text-blue-600"
                >
                  {action.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      </nav>
    </>
  );
};

export default GV_TopNav;