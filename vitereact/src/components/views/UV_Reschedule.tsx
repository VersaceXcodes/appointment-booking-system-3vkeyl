import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { useSelector } from "react-redux";
import type { RootState } from "@/store/main";

interface CurrentAppointment {
  appointment_uid: string;
  date: string;
  time: string;
  booking_reference: string;
  service_provider: string;
  status: string;
  notes: string;
}

interface AvailableTimeSlot {
  time_slot_uid: string;
  slot_date: string;
  start_time: string;
  end_time: string;
  availability_status: string;
}

interface SelectedNewTimeSlot {
  time_slot_uid: string;
  slot_date: string;
  start_time: string;
  end_time: string;
}

const UV_Reschedule: React.FC = () => {
  // Extract appointment_uid from URL slugs.
  const { appointment_uid } = useParams<{ appointment_uid: string }>();
  const navigate = useNavigate();
  
  // Get the global auth state (token, etc.) from the Redux store.
  const auth_state = useSelector((state: RootState) => state.auth);

  // Local state for current appointment details.
  const [currentAppointment, setCurrentAppointment] = useState<CurrentAppointment>({
    appointment_uid: "",
    date: "",
    time: "",
    booking_reference: "",
    service_provider: "",
    status: "",
    notes: ""
  });
  // Local state for available time slots.
  const [availableTimeSlots, setAvailableTimeSlots] = useState<AvailableTimeSlot[]>([]);
  // Local state for user-selected new time slot.
  const [selectedNewTimeSlot, setSelectedNewTimeSlot] = useState<SelectedNewTimeSlot>({
    time_slot_uid: "",
    slot_date: "",
    start_time: "",
    end_time: ""
  });
  // State for controlling the chosen date for filtering available slots.
  const [selectedDate, setSelectedDate] = useState<string>("");
  // Optional additional notes.
  const [additionalNotes, setAdditionalNotes] = useState<string>("");

  // Loading and error states for various backend calls.
  const [loadingAppointment, setLoadingAppointment] = useState<boolean>(false);
  const [errorAppointment, setErrorAppointment] = useState<string>("");
  const [loadingTimeSlots, setLoadingTimeSlots] = useState<boolean>(false);
  const [errorTimeSlots, setErrorTimeSlots] = useState<string>("");
  const [submittingReschedule, setSubmittingReschedule] = useState<boolean>(false);
  const [errorReschedule, setErrorReschedule] = useState<string>("");

  // Function to fetch the current appointment details based on appointment_uid.
  const fetchCurrentAppointmentDetails = async () => {
    if (!appointment_uid) return;
    try {
      setLoadingAppointment(true);
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/api/appointments/${appointment_uid}`,
        { headers: { Authorization: `Bearer ${auth_state.token}` } }
      );
      // Assuming that the response returns an object with the required fields.
      const appointment = response.data;
      setCurrentAppointment({
        appointment_uid: appointment.appointment_uid || "",
        date: appointment.date || "",
        time: appointment.time || "",
        booking_reference: appointment.booking_reference || "",
        service_provider: appointment.service_provider || "",
        status: appointment.status || "",
        notes: appointment.notes || ""
      });
      // Set the default selected date to the current appointment's date.
      setSelectedDate(appointment.date || "");
      setLoadingAppointment(false);
    } catch (error: any) {
      setErrorAppointment("Failed to fetch appointment details.");
      setLoadingAppointment(false);
    }
  };

  // Function to fetch available time slots for a given date.
  const fetchAvailableTimeSlots = async (date: string) => {
    try {
      setLoadingTimeSlots(true);
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/api/time-slots`,
        { params: { date } }
      );
      setAvailableTimeSlots(response.data);
      setLoadingTimeSlots(false);
    } catch (error: any) {
      setErrorTimeSlots("Failed to fetch available time slots.");
      setLoadingTimeSlots(false);
    }
  };

  // Function to submit the reschedule request to update the appointment.
  const submitRescheduleRequest = async () => {
    if (!selectedNewTimeSlot.time_slot_uid) {
      setErrorReschedule("Please select a new time slot.");
      return;
    }
    try {
      setSubmittingReschedule(true);
      const payload = {
        new_time_slot_uid: selectedNewTimeSlot.time_slot_uid,
        notes: additionalNotes
      };
      const response = await axios.put(
        `${import.meta.env.VITE_API_BASE_URL}/api/appointments/${appointment_uid}/reschedule`,
        payload,
        { headers: { Authorization: `Bearer ${auth_state.token}` } }
      );
      setSubmittingReschedule(false);
      // Redirect to the booking confirmation view with updated appointment data.
      navigate("/booking_confirmation", { state: { appointment: response.data } });
    } catch (error: any) {
      setErrorReschedule("Failed to reschedule appointment.");
      setSubmittingReschedule(false);
    }
  };

  // On component mount, fetch the current appointment details.
  useEffect(() => {
    if (appointment_uid) {
      fetchCurrentAppointmentDetails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointment_uid]);

  // When the selected date changes, fetch available time slots for that date.
  useEffect(() => {
    if (selectedDate) {
      fetchAvailableTimeSlots(selectedDate);
    }
  }, [selectedDate]);

  return (
    <>
      <div className="max-w-4xl mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Reschedule Appointment</h1>

        {/* Display current appointment details */}
        <div className="border p-4 mb-4">
          <h2 className="text-xl font-semibold mb-2">Current Appointment Details</h2>
          {loadingAppointment ? (
            <p>Loading current appointment...</p>
          ) : errorAppointment ? (
            <p className="text-red-500">{errorAppointment}</p>
          ) : (
            <div>
              <p>
                <span className="font-semibold">Appointment ID:</span> {currentAppointment.appointment_uid}
              </p>
              <p>
                <span className="font-semibold">Date:</span> {currentAppointment.date}
              </p>
              <p>
                <span className="font-semibold">Time:</span> {currentAppointment.time}
              </p>
              <p>
                <span className="font-semibold">Booking Reference:</span> {currentAppointment.booking_reference}
              </p>
              <p>
                <span className="font-semibold">Service Provider:</span> {currentAppointment.service_provider}
              </p>
              <p>
                <span className="font-semibold">Status:</span> {currentAppointment.status}
              </p>
              <p>
                <span className="font-semibold">Notes:</span> {currentAppointment.notes}
              </p>
            </div>
          )}
        </div>

        {/* Date input for selecting a new date */}
        <div className="mb-4">
          <label className="block mb-1 font-semibold">Select New Date</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="border p-2 rounded w-full"
          />
        </div>

        {/* Display available time slots for the selected date */}
        <div className="mb-4">
          <h2 className="text-xl font-semibold mb-2">Available Time Slots</h2>
          {loadingTimeSlots ? (
            <p>Loading available time slots...</p>
          ) : errorTimeSlots ? (
            <p className="text-red-500">{errorTimeSlots}</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {availableTimeSlots.length === 0 ? (
                <p>No available time slots for the selected date.</p>
              ) : (
                availableTimeSlots.map((slot) => (
                  <button
                    key={slot.time_slot_uid}
                    onClick={() => setSelectedNewTimeSlot(slot)}
                    className={`border p-2 rounded text-left w-full ${
                      selectedNewTimeSlot.time_slot_uid === slot.time_slot_uid ? "bg-blue-200" : "bg-white"
                    }`}
                  >
                    <p>
                      <span className="font-semibold">Time:</span> {slot.start_time} - {slot.end_time}
                    </p>
                    <p>
                      <span className="font-semibold">Status:</span> {slot.availability_status}
                    </p>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Optional additional notes */}
        <div className="mb-4">
          <label className="block mb-1 font-semibold">Additional Notes (optional)</label>
          <textarea
            value={additionalNotes}
            onChange={(e) => setAdditionalNotes(e.target.value)}
            className="border p-2 rounded w-full"
            rows={3}
          ></textarea>
        </div>

        {/* Confirm reschedule action */}
        <div className="mb-4">
          {errorReschedule && <p className="text-red-500 mb-2">{errorReschedule}</p>}
          <button
            onClick={submitRescheduleRequest}
            className="bg-blue-500 text-white p-2 rounded disabled:opacity-50"
            disabled={submittingReschedule || !selectedNewTimeSlot.time_slot_uid}
          >
            {submittingReschedule ? "Submitting..." : "Confirm Reschedule"}
          </button>
        </div>

        {/* Link back to the dashboard */}
        <div>
          <Link to="/dashboard" className="text-blue-500 underline">
            Back to Dashboard
          </Link>
        </div>
      </div>
    </>
  );
};

export default UV_Reschedule;