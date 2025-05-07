import React, { useState, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useDispatch } from "react-redux";
import { auth_actions } from "@/store/main";

interface LoginFormState {
  email: string;
  password: string;
  errorMessage: string;
  loading: boolean;
}

const UV_Login: React.FC = () => {
  const [loginForm, setLoginForm] = useState<LoginFormState>({
    email: "",
    password: "",
    errorMessage: "",
    loading: false,
  });

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const onSubmitLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Basic validation: check if email and password are provided.
    if (!loginForm.email || !loginForm.password) {
      setLoginForm((prevState) => ({
        ...prevState,
        errorMessage: "Please enter both email and password.",
      }));
      return;
    }

    setLoginForm((prevState) => ({ ...prevState, loading: true, errorMessage: "" }));

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/auth/login`,
        {
          email: loginForm.email,
          password: loginForm.password,
        }
      );
      // Expected response: { token: string, user: { user_uid, name, email, phone, role, ... } }
      const { token, user } = response.data;
      // Update global auth_state via Redux
      dispatch(
        auth_actions.set_auth_state({
          user_uid: user.user_uid,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          token: token,
          is_authenticated: true,
        })
      );
      // Navigate based on the user role
      if (user.role === "admin") {
        navigate("/admin/dashboard");
      } else {
        navigate("/dashboard");
      }
    } catch (error: any) {
      let errorMsg = "Login failed, please try again.";
      if (error.response && error.response.data && error.response.data.message) {
        errorMsg = error.response.data.message;
      }
      setLoginForm((prevState) => ({ ...prevState, errorMessage: errorMsg, loading: false }));
    }
  };

  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="w-full max-w-md p-8 space-y-6 bg-white rounded shadow-md">
          <h2 className="text-center text-3xl font-extrabold text-gray-900">Login</h2>
          <form className="mt-8 space-y-6" onSubmit={onSubmitLogin}>
            <div className="rounded-md shadow-sm -space-y-px">
              <div className="mb-4">
                <label htmlFor="email" className="sr-only">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  disabled={loginForm.loading}
                  required
                  className="appearance-none rounded relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Email address"
                  value={loginForm.email}
                  onChange={(e) =>
                    setLoginForm((prevState) => ({ ...prevState, email: e.target.value }))
                  }
                />
              </div>
              <div className="mb-4">
                <label htmlFor="password" className="sr-only">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  disabled={loginForm.loading}
                  required
                  className="appearance-none rounded relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Password"
                  value={loginForm.password}
                  onChange={(e) =>
                    setLoginForm((prevState) => ({ ...prevState, password: e.target.value }))
                  }
                />
              </div>
            </div>
            {loginForm.errorMessage && (
              <div className="text-red-500 text-sm text-center">{loginForm.errorMessage}</div>
            )}
            <div>
              <button
                type="submit"
                disabled={loginForm.loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {loginForm.loading ? "Logging in..." : "Login"}
              </button>
            </div>
          </form>
          <div className="flex justify-between text-sm">
            <Link
              to="/forgot_password"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Forgot Password?
            </Link>
            <Link
              to="/register"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Register
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default UV_Login;