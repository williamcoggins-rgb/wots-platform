import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  projectId: 'wots-platform-11435',
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
