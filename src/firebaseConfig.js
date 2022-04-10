
import { initializeApp } from "firebase/app";
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  //Your Config Data
};

export const app = initializeApp(firebaseConfig);
export const database = getFirestore(app);