import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCO2d_THbo7XhCnL8oJxOhmTBWy-373x4s",
  authDomain: "alumacontracte.firebaseapp.com",
  projectId: "alumacontracte",
  storageBucket: "alumacontracte.firebasestorage.app",
  messagingSenderId: "284641437845",
  appId: "1:284641437845:web:f13c167f10e03d4e5b539c",
  measurementId: "G-XQV4EXGMSN",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

export const analytics = isSupported().then((ok) => (ok ? getAnalytics(app) : null));

export default app;
