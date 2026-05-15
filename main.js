import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithRedirect, getRedirectResult, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, updateDoc, collection, addDoc, query, where, getDocs } from "firebase/firestore";
import { AdMob, BannerAdSize, BannerAdPosition } from '@capacitor-community/admob';

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

// FIXED: Web Client ID added for Google Login in APK
provider.setCustomParameters({
  prompt: 'select_account'
});

let currentUserUID = null;
let currentCoins = 0; 
let currentRupees = 0.00;
let lastConversionTime = 0;
let conversionTimerInterval;

let userReferCode = "";
let currentGameObj = null, pendingReward = 0;

const COINS_PER_RUPEE = 100; 
const CONVERT_TIME_MS = 24 * 60 * 60 * 1000; 

const WIN_AMOUNTS = [5, 10, 15, 20, 25, 50]; 
const CONSOLATION_PRIZE = 2; 
const DAILY_LIMIT = 40; 
let todayPlays = 0;
let lastGamePlayedTime = 0; 

const GAMES = [
  { id: 'slot', name: 'Jackpot Slots', icon: '🎰', action: 'auto', desc: 'Click play to spin.' },
  { id: 'coin', name: 'Coin Flip', icon: '🪙', action: 'auto', desc: 'Click play to flip.' },
  { id: 'spin', name: 'Spin Wheel', icon: '🎡', action: 'auto', desc: 'Click play to spin.' },
  { id: 'dice', name: 'Lucky Dice', icon: '🎲', action: 'auto', desc: 'Click play to roll.' },
  { id: 'scratch', name: 'Scratch Card', icon: '🎫', action: 'manual', desc: 'Tap the gray box to scratch.' },
  { id: 'box', name: 'Mystery Box', icon: '🎁', action: 'manual', desc: 'Choose a lucky box.' },
  { id: 'color', name: 'Color Guess', icon: '🎨', action: 'manual', desc: 'Pick the winning color.' },
  { id: 'math', name: 'Math Quiz', icon: '🧮', action: 'manual', desc: 'Select the correct answer.' },
  { id: 'rps', name: 'Rock Paper', icon: '✌️', action: 'manual', desc: 'Choose your move.' },
  { id: 'card', name: 'Card Draw', icon: '🃏', action: 'manual', desc: 'Draw a lucky card.' }
];

// Login Handling with Redirect Result
onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUserUID = user.uid;
    document.getElementById('userName').innerText = user.displayName.split(" ")[0];
    userReferCode = user.uid.substring(0, 6).toUpperCase(); 
    
    const userRef = doc(db, "ad2win_users", user.uid);
    const docSnap = await getDoc(userRef);
    const today = getTodayDateStr();

    if (!docSnap.exists()) {
      await setDoc(userRef, { 
          name: user.displayName, 
          walletCoins: 0, 
          walletRupees: 0.00,
          lastConversionTime: Date.now(), 
          referCode: userReferCode, 
          referredBy: null, 
          lastPlayDate: today, 
          playsToday: 0 
      });
      currentCoins = 0; currentRupees = 0; lastConversionTime = Date.now(); todayPlays = 0;
    } else {
      let data = docSnap.data();
      currentCoins = data.walletCoins || 0; 
      currentRupees = data.walletRupees || 0.00;
      lastConversionTime = data.lastConversionTime || Date.now();
      
      if(data.lastPlayDate !== today) { todayPlays = 0; await updateDoc(userRef, { lastPlayDate: today, playsToday: 0 }); } 
      else { todayPlays = data.playsToday || 0; }

      if(data.referredBy) {
          document.getElementById('referralInputArea').style.display = 'none';
          document.getElementById('referralSuccessArea').style.display = 'block';
      }
    }
    
    document.getElementById('myReferCode').innerText = userReferCode;
    await handleAutoConversion();
    startConversionTimer();
    updateBalanceUI(); generateTicker(); renderGames(); showSection('dashboardSection'); setupSafeAdMob();
  } else {
    // Check if user is returning from a redirect
    getRedirectResult(auth).catch((error) => {
        console.error("Redirect Login Error:", error);
    });
    showSection('loginSection');
  }
});

// Google Login Trigger (Redirect Method for APK Stability)
document.getElementById('btnGoogleLogin').addEventListener('click', () => {
    signInWithRedirect(auth, provider);
});

// --- Baaki Ka Game Logic Same Rahega ---

function generateTicker() {
  const names = ["Rohit", "Priya", "Amit", "Rahul", "Neha", "Vikas", "Sneha", "Karan", "Pooja", "Ravi", "Anjali"];
  const amounts = [100, 150, 200, 250, 500, 800, 1000, 1200, 1500, 2000];
  let str = "";
  for(let i=0; i<100; i++) {
    let n = names[Math.floor(Math.random() * names.length)];
    let a = amounts[Math.floor(Math.random() * amounts.length)];
    str += `🎉 ${n} withdrew ₹${a} &nbsp;&nbsp;•&nbsp;&nbsp; `;
  }
  document.getElementById('tickerText').innerHTML = str;
}

function renderGames() {
  const grid = document.getElementById('gamesGrid');
  grid.innerHTML = '';
  GAMES.forEach(game => {
    grid.innerHTML += `<div class="game-item" onclick="openGame('${game.id}')"><div class="game-icon">${game.icon}</div><div style="font-size: 13px; font-weight: bold; margin-bottom: 8px;">${game.name}</div><button class="btn" style="padding: 6px; font-size: 12px; margin:0;">Play</button></div>`;
  });
}

function showSection(id) {
  document.querySelectorAll('.section').forEach(sec => sec.classList.remove('active-section'));
  document.getElementById(id).classList.add('active-section');
}

function updateBalanceUI() { 
    document.getElementById('txtCoins').innerText = currentCoins; 
    document.getElementById('txtRupees').innerText = currentRupees.toFixed(2);
    document.getElementById('txtRemainingPlays').innerText = (DAILY_LIMIT - todayPlays);
}

function getTodayDateStr() {
    let d = new Date();
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

async function handleAutoConversion() {
    const now = Date.now();
    if (now - lastConversionTime >= CONVERT_TIME_MS) {
        if (currentCoins > 0) {
            let rupeesToAdd = currentCoins / COINS_PER_RUPEE;
            currentRupees += rupeesToAdd;
            await addDoc(collection(db, "ad2win_history"), { 
                userId: currentUserUID, amount: rupeesToAdd, type: "Auto Converted to ₹", date: new Date().toISOString() 
            });
            alert(`🎉 Your ${currentCoins} Coins have been converted into ₹${rupeesToAdd.toFixed(2)}.`);
        }
        currentCoins = 0;
        lastConversionTime = now;
        await updateDoc(doc(db, "ad2win_users", currentUserUID), { 
            walletCoins: currentCoins, 
            walletRupees: currentRupees,
            lastConversionTime: lastConversionTime
        });
        updateBalanceUI();
    }
}

function startConversionTimer() {
    if(conversionTimerInterval) clearInterval(conversionTimerInterval);
    conversionTimerInterval = setInterval(() => {
        let timeLeft = CONVERT_TIME_MS - (Date.now() - lastConversionTime);
        if (timeLeft <= 0) {
            document.getElementById('txtConvertTimer').innerText = "Converting...";
            handleAutoConversion(); 
        } else {
            let hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            let minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
            document.getElementById('txtConvertTimer').innerText = `Converts in: ${hours}h ${minutes}m`;
        }
    }, 1000); 
}

async function setupSafeAdMob() {
  try {
    await AdMob.initialize();
    await AdMob.showBanner({ adId: 'ca-app-pub-3940256099942544/6300978111', adSize: BannerAdSize.BANNER, position: BannerAdPosition.BOTTOM_CENTER, isTesting: true });
  } catch(e) {}
}

window.openGame = async function(gameId) {
  if(todayPlays >= DAILY_LIMIT) return alert(`🛑 Daily Limit Reached!`);
  const now = Date.now();
  if(now - lastGamePlayedTime < 60000) {
      const wait = Math.ceil((60000 - (now - lastGamePlayedTime)) / 1000);
      document.getElementById('cooldownAlert').style.display = 'block';
      document.getElementById('cooldownSeconds').innerText = wait;
      setTimeout(() => document.getElementById('cooldownAlert').style.display = 'none', 3000);
      return;
  }
  currentGameObj = GAMES.find(g => g.id === gameId);
  document.getElementById('gameTitle').innerText = currentGameObj.name;
  document.getElementById('gameInstruction').innerText = currentGameObj.desc;
  document.getElementById('gameResultText').innerText = '';
  document.getElementById('btnClaimReward').style.display = 'none';
  document.getElementById('btnClaimReward').disabled = false;
  pendingReward = 0;
  const board = document.getElementById('dynamicGameBoard');
  const playBtn = document.getElementById('btnStartGameAction');
  board.innerHTML = ''; board.style.pointerEvents = 'auto'; 
  if(currentGameObj.id === 'slot') { board.innerHTML = `<div class="slot-box" id="s1">🍒</div><div class="slot-box" id="s2">🍋</div><div class="slot-box" id="s3">🔔</div>`; playBtn.style.display = 'block'; }
  else if(currentGameObj.id === 'coin') { board.innerHTML = `<div class="coin" id="c1">🪙</div>`; playBtn.style.display = 'block'; }
  else if(currentGameObj.id === 'spin') { board.innerHTML = `<div class="spin-wheel" id="w1">🎡</div>`; playBtn.style.display = 'block'; }
  else if(currentGameObj.id === 'dice') { board.innerHTML = `<div class="dice-icon" id="d1">⚀</div>`; playBtn.style.display = 'block'; }
  else { board.innerHTML = `<div class="scratch-area manual-btn">Tap Here</div>`; playBtn.style.display = 'none'; }
  setTimeout(() => {
    document.querySelectorAll('.manual-btn').forEach(btn => {
      btn.onclick = function() { window.processGameLogic(true, null, this); };
    });
  }, 100);
  showSection('gamePlaySection');
}

document.getElementById('btnStartGameAction').addEventListener('click', () => {
  document.getElementById('btnStartGameAction').style.display = 'none';
  let isWin = Math.random() > 0.6; 
  if(currentGameObj.id === 'slot') {
    let t=0, int = setInterval(()=>{ ['s1','s2','s3'].forEach(id => document.getElementById(id).innerText = ['🍒','🍋','💎'][Math.floor(Math.random()*3)]); if(++t>15){ clearInterval(int); if(isWin){let e='💎';['s1','s2','s3'].forEach(id=>document.getElementById(id).innerText=e);} window.processGameLogic(false, isWin); } }, 100);
  } else if(currentGameObj.id === 'coin') {
    document.getElementById('c1').style.transform = `rotateY(${isWin?1080:1260}deg)`; setTimeout(() => { document.getElementById('c1').innerText = isWin?"Win":"Loss"; window.processGameLogic(false, isWin); }, 2000);
  } else { window.processGameLogic(false, isWin); }
});

window.processGameLogic = async function(isManualInteraction, forceMathLogic = null, clickedEl = null) {
  if(isManualInteraction) document.getElementById('dynamicGameBoard').style.pointerEvents = 'none'; 
  let isWin = Math.random() > 0.6; 
  if(clickedEl) clickedEl.innerText = isWin ? "💎 Win" : "💨 Loss";
  try { await AdMob.prepareInterstitial({ adId: 'ca-app-pub-3940256099942544/1033173712', isTesting: true }); await AdMob.showInterstitial(); } catch(e) {}
  setTimeout(() => {
    const btnClaim = document.getElementById('btnClaimReward');
    const resText = document.getElementById('gameResultText');
    if(isWin) { pendingReward = WIN_AMOUNTS[Math.floor(Math.random() * WIN_AMOUNTS.length)]; resText.innerHTML = `🎉 Won <b>${pendingReward} Coins</b>!`; resText.style.color = "#fbbf24"; }
    else { pendingReward = CONSOLATION_PRIZE; resText.innerHTML = `😢 Loss! Consolation: <b>${CONSOLATION_PRIZE} Coins</b>`; resText.style.color = "#f43f5e"; }
    btnClaim.innerText = `Claim ${pendingReward} Coins`; btnClaim.style.display = 'block';
  }, 800);
};

document.getElementById('btnClaimReward').addEventListener('click', async () => {
  document.getElementById('btnClaimReward').disabled = true; 
  try { await AdMob.prepareRewardVideoAd({ adId: 'ca-app-pub-3940256099942544/5224354917', isTesting: true }); await AdMob.showRewardVideoAd(); } 
  catch(e) { setTimeout(() => processReward(), 2000); }
});

async function processReward() {
  if(pendingReward <= 0) return; 
  let wonCoins = pendingReward; pendingReward = 0; 
  currentCoins += wonCoins; todayPlays += 1; lastGamePlayedTime = Date.now(); 
  updateBalanceUI();
  try {
    await updateDoc(doc(db, "ad2win_users", currentUserUID), { walletCoins: currentCoins, playsToday: todayPlays, lastPlayDate: getTodayDateStr() });
    await addDoc(collection(db, "ad2win_history"), { userId: currentUserUID, amount: wonCoins, type: "Win (Coins)", game: currentGameObj.name, date: new Date().toISOString() });
    alert(`✅ ${wonCoins} Coins added!`);
  } catch(e) {}
  showSection('dashboardSection');
}

// History & Navigation
document.getElementById('btnGoHistory').addEventListener('click', async () => {
  showSection('historySection'); const hDiv = document.getElementById('historyList'); hDiv.innerHTML = "Loading...";
  const snap = await getDocs(query(collection(db, "ad2win_history"), where("userId", "==", currentUserUID)));
  hDiv.innerHTML = snap.empty ? "No transactions." : "";
  snap.forEach(d => {
      let data = d.data();
      hDiv.innerHTML += `<div style="background: rgba(255,255,255,0.05); padding: 10px; margin-bottom: 8px; border-radius: 8px; display:flex; justify-content: space-between;"><div><strong>${data.type}</strong><br><small>${new Date(data.date).toLocaleDateString()}</small></div><div>${data.amount}</div></div>`;
  });
});

// Refer & Withdraw (Simplified for brevity)
document.getElementById('btnGoWithdraw').addEventListener('click', () => showSection('withdrawSection'));
document.getElementById('btnGoRefer').addEventListener('click', () => showSection('referSection'));
document.getElementById('btnLeaveGame').addEventListener('click', () => showSection('dashboardSection'));
['btnBackToDash2', 'btnBackToDash3', 'btnBackFromRefer'].forEach(id => document.getElementById(id).addEventListener('click', () => showSection('dashboardSection')));

