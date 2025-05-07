import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { RootState, AppDispatch, appointments_actions } from "@/store/main";

const UV_UserDashboard: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const auth = useSelector((state: RootState) => state.auth);
  const appointments = useSelector((state: RootState) => state.appointments);

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  // Function to fetch appointments from backend using the auth token.
  const fetchAppointments = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await axios.get("http://localhost:3000/api/appointments", {
        headers: { Authorization: `Bearer ${auth.token}` }
      });
      dispatch(appointments_actions.set_appointments(response.data));
    } catch (err) {
      setError("Failed to fetch appointments.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (auth.is_authenticated) {
      fetchAppointments();
    } else {
      // Redirect to login if user is not authenticated
      navigate("/login");
    }
  }, [auth.is_authenticated, auth.token, navigate, dispatch]);

  // Segregate appointments into upcoming and past based on their date (assumed format: YYYY-MM-DD).
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const upcomingAppointments = appointments.filter(app => {
    if (!app.date) return false;
    const appDate = new Date(app.date);
    return appDate >= startOfToday;
  });
  const pastAppointments = appointments.filter(app => {
    if (!app.date) return false;
    const appDate = new Date(app.date);
    return appDate < startOfToday;
  });

  // Handlers for navigating to detailed views.
  const handleViewDetails = (appointment_uid: string) => {
    navigate(`/appointment_detail/${appointment_uid}`);
  };

  const handleReschedule = (appointment_uid: string) => {
    navigate(`/reschedule/${appointment_uid}`);
  };

  const handleCancel = (appointment_uid: string) => {
    navigate(`/cancellation/${appointment_uid}`);
  };

  return (
    <>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">User Dashboard</h1>
        {loading && <p>Loading appointments...</p>}
        {error && <p className="text-red-500">{error}</p>}
        {!loading && !error && appointments.length === 0 && (
          <p>No appointments found.</p>
        )}

        {upcomingAppointments.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Upcoming Appointments</h2>
            <div className="space-y-4">
              {upcomingAppointments.map(app => (
                <div key={app.appointment_uid} className="p-4 border rounded shadow-sm">
                  <p><span className="font-semibold">Date:</span> {app.date}</p>
                  <p><span className="font-semibold">Time:</span> {app.time}</p>
                  <p><span className="font-semibold">Booking Reference:</span> {app.booking_reference}</p>
                  <p><span className="font-semibold">Service Provider:</span> {app.service_provider}</p>
                  <p><span className="font-semibold">Status:</span> {app.status}</p>
                  <div className="mt-2 space-x-2">
                    <button onClick={() => handleViewDetails(app.appointment_uid)} className="bg-blue-500 text-white px-3 py-1 rounded">
                      View Details
                    </button>
                    <button onClick={() => handleReschedule(app.appointment_uid)} className="bg-green-500 text-white px-3 py-1 rounded">
                      Reschedule
                    </button>
                    <button onClick={() => handleCancel(app.appointment_uid)} className="bg-red-500 text-white px-3 py-1 rounded">
                      Cancel
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {pastAppointments.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-2">Past Appointments</h2>
            <div className="space-y-4">
              {pastAppointments.map(app => (
                <div key={app.appointment_uid} className="p-4 border rounded shadow-sm">
                  <p><span className="font-semibold">Date:</span> {app.date}</p>
                  <p><span className="font-semibold">Time:</span> {app.time}</p>
                  <p><span className="font-semibold">Booking Reference:</span> {app.booking_reference}</p>
                  <p><span className="font-semibold">Service Provider:</span> {app.service_provider}</p>
                  <p><span className="font-semibold">Status:</span> {app.status}</p>
                  <div className="mt-2">
                    <button onClick={() => handleViewDetails(app.appointment_uid)} className="bg-blue-500 text-white px-3 py-1 rounded">
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default UV_UserDashboard;