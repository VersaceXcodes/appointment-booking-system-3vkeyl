import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, Link } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { RootState, auth_actions, appointments_actions } from "@/store/main";

interface AppointmentDetails {
  appointment_uid: string;
  time_slot_uid: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  notes: string;
  booking_reference: string;
  status: string;
  created_at: string;
  updated_at: string;
}

const UV_AdminUpdateAppointment: React.FC = () => {
  const { appointment_uid } = useParams<{ appointment_uid: string }>();
  const auth_state = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();

  const [appointmentDetails, setAppointmentDetails] = useState<AppointmentDetails | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [updateError, setUpdateError] = useState<string>("");

  useEffect(() => {
    const fetchAppointmentDetails = async () => {
      if (!appointment_uid) return;
      try {
        const response = await axios.get(
          `http://localhost:3000/api/admin/appointments/${appointment_uid}`,
          {
            headers: {
              Authorization: `Bearer ${auth_state.token}`
            }
          }
        );
        setAppointmentDetails(response.data);
      } catch (error) {
        setUpdateError("Failed to load appointment details.");
      }
    };
    fetchAppointmentDetails();
  }, [appointment_uid, auth_state.token]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    if (appointmentDetails) {
      setAppointmentDetails({
        ...appointmentDetails,
        [name]: value
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appointmentDetails || !appointment_uid) return;
    // Validate required fields
    if (!appointmentDetails.time_slot_uid.trim() || !appointmentDetails.status.trim()) {
      setUpdateError("Time slot and status are required.");
      return;
    }
    setIsSaving(true);
    setUpdateError("");
    try {
      const response = await axios.put(
        `http://localhost:3000/api/admin/appointments/${appointment_uid}`,
        {
          time_slot_uid: appointmentDetails.time_slot_uid,
          status: appointmentDetails.status,
          notes: appointmentDetails.notes
        },
        {
          headers: {
            Authorization: `Bearer ${auth_state.token}`
          }
        }
      );
      setAppointmentDetails(response.data);
      dispatch(appointments_actions.update_appointment(response.data));
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        setUpdateError(error.response.data.message || "Failed to update appointment.");
      } else {
        setUpdateError("Failed to update appointment.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <div className="max-w-3xl mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Update Appointment</h1>
        {updateError && (
          <div className="bg-red-100 text-red-700 p-2 mb-4 rounded">{updateError}</div>
        )}
        {appointmentDetails ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block font-medium mb-1">Booking Reference</label>
              <input
                type="text"
                name="booking_reference"
                value={appointmentDetails.booking_reference}
                readOnly
                className="w-full border p-2 rounded bg-gray-100"
              />
            </div>
            <div>
              <label className="block font-medium mb-1">Customer Name</label>
              <input
                type="text"
                name="customer_name"
                value={appointmentDetails.customer_name}
                readOnly
                className="w-full border p-2 rounded bg-gray-100"
              />
            </div>
            <div>
              <label className="block font-medium mb-1">Customer Email</label>
              <input
                type="email"
                name="customer_email"
                value={appointmentDetails.customer_email}
                readOnly
                className="w-full border p-2 rounded bg-gray-100"
              />
            </div>
            <div>
              <label className="block font-medium mb-1">Customer Phone</label>
              <input
                type="text"
                name="customer_phone"
                value={appointmentDetails.customer_phone}
                readOnly
                className="w-full border p-2 rounded bg-gray-100"
              />
            </div>
            <div>
              <label className="block font-medium mb-1">Appointment Time Slot UID</label>
              <input
                type="text"
                name="time_slot_uid"
                value={appointmentDetails.time_slot_uid}
                onChange={handleInputChange}
                className="w-full border p-2 rounded"
              />
            </div>
            <div>
              <label className="block font-medium mb-1">Status</label>
              <select
                name="status"
                value={appointmentDetails.status}
                onChange={handleInputChange}
                className="w-full border p-2 rounded"
              >
                <option value="">Select Status</option>
                <option value="booked">Booked</option>
                <option value="cancelled">Cancelled</option>
                <option value="rescheduled">Rescheduled</option>
              </select>
            </div>
            <div>
              <label className="block font-medium mb-1">Notes</label>
              <textarea
                name="notes"
                value={appointmentDetails.notes}
                onChange={handleInputChange}
                className="w-full border p-2 rounded"
                rows={4}
              ></textarea>
            </div>
            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={isSaving}
                className={`px-4 py-2 rounded text-white ${
                  isSaving ? "bg-gray-500" : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
              <Link
                to="/admin/dashboard"
                className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 text-white"
              >
                Cancel
              </Link>
            </div>
          </form>
        ) : (
          <div>Loading appointment details...</div>
        )}
      </div>
    </>
  );
};

export default UV_AdminUpdateAppointment;