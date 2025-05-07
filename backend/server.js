import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import dotenv from 'dotenv';
import pkg from 'pg';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables from .env file
dotenv.config();

// Destructure and setup PostgreSQL pool as specified
const { Pool } = pkg;
const {
  DATABASE_URL,
  PGHOST,
  PGDATABASE,
  PGUSER,
  PGPASSWORD,
  PGPORT = 5432,
  JWT_SECRET,
  PORT = 3000
} = process.env;

const pool = new Pool(
  DATABASE_URL
    ? { 
        connectionString: DATABASE_URL, 
        ssl: { require: true } 
      }
    : {
        host: PGHOST,
        database: PGDATABASE,
        user: PGUSER,
        password: PGPASSWORD,
        port: Number(PGPORT),
        ssl: { require: true },
      }
);

// Initialize Express App
const app = express();

// Middleware Setup
app.use(express.json());
app.use(cors());
app.use(morgan('combined'));

// ESM workaround for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

//
// JWT Authentication Middleware
//
function authenticateToken(req, res, next) {
  // Get token from Authorization header
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Missing token' });
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(401).json({ message: 'Invalid token' });
    req.user = user;
    next();
  });
}

//
// Admin-only Middleware
//
function adminOnly(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
}

//
// Helper function to generate a unique id with a prefix
//
function generateId(prefix) {
  return `${prefix}_${crypto.randomUUID()}`;
}

//
// Routes: Authentication Endpoints
//

/*
  @desc  Register a new user
  @need: Validate provided details, hash password and insert into users table.
*/
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password, phone } = req.body;
  if (!name || !email || !password || !phone) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  try {
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);
    const user_uid = generateId('user');
    const role = 'customer';
    const timestamp = new Date().toISOString();
    const query = `
      INSERT INTO users (user_uid, name, email, password_hash, phone, role, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING user_uid, name, email, phone, role, created_at, updated_at
    `;
    const values = [user_uid, name, email, password_hash, phone, role, timestamp, timestamp];
    const result = await pool.query(query, values);
    return res.status(201).json(result.rows[0]);
  } catch (err) {
    // Check for duplicate email errors
    if (err.code === '23505') { // Unique violation in Postgres
      return res.status(400).json({ message: 'Email already exists' });
    }
    console.error(err);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

/*
  @desc  Authenticate user and return JWT token
  @need: Validate credentials using bcrypt and generate a JWT token if success.
*/
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Missing email or password' });
  }
  try {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await pool.query(query, [email]);
    if (!result.rows.length) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    // Generate JWT token with payload
    const tokenPayload = {
      user_uid: user.user_uid,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role
    };
    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '1h' });
    return res.status(200).json({ token, user: tokenPayload });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

//
// Routes: Time Slots Endpoints
//

/*
  @desc  Retrieve available time slots for a given date
  @need: Query time_slots table filtered by date and available status.
*/
app.get('/api/time-slots', async (req, res) => {
  const { date } = req.query;
  if (!date) {
    return res.status(400).json({ message: 'Date parameter is required (YYYY-MM-DD)' });
  }
  try {
    const query = "SELECT * FROM time_slots WHERE slot_date = $1 AND availability_status = 'available'";
    const result = await pool.query(query, [date]);
    return res.status(200).json(result.rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

//
// Routes: Appointments Endpoints
//

/*
  @desc  Book an appointment (for registered or guest users)
  @need: Lock the time slot, then insert an appointment record with unique booking reference.
  All DB operations are transactional to ensure consistency.
*/
app.post('/api/appointments', async (req, res) => {
  const { time_slot_uid, customer_name, customer_email, customer_phone, notes, user_uid } = req.body;
  if (!time_slot_uid || !customer_name || !customer_email || !customer_phone) {
    return res.status(400).json({ message: 'Missing required booking fields' });
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // Lock the time slot row to check availability
    const timeSlotQuery = 'SELECT * FROM time_slots WHERE time_slot_uid = $1 FOR UPDATE';
    const timeSlotResult = await client.query(timeSlotQuery, [time_slot_uid]);
    if (timeSlotResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Time slot not found' });
    }
    const timeSlot = timeSlotResult.rows[0];
    if (timeSlot.availability_status !== 'available') {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Time slot is not available' });
    }
    // Temporarily lock the slot
    const timestamp = new Date().toISOString();
    const lockQuery = "UPDATE time_slots SET availability_status = 'locked', updated_at = $1 WHERE time_slot_uid = $2";
    await client.query(lockQuery, [timestamp, time_slot_uid]);

    // Generate unique IDs for appointment and booking reference
    const appointment_uid = generateId('apt');
    const booking_reference = 'BR' + Math.floor(Math.random() * 100000).toString();
    
    // Insert appointment record
    const insertAppointmentQuery = `
      INSERT INTO appointments
      (appointment_uid, user_uid, time_slot_uid, customer_name, customer_email, customer_phone, notes, booking_reference, status, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'booked', $9, $10)
      RETURNING *
    `;
    const appointmentValues = [
      appointment_uid,
      user_uid || null,
      time_slot_uid,
      customer_name,
      customer_email,
      customer_phone,
      notes || null,
      booking_reference,
      timestamp,
      timestamp
    ];
    const appointmentResult = await client.query(insertAppointmentQuery, appointmentValues);

    // Finalize time slot to "booked"
    const updateSlotQuery = "UPDATE time_slots SET availability_status = 'booked', updated_at = $1 WHERE time_slot_uid = $2";
    await client.query(updateSlotQuery, [timestamp, time_slot_uid]);

    // Log email notification (mocking sending email)
    const notification_uid = generateId('enot');
    const insertNotificationQuery = `
      INSERT INTO email_notifications
      (notification_uid, appointment_uid, notification_type, recipient_email, sent_status, created_at)
      VALUES ($1, $2, 'booking_confirmation', $3, 'sent', $4)
    `;
    await client.query(insertNotificationQuery, [notification_uid, appointment_uid, customer_email, timestamp]);

    await client.query('COMMIT');
    return res.status(201).json(appointmentResult.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    return res.status(500).json({ message: 'Internal Server Error' });
  } finally {
    client.release();
  }
});

/*
  @desc  Get appointments for authenticated user
  @need: Retrieve appointments from DB where user_uid matches the token payload.
*/
app.get('/api/appointments', authenticateToken, async (req, res) => {
  try {
    const query = "SELECT * FROM appointments WHERE user_uid = $1";
    const result = await pool.query(query, [req.user.user_uid]);
    return res.status(200).json(result.rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

/*
  @desc  Reschedule an appointment by updating its time slot
  @need: Verify new time slot availability; update old slot to 'available' and new slot to 'booked';
         update appointment status to 'rescheduled'.
*/
app.put('/api/appointments/:appointment_uid/reschedule', authenticateToken, async (req, res) => {
  const { appointment_uid } = req.params;
  const { new_time_slot_uid, notes } = req.body;
  if (!new_time_slot_uid) {
    return res.status(400).json({ message: 'New time slot UID is required' });
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // Fetch the appointment
    const appointmentQuery = 'SELECT * FROM appointments WHERE appointment_uid = $1';
    const appointmentResult = await client.query(appointmentQuery, [appointment_uid]);
    if (appointmentResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Appointment not found' });
    }
    const appointment = appointmentResult.rows[0];
    // Check ownership or admin
    if (appointment.user_uid !== req.user.user_uid && req.user.role !== 'admin') {
      await client.query('ROLLBACK');
      return res.status(401).json({ message: 'Unauthorized to reschedule this appointment' });
    }
    const old_time_slot_uid = appointment.time_slot_uid;

    // Lock and check new time slot availability
    const newSlotQuery = 'SELECT * FROM time_slots WHERE time_slot_uid = $1 FOR UPDATE';
    const newSlotResult = await client.query(newSlotQuery, [new_time_slot_uid]);
    if (newSlotResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'New time slot not found' });
    }
    const newSlot = newSlotResult.rows[0];
    if (newSlot.availability_status !== 'available') {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'New time slot is not available' });
    }
    const timestamp = new Date().toISOString();
    // Update old time slot to available
    const updateOldSlotQuery = "UPDATE time_slots SET availability_status = 'available', updated_at = $1 WHERE time_slot_uid = $2";
    await client.query(updateOldSlotQuery, [timestamp, old_time_slot_uid]);
    // Update new time slot to booked
    const updateNewSlotQuery = "UPDATE time_slots SET availability_status = 'booked', updated_at = $1 WHERE time_slot_uid = $2";
    await client.query(updateNewSlotQuery, [timestamp, new_time_slot_uid]);
    // Update appointment record
    const updateAppointmentQuery = `
      UPDATE appointments
      SET time_slot_uid = $1, status = 'rescheduled', notes = COALESCE($2, notes), updated_at = $3
      WHERE appointment_uid = $4
      RETURNING appointment_uid, time_slot_uid, status, updated_at
    `;
    const updateResult = await client.query(updateAppointmentQuery, [new_time_slot_uid, notes || null, timestamp, appointment_uid]);
    // Log email notification for reschedule (mock)
    const notification_uid = generateId('enot');
    const insertNotificationQuery = `
      INSERT INTO email_notifications
      (notification_uid, appointment_uid, notification_type, recipient_email, sent_status, created_at)
      VALUES ($1, $2, 'reschedule_notification', $3, 'sent', $4)
    `;
    await client.query(insertNotificationQuery, [notification_uid, appointment_uid, appointment.customer_email, timestamp]);
    
    await client.query('COMMIT');
    return res.status(200).json(updateResult.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    return res.status(500).json({ message: 'Internal Server Error' });
  } finally {
    client.release();
  }
});

/*
  @desc  Cancel an appointment and release the associated time slot
  @need: Update appointment’s status to 'cancelled' and set the time slot to 'available'.
*/
app.delete('/api/appointments/:appointment_uid', authenticateToken, async (req, res) => {
  const { appointment_uid } = req.params;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // Fetch the appointment
    const appointmentQuery = 'SELECT * FROM appointments WHERE appointment_uid = $1';
    const appointmentResult = await client.query(appointmentQuery, [appointment_uid]);
    if (appointmentResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Appointment not found' });
    }
    const appointment = appointmentResult.rows[0];
    // Check ownership or admin
    if (appointment.user_uid !== req.user.user_uid && req.user.role !== 'admin') {
      await client.query('ROLLBACK');
      return res.status(401).json({ message: 'Unauthorized to cancel this appointment' });
    }
    const timestamp = new Date().toISOString();
    // Update appointment status to cancelled
    const updateAppointmentQuery = `
      UPDATE appointments
      SET status = 'cancelled', updated_at = $1
      WHERE appointment_uid = $2
      RETURNING appointment_uid, status, updated_at
    `;
    const updateAppointmentResult = await client.query(updateAppointmentQuery, [timestamp, appointment_uid]);
    // Release the time slot associated with the appointment
    const updateSlotQuery = "UPDATE time_slots SET availability_status = 'available', updated_at = $1 WHERE time_slot_uid = $2";
    await client.query(updateSlotQuery, [timestamp, appointment.time_slot_uid]);
    // Log email notification for cancellation (mock)
    const notification_uid = generateId('enot');
    const insertNotificationQuery = `
      INSERT INTO email_notifications
      (notification_uid, appointment_uid, notification_type, recipient_email, sent_status, created_at)
      VALUES ($1, $2, 'cancellation_notification', $3, 'sent', $4)
    `;
    await client.query(insertNotificationQuery, [notification_uid, appointment_uid, appointment.customer_email, timestamp]);
    
    await client.query('COMMIT');
    return res.status(200).json(updateAppointmentResult.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    return res.status(500).json({ message: 'Internal Server Error' });
  } finally {
    client.release();
  }
});

//
// Routes: Admin-Specific Endpoints for Time Slots
//

/*
  @desc  Get admin time slots, optionally filtered by date
  @need: Use admin token to fetch time slots where admin_uid matches.
*/
app.get('/api/admin/time-slots', authenticateToken, adminOnly, async (req, res) => {
  const { date } = req.query;
  try {
    let query = "SELECT * FROM time_slots WHERE admin_uid = $1";
    const params = [req.user.user_uid];
    if (date) {
      query += " AND slot_date = $2";
      params.push(date);
    }
    const result = await pool.query(query, params);
    return res.status(200).json(result.rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

/*
  @desc  Create a new time slot as admin
  @need: Insert a new record into time_slots with availability_status set to 'available'
*/
app.post('/api/admin/time-slots', authenticateToken, adminOnly, async (req, res) => {
  const { slot_date, start_time, end_time } = req.body;
  if (!slot_date || !start_time || !end_time) {
    return res.status(400).json({ message: 'Missing required time slot fields' });
  }
  try {
    const time_slot_uid = generateId('ts');
    const admin_uid = req.user.user_uid;
    const timestamp = new Date().toISOString();
    const query = `
      INSERT INTO time_slots (time_slot_uid, admin_uid, slot_date, start_time, end_time, availability_status, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, 'available', $6, $7)
      RETURNING *
    `;
    const values = [time_slot_uid, admin_uid, slot_date, start_time, end_time, timestamp, timestamp];
    const result = await pool.query(query, values);
    return res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

/*
  @desc  Update an existing time slot as admin
  @need: Validate admin ownership and perform update on allowed fields.
*/
app.put('/api/admin/time-slots/:time_slot_uid', authenticateToken, adminOnly, async (req, res) => {
  const { time_slot_uid } = req.params;
  const { slot_date, start_time, end_time, availability_status } = req.body;
  try {
    // First, check if the time slot belongs to the admin
    const checkQuery = "SELECT * FROM time_slots WHERE time_slot_uid = $1 AND admin_uid = $2";
    const checkResult = await pool.query(checkQuery, [time_slot_uid, req.user.user_uid]);
    if (checkResult.rows.length === 0) {
      return res.status(400).json({ message: 'Time slot not found or unauthorized' });
    }
    const timestamp = new Date().toISOString();
    // Update allowed fields if provided
    const updateQuery = `
      UPDATE time_slots
      SET slot_date = COALESCE($1, slot_date),
          start_time = COALESCE($2, start_time),
          end_time = COALESCE($3, end_time),
          availability_status = COALESCE($4, availability_status),
          updated_at = $5
      WHERE time_slot_uid = $6
      RETURNING *
    `;
    const updateResult = await pool.query(updateQuery, [slot_date, start_time, end_time, availability_status, timestamp, time_slot_uid]);
    return res.status(200).json(updateResult.rows[0]);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

/*
  @desc  Delete a time slot as admin (only if available)
  @need: Ensure the time slot is available before deletion.
*/
app.delete('/api/admin/time-slots/:time_slot_uid', authenticateToken, adminOnly, async (req, res) => {
  const { time_slot_uid } = req.params;
  try {
    // Ensure that the time slot belongs to admin and is available
    const checkQuery = "SELECT * FROM time_slots WHERE time_slot_uid = $1 AND admin_uid = $2 AND availability_status = 'available'";
    const checkResult = await pool.query(checkQuery, [time_slot_uid, req.user.user_uid]);
    if (checkResult.rows.length === 0) {
      return res.status(400).json({ message: 'Time slot cannot be deleted (it may be booked or unauthorized)' });
    }
    const deleteQuery = "DELETE FROM time_slots WHERE time_slot_uid = $1";
    await pool.query(deleteQuery, [time_slot_uid]);
    return res.status(200).json({ message: 'Time slot deleted successfully' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

//
// Routes: Admin Appointments Endpoints
//

/*
  @desc  Get appointments for admin based on their managed time slots; optional status filtering.
  @need: Join appointments with time_slots to filter by admin_uid.
*/
app.get('/api/admin/appointments', authenticateToken, adminOnly, async (req, res) => {
  const { status } = req.query;
  try {
    let query = `
      SELECT a.*
      FROM appointments a
      JOIN time_slots t ON a.time_slot_uid = t.time_slot_uid
      WHERE t.admin_uid = $1
    `;
    const params = [req.user.user_uid];
    if (status) {
      query += " AND a.status = $2";
      params.push(status);
    }
    const result = await pool.query(query, params);
    return res.status(200).json(result.rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

//
// Catch-all route for SPA routing
//
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

//
// Start the server
//
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});