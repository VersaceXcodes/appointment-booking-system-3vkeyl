import React, { useState, FormEvent } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

interface ForgotPasswordFormState {
  email: string;
  errorMessage: string;
  confirmationMessage: string;
  loading: boolean;
}

const UV_ForgotPassword: React.FC = () => {
  const [forgotPasswordForm, setForgotPasswordForm] = useState<ForgotPasswordFormState>({
    email: "",
    errorMessage: "",
    confirmationMessage: "",
    loading: false
  });

  const onSubmitForgotPassword = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Reset error and confirmation messages
    setForgotPasswordForm(prevState => ({ ...prevState, errorMessage: "", confirmationMessage: "" }));

    if (!forgotPasswordForm.email) {
      setForgotPasswordForm(prevState => ({ ...prevState, errorMessage: "Please enter your email address." }));
      return;
    }
    
    setForgotPasswordForm(prevState => ({ ...prevState, loading: true }));
    
    try {
      // Call the backend forgot_password API.
      // Assumption: The backend endpoint is '/api/auth/forgot_password' which processes the request.
      const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/auth/forgot_password`, {
        email: forgotPasswordForm.email
      });
      // Assuming the backend returns a message confirming the email was sent
      setForgotPasswordForm(prevState => ({
        ...prevState,
        confirmationMessage: "Reset instructions have been sent to your email address.",
        loading: false,
        email: ""
      }));
    } catch (error: any) {
      // Handle error message; use error.response.data.message if available
      const errorMsg = error.response && error.response.data && error.response.data.message 
        ? error.response.data.message 
        : "An error occurred. Please try again.";
      setForgotPasswordForm(prevState => ({
        ...prevState,
        errorMessage: errorMsg,
        loading: false
      }));
    }
  };

  return (
    <>
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
        <div className="w-full max-w-md bg-white rounded shadow-md p-6">
          <h1 className="text-2xl font-bold mb-4 text-center">Forgot Password</h1>
          <p className="mb-6 text-center text-gray-600">
            Enter your registered email address to receive password reset instructions.
          </p>
          <form onSubmit={onSubmitForgotPassword} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={forgotPasswordForm.email}
                onChange={(e) =>
                  setForgotPasswordForm(prevState => ({ ...prevState, email: e.target.value }))
                }
                className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            {forgotPasswordForm.errorMessage && (
              <div className="text-red-500 text-sm">
                {forgotPasswordForm.errorMessage}
              </div>
            )}
            {forgotPasswordForm.confirmationMessage && (
              <div className="text-green-500 text-sm">
                {forgotPasswordForm.confirmationMessage}
              </div>
            )}
            <div>
              <button
                type="submit"
                disabled={forgotPasswordForm.loading}
                className={`w-full py-2 px-4 rounded-md text-white ${
                  forgotPasswordForm.loading ? "bg-blue-300" : "bg-blue-600 hover:bg-blue-700"
                } focus:outline-none focus:ring-2 focus:ring-blue-500`}
              >
                {forgotPasswordForm.loading ? "Submitting..." : "Submit"}
              </button>
            </div>
          </form>
          <div className="mt-4 text-center">
            <Link to="/login" className="text-blue-600 hover:underline">
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default UV_ForgotPassword;