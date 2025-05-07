import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import { RootState, AppDispatch, time_slots_actions } from "@/store/main";

const UV_AdminTimeSlotManagement: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const timeSlots = useSelector((state: RootState) => state.time_slots);
  const auth = useSelector((state: RootState) => state.auth);
  const [searchParams] = useSearchParams();
  const filterDate = searchParams.get("date") || "";

  // Local state for new time slot creation
  const [newTimeSlot, setNewTimeSlot] = useState({
    slot_date: "",
    start_time: "",
    end_time: ""
  });

  // Local state for editing an existing time slot
  const [editTimeSlot, setEditTimeSlot] = useState<any>({});
  const [isLoading, setIsLoading] = useState(false);

  // Function to fetch time slots, with optional date filtering
  const fetchTimeSlots = async () => {
    setIsLoading(true);
    try {
      const url = filterDate
        ? `${import.meta.env.VITE_API_BASE_URL}/api/admin/time-slots?date=${filterDate}`
        : `${import.meta.env.VITE_API_BASE_URL}/api/admin/time-slots`;
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${auth.token}` }
      });
      dispatch(time_slots_actions.set_time_slots(response.data));
    } catch (error) {
      alert("Error fetching time slots.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTimeSlots();
  }, [filterDate]);

  // Handler for new time slot form update
  const handleNewChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewTimeSlot({
      ...newTimeSlot,
      [e.target.name]: e.target.value
    });
  };

  // Handler for submitting the new time slot form
  const handleCreateTimeSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTimeSlot.slot_date || !newTimeSlot.start_time || !newTimeSlot.end_time) {
      alert("Please fill in all fields to create a new time slot.");
      return;
    }
    try {
      const url = `${import.meta.env.VITE_API_BASE_URL}/api/admin/time-slots`;
      const response = await axios.post(url, newTimeSlot, {
        headers: { Authorization: `Bearer ${auth.token}` }
      });
      dispatch(time_slots_actions.add_time_slot(response.data));
      setNewTimeSlot({ slot_date: "", start_time: "", end_time: "" });
    } catch (error) {
      alert("Error creating new time slot.");
    }
  };

  // Handler for changes in the edit time slot form
  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditTimeSlot({
      ...editTimeSlot,
      [e.target.name]: e.target.value
    });
  };

  // Handler for submitting updates to an existing time slot
  const handleUpdateTimeSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !editTimeSlot.time_slot_uid ||
      !editTimeSlot.slot_date ||
      !editTimeSlot.start_time ||
      !editTimeSlot.end_time
    ) {
      alert("Please fill in all fields to update the time slot.");
      return;
    }
    try {
      const url = `${import.meta.env.VITE_API_BASE_URL}/api/admin/time-slots/${editTimeSlot.time_slot_uid}`;
      const response = await axios.put(
        url,
        {
          slot_date: editTimeSlot.slot_date,
          start_time: editTimeSlot.start_time,
          end_time: editTimeSlot.end_time,
          availability_status: editTimeSlot.availability_status
        },
        {
          headers: { Authorization: `Bearer ${auth.token}` }
        }
      );
      dispatch(time_slots_actions.update_time_slot(response.data));
      setEditTimeSlot({});
    } catch (error) {
      alert("Error updating time slot.");
    }
  };

  // Handler for deleting a time slot
  const handleDeleteTimeSlot = async (time_slot_uid: string) => {
    if (!window.confirm("Are you sure you want to delete this time slot?")) {
      return;
    }
    try {
      const url = `${import.meta.env.VITE_API_BASE_URL}/api/admin/time-slots/${time_slot_uid}`;
      await axios.delete(url, {
        headers: { Authorization: `Bearer ${auth.token}` }
      });
      dispatch(time_slots_actions.remove_time_slot(time_slot_uid));
    } catch (error) {
      alert("Error deleting time slot.");
    }
  };

  // Handler for selecting a time slot to edit
  const handleEditButtonClick = (slot: any) => {
    setEditTimeSlot(slot);
  };

  return (
    <>
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Time Slot Management</h1>
        {filterDate && (
          <p className="mb-4">
            Filtering time slots for date: <span className="font-semibold">{filterDate}</span>
          </p>
        )}

        <div className="mb-8 border p-4 rounded">
          <h2 className="text-xl font-semibold mb-2">Add New Time Slot</h2>
          <form onSubmit={handleCreateTimeSlot} className="space-y-4">
            <div>
              <label className="block font-medium">Date</label>
              <input
                type="date"
                name="slot_date"
                value={newTimeSlot.slot_date}
                onChange={handleNewChange}
                className="mt-1 p-2 border rounded w-full"
              />
            </div>
            <div>
              <label className="block font-medium">Start Time</label>
              <input
                type="time"
                name="start_time"
                value={newTimeSlot.start_time}
                onChange={handleNewChange}
                className="mt-1 p-2 border rounded w-full"
              />
            </div>
            <div>
              <label className="block font-medium">End Time</label>
              <input
                type="time"
                name="end_time"
                value={newTimeSlot.end_time}
                onChange={handleNewChange}
                className="mt-1 p-2 border rounded w-full"
              />
            </div>
            <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
              Add Time Slot
            </button>
          </form>
        </div>

        {editTimeSlot.time_slot_uid && (
          <div className="mb-8 border p-4 rounded">
            <h2 className="text-xl font-semibold mb-2">Edit Time Slot</h2>
            <form onSubmit={handleUpdateTimeSlot} className="space-y-4">
              <div>
                <label className="block font-medium">Date</label>
                <input
                  type="date"
                  name="slot_date"
                  value={editTimeSlot.slot_date}
                  onChange={handleEditChange}
                  className="mt-1 p-2 border rounded w-full"
                />
              </div>
              <div>
                <label className="block font-medium">Start Time</label>
                <input
                  type="time"
                  name="start_time"
                  value={editTimeSlot.start_time}
                  onChange={handleEditChange}
                  className="mt-1 p-2 border rounded w-full"
                />
              </div>
              <div>
                <label className="block font-medium">End Time</label>
                <input
                  type="time"
                  name="end_time"
                  value={editTimeSlot.end_time}
                  onChange={handleEditChange}
                  className="mt-1 p-2 border rounded w-full"
                />
              </div>
              <div>
                <label className="block font-medium">Availability Status</label>
                <input
                  type="text"
                  name="availability_status"
                  value={editTimeSlot.availability_status || ""}
                  onChange={handleEditChange}
                  className="mt-1 p-2 border rounded w-full"
                  placeholder="e.g., available"
                />
              </div>
              <div className="flex space-x-4">
                <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded">
                  Update Time Slot
                </button>
                <button
                  type="button"
                  onClick={() => setEditTimeSlot({})}
                  className="bg-gray-500 text-white px-4 py-2 rounded"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="mb-4">
          <h2 className="text-xl font-semibold mb-2">Existing Time Slots</h2>
          {isLoading ? (
            <p>Loading time slots...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="border px-4 py-2">Date</th>
                    <th className="border px-4 py-2">Start Time</th>
                    <th className="border px-4 py-2">End Time</th>
                    <th className="border px-4 py-2">Status</th>
                    <th className="border px-4 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {timeSlots.map((slot: any) => (
                    <tr key={slot.time_slot_uid}>
                      <td className="border px-4 py-2">{slot.slot_date}</td>
                      <td className="border px-4 py-2">{slot.start_time}</td>
                      <td className="border px-4 py-2">{slot.end_time}</td>
                      <td className="border px-4 py-2">{slot.availability_status}</td>
                      <td className="border px-4 py-2 space-x-2">
                        <button
                          onClick={() => handleEditButtonClick(slot)}
                          className="bg-yellow-500 text-white px-2 py-1 rounded"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteTimeSlot(slot.time_slot_uid)}
                          className="bg-red-500 text-white px-2 py-1 rounded"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                  {timeSlots.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center p-4">
                        No time slots available.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default UV_AdminTimeSlotManagement;