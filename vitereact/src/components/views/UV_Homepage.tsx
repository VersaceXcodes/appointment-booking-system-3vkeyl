import React from "react";
import { useNavigate } from "react-router-dom";

const UV_Homepage: React.FC = () => {
  // Define the static homepage content based on the datamap
  const homepageContent = {
    serviceOverview: "Welcome to our Appointment Booking System. We offer seamless appointment scheduling.",
    tagline: "Effortless Scheduling at Your Fingertips",
    ctaLabel: "Book Appointment"
  };

  // Action: On clicking the CTA, navigate to the booking page
  const navigate = useNavigate();
  const onBookAppointmentClick = () => {
    navigate("/book_appointment");
  };

  return (
    <>
      <div className="bg-gray-50">
        <div className="container mx-auto px-4 py-12 text-center">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            {homepageContent.tagline}
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            {homepageContent.serviceOverview}
          </p>
          <button
            onClick={onBookAppointmentClick}
            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded transition duration-200"
          >
            {homepageContent.ctaLabel}
          </button>
        </div>
      </div>
    </>
  );
};

export default UV_Homepage;