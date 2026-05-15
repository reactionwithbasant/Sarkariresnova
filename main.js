import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithRedirect, getRedirectResult, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, updateDoc } from "firebase/firestore";

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

// IMPORTANT: Web Client ID configuration
provider.setCustomParameters({
  prompt: 'select_account'
});

window.addEventListener('load', () => {
    const loginBtn = document.getElementById('btnGoogleLogin');
    if (loginBtn) {
        loginBtn.onclick = async () => {
            console.log("Redirecting to Google...");
            try {
                await signInWithRedirect(auth, provider);
            } catch (err) {
                alert("Login Error: " + err.message);
            }
        };
    }
});

onAuthStateChanged(auth, async (user) => {
  const loginSec = document.getElementById('loginSection');
  const dashSec = document.getElementById('dashboardSection');

  if (user) {
    document.getElementById('userName').innerText = user.displayName ? user.displayName.split(" ")[0] : "User";
    loginSec.style.display = "none";
    dashSec.style.display = "block";
    
    // Auto sync user data
    const userRef = doc(db, "ad2win_users", user.uid);
    const docSnap = await getDoc(userRef);
    if (!docSnap.exists()) {
        await setDoc(userRef, { name: user.displayName, walletCoins: 0, walletRupees: 0.00 });
    } else {
        document.getElementById('txtCoins').innerText = docSnap.data().walletCoins || 0;
        document.getElementById('txtRupees').innerText = (docSnap.data().walletRupees || 0).toFixed(2);
    }
  } else {
    getRedirectResult(auth).catch((e) => {
        if(e.code !== "auth/operation-not-supported-in-this-environment") {
            alert("Auth Error: " + e.message);
        }
    });
    loginSec.style.display = "block";
    dashSec.style.display = "none";
  }
});

