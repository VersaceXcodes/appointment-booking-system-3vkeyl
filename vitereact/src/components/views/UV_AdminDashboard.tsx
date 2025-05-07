import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { RootState, AppDispatch, appointments_actions } from "@/store/main";

const UV_AdminDashboard: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  // Access global auth state and appointments from the Redux store
  const auth_state = useSelector((state: RootState) => state.auth);
  const appointments = useSelector((state: RootState) => state.appointments);

  // Local state for summary statistics, view mode, filters, and loading indicator
  const [summaryStats, setSummaryStats] = useState({
    totalBookings: 0,
    totalCancellations: 0,
    totalReschedules: 0,
  });
  const [viewMode, setViewMode] = useState<string>("list");
  const [filters, setFilters] = useState<{ date?: string; status?: string }>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Function to fetch appointments and update summary statistics
  const fetchAppointments = async () => {
    setIsLoading(true);
    try {
      // Prepare filter parameters for the API call
      const params: any = {};
      if (filters.status && filters.status !== "all") {
        params.status = filters.status;
      }
      if (filters.date) {
        params.date = filters.date;
      }
      // Call the backend endpoint with proper authorization header
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/api/admin/appointments`,
        {
          headers: { Authorization: "Bearer " + auth_state.token },
          params: params,
        }
      );
      const appointmentsData = response.data;
      // Dispatch the list of appointments to the global store
      dispatch(appointments_actions.set_appointments(appointmentsData));
      // Compute summary statistics based on appointment status
      let totalBookings = 0,
        totalCancellations = 0,
        totalReschedules = 0;
      appointmentsData.forEach((apt: any) => {
        if (apt.status === "booked") totalBookings++;
        else if (apt.status === "cancelled") totalCancellations++;
        else if (apt.status === "rescheduled") totalReschedules++;
      });
      setSummaryStats({ totalBookings, totalCancellations, totalReschedules });
    } catch (error: any) {
      console.error("Error fetching appointments: ", error);
    }
    setIsLoading(false);
  };

  // Fetch appointments when the component mounts or filters change
  useEffect(() => {
    fetchAppointments();
  }, [filters]);

  // Toggle view mode between "list" and "calendar"
  const handleChangeViewMode = () => {
    const newMode = viewMode === "list" ? "calendar" : "list";
    setViewMode(newMode);
  };

  // Navigate to the appointment update view when an appointment is selected
  const handleSelectAppointment = (appointment_uid: string) => {
    navigate(`/admin/update_appointment/${appointment_uid}`);
  };

  // Handlers for filter input changes
  const handleFilterDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({ ...filters, date: event.target.value });
  };

  const handleFilterStatusChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    if (value === "all") {
      const { status, ...rest } = filters;
      setFilters({ ...rest });
    } else {
      setFilters({ ...filters, status: value });
    }
  };

  // Reset filters to default (empty) state
  const handleResetFilters = () => {
    setFilters({});
  };

  return (
    <>
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>

        {/* Summary Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white shadow rounded p-4">
            <h2 className="text-lg font-semibold">Total Bookings</h2>
            <p className="text-2xl">{summaryStats.totalBookings}</p>
          </div>
          <div className="bg-white shadow rounded p-4">
            <h2 className="text-lg font-semibold">Total Cancellations</h2>
            <p className="text-2xl">{summaryStats.totalCancellations}</p>
          </div>
          <div className="bg-white shadow rounded p-4">
            <h2 className="text-lg font-semibold">Total Reschedules</h2>
            <p className="text-2xl">{summaryStats.totalReschedules}</p>
          </div>
        </div>

        {/* Filters Section */}
        <div className="bg-white shadow rounded p-4 mb-6">
          <h2 className="text-lg font-semibold mb-2">Filters</h2>
          <div className="flex flex-col md:flex-row md:items-center md:space-x-4">
            <div className="mb-2 md:mb-0">
              <label className="block text-sm font-medium mb-1">Date</label>
              <input
                type="date"
                className="border rounded p-2"
                onChange={handleFilterDateChange}
                value={filters.date || ""}
              />
            </div>
            <div className="mb-2 md:mb-0">
              <label className="block text-sm font-medium mb-1">Status</label>
              <select
                className="border rounded p-2"
                onChange={handleFilterStatusChange}
                value={filters.status || "all"}
              >
                <option value="all">All</option>
                <option value="booked">Booked</option>
                <option value="cancelled">Cancelled</option>
                <option value="rescheduled">Rescheduled</option>
              </select>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={fetchAppointments}
                className="bg-blue-500 text-white px-4 py-2 rounded"
              >
                Apply Filters
              </button>
              <button
                onClick={handleResetFilters}
                className="bg-gray-500 text-white px-4 py-2 rounded"
              >
                Reset Filters
              </button>
            </div>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex justify-end mb-4">
          <button
            onClick={handleChangeViewMode}
            className="bg-green-500 text-white px-4 py-2 rounded"
          >
            {viewMode === "list" ? "Switch to Calendar View" : "Switch to List View"}
          </button>
        </div>

        {/* Appointments Section */}
        {isLoading ? (
          <div className="text-center">Loading appointments...</div>
        ) : (
          <>
            {viewMode === "list" ? (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white">
                  <thead>
                    <tr>
                      <th className="py-2 px-4 border-b">Booking Reference</th>
                      <th className="py-2 px-4 border-b">Customer Name</th>
                      <th className="py-2 px-4 border-b">Email</th>
                      <th className="py-2 px-4 border-b">Phone</th>
                      <th className="py-2 px-4 border-b">Status</th>
                      <th className="py-2 px-4 border-b">Created At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appointments.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-4">
                          No appointments found.
                        </td>
                      </tr>
                    ) : (
                      appointments.map((apt) => (
                        <tr
                          key={apt.appointment_uid}
                          className="cursor-pointer hover:bg-gray-100"
                          onClick={() => handleSelectAppointment(apt.appointment_uid)}
                        >
                          <td className="py-2 px-4 border-b">{apt.booking_reference}</td>
                          <td className="py-2 px-4 border-b">{apt.customer_name}</td>
                          <td className="py-2 px-4 border-b">{apt.customer_email}</td>
                          <td className="py-2 px-4 border-b">{apt.customer_phone}</td>
                          <td className="py-2 px-4 border-b">{apt.status}</td>
                          <td className="py-2 px-4 border-b">
                            {new Date(apt.created_at).toLocaleString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <div>
                {appointments.length === 0 ? (
                  <div className="text-center py-4">No appointments found.</div>
                ) : (
                  Object.entries(
                    appointments.reduce((acc: Record<string, any[]>, apt) => {
                      const date = new Date(apt.created_at)
                        .toISOString()
                        .split("T")[0];
                      if (!acc[date]) acc[date] = [];
                      acc[date].push(apt);
                      return acc;
                    }, {})
                  ).map(([date, apts]) => (
                    <div key={date} className="mb-4">
                      <h3 className="text-xl font-semibold mb-2">{date}</h3>
                      <ul>
                        {apts.map((apt) => (
                          <li
                            key={apt.appointment_uid}
                            className="cursor-pointer hover:bg-gray-100 p-2 border rounded mb-2"
                            onClick={() => handleSelectAppointment(apt.appointment_uid)}
                          >
                            <div>
                              <strong>Booking Reference:</strong> {apt.booking_reference}
                            </div>
                            <div>
                              <strong>Customer:</strong> {apt.customer_name}
                            </div>
                            <div>
                              <strong>Status:</strong> {apt.status}
                            </div>
                            <div>
                              <strong>Created:</strong>{" "}
                              {new Date(apt.created_at).toLocaleString()}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
};

export default UV_AdminDashboard;