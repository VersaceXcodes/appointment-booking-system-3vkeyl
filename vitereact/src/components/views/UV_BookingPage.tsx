import React, { useState, useEffect } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { appointments_actions, notifications_actions } from "@/store/main";

interface TimeSlot {
  time_slot_uid: string;
  slot_date: string;
  start_time: string;
  end_time: string;
  availability_status: string;
}

interface BookingState {
  selectedDate: string;
  timeSlots: TimeSlot[];
  selectedTimeSlotId: string;
  bookingForm: {
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    notes: string;
  };
  formErrors: {
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    notes: string;
  };
  loading: boolean;
}

const UV_BookingPage: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const [bookingState, setBookingState] = useState<BookingState>({
    selectedDate: "",
    timeSlots: [],
    selectedTimeSlotId: "",
    bookingForm: {
      customerName: "",
      customerEmail: "",
      customerPhone: "",
      notes: ""
    },
    formErrors: {
      customerName: "",
      customerEmail: "",
      customerPhone: "",
      notes: ""
    },
    loading: false
  });

  // On mount, detect if a query parameter "date" exists and update selectedDate.
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const preDate = queryParams.get("date") || "";
    if (preDate && preDate !== bookingState.selectedDate) {
      setBookingState(prev => ({ ...prev, selectedDate: preDate }));
    }
  }, [location.search]);

  // Whenever selectedDate is updated, fetch available time slots.
  useEffect(() => {
    if (bookingState.selectedDate) {
      (async () => {
        setBookingState(prev => ({ ...prev, loading: true }));
        try {
          const response = await axios.get(
            `${import.meta.env.VITE_API_BASE_URL}/api/time-slots`,
            { params: { date: bookingState.selectedDate } }
          );
          setBookingState(prev => ({
            ...prev,
            timeSlots: response.data,
            loading: false
          }));
        } catch (error) {
          setBookingState(prev => ({ ...prev, loading: false }));
          dispatch(
            notifications_actions.add_notification({
              message: "Error fetching available time slots.",
              type: "error",
              timestamp: new Date().toISOString()
            })
          );
        }
      })();
    }
  }, [bookingState.selectedDate, dispatch]);

  // Handler for date change from the calendar/date picker.
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    setBookingState(prev => ({
      ...prev,
      selectedDate: newDate,
      selectedTimeSlotId: "",
      timeSlots: []
    }));
  };

  // Handler for selecting a time slot.
  const handleSelectTimeSlot = (timeSlotId: string) => {
    setBookingState(prev => ({ ...prev, selectedTimeSlotId: timeSlotId }));
  };

  // Handler for changes in the booking form fields.
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setBookingState(prev => ({
      ...prev,
      bookingForm: { ...prev.bookingForm, [name]: value },
      formErrors: { ...prev.formErrors, [name]: "" }
    }));
  };

  // Handler for booking form submission.
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let errors = { customerName: "", customerEmail: "", customerPhone: "", notes: "" };
    let valid = true;
    if (!bookingState.bookingForm.customerName.trim()) {
      errors.customerName = "Name is required";
      valid = false;
    }
    if (!bookingState.bookingForm.customerEmail.trim()) {
      errors.customerEmail = "Email is required";
      valid = false;
    } else if (!/^\S+@\S+\.\S+$/.test(bookingState.bookingForm.customerEmail)) {
      errors.customerEmail = "Invalid email format";
      valid = false;
    }
    if (!bookingState.bookingForm.customerPhone.trim()) {
      errors.customerPhone = "Phone number is required";
      valid = false;
    }
    if (!bookingState.selectedTimeSlotId) {
      dispatch(
        notifications_actions.add_notification({
          message: "Please select a time slot",
          type: "error",
          timestamp: new Date().toISOString()
        })
      );
      valid = false;
    }
    if (!valid) {
      setBookingState(prev => ({ ...prev, formErrors: errors }));
      return;
    }
    setBookingState(prev => ({ ...prev, loading: true }));
    try {
      const bookingData = {
        time_slot_uid: bookingState.selectedTimeSlotId,
        customer_name: bookingState.bookingForm.customerName,
        customer_email: bookingState.bookingForm.customerEmail,
        customer_phone: bookingState.bookingForm.customerPhone,
        notes: bookingState.bookingForm.notes
      };
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/appointments`,
        bookingData
      );
      dispatch(appointments_actions.add_appointment(response.data));
      dispatch(
        notifications_actions.add_notification({
          message: "Appointment booked successfully.",
          type: "success",
          timestamp: new Date().toISOString()
        })
      );
      setBookingState(prev => ({ ...prev, loading: false }));
      navigate("/booking_confirmation");
    } catch (error) {
      setBookingState(prev => ({ ...prev, loading: false }));
      dispatch(
        notifications_actions.add_notification({
          message: "Error booking appointment. Please try again.",
          type: "error",
          timestamp: new Date().toISOString()
        })
      );
    }
  };

  return (
    <>
      <div className="max-w-4xl mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Book an Appointment</h1>
        <div className="mb-6">
          <label className="block text-sm font-medium mb-1" htmlFor="appointment-date">
            Select Date
          </label>
          <input
            type="date"
            id="appointment-date"
            name="appointment-date"
            value={bookingState.selectedDate}
            onChange={handleDateChange}
            className="border rounded p-2 w-full"
          />
        </div>
        {bookingState.loading && (
          <div className="mb-4 text-blue-500">Loading...</div>
        )}
        {bookingState.selectedDate && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">
              Available Time Slots for {bookingState.selectedDate}
            </h2>
            {bookingState.timeSlots.length > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                {bookingState.timeSlots.map((slot) => (
                  <button
                    key={slot.time_slot_uid}
                    onClick={() => handleSelectTimeSlot(slot.time_slot_uid)}
                    className={`p-2 border rounded ${
                      bookingState.selectedTimeSlotId === slot.time_slot_uid
                        ? "bg-blue-500 text-white"
                        : "bg-white text-black"
                    }`}
                  >
                    {slot.start_time} - {slot.end_time}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-600">
                No available time slots for this date.
              </p>
            )}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="customerName">
              Name
            </label>
            <input
              type="text"
              id="customerName"
              name="customerName"
              value={bookingState.bookingForm.customerName}
              onChange={handleInputChange}
              className="border rounded p-2 w-full"
            />
            {bookingState.formErrors.customerName && (
              <p className="text-red-500 text-sm">{bookingState.formErrors.customerName}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="customerEmail">
              Email
            </label>
            <input
              type="email"
              id="customerEmail"
              name="customerEmail"
              value={bookingState.bookingForm.customerEmail}
              onChange={handleInputChange}
              className="border rounded p-2 w-full"
            />
            {bookingState.formErrors.customerEmail && (
              <p className="text-red-500 text-sm">{bookingState.formErrors.customerEmail}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="customerPhone">
              Phone Number
            </label>
            <input
              type="text"
              id="customerPhone"
              name="customerPhone"
              value={bookingState.bookingForm.customerPhone}
              onChange={handleInputChange}
              className="border rounded p-2 w-full"
            />
            {bookingState.formErrors.customerPhone && (
              <p className="text-red-500 text-sm">{bookingState.formErrors.customerPhone}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="notes">
              Special Requests / Notes (Optional)
            </label>
            <textarea
              id="notes"
              name="notes"
              value={bookingState.bookingForm.notes}
              onChange={handleInputChange}
              className="border rounded p-2 w-full"
            />
            {bookingState.formErrors.notes && (
              <p className="text-red-500 text-sm">{bookingState.formErrors.notes}</p>
            )}
          </div>
          <button
            type="submit"
            className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
            disabled={bookingState.loading}
          >
            {bookingState.loading ? "Processing..." : "Book Appointment"}
          </button>
        </form>
      </div>
    </>
  );
};

export default UV_BookingPage;