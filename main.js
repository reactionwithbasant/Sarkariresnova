import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from "firebase/auth";
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

// FIXED: Random Amounts for Live Ticker
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
            alert(`🎉 Great news! Your ${currentCoins} Coins have been auto-converted into ₹${rupeesToAdd.toFixed(2)}.`);
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
            document.getElementById('txtConvertTimer').innerText = "Converting shortly...";
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
    AdMob.addListener('onRewardedVideoAdRewarded', () => { if(pendingReward > 0) processReward(); });
  } catch(e) {}
}

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
      currentCoins = data.walletCoins || (data.walletBalance || 0); 
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
  } else { showSection('loginSection'); }
});

document.getElementById('btnGoogleLogin').addEventListener('click', () => signInWithPopup(auth, provider));

window.openGame = async function(gameId) {
  if(todayPlays >= DAILY_LIMIT) return alert(`🛑 Daily Limit Reached!\nAapne aaj ke ${DAILY_LIMIT} games khel liye hain.`);
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
  board.innerHTML = ''; 
  board.style.pointerEvents = 'auto'; 

  if(currentGameObj.id === 'slot') { board.innerHTML = `<div class="slot-box" id="s1">🍒</div><div class="slot-box" id="s2">🍋</div><div class="slot-box" id="s3">🔔</div>`; playBtn.style.display = 'block'; }
  else if(currentGameObj.id === 'coin') { board.innerHTML = `<div class="coin" id="c1">🪙</div>`; playBtn.style.display = 'block'; }
  else if(currentGameObj.id === 'spin') { board.innerHTML = `<div class="spin-wheel" id="w1">🎡</div>`; playBtn.style.display = 'block'; }
  else if(currentGameObj.id === 'dice') { board.innerHTML = `<div class="dice-icon" id="d1">⚀</div>`; playBtn.style.display = 'block'; }
  else if(currentGameObj.id === 'scratch') { board.innerHTML = `<div class="scratch-area manual-btn">Tap to Scratch</div>`; playBtn.style.display = 'none'; }
  else if(currentGameObj.id === 'box') { board.innerHTML = `<div class="interactive-btn manual-btn">🎁</div><div class="interactive-btn manual-btn">🎁</div><div class="interactive-btn manual-btn">🎁</div>`; playBtn.style.display = 'none'; }
  else if(currentGameObj.id === 'color') { board.innerHTML = `<div class="interactive-btn manual-btn" style="background:#ef4444">🔴</div><div class="interactive-btn manual-btn" style="background:#22c55e">🟢</div><div class="interactive-btn manual-btn" style="background:#3b82f6">🔵</div>`; playBtn.style.display = 'none'; }
  else if(currentGameObj.id === 'math') { 
    let a=Math.floor(Math.random()*10)+1, b=Math.floor(Math.random()*10)+1; 
    let btn1 = `<button class="interactive-btn manual-btn" data-math="true">${a+b}</button>`;
    let btn2 = `<button class="interactive-btn manual-btn" data-math="false">${a+b+2}</button>`;
    board.innerHTML = `<div style="width:100%"><div style="font-size:24px; margin-bottom:15px;">${a} + ${b} = ?</div>${Math.random() > 0.5 ? btn1+btn2 : btn2+btn1}</div>`; 
    playBtn.style.display = 'none'; 
  }
  else if(currentGameObj.id === 'rps') { board.innerHTML = `<div class="interactive-btn manual-btn">✊</div><div class="interactive-btn manual-btn">✋</div><div class="interactive-btn manual-btn">✌️</div>`; playBtn.style.display = 'none'; }
  else if(currentGameObj.id === 'card') { board.innerHTML = `<div class="interactive-btn manual-btn">🂠</div><div class="interactive-btn manual-btn">🂠</div><div class="interactive-btn manual-btn">🂠</div>`; playBtn.style.display = 'none'; }

  setTimeout(() => {
    document.querySelectorAll('.manual-btn').forEach(btn => {
      btn.onclick = function() {
        let mData = this.getAttribute('data-math');
        let fMath = mData === "true" ? true : (mData === "false" ? false : null);
        window.processGameLogic(true, fMath, this);
      };
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
  } else if(currentGameObj.id === 'spin') {
    document.getElementById('w1').style.transform = `rotate(${Math.floor(Math.random()*1000)+1000}deg)`; setTimeout(() => window.processGameLogic(false, isWin), 2000);
  } else if(currentGameObj.id === 'dice') {
    let d=['⚀','⚁','⚂','⚃','⚄','⚅'], t=0, int=setInterval(()=>{ document.getElementById('d1').innerText=d[Math.floor(Math.random()*6)]; if(++t>15){ clearInterval(int); document.getElementById('d1').innerText=isWin?'⚅':'⚀'; window.processGameLogic(false, isWin); } }, 100);
  }
});

window.processGameLogic = async function(isManualInteraction, forceMathLogic = null, clickedEl = null) {
  if(isManualInteraction) document.getElementById('dynamicGameBoard').style.pointerEvents = 'none'; 
  
  let isWin = Math.random() > 0.6; 
  if(forceMathLogic === false) isWin = false; 
  if(forceMathLogic === true) isWin = true; 

  if(clickedEl) {
    clickedEl.style.transform = 'scale(0.9)';
    if(currentGameObj.id === 'scratch') clickedEl.innerText = isWin ? "🪙 Prize!" : "❌ Empty";
    else if(currentGameObj.id === 'box') clickedEl.innerText = isWin ? "💎" : "💨";
    else if(currentGameObj.id === 'color') clickedEl.innerHTML = isWin ? "✔️" : "❌";
    else if(currentGameObj.id === 'math') clickedEl.style.background = isWin ? "#22c55e" : "#ef4444";
    else if(currentGameObj.id === 'rps') clickedEl.innerText = isWin ? "👑" : "💀";
    else if(currentGameObj.id === 'card') clickedEl.innerText = isWin ? "🂡" : "🃟";
  }
  
  try { await AdMob.prepareInterstitial({ adId: 'ca-app-pub-3940256099942544/1033173712', isTesting: true }); await AdMob.showInterstitial(); } catch(e) {}

  setTimeout(() => {
    const btnClaim = document.getElementById('btnClaimReward');
    const resText = document.getElementById('gameResultText');

    if(isWin) {
      pendingReward = WIN_AMOUNTS[Math.floor(Math.random() * WIN_AMOUNTS.length)];
      resText.innerHTML = `🎉 You Won <b>${pendingReward} Coins</b>!`;
      resText.style.color = "#fbbf24";
    } else {
      pendingReward = CONSOLATION_PRIZE;
      resText.innerHTML = `😢 You Lost! Consolation: <b>${CONSOLATION_PRIZE} Coins</b>`;
      resText.style.color = "#f43f5e";
    }
    btnClaim.innerText = `📺 Watch Ad to Claim ${pendingReward} Coins`;
    btnClaim.style.display = 'block';
  }, isManualInteraction ? 800 : 0);
};

document.getElementById('btnClaimReward').addEventListener('click', async () => {
  document.getElementById('btnClaimReward').disabled = true; 
  try {
    await AdMob.prepareRewardVideoAd({ adId: 'ca-app-pub-3940256099942544/5224354917', isTesting: true });
    await AdMob.showRewardVideoAd();
  } catch(e) { 
    alert("📺 Rewarded Video Ad Simulating..."); setTimeout(() => { if(pendingReward > 0) processReward(); }, 2000);
  }
});

async function processReward() {
  if(pendingReward <= 0) return; 
  let wonCoins = pendingReward; pendingReward = 0; 

  currentCoins += wonCoins; 
  todayPlays += 1;
  lastGamePlayedTime = Date.now(); 
  updateBalanceUI();

  try {
    await updateDoc(doc(db, "ad2win_users", currentUserUID), { walletCoins: currentCoins, playsToday: todayPlays, lastPlayDate: getTodayDateStr() });
    await addDoc(collection(db, "ad2win_history"), { userId: currentUserUID, amount: wonCoins, type: "Win (Coins)", game: currentGameObj.name, date: new Date().toISOString() });
    alert(`✅ ${wonCoins} Coins added to wallet!`);
  } catch(e) {}
  showSection('dashboardSection');
}

document.getElementById('btnShareRefer').addEventListener('click', () => {
  const shareText = `🔥 Play awesome games and win real cash daily!\n\nUse my Refer Code: *${userReferCode}* and get 500 Coins Instant Bonus.\n\nDownload Now: https://ad2win.fbgfeeds.in`;
  if (navigator.share) navigator.share({ title: 'Ad2Win', text: shareText }).catch(e=>e);
  else alert("Copy this text:\n\n" + shareText);
});

document.getElementById('btnApplyRefer').addEventListener('click', async () => {
  const code = document.getElementById('inputReferCode').value.trim().toUpperCase();
  if(!code) return alert("Enter a valid code.");
  if(code === userReferCode) return alert("You cannot use your own code!");
  
  const snap = await getDocs(query(collection(db, "ad2win_users"), where("referCode", "==", code)));
  if(snap.empty) return alert("Invalid Referral Code!");

  let referrerId = snap.docs[0].id;
  let referrerData = snap.docs[0].data();
  let referrerCoins = referrerData.walletCoins || (referrerData.walletBalance || 0);

  currentCoins += 500; updateBalanceUI();
  await updateDoc(doc(db, "ad2win_users", currentUserUID), { walletCoins: currentCoins, referredBy: code });
  await addDoc(collection(db, "ad2win_history"), { userId: currentUserUID, amount: 500, type: "Refer Bonus (Coins)", date: new Date().toISOString() });
  
  await updateDoc(doc(db, "ad2win_users", referrerId), { walletCoins: referrerCoins + 1000 });
  await addDoc(collection(db, "ad2win_history"), { userId: referrerId, amount: 1000, type: "Friend Joined (Coins)", date: new Date().toISOString() });

  document.getElementById('referralInputArea').style.display = 'none';
  document.getElementById('referralSuccessArea').style.display = 'block';
  alert("🎉 Code Applied! You got 500 Coins.");
});

document.getElementById('btnSubmitWithdraw').addEventListener('click', async () => {
  const withdrawAmount = parseFloat(document.getElementById('withdrawAmount').value);
  if(currentRupees < 100) return alert(`❌ Minimum withdrawal is ₹100.`);
  if(withdrawAmount < 100) return alert(`❌ You cannot withdraw less than ₹100.`);
  if(withdrawAmount > currentRupees) return alert(`❌ Insufficient Main Balance! Aapke paas ₹${currentRupees.toFixed(2)} hain.`);

  currentRupees -= withdrawAmount; 
  updateBalanceUI();
  
  await updateDoc(doc(db, "ad2win_users", currentUserUID), { walletRupees: currentRupees });
  await addDoc(collection(db, "ad2win_withdrawals"), { userId: currentUserUID, amount: withdrawAmount, status: 'Pending', date: new Date().toISOString() });
  await addDoc(collection(db, "ad2win_history"), { userId: currentUserUID, amount: withdrawAmount, type: "Withdraw (₹)", date: new Date().toISOString() });
  
  alert("✅ Withdrawal Request Sent to Admin!"); 
  showSection('dashboardSection');
});

document.getElementById('btnGoHistory').addEventListener('click', async () => {
  showSection('historySection'); const hDiv = document.getElementById('historyList'); hDiv.innerHTML = "Loading...";
  try {
    const snap = await getDocs(query(collection(db, "ad2win_history"), where("userId", "==", currentUserUID)));
    if(snap.empty) { hDiv.innerHTML = "No transactions yet."; return; }
    let hist = []; snap.forEach(d => hist.push(d.data()));
    hist.sort((a, b) => new Date(b.date) - new Date(a.date));
    hDiv.innerHTML = "";
    hist.forEach(data => {
      let isWin = data.type.includes("Withdraw") === false;
      let symbol = data.type.includes("₹") ? "₹" : "🪙";
      hDiv.innerHTML += `<div style="background: rgba(255,255,255,0.05); padding: 10px; margin-bottom: 8px; border-radius: 8px; display:flex; justify-content: space-between;"><div><strong>${data.type}</strong><br><small style="color:#94a3b8;">${new Date(data.date).toLocaleDateString()}</small></div><div style="color: ${isWin?'#4ade80':'#f43f5e'}; font-weight: bold;">${isWin?'+':'-'}${symbol}${data.amount}</div></div>`;
    });
  } catch(e) { hDiv.innerHTML = "Error loading history."; }
});

document.getElementById('btnGoWithdraw').addEventListener('click', () => showSection('withdrawSection'));
document.getElementById('btnGoRefer').addEventListener('click', () => showSection('referSection'));
document.getElementById('btnLeaveGame').addEventListener('click', () => showSection('dashboardSection'));
['btnBackToDash2', 'btnBackToDash3', 'btnBackFromRefer'].forEach(id => document.getElementById(id).addEventListener('click', () => showSection('dashboardSection')));

