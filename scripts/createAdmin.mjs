import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, setDoc, Timestamp } from "firebase/firestore";

// 1. Paste your Firebase config here (from the Firebase Console)
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// 2. Define the Admin credentials you want to create
const ADMIN_EMAIL = "mangia.manga.inc@gmail.com";
const ADMIN_PASSWORD = "SuperSecretPassword123!";
const ADMIN_NAME = "Master Admin";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function createAdmin() {
  console.log("🚀 Starting Admin Creation Process...");
  
  try {
    // Step 1: Create the user in Firebase Auth
    console.log(`Creating user in Authentication for ${ADMIN_EMAIL}...`);
    const userCredential = await createUserWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASSWORD);
    const user = userCredential.user;
    console.log(`✅ User created successfully! UID: ${user.uid}`);

    // Step 2: Create the user profile in Firestore with role: "admin"
    console.log(`Setting up Admin profile in Firestore for UID: ${user.uid}...`);
    const profile = {
      email: ADMIN_EMAIL,
      displayName: ADMIN_NAME,
      photoURL: null,
      role: "admin", // <--- THIS IS THE CRITICAL PART
      preferredLanguage: "en",
      subscriptionStatus: "active", // Give admin premium access
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    await setDoc(doc(db, "users", user.uid), profile, { merge: true });
    console.log("✅ Firestore profile created with 'admin' role!");
    
    console.log("🎉 MASTER ADMIN SUCCESSFULLY CREATED!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating admin:");
    console.error(error.message);
    process.exit(1);
  }
}

createAdmin();
