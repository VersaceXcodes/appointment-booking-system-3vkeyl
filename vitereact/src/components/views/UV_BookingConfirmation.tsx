import React from "react";
import { useLocation, Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "@/store/main";

interface BookingData {
  appointment_uid: string;
  booking_reference: string;
  date: string;
  time: string;
  service_provider: string;
  notes: string;
}

const UV_BookingConfirmation: React.FC = () => {
  const location = useLocation();
  // Retrieve the bookingData from the route state if available
  const bookingData: BookingData = (location.state && location.state.bookingData) || {
    appointment_uid: "",
    booking_reference: "",
    date: "",
    time: "",
    service_provider: "",
    notes: ""
  };

  // Get the global auth_state to know whether the user is authenticated
  const authState = useSelector((state: RootState) => state.auth);

  return (
    <>
      <div className="max-w-3xl mx-auto p-4">
        <div className="bg-white shadow-lg rounded-lg p-6">
          <h1 className="text-2xl font-bold text-center mb-4">Booking Confirmation</h1>
          <p className="text-center text-gray-600 mb-6">
            Your appointment has been successfully booked. A confirmation email has been sent to you.
          </p>
          <div className="border rounded p-4 mb-6">
            <div className="mb-2">
              <span className="font-semibold">Booking Reference:</span>{" "}
              {bookingData.booking_reference}
            </div>
            <div className="mb-2">
              <span className="font-semibold">Date:</span> {bookingData.date}
            </div>
            <div className="mb-2">
              <span className="font-semibold">Time:</span> {bookingData.time}
            </div>
            <div className="mb-2">
              <span className="font-semibold">Service Provider:</span>{" "}
              {bookingData.service_provider}
            </div>
            {bookingData.notes && bookingData.notes.trim() !== "" && (
              <div className="mb-2">
                <span className="font-semibold">Notes:</span> {bookingData.notes}
              </div>
            )}
          </div>
          <div className="flex flex-col md:flex-row md:justify-center gap-4">
            <Link
              to="/dashboard"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-center"
            >
              Manage Appointments
            </Link>
            <Link
              to="/book_appointment"
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-center"
            >
              Book Another Appointment
            </Link>
          </div>
          {!authState.is_authenticated && (
            <div className="mt-6 text-center">
              <p className="text-gray-700">
                Booked as a Guest?{" "}
                <Link to="/register" className="text-blue-500 hover:underline">
                  Register now
                </Link>{" "}
                for easier management of your appointments.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default UV_BookingConfirmation;