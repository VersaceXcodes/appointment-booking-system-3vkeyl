-- Create the users table
CREATE TABLE users (
    user_uid TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    phone TEXT NOT NULL,
    role TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- Create the time_slots table (depends on users)
CREATE TABLE time_slots (
    time_slot_uid TEXT PRIMARY KEY,
    admin_uid TEXT NOT NULL,
    slot_date TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    availability_status TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (admin_uid) REFERENCES users(user_uid)
);

-- Create the appointments table (depends on users and time_slots)
CREATE TABLE appointments (
    appointment_uid TEXT PRIMARY KEY,
    user_uid TEXT,
    time_slot_uid TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    notes TEXT,
    booking_reference TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (user_uid) REFERENCES users(user_uid),
    FOREIGN KEY (time_slot_uid) REFERENCES time_slots(time_slot_uid)
);

-- Create the email_notifications table (depends on appointments)
CREATE TABLE email_notifications (
    notification_uid TEXT PRIMARY KEY,
    appointment_uid TEXT,
    notification_type TEXT NOT NULL,
    recipient_email TEXT NOT NULL,
    sent_status TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (appointment_uid) REFERENCES appointments(appointment_uid)
);

-----------------------------------------------------------
-- Seed Data: Insert Users
-----------------------------------------------------------
INSERT INTO users (user_uid, name, email, password_hash, phone, role, created_at, updated_at) VALUES
('user_1', 'Alice Smith', 'alice.smith@example.com', 'hash_alice', '1234567890', 'customer', '2023-10-01T10:00:00Z', '2023-10-01T10:00:00Z'),
('user_2', 'Bob Johnson', 'bob.johnson@example.com', 'hash_bob', '0987654321', 'admin', '2023-10-01T11:00:00Z', '2023-10-01T11:00:00Z'),
('user_3', 'Carol Martinez', 'carol.m@example.com', 'hash_carol', '5551234567', 'customer', '2023-10-01T12:00:00Z', '2023-10-01T12:00:00Z'),
('user_4', 'David Lee', 'david.lee@example.com', 'hash_david', '4449876543', 'customer', '2023-10-01T13:00:00Z', '2023-10-01T13:00:00Z'),
('user_5', 'Eve Adams', 'eve.adams@example.com', 'hash_eve', '3331239876', 'admin', '2023-10-01T14:00:00Z', '2023-10-01T14:00:00Z');

-----------------------------------------------------------
-- Seed Data: Insert Time Slots
-----------------------------------------------------------
INSERT INTO time_slots (time_slot_uid, admin_uid, slot_date, start_time, end_time, availability_status, created_at, updated_at) VALUES
('ts_1', 'user_2', '2023-10-05', '09:00', '09:30', 'available', '2023-10-02T08:00:00Z', '2023-10-02T08:00:00Z'),
('ts_2', 'user_2', '2023-10-05', '10:00', '10:30', 'available', '2023-10-02T08:05:00Z', '2023-10-02T08:05:00Z'),
('ts_3', 'user_5', '2023-10-06', '11:00', '11:30', 'booked', '2023-10-02T08:10:00Z', '2023-10-02T08:10:00Z'),
('ts_4', 'user_5', '2023-10-06', '12:00', '12:30', 'locked', '2023-10-02T08:15:00Z', '2023-10-02T08:15:00Z');

-----------------------------------------------------------
-- Seed Data: Insert Appointments
-----------------------------------------------------------
INSERT INTO appointments (appointment_uid, user_uid, time_slot_uid, customer_name, customer_email, customer_phone, notes, booking_reference, status, created_at, updated_at) VALUES
('apt_1', 'user_1', 'ts_2', 'Alice Smith', 'alice.smith@example.com', '1234567890', 'Looking forward to it!', 'BR12345', 'booked', '2023-10-02T09:30:00Z', '2023-10-02T09:30:00Z'),
('apt_2', NULL, 'ts_1', 'John Doe', 'john.doe@guestmail.com', '7778889999', NULL, 'BR67890', 'booked', '2023-10-02T10:00:00Z', '2023-10-02T10:00:00Z'),
('apt_3', 'user_3', 'ts_3', 'Carol Martinez', 'carol.m@example.com', '5551234567', 'Need wheelchair access', 'BR24680', 'booked', '2023-10-02T10:30:00Z', '2023-10-02T10:30:00Z');

-----------------------------------------------------------
-- Seed Data: Insert Email Notifications
-----------------------------------------------------------
INSERT INTO email_notifications (notification_uid, appointment_uid, notification_type, recipient_email, sent_status, created_at) VALUES
('enot_1', 'apt_1', 'booking_confirmation', 'alice.smith@example.com', 'sent', '2023-10-02T09:31:00Z'),
('enot_2', 'apt_2', 'booking_confirmation', 'john.doe@guestmail.com', 'sent', '2023-10-02T10:01:00Z'),
('enot_3', 'apt_3', 'booking_confirmation', 'carol.m@example.com', 'sent', '2023-10-02T10:31:00Z');