import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithRedirect, getRedirectResult, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, updateDoc, collection, addDoc, query, where, getDocs } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC5RgzMeAlQrbKbtcRvY7YgNKK59w2mT8s",
  authDomain: "raghvitamart.firebaseapp.com",
  databaseURL: "https://raghvitamart-default-rtdb.firebaseio.com",
  projectId: "raghvitamart",
  storageBucket: "raghvitamart.firebasestorage.app",
  messagingSenderId: "849119353425",
  appId: "1:849119353425:web:cc2114ea115235cc43f670"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

// IMPORTANT: Waiting for HTML to load completely
window.addEventListener('DOMContentLoaded', () => {
    console.log("Ad2Win JS Loaded");
    
    const loginBtn = document.getElementById('btnGoogleLogin');
    
    if (loginBtn) {
        loginBtn.addEventListener('click', async () => {
            alert("Login Triggered! Please wait...");
            try {
                await signInWithRedirect(auth, provider);
            } catch (error) {
                alert("Login Error: " + error.message);
            }
        });
    } else {
        console.error("Login button not found in HTML!");
    }
});

// Authentication Observer
onAuthStateChanged(auth, async (user) => {
  const loginSec = document.getElementById('loginSection');
  const dashSec = document.getElementById('dashboardSection');

  if (user) {
    document.getElementById('userName').innerText = user.displayName ? user.displayName.split(" ")[0] : "User";
    loginSec.style.display = "none";
    dashSec.style.display = "block";
    
    // Fetch Coins
    const userRef = doc(db, "ad2win_users", user.uid);
    const docSnap = await getDoc(userRef);
    if (docSnap.exists()) {
        document.getElementById('txtCoins').innerText = docSnap.data().walletCoins || 0;
    }
  } else {
    getRedirectResult(auth).catch((error) => {
        if(error.code !== "auth/operation-not-supported-in-this-environment") {
            alert("System Error: " + error.message);
        }
    });
    loginSec.style.display = "block";
    dashSec.style.display = "none";
  }
});

