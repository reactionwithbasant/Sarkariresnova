import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithRedirect, getRedirectResult, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, updateDoc, collection, addDoc, query, where, getDocs } from "firebase/firestore";

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyC5RgzMeAlQrbKbtcRvY7YgNKK59w2mT8s",
  authDomain: "raghvitamart.firebaseapp.com",
  databaseURL: "https://raghvitamart-default-rtdb.firebaseio.com",
  projectId: "raghvitamart",
  storageBucket: "raghvitamart.firebasestorage.app",
  messagingSenderId: "849119353425",
  appId: "1:849119353425:web:cc2114ea115235cc43f670"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

// Debugging: App start hote hi alert aayega
alert("SYSTEM: Ad2Win Engine Started!");

// Sabse zaroori: Button event listener
window.addEventListener('load', () => {
    const loginBtn = document.getElementById('btnGoogleLogin');
    
    if (loginBtn) {
        loginBtn.onclick = async () => {
            alert("ACTION: Google Login Triggered...");
            try {
                // Force Direct Redirect
                await signInWithRedirect(auth, provider);
            } catch (err) {
                alert("CRITICAL ERROR: " + err.message);
            }
        };
        console.log("Button linked successfully");
    } else {
        alert("ERROR: Login Button Not Found in HTML!");
    }
});

// Auth State Change
onAuthStateChanged(auth, async (user) => {
  const loginSec = document.getElementById('loginSection');
  const dashSec = document.getElementById('dashboardSection');

  if (user) {
    alert("WELCOME: " + user.displayName);
    if(loginSec) loginSec.style.display = "none";
    if(dashSec) dashSec.style.display = "block";
  } else {
    // Check if coming back from redirect
    getRedirectResult(auth).catch((e) => {
        if(e.code !== "auth/operation-not-supported-in-this-environment") {
            alert("AUTH FAIL: " + e.message);
        }
    });
  }
});
