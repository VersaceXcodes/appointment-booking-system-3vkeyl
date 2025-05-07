import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import axios from "axios";
import { RootState } from "@/store/main";

interface AppointmentDetailType {
  appointment_uid: string;
  date: string;
  time: string;
  booking_reference: string;
  service_provider: string;
  status: string;
  notes: string;
  customer_details: {
    name: string;
    email: string;
    phone: string;
  };
}

const UV_AppointmentDetail: React.FC = () => {
  const { appointment_uid } = useParams<{ appointment_uid: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Access global auth_state and appointments from Redux store
  const auth_state = useSelector((state: RootState) => state.auth);
  const appointments = useSelector((state: RootState) => state.appointments);

  const [appointmentDetail, setAppointmentDetail] = useState<AppointmentDetailType>({
    appointment_uid: "",
    date: "",
    time: "",
    booking_reference: "",
    service_provider: "",
    status: "",
    notes: "",
    customer_details: {
      name: "",
      email: "",
      phone: ""
    }
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  // Function to fetch appointment details
  const fetchAppointmentDetail = async () => {
    try {
      let appointment = appointments.find(app => app.appointment_uid === appointment_uid);
      if (!appointment) {
        // Fetch all appointments from backend if not found in global state
        const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/appointments`, {
          headers: {
            Authorization: `Bearer ${auth_state.token}`
          }
        });
        const appointmentsData = response.data;
        appointment = appointmentsData.find((app: any) => app.appointment_uid === appointment_uid);
      }
      if (!appointment) {
        setError("Appointment not found.");
      } else {
        // Transform the appointment data into our expected detail structure.
        const detail: AppointmentDetailType = {
          appointment_uid: appointment.appointment_uid,
          // Here, we derive the date and time from created_at as a fallback.
          date: appointment.created_at ? appointment.created_at.split("T")[0] : "N/A",
          time: appointment.created_at ? appointment.created_at.split("T")[1]?.substring(0, 5) : "N/A",
          booking_reference: appointment.booking_reference,
          // Since the appointment object does not include service provider info,
          // we set a default value
          service_provider: "Default Service Provider",
          status: appointment.status,
          notes: appointment.notes || "",
          customer_details: {
            name: appointment.customer_name,
            email: appointment.customer_email,
            phone: appointment.customer_phone
          }
        };
        setAppointmentDetail(detail);
      }
    } catch (err: any) {
      setError("Failed to fetch appointment details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Redirect to login if user is not authenticated.
    if (!auth_state.is_authenticated) {
      navigate("/login");
      return;
    }
    if (!appointment_uid) {
      setError("No appointment ID provided.");
      setLoading(false);
      return;
    }
    fetchAppointmentDetail();
  }, [appointment_uid, auth_state.is_authenticated]);

  // Button handlers
  const handleReschedule = () => {
    if (appointmentDetail.appointment_uid) {
      navigate(`/reschedule/${appointmentDetail.appointment_uid}`);
    }
  };

  const handleCancel = () => {
    if (appointmentDetail.appointment_uid) {
      navigate(`/cancellation/${appointmentDetail.appointment_uid}`);
    }
  };

  const handleGoBack = () => {
    navigate("/dashboard");
  };

  return (
    <>
      {loading ? (
        <div className="flex items-center justify-center h-full py-10">
          <p className="text-xl font-semibold">Loading appointment details ...</p>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center h-full py-10">
          <p className="text-red-600 text-lg">{error}</p>
          <button
            onClick={handleGoBack}
            className="ml-4 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded"
          >
            Go Back
          </button>
        </div>
      ) : (
        <div className="max-w-3xl mx-auto p-6">
          <h1 className="text-3xl font-bold mb-6">Appointment Details</h1>
          <div className="bg-white shadow-md rounded-lg p-6">
            <div className="mb-4">
              <span className="font-semibold">Booking Reference: </span>
              <span>{appointmentDetail.booking_reference}</span>
            </div>
            <div className="mb-4">
              <span className="font-semibold">Appointment Date: </span>
              <span>{appointmentDetail.date}</span>
            </div>
            <div className="mb-4">
              <span className="font-semibold">Time: </span>
              <span>{appointmentDetail.time}</span>
            </div>
            <div className="mb-4">
              <span className="font-semibold">Service Provider: </span>
              <span>{appointmentDetail.service_provider}</span>
            </div>
            <div className="mb-4">
              <span className="font-semibold">Status: </span>
              <span>{appointmentDetail.status}</span>
            </div>
            {appointmentDetail.notes && (
              <div className="mb-4">
                <span className="font-semibold">Notes: </span>
                <span>{appointmentDetail.notes}</span>
              </div>
            )}
            <div className="mb-4">
              <h2 className="text-2xl font-semibold mb-2">Customer Details</h2>
              <p>
                <span className="font-semibold">Name: </span>
                {appointmentDetail.customer_details.name}
              </p>
              <p>
                <span className="font-semibold">Email: </span>
                {appointmentDetail.customer_details.email}
              </p>
              <p>
                <span className="font-semibold">Phone: </span>
                {appointmentDetail.customer_details.phone}
              </p>
            </div>
          </div>
          <div className="flex justify-between mt-6">
            <button
              onClick={handleReschedule}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Reschedule
            </button>
            <button
              onClick={handleCancel}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Cancel
            </button>
            <button
              onClick={handleGoBack}
              className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
            >
              Back
            </button>
          </div>
          <div className="mt-6">
            <Link to="/dashboard" className="text-blue-500 hover:underline">
              Return to Dashboard
            </Link>
          </div>
        </div>
      )}
    </>
  );
};

export default UV_AppointmentDetail;