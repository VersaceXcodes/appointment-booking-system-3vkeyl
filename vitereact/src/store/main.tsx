import { configureStore, combineReducers, createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { io } from 'socket.io-client';
import axios from 'axios';

// Define TypeScript interfaces for our state

interface AuthState {
  user_uid: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  token: string;
  is_authenticated: boolean;
}

interface TimeSlot {
  time_slot_uid: string;
  admin_uid: string;
  slot_date: string;
  start_time: string;
  end_time: string;
  availability_status: string;
  created_at: string;
  updated_at: string;
}

interface Appointment {
  appointment_uid: string;
  user_uid: string | null;
  time_slot_uid: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  notes: string | null;
  booking_reference: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface Notification {
  message: string;
  type: string;
  timestamp: string;
}

interface NotificationState {
  notifications: Notification[];
}

interface RealtimeState {
  socket: any;
}

// Create async thunk to initialize the Socket.io connection
export const init_socket_connection = createAsyncThunk(
  'realtime/init_socket_connection',
  async (_, thunkAPI) => {
    // Connect to the backend socket server using the VITE_API_BASE_URL environment variable
    const socket = io(import.meta.env.VITE_API_BASE_URL);
    // Listen for 'global_notification' events
    socket.on("global_notification", (notification: Notification) => {
      thunkAPI.dispatch(notifications_slice.actions.add_notification(notification));
    });
    return socket;
  }
);

// Create auth slice
const auth_slice = createSlice({
  name: 'auth',
  initialState: {
    user_uid: "",
    name: "",
    email: "",
    phone: "",
    role: "",
    token: "",
    is_authenticated: false
  } as AuthState,
  reducers: {
    set_auth_state: (state, action: PayloadAction<AuthState>) => {
      return action.payload;
    },
    clear_auth_state: (state) => {
      state.user_uid = "";
      state.name = "";
      state.email = "";
      state.phone = "";
      state.role = "";
      state.token = "";
      state.is_authenticated = false;
    }
  }
});

// Create time_slots slice
const time_slots_slice = createSlice({
  name: 'time_slots',
  initialState: [] as TimeSlot[],
  reducers: {
    set_time_slots: (_state, action: PayloadAction<TimeSlot[]>) => action.payload,
    add_time_slot: (state, action: PayloadAction<TimeSlot>) => {
      state.push(action.payload);
    },
    update_time_slot: (state, action: PayloadAction<TimeSlot>) => {
      const index = state.findIndex(ts => ts.time_slot_uid === action.payload.time_slot_uid);
      if (index !== -1) {
        state[index] = action.payload;
      }
    },
    remove_time_slot: (state, action: PayloadAction<string>) =>
      state.filter(ts => ts.time_slot_uid !== action.payload)
  }
});

// Create appointments slice
const appointments_slice = createSlice({
  name: 'appointments',
  initialState: [] as Appointment[],
  reducers: {
    set_appointments: (_state, action: PayloadAction<Appointment[]>) => action.payload,
    add_appointment: (state, action: PayloadAction<Appointment>) => {
      state.push(action.payload);
    },
    update_appointment: (state, action: PayloadAction<Appointment>) => {
      const index = state.findIndex(a => a.appointment_uid === action.payload.appointment_uid);
      if (index !== -1) {
        state[index] = action.payload;
      }
    },
    remove_appointment: (state, action: PayloadAction<string>) =>
      state.filter(a => a.appointment_uid !== action.payload)
  }
});

// Create notifications slice
const notifications_slice = createSlice({
  name: 'notifications',
  initialState: { notifications: [] } as NotificationState,
  reducers: {
    add_notification: (state, action: PayloadAction<Notification>) => {
      state.notifications.push(action.payload);
    },
    remove_notification: (state, action: PayloadAction<number>) => {
      state.notifications.splice(action.payload, 1);
    },
    clear_notifications: (state) => {
      state.notifications = [];
    }
  }
});

// Create realtime slice
const realtime_slice = createSlice({
  name: 'realtime',
  initialState: { socket: null } as RealtimeState,
  reducers: {
    set_socket: (state, action: PayloadAction<any>) => {
      state.socket = action.payload;
    },
    clear_socket: (state) => {
      state.socket = null;
    }
  },
  extraReducers: (builder) => {
    builder.addCase(init_socket_connection.fulfilled, (state, action) => {
      state.socket = action.payload;
    });
  }
});

// Combine slices into a root reducer
const root_reducer = combineReducers({
  auth: auth_slice.reducer,
  time_slots: time_slots_slice.reducer,
  appointments: appointments_slice.reducer,
  notifications: notifications_slice.reducer,
  realtime: realtime_slice.reducer
});

// Set up persist configuration to use localStorage; persist only the required slices.
const persist_config = {
  key: 'root',
  storage,
  whitelist: ['auth', 'time_slots', 'appointments', 'notifications']
};

const persisted_reducer = persistReducer(persist_config, root_reducer);

// Configure the Redux store
const store = configureStore({
  reducer: persisted_reducer,
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          'persist/PERSIST',
          'persist/REHYDRATE',
          'persist/PAUSE',
          'persist/FLUSH',
          'persist/PURGE',
          'persist/REGISTER'
        ]
      }
    })
});

// Initialize realtime socket connection
store.dispatch(init_socket_connection() as any);

// Create the persistor for redux-persist
export const persistor = persistStore(store);

// Export actions for use in views
export const auth_actions = auth_slice.actions;
export const time_slots_actions = time_slots_slice.actions;
export const appointments_actions = appointments_slice.actions;
export const notifications_actions = notifications_slice.actions;
export const realtime_actions = realtime_slice.actions;

// Export RootState and AppDispatch types for usage with react-redux hooks
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Export the store as default so it can be imported as `import store from '@/store/main'`
export default store;