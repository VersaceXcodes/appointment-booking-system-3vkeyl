import React, { useState, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useDispatch } from "react-redux";
import { auth_actions } from "@/store/main";

const UV_Register: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Local state for registration form data
  const [registrationForm, setRegistrationForm] = useState({
    fullName: "",
    email: "",
    password: "",
    phone: "",
    errorMessage: "",
    loading: false,
  });

  // Handler for input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setRegistrationForm((prev) => ({
      ...prev,
      [name]: value,
      errorMessage: "", // Clear error on change
    }));
  };

  // Client-side validation function for email
  const isValidEmail = (email: string) => {
    // Simple email regex for basic validation
    return /\S+@\S+\.\S+/.test(email);
  };

  // Form submission handler
  const onSubmitRegister = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Basic validation to ensure all fields are filled
    if (
      !registrationForm.fullName.trim() ||
      !registrationForm.email.trim() ||
      !registrationForm.password.trim() ||
      !registrationForm.phone.trim()
    ) {
      setRegistrationForm((prev) => ({
        ...prev,
        errorMessage: "Please fill in all fields.",
      }));
      return;
    }
    if (!isValidEmail(registrationForm.email)) {
      setRegistrationForm((prev) => ({
        ...prev,
        errorMessage: "Please enter a valid email address.",
      }));
      return;
    }

    try {
      setRegistrationForm((prev) => ({ ...prev, loading: true, errorMessage: "" }));
      // Prepare payload: note that API expects "name" instead of "fullName"
      const payload = {
        name: registrationForm.fullName,
        email: registrationForm.email,
        password: registrationForm.password,
        phone: registrationForm.phone,
      };

      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/auth/register`,
        payload,
        { headers: { "Content-Type": "application/json" } }
      );

      // Assuming the response contains user details along with a token
      if (response.status === 201) {
        const userData = response.data;
        // Update global auth_state with user details and set is_authenticated true
        dispatch(
          auth_actions.set_auth_state({
            user_uid: userData.user_uid,
            name: userData.name,
            email: userData.email,
            phone: userData.phone,
            role: userData.role,
            token: userData.token || "",
            is_authenticated: true,
          })
        );
        // Redirect to the dashboard on successful registration
        navigate("/dashboard");
      }
    } catch (error: any) {
      // Capture any errors and update errorMessage
      let errorMsg = "Registration failed. Please try again.";
      if (error.response && error.response.data) {
        errorMsg = error.response.data.message || errorMsg;
      }
      setRegistrationForm((prev) => ({
        ...prev,
        errorMessage: errorMsg,
      }));
    } finally {
      setRegistrationForm((prev) => ({ ...prev, loading: false }));
    }
  };

  return (
    <>
      <div className="max-w-md mx-auto my-8 p-6 bg-white shadow-md rounded">
        <h1 className="text-2xl font-semibold text-center mb-6">Create an Account</h1>
        {registrationForm.errorMessage && (
          <div className="mb-4 text-red-500 text-center">
            {registrationForm.errorMessage}
          </div>
        )}
        <form onSubmit={onSubmitRegister}>
          <div className="mb-4">
            <label htmlFor="fullName" className="block text-gray-700 mb-1">
              Full Name
            </label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              value={registrationForm.fullName}
              onChange={handleInputChange}
              className="border p-2 w-full rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Your full name"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="email" className="block text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={registrationForm.email}
              onChange={handleInputChange}
              className="border p-2 w-full rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="you@example.com"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="password" className="block text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={registrationForm.password}
              onChange={handleInputChange}
              className="border p-2 w-full rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your password"
            />
          </div>
          <div className="mb-6">
            <label htmlFor="phone" className="block text-gray-700 mb-1">
              Phone Number
            </label>
            <input
              type="text"
              id="phone"
              name="phone"
              value={registrationForm.phone}
              onChange={handleInputChange}
              className="border p-2 w-full rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. 1234567890"
            />
          </div>
          <button
            type="submit"
            disabled={registrationForm.loading}
            className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {registrationForm.loading ? "Registering..." : "Register"}
          </button>
        </form>
        <div className="mt-4 text-center">
          <span className="text-gray-600">Already have an account?</span>{" "}
          <Link to="/login" className="text-blue-500 hover:underline">
            Login
          </Link>
        </div>
      </div>
    </>
  );
};

export default UV_Register;