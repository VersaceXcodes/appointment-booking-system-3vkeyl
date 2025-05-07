import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import axios from "axios";
import { RootState, appointments_actions, notifications_actions } from "@/store/main";

const UV_Cancellation: React.FC = () => {
  const { appointment_uid } = useParams<{ appointment_uid: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const auth = useSelector((state: RootState) => state.auth);
  const appointments = useSelector((state: RootState) => state.appointments);
  const appointment = appointments.find(a => a.appointment_uid === appointment_uid);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirmCancellation = async () => {
    if (!appointment_uid) return;
    setLoading(true);
    setError(null);
    try {
      const response = await axios.delete(
        `${import.meta.env.VITE_API_BASE_URL}/api/appointments/${appointment_uid}`,
        {
          headers: {
            Authorization: `Bearer ${auth.token}`,
          },
        }
      );
      // Expecting response.data to be a CancelAppointmentResponse { appointment_uid, status, updated_at }
      if (appointment) {
        const updatedAppointment = {
          ...appointment,
          status: response.data.status,
          updated_at: response.data.updated_at,
        };
        dispatch(appointments_actions.update_appointment(updatedAppointment));
      }
      dispatch(
        notifications_actions.add_notification({
          message: "Appointment cancelled successfully.",
          type: "success",
          timestamp: new Date().toISOString(),
        })
      );
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.message || "An error occurred while cancelling the appointment.");
    } finally {
      setLoading(false);
    }
  };

  const handleAbortCancellation = () => {
    navigate(-1);
  };

  return (
    <>
      <div className="max-w-xl mx-auto my-10 p-5 border rounded shadow">
        <h2 className="text-2xl font-bold mb-4">Cancel Appointment</h2>
        {!appointment ? (
          <div className="text-red-500">Appointment not found.</div>
        ) : (
          <>
            <div className="mb-4">
              <p>
                <span className="font-semibold">Booking Reference:</span>{" "}
                {appointment.booking_reference}
              </p>
              <p>
                <span className="font-semibold">Date:</span>{" "}
                {appointment.created_at
                  ? new Date(appointment.created_at).toLocaleDateString()
                  : "N/A"}
              </p>
              <p>
                <span className="font-semibold">Time:</span>{" "}
                {appointment.created_at
                  ? new Date(appointment.created_at).toLocaleTimeString()
                  : "N/A"}
              </p>
              <p>
                <span className="font-semibold">Service Provider:</span>{" "}
                {"N/A"}
              </p>
              <p>
                <span className="font-semibold">Status:</span>{" "}
                {appointment.status}
              </p>
            </div>
            {error && <div className="mb-4 text-red-500">{error}</div>}
            <p className="mb-4">
              Are you sure you want to cancel this appointment? This action cannot
              be undone.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={handleAbortCancellation}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
                disabled={loading}
              >
                Abort
              </button>
              <button
                onClick={handleConfirmCancellation}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                disabled={loading}
              >
                {loading ? "Cancelling..." : "Confirm"}
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default UV_Cancellation;