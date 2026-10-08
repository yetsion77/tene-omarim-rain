import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase's web configuration identifies the app; access is controlled by Auth and Rules.
const config = {
  apiKey: 'AIzaSyB4jjc1o5qVRUX8guW2S0RiHEunyRYzcFY',
  authDomain: 'boor-a77ba.firebaseapp.com',
  projectId: 'boor-a77ba',
  storageBucket: 'boor-a77ba.firebasestorage.app',
  appId: '1:833492383808:web:4a8d01cbf81f67d88dc7a5',
};

export const isConfigured = Boolean(config.apiKey && config.authDomain && config.projectId && config.appId);
export const hasStorage = isConfigured && Boolean(config.storageBucket);
export const firebaseApp = isConfigured ? initializeApp(config) : null;
export const auth = firebaseApp ? getAuth(firebaseApp) : null;
export const db = firebaseApp ? getFirestore(firebaseApp) : null;
export const storage = hasStorage ? getStorage(firebaseApp) : null;
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });
