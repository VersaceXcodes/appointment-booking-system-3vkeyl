import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { auth_actions } from "@/store/main";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";

const UV_AdminLogin: React.FC = () => {
  const [adminEmail, setAdminEmail] = useState<string>("");
  const [adminPassword, setAdminPassword] = useState<string>("");
  const [loginError, setLoginError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const submitAdminLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoginError("");
    setLoading(true);
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/auth/login`, {
        email: adminEmail,
        password: adminPassword,
      });
      if (response.status === 200) {
        const data = response.data; // Expected: { token, user }
        // Verify that the returned user is an admin
        if (data.user && data.user.role && data.user.role.toLowerCase() === "admin") {
          dispatch(
            auth_actions.set_auth_state({
              user_uid: data.user.user_uid,
              name: data.user.name,
              email: data.user.email,
              phone: data.user.phone,
              role: data.user.role,
              token: data.token,
              is_authenticated: true,
            })
          );
          navigate("/admin/dashboard");
        } else {
          setLoginError("You are not authorized to access the admin panel.");
        }
      } else {
        setLoginError("Login failed. Please try again.");
      }
    } catch (error: any) {
      if (error.response && error.response.data && error.response.data.message) {
        setLoginError(error.response.data.message);
      } else {
        setLoginError("An error occurred during login. Please try again later.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4 w-full max-w-md">
          <h2 className="block text-gray-700 text-2xl font-bold mb-6 text-center">Admin Login</h2>
          {loginError && (
            <div className="mb-4 text-red-500 text-center">
              {loginError}
            </div>
          )}
          <form onSubmit={submitAdminLogin}>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="adminEmail">
                Email or Username
              </label>
              <input
                id="adminEmail"
                type="text"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                placeholder="Enter your email or username"
                required
              />
            </div>
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="adminPassword">
                Password
              </label>
              <input
                id="adminPassword"
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
                placeholder="Enter your password"
                required
              />
            </div>
            <div className="flex items-center justify-between">
              <button
                type="submit"
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                disabled={loading}
              >
                {loading ? "Logging in..." : "Login"}
              </button>
              <Link
                to="/forgot_password"
                className="inline-block align-baseline font-bold text-sm text-blue-500 hover:text-blue-800"
              >
                Forgot Password?
              </Link>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default UV_AdminLogin;