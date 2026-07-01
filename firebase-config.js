/**
 * BluePay Firebase Configuration & Global Fintech Helpers
 * Responsible for: Firebase Init, Identity Management, Balance Logic, and Shared Helpers.
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
  getAuth, 
  onAuthStateChanged, 
  GoogleAuthProvider, 
  signInWithPopup 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  serverTimestamp, 
  increment, 
  runTransaction,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// 1. PLATFORM CONSTANTS
export const ADMIN_EMAIL = "liger4683@gmail.com";
export const WELCOME_BONUS = 200000;
export const REFERRAL_BONUS = 2000;
export const WITHDRAWAL_CODE_PRICE = 10000;
export const SITE_NAME = "BluePay";

export const INVESTMENT_PLANS = [
  { id: "nano", name: "Nano", roiPercent: 10, durationDays: 3, min: 1000, max: 4999 },
  { id: "starter", name: "Starter", roiPercent: 15, durationDays: 7, min: 5000, max: 19999 },
  { id: "bronze", name: "Bronze", roiPercent: 20, durationDays: 7, min: 20000, max: 49999 },
  { id: "silver", name: "Silver", roiPercent: 28, durationDays: 14, min: 50000, max: 99999 },
  { id: "gold", name: "Gold", roiPercent: 35, durationDays: 14, min: 100000, max: 199999 },
  { id: "diamond", name: "Diamond", roiPercent: 45, durationDays: 21, min: 200000, max: 499999 },
  { id: "platinum", name: "Platinum", roiPercent: 60, durationDays: 30, min: 500000, max: 999999 },
  { id: "elite", name: "Elite", roiPercent: 75, durationDays: 30, min: 1000000, max: 1999999 },
  { id: "vip", name: "VIP", roiPercent: 90, durationDays: 45, min: 2000000, max: 4999999 },
  { id: "apex", name: "APEX", roiPercent: 120, durationDays: 60, min: 5000000, max: Infinity }
];

// 2. FIREBASE INITIALIZATION
const firebaseConfig = {
  apiKey: "AIzaSyDJlOQ4vgvuJPzE6ZG56aFxAtX0PSxvOtI",
  authDomain: "apexvault-investment.firebaseapp.com",
  projectId: "apexvault-investment",
  storageBucket: "apexvault-investment.firebasestorage.app",
  messagingSenderId: "884037084154",
  appId: "1:884037084154:web:b9ca0de1293527d38afa43"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// 3. IDENTITY & DUPLICATE PREVENTION
/**
 * Standardizes user identity. If a user exists with the same email 
 * but different UID (e.g. switching from Email to Google), 
 * we link them to a single Firestore record.
 */
export async function syncUserIdentity(authUser, profileData = {}) {
  // Check if UID document exists
  const userRef = doc(db, "users", authUser.uid);
  const snap = await getDoc(userRef);

  if (snap.exists()) {
    await updateDoc(userRef, { lastSeen: serverTimestamp() });
    return snap.data();
  }

  // Check if email exists under another UID (Duplicate Prevention)
  const q = query(collection(db, "users"), where("email", "==", authUser.email));
  const emailSnap = await getDocs(q);

  if (!emailSnap.empty) {
    // A document for this email already exists under a different UID.
    // We treat the first created document as the source of truth.
    const existingUser = emailSnap.docs[0].data();
    return existingUser;
  }

  // New User - Create Document
  const userData = {
    uid: authUser.uid,
    email: authUser.email,
    displayName: authUser.displayName || profileData.fullName || "BluePay Investor",
    phone: profileData.phone || "",
    balance: WELCOME_BONUS,
    totalDeposited: 0,
    totalInvested: 0,
    totalWithdrawn: 0,
    totalEarned: 0,
    referralCode: Math.random().toString(36).substring(2, 10).toUpperCase(),
    referredBy: profileData.referredBy || "",
    referralCount: 0,
    referralEarnings: 0,
    kycStatus: "not_submitted",
    role: authUser.email === ADMIN_EMAIL ? "admin" : "user",
    agentName: "Sarah Mitchell", // Default starter agent
    isActive: true,
    createdAt: serverTimestamp(),
    lastSeen: serverTimestamp()
  };

  await setDoc(userRef, userData);
  
  // Log the welcome bonus as a transaction
  await logTx(authUser.uid, {
    type: "bonus",
    amount: WELCOME_BONUS,
    description: "Welcome Bonus Credited",
    status: "completed"
  });

  return userData;
}

// 4. FINTECH BALANCE OPERATIONS
export async function logTx(uid, data) {
  const txRef = doc(collection(db, "transactions"));
  await setDoc(txRef, {
    uid,
    ...data,
    createdAt: serverTimestamp()
  });
}

/**
 * Atomic balance update to prevent race conditions
 */
export async function updateWallet(uid, amount, type = 'credit', logDetails = {}) {
  const userRef = doc(db, "users", uid);
  try {
    await runTransaction(db, async (transaction) => {
      const uSnap = await transaction.get(userRef);
      if (!uSnap.exists()) throw "User document missing";
      
      const currentBal = uSnap.data().balance || 0;
      const newBal = type === 'credit' ? currentBal + amount : currentBal - amount;
      
      if (newBal < 0) throw "Insufficient wallet balance";

      const updates = { 
        balance: newBal,
        updatedAt: serverTimestamp() 
      };

      // Aggregate stats based on transaction type
      if (logDetails.type === 'deposit') updates.totalDeposited = increment(amount);
      if (logDetails.type === 'withdrawal') updates.totalWithdrawn = increment(amount);
      if (logDetails.type === 'return' || logDetails.type === 'claim') updates.totalEarned = increment(amount);
      if (logDetails.type === 'investment') updates.totalInvested = increment(amount);

      transaction.update(userRef, updates);
    });

    await logTx(uid, {
      amount,
      type: logDetails.type || 'adjustment',
      description: logDetails.description || 'Wallet adjustment',
      status: logDetails.status || 'completed'
    });
    
    return true;
  } catch (e) {
    console.error("Balance Update Error:", e);
    throw e;
  }
}

// 5. GLOBAL FORMATTERS & UI HELPERS
export function fmtN(amount) {
  return "₦" + Number(amount || 0).toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

export function fmtDate(ts) {
  if (!ts) return "---";
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  return date.toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

export function timeAgo(ts) {
  if (!ts) return "Never";
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  const seconds = Math.floor((new Date() - date) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + "y ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + "mo ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + "d ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + "h ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + "m ago";
  return "Just now";
}

export function badge(status) {
  const s = status?.toLowerCase();
  const map = {
    'pending': 'badge-warning',
    'active': 'badge-success',
    'completed': 'badge-success',
    'approved': 'badge-success',
    'verified': 'badge-success',
    'declined': 'badge-danger',
    'failed': 'badge-danger',
    'expired': 'badge-danger',
    'matured': 'badge-info'
  };
  return map[s] || 'badge-muted';
}

// 6. GLOBAL TOAST SYSTEM (Housed in Config for universal access)
export function toast(message, type = "info") {
  let container = document.getElementById("toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    container.style.cssText = "position:fixed; top:20px; right:20px; z-index:10000; display:flex; flex-direction:column; gap:10px; max-width:350px; width:calc(100% - 40px);";
    document.body.appendChild(container);
  }

  const el = document.createElement("div");
  const colors = { success: "#22c55e", error: "#ef4444", warning: "#f59e0b", info: "#3b82f6" };
  const icons = { success: "fa-check-circle", error: "fa-circle-xmark", warning: "fa-triangle-exclamation", info: "fa-circle-info" };

  el.style.cssText = `
    background: #0b0f1a; color: white; padding: 16px 20px; border-radius: 12px;
    border: 1px solid rgba(255,255,255,0.1); border-left: 4px solid ${colors[type]};
    box-shadow: 0 20px 40px rgba(0,0,0,0.4); display: flex; align-items: center; gap: 12px;
    font-size: 14px; font-weight: 600; animation: slideInToast 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
    cursor: pointer; pointer-events: all;
  `;

  el.innerHTML = `<i class="fa-solid ${icons[type]}" style="color:${colors[type]}; font-size:18px;"></i> <span>${message}</span>`;
  container.appendChild(el);

  const close = () => {
    el.style.animation = "slideOutToast 0.4s ease forwards";
    setTimeout(() => el.remove(), 400);
  };

  el.onclick = close;
  setTimeout(close, 5000);
}

// 7. AUTH GUARDS
export function requireAuth(callback) {
  onAuthStateChanged(auth, (user) => {
    if (!user) {
      window.location.href = "login.html";
    } else {
      callback(user);
    }
  });
}

/**
 * Strict Admin Gate - checks both Auth state AND hardcoded admin email
 */
export function requireAdmin(callback) {
  onAuthStateChanged(auth, async (user) => {
    if (!user || user.email !== ADMIN_EMAIL) {
      window.location.href = "dashboard.html";
      return;
    }
    const snap = await getDoc(doc(db, "users", user.uid));
    if (snap.exists() && snap.data().role === "admin") {
      callback(user, snap.data());
    } else {
      window.location.href = "dashboard.html";
    }
  });
}
