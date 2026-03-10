import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, onValue, off, push, update, remove, get } from 'firebase/database';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';

// Firebase configuration - In production, use environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "demo-key",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "school-bus-tracker-demo.firebaseapp.com",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://school-bus-tracker-demo-default-rtdb.firebaseio.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "school-bus-tracker-demo",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "school-bus-tracker-demo.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:123456789:web:demo"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export const auth = getAuth(app);

// Realtime Database helpers
export const updateBusLocation = async (busId: string, location: { lat: number; lng: number; heading?: number; speed?: number }) => {
  const busRef = ref(db, `buses/${busId}/location`);
  await set(busRef, {
    ...location,
    timestamp: Date.now()
  });
};

export const subscribeToBusLocation = (busId: string, callback: (location: any) => void) => {
  const busRef = ref(db, `buses/${busId}/location`);
  onValue(busRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      callback(data);
    }
  });
  return () => off(busRef);
};

export const subscribeToAllBuses = (callback: (buses: any) => void) => {
  const busesRef = ref(db, 'buses');
  onValue(busesRef, (snapshot) => {
    const data = snapshot.val();
    callback(data || {});
  });
  return () => off(busesRef);
};

export const updateTripStatus = async (tripId: string, status: string, data?: any) => {
  const tripRef = ref(db, `trips/${tripId}`);
  await update(tripRef, {
    status,
    ...data,
    lastUpdated: Date.now()
  });
};

export const subscribeToTrip = (tripId: string, callback: (trip: any) => void) => {
  const tripRef = ref(db, `trips/${tripId}`);
  onValue(tripRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      callback(data);
    }
  });
  return () => off(tripRef);
};

export const createTrip = async (tripData: any) => {
  const tripsRef = ref(db, 'trips');
  const newTripRef = push(tripsRef);
  await set(newTripRef, {
    ...tripData,
    createdAt: Date.now(),
    status: 'scheduled'
  });
  return newTripRef.key;
};

export const sendNotification = async (userId: string, notification: any) => {
  const notificationsRef = ref(db, `notifications/${userId}`);
  const newNotifRef = push(notificationsRef);
  await set(newNotifRef, {
    ...notification,
    read: false,
    createdAt: Date.now()
  });
};

export const subscribeToNotifications = (userId: string, callback: (notifications: any[]) => void) => {
  const notifRef = ref(db, `notifications/${userId}`);
  onValue(notifRef, (snapshot) => {
    const data = snapshot.val();
    const notifications = data ? Object.entries(data).map(([id, notif]: [string, any]) => ({ id, ...notif })) : [];
    callback(notifications.sort((a, b) => b.createdAt - a.createdAt));
  });
  return () => off(notifRef);
};

export { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut };
