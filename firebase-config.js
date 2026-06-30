// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
  getAuth, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  sendEmailVerification, 
  sendPasswordResetEmail, 
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs, 
  onSnapshot, 
  runTransaction, 
  increment, 
  serverTimestamp, 
  writeBatch
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Platform Constants
export const WELCOME_BONUS = 200000;   // ₦200,000 — credited on first registration
export const REFERRAL_BONUS = 2000;     // ₦2,000 per successful referral
export const CODE_EXPIRY_HOURS = 24;       // withdrawal code expires in 24 hours
export const CODE_PRICES = [500, 1000, 2000, 5000]; // code purchase options
export const ADMIN_EMAIL = "admin@bluepay.com";
export const SITE_NAME = "BluePay";

export const AGENTS = [
  "Sarah Mitchell", "David Osei", "Amara Nwosu", "James Adeleke",
  "Fatima Hassan", "Chidi Eze", "Grace Okonkwo", "Michael Bello",
  "Zainab Yusuf", "Kenneth Okoro"
];

export const INVESTMENT_PLANS = [
  { id: "nano", name: "Nano", roiPercent: 10, durationDays: 3, min: 1000, max: 4999 },
  { id: "starter", name: "Starter", roiPercent: 15, durationDays: 7, min: 5000, max: 19999 },
  { id: "bronze", name: "Bronze", roiPercent: 20, durationDays: 7, min: 10000, max: 49999 },
  { id: "silver", name: "Silver", roiPercent: 28, durationDays: 14, min: 20000, max: 99999 },
  { id: "gold", name: "Gold", roiPercent: 35, durationDays: 14, min: 50000, max: 199999 },
  { id: "diamond", name: "Diamond", roiPercent: 45, durationDays: 21, min: 100000, max: 499999 },
  { id: "platinum", name: "Platinum", roiPercent: 60, durationDays: 30, min: 200000, max: 999999 },
  { id: "elite", name: "Elite", roiPercent: 75, durationDays: 30, min: 500000, max: 1999999 },
  { id: "vip", name: "VIP", roiPercent: 90, durationDays: 45, min: 1000000, max: 4999999 },
  { id: "apex", name: "APEX", roiPercent: 120, durationDays: 60, min: 5000000, max: Infinity }
];

// Firebase Configuration
const firebaseConfig = {
  apiKey:            "AIzaSyDJlOQ4vgvuJPzE6ZG56aFxAtX0PSxvOtI",
  authDomain:        "apexvault-investment.firebaseapp.com",
  projectId:         "apexvault-investment",
  storageBucket:     "apexvault-investment.firebasestorage.app",
  messagingSenderId: "884037084154",
  appId:             "1:884037084154:web:b9ca0de1293527d38afa43"
};

// Initialize App
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// Agent Rotation Helper
export function randomAgent() {
  return AGENTS[Math.floor(Math.random() * AGENTS.length)];
}

// Format Utilities
export function fmtN(amount) {
  if (amount === null || amount === undefined || isNaN(amount)) return "₦0.00";
  return "₦" + Number(amount).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function fmt(number) {
  if (number === null || number === undefined || isNaN(number)) return "0";
  return Number(number).toLocaleString("en-NG");
}

export function fmtDate(timestamp) {
  if (!timestamp) return "-";
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString("en-NG", { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function timeAgo(timestamp) {
  if (!timestamp) return "Just now";
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const seconds = Math.floor((new Date() - date) / 1000);
  let interval = Math.floor(seconds / 31536000);
  if (interval >= 1) return interval + "y ago";
  interval = Math.floor(seconds / 2592000);
  if (interval >= 1) return interval + "mo ago";
  interval = Math.floor(seconds / 86400);
  if (interval >= 1) return interval + "d ago";
  interval = Math.floor(seconds / 3600);
  if (interval >= 1) return interval + "h ago";
  interval = Math.floor(seconds / 60);
  if (interval >= 1) return interval + "m ago";
  return "Just now";
}

export function txMeta(type) {
  switch (type) {
    case "deposit":
      return { icon: "fa-wallet", color: "var(--blue)", bg: "rgba(26,86,219,0.1)", label: "Deposit" };
    case "withdrawal":
      return { icon: "fa-bank", color: "var(--red)", bg: "rgba(239,68,68,0.1)", label: "Withdrawal" };
    case "investment":
      return { icon: "fa-chart-line", color: "var(--gold)", bg: "rgba(212,175,55,0.1)", label: "Investment" };
    case "return":
      return { icon: "fa-arrow-down-long", color: "var(--green)", bg: "rgba(34,197,94,0.1)", label: "Maturity Return" };
    case "buy_code":
      return { icon: "fa-key", color: "var(--purple)", bg: "rgba(168,85,247,0.1)", label: "Code Purchase" };
    case "referral_bonus":
      return { icon: "fa-users", color: "var(--green)", bg: "rgba(34,197,94,0.1)", label: "Referral Bonus" };
    case "bonus":
      return { icon: "fa-gift", color: "var(--orange)", bg: "rgba(245,158,11,0.1)", label: "System Bonus" };
    case "refund":
      return { icon: "fa-undo", color: "var(--blue2)", bg: "rgba(59,130,246,0.1)", label: "Refund" };
    case "daily_claim":
      return { icon: "fa-calendar-check", color: "var(--green)", bg: "rgba(34,197,94,0.1)", label: "Daily Claim" };
    default:
      return { icon: "fa-exchange-alt", color: "var(--muted2)", bg: "var(--bg3)", label: "Transaction" };
  }
}

export function txSign(type) {
  const credits = ["deposit", "return", "referral_bonus", "bonus", "refund", "daily_claim"];
  return credits.includes(type) ? "+" : "-";
}

export function badge(status) {
  switch (status) {
    case "completed":
    case "confirmed":
    case "approved":
    case "verified":
    case "active":
    case "paid":
      return "badge-success";
    case "pending":
    case "not_submitted":
      return "badge-pending";
    case "rejected":
    case "declined":
    case "failed":
    case "expired":
      return "badge-danger";
    case "matured":
      return "badge-warning";
    default:
      return "badge-muted";
  }
}

export function generateUID() {
  return "BLP" + Math.floor(10000000 + Math.random() * 90000000);
}

// Standard Dynamic Toast System
export function toast(message, type = "info", duration = 4000) {
  let container = document.getElementById("toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    container.style.cssText = "position: fixed; top: 24px; right: 24px; z-index: 99999; display: flex; flex-direction: column; gap: 10px; max-width: 350px; width: calc(100% - 48px);";
    document.body.appendChild(container);
  }

  const t = document.createElement("div");
  t.style.cssText = `
    background: var(--bg2);
    border-left: 4px solid var(--muted);
    border-radius: var(--radius-xs);
    box-shadow: var(--shadow-l);
    padding: 14px 18px;
    color: var(--text);
    font-family: 'Inter', sans-serif;
    font-size: 14px;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 12px;
    transform: translateX(120%);
    transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    border: 1px solid var(--border);
  `;

  let icon = "fa-info-circle";
  if (type === "success") {
    t.style.borderLeftColor = "var(--green)";
    icon = "fa-check-circle";
  } else if (type === "error") {
    t.style.borderLeftColor = "var(--red)";
    icon = "fa-times-circle";
  } else if (type === "warning") {
    t.style.borderLeftColor = "var(--orange)";
    icon = "fa-exclamation-triangle";
  } else if (type === "info") {
    t.style.borderLeftColor = "var(--blue2)";
    icon = "fa-info-circle";
  }

  t.innerHTML = `<i class="fa-solid ${icon}" style="color: ${t.style.borderLeftColor}; font-size: 16px;"></i><div style="flex-grow: 1;">${message}</div>`;
  container.appendChild(t);

  setTimeout(() => { t.style.transform = "translateX(0)"; }, 50);
  
  const removeToast = () => {
    t.style.transform = "translateX(120%)";
    setTimeout(() => { t.remove(); }, 300);
  };

  t.onclick = removeToast;
  setTimeout(removeToast, duration);
}

// User Document Creation
export async function createUserDoc(uid, data) {
  const userRef = doc(db, "users", uid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) {
    const defaultData = {
      uid,
      email: data.email,
      displayName: data.displayName || "BluePay Investor",
      phone: data.phone || "",
      photoBase64: "",
      balance: WELCOME_BONUS,
      totalDeposited: 0,
      totalInvested: 0,
      totalWithdrawn: 0,
      totalEarned: 0,
      referralCode: data.referralCode || generateUID().substring(0, 8),
      referredBy: data.referredBy || "",
      referralCount: 0,
      referralEarnings: 0,
      role: data.role || "user",
      kycStatus: "not_submitted",
      isActive: true,
      welcomeBonusPaid: true,
      agentName: randomAgent(),
      createdAt: serverTimestamp(),
      lastSeen: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    await setDoc(userRef, defaultData);
    
    // Log Welcome Bonus Transaction
    await logTx(uid, "bonus", WELCOME_BONUS, "Welcome Bonus Credited", "completed", { reason: "Welcome promotion" });
    
    // Send Welcome Notification
    await notify(uid, "Welcome Bonus Credited! 🎉", `We've funded your wallet with ${fmtN(WELCOME_BONUS)} as a signup bonus. Direct this towards active investments to earn dividends!`, "success");
    
    // Process Referral if code exists
    if (data.referredBy) {
      await processReferral(data.referredBy, uid);
    }
    return defaultData;
  }
  return snap.data();
}

// User Profile Actions
export async function getUserDoc(uid) {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? snap.data() : null;
}

export async function updateUserDoc(uid, data) {
  const userRef = doc(db, "users", uid);
  await updateDoc(userRef, {
    ...data,
    updatedAt: serverTimestamp()
  });
}

// Financial Balance Operations (Safe transactions)
export async function creditBalance(uid, amount, logDetails) {
  const userRef = doc(db, "users", uid);
  await runTransaction(db, async (transaction) => {
    const userSnap = await transaction.get(userRef);
    if (!userSnap.exists()) throw "User does not exist";
    const currentBal = userSnap.data().balance || 0;
    const currentEarned = userSnap.data().totalEarned || 0;
    const currentDeposited = userSnap.data().totalDeposited || 0;

    const updates = {
      balance: currentBal + amount,
      updatedAt: serverTimestamp()
    };

    if (logDetails.type === "return" || logDetails.type === "daily_claim" || logDetails.type === "referral_bonus" || logDetails.type === "bonus") {
      updates.totalEarned = currentEarned + amount;
    }
    if (logDetails.type === "deposit") {
      updates.totalDeposited = currentDeposited + amount;
    }

    transaction.update(userRef, updates);
  });
  await logTx(uid, logDetails.type, amount, logDetails.description, "completed", logDetails.meta || {});
}

export async function debitBalance(uid, amount, logDetails) {
  const userRef = doc(db, "users", uid);
  let status = "completed";
  await runTransaction(db, async (transaction) => {
    const userSnap = await transaction.get(userRef);
    if (!userSnap.exists()) throw "User does not exist";
    const currentBal = userSnap.data().balance || 0;
    if (currentBal < amount) throw "Insufficient balance";
    
    const currentInvested = userSnap.data().totalInvested || 0;
    const currentWithdrawn = userSnap.data().totalWithdrawn || 0;

    const updates = {
      balance: currentBal - amount,
      updatedAt: serverTimestamp()
    };

    if (logDetails.type === "investment") {
      updates.totalInvested = currentInvested + amount;
    }
    if (logDetails.type === "withdrawal") {
      updates.totalWithdrawn = currentWithdrawn + amount;
      status = "pending"; // Withdrawals go to pending approval
    }

    transaction.update(userRef, updates);
  });
  await logTx(uid, logDetails.type, amount, logDetails.description, status, logDetails.meta || {});
}

export async function getBalance(uid) {
  const u = await getUserDoc(uid);
  return u ? u.balance : 0;
}

// Transaction Logs
export async function logTx(uid, type, amount, description, status, meta = {}) {
  const txRef = doc(collection(db, "transactions"));
  await setDoc(txRef, {
    uid,
    type,
    amount,
    description,
    status,
    meta,
    createdAt: serverTimestamp()
  });
  return txRef.id;
}

// Deposit Handling (Real-Time Flows)
export async function createDeposit(uid, amount, method, paystackRef) {
  const depRef = doc(collection(db, "deposits"));
  const depData = {
    uid,
    amount,
    method,
    paystackRef,
    status: "pending",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };
  await setDoc(depRef, depData);
  return depRef.id;
}

export async function confirmDeposit(depositId, uid, amount) {
  const depRef = doc(db, "deposits", depositId);
  await runTransaction(db, async (transaction) => {
    const dSnap = await transaction.get(depRef);
    if (!dSnap.exists() || dSnap.data().status !== "pending") throw "Invalid deposit state";
    
    transaction.update(depRef, {
      status: "confirmed",
      updatedAt: serverTimestamp()
    });
  });

  await creditBalance(uid, amount, {
    type: "deposit",
    description: `Deposited via Paystack (Ref: ${depositId.substr(0, 10)})`,
    meta: { depositId }
  });

  await notify(uid, "Deposit Confirmed! 💳", `Your deposit of ${fmtN(amount)} has been successfully credited to your balance.`, "success");
}

export async function rejectDeposit(depositId, uid, reason) {
  const depRef = doc(db, "deposits", depositId);
  await updateDoc(depRef, {
    status: "rejected",
    reason,
    updatedAt: serverTimestamp()
  });
  await notify(uid, "Deposit Rejected ❌", `Your deposit request was declined. Reason: ${reason}`, "error");
}

// Withdrawal Code Generation and Redemption
export async function purchaseCode(uid, paidAmount) {
  const user = await getUserDoc(uid);
  if (!user || user.balance < paidAmount) throw "Insufficient balance to buy code";

  const codeString = "WDC-" + Math.floor(100000 + Math.random() * 900000) + Math.random().toString(36).substr(2, 4).toUpperCase();
  const codeId = "code_" + Date.now();
  
  await debitBalance(uid, paidAmount, {
    type: "buy_code",
    description: `Purchased withdrawal code ${codeString}`,
    meta: { codeString }
  });

  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + CODE_EXPIRY_HOURS);

  await setDoc(doc(db, "codes", codeId), {
    uid,
    code: codeString,
    paidAmount,
    used: false,
    expiresAt,
    createdAt: serverTimestamp()
  });

  await notify(uid, "Withdrawal Code Issued 🔑", `You purchased code ${codeString} for ${fmtN(paidAmount)}. Valid for 24 hours.`, "info");
  return { codeId, codeString };
}

export async function validateCode(codeString) {
  const q = query(collection(db, "codes"), where("code", "==", codeString), where("used", "==", false));
  const snap = await getDocs(q);
  if (snap.empty) return { valid: false, error: "Invalid or already used code" };
  
  const codeDoc = snap.docs[0];
  const data = codeDoc.data();
  const exp = data.expiresAt.toDate ? data.expiresAt.toDate() : new Date(data.expiresAt);
  if (new Date() > exp) {
    await updateDoc(doc(db, "codes", codeDoc.id), { used: true, status: "expired" });
    return { valid: false, error: "This code has expired" };
  }
  return { valid: true, codeId: codeDoc.id, data };
}

export async function consumeCode(codeId, uid) {
  const codeRef = doc(db, "codes", codeId);
  await updateDoc(codeRef, {
    used: true,
    usedAt: serverTimestamp()
  });
}

export async function getUserCodes(uid) {
  const q = query(collection(db, "codes"), where("uid", "==", uid), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// Withdrawal Management
export async function submitWithdrawal(uid, amount, bankName, accountNumber, accountName, code, codeId) {
  const wId = "withdraw_" + Date.now();
  
  // Consume the code first
  await consumeCode(codeId, uid);

  // Debit the user balance
  await debitBalance(uid, amount, {
    type: "withdrawal",
    description: `Pending withdrawal to ${bankName} (${accountNumber})`,
    meta: { withdrawalId: wId }
  });

  // Save to withdrawals collection
  await setDoc(doc(db, "withdrawals", wId), {
    uid,
    amount,
    bankName,
    accountNumber,
    accountName,
    code,
    codeId,
    status: "pending",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });

  await notify(uid, "Withdrawal Submitted 🏦", `Your request of ${fmtN(amount)} is under review. The administrative team will process it within 2 hours.`, "warning");
  await adminNotify("New Withdrawal Request", `User has submitted a pending withdrawal of ${fmtN(amount)}.`, "warning");
}

export async function approveWithdrawal(withdrawalId) {
  const wRef = doc(db, "withdrawals", withdrawalId);
  const wSnap = await getDoc(wRef);
  if (!wSnap.exists() || wSnap.data().status !== "pending") throw "Invalid status";
  
  const wData = wSnap.data();

  await updateDoc(wRef, {
    status: "approved",
    updatedAt: serverTimestamp()
  });

  // Update original pending transaction log status to completed
  const q = query(collection(db, "transactions"), where("meta.withdrawalId", "==", withdrawalId));
  const tSnap = await getDocs(q);
  if (!tSnap.empty) {
    await updateDoc(doc(db, "transactions", tSnap.docs[0].id), { status: "completed" });
  }

  await notify(wData.uid, "Withdrawal Approved! ✅", `Your withdrawal of ${fmtN(wData.amount)} to ${wData.bankName} was completed.`, "success");
}

export async function declineWithdrawal(withdrawalId, reason) {
  const wRef = doc(db, "withdrawals", withdrawalId);
  const wSnap = await getDoc(wRef);
  if (!wSnap.exists() || wSnap.data().status !== "pending") throw "Invalid status";

  const wData = wSnap.data();

  await updateDoc(wRef, {
    status: "declined",
    declineReason: reason,
    updatedAt: serverTimestamp()
  });

  // Refund user wallet (Credit balance)
  await creditBalance(wData.uid, wData.amount, {
    type: "refund",
    description: `Declined withdrawal refund for code: ${wData.code}`,
    meta: { withdrawalId, reason }
  });

  // Keep transaction of failure clear
  const q = query(collection(db, "transactions"), where("meta.withdrawalId", "==", withdrawalId));
  const tSnap = await getDocs(q);
  if (!tSnap.empty) {
    await updateDoc(doc(db, "transactions", tSnap.docs[0].id), { status: "failed" });
  }

  await notify(wData.uid, "Withdrawal Declined ❌", `Your withdrawal was declined: ${reason}. Refund credited.`, "error");
}

// Investment Flows
export async function investInPlan(uid, planId, amount) {
  const plan = INVESTMENT_PLANS.find(p => p.id === planId);
  if (!plan) throw "Selected plan config not found";
  if (amount < plan.min || amount > plan.max) throw `Amount boundaries violated for ${plan.name}`;

  const user = await getUserDoc(uid);
  if (!user || user.balance < amount) throw "Insufficient balance to establish investment";

  await debitBalance(uid, amount, {
    type: "investment",
    description: `Subscribed to ${plan.name} Investment Plan`,
    meta: { planId, planName: plan.name }
  });

  const profit = amount * (plan.roiPercent / 100);
  const dailyROI = profit / plan.durationDays;
  const maturesAt = new Date();
  maturesAt.setDate(maturesAt.getDate() + plan.durationDays);

  const invId = "invest_" + Date.now();
  await setDoc(doc(db, "investments", invId), {
    uid,
    planId,
    planName: plan.name,
    amount,
    roiPercent: plan.roiPercent,
    durationDays: plan.durationDays,
    expectedReturn: amount + profit,
    profit,
    dailyROI,
    status: "active",
    lastClaimed: null,
    totalClaimed: 0,
    claimCount: 0,
    maturesAt,
    createdAt: serverTimestamp()
  });

  await notify(uid, "Investment Activated! 📈", `Your portfolio has allocated ${fmtN(amount)} into the ${plan.name} Plan.`, "success");
}

export async function claimDailyReturns(uid, investmentId) {
  const invRef = doc(db, "investments", investmentId);
  const invSnap = await getDoc(invRef);
  if (!invSnap.exists()) throw "Portfolio asset record missing";
  const data = invSnap.data();

  if (data.status !== "active") throw "Investment is no longer active";

  // Check 24 hour claim lock
  if (data.lastClaimed) {
    const last = data.lastClaimed.toDate ? data.lastClaimed.toDate() : new Date(data.lastClaimed);
    const hours = (new Date() - last) / 3600000;
    if (hours < 24) throw "Next claim yields in " + (24 - hours).toFixed(1) + " hours";
  }

  const claimable = Math.min(data.dailyROI, data.profit - data.totalClaimed);
  if (claimable <= 0) throw "Profit payout cap reached";

  const nextClaimCount = data.claimCount + 1;
  const nextTotalClaimed = data.totalClaimed + claimable;
  const completesPortfolio = nextTotalClaimed >= data.profit || nextClaimCount >= data.durationDays;

  await creditBalance(uid, claimable, {
    type: "daily_claim",
    description: `Daily Returns Claim for ${data.planName}`,
    meta: { investmentId }
  });

  const updates = {
    lastClaimed: serverTimestamp(),
    totalClaimed: nextTotalClaimed,
    claimCount: nextClaimCount,
  };

  if (completesPortfolio) {
    updates.status = "matured";
  }

  await updateDoc(invRef, updates);
  await notify(uid, "Daily Yield Claimed 💰", `Credited ${fmtN(claimable)} into your available balance from ${data.planName}.`, "success");
}

export async function payoutInvestment(investmentId) {
  const invRef = doc(db, "investments", investmentId);
  const invSnap = await getDoc(invRef);
  if (!invSnap.exists() || invSnap.data().status !== "matured") throw "Invalid status";

  const data = invSnap.data();

  // Payout original capital
  await creditBalance(data.uid, data.amount, {
    type: "return",
    description: `Matured Capital Payout: ${data.planName}`,
    meta: { investmentId }
  });

  await updateDoc(invRef, {
    status: "paid",
    paidAt: serverTimestamp()
  });

  await notify(data.uid, "Investment Fully Matured 🏁", `Your ${data.planName} plan matured. Capital of ${fmtN(data.amount)} returned.`, "success");
}

// Referrals Engine
export async function processReferral(referrerCode, referredUid) {
  const q = query(collection(db, "users"), where("referralCode", "==", referrerCode));
  const snap = await getDocs(q);
  if (snap.empty) return;

  const referrer = snap.docs[0].data();
  const refId = "ref_" + Date.now();

  await setDoc(doc(db, "referrals", refId), {
    referrerId: referrer.uid,
    referredId: referredUid,
    bonus: REFERRAL_BONUS,
    referralCode: referrerCode,
    createdAt: serverTimestamp()
  });

  // Credit referrer
  await creditBalance(referrer.uid, REFERRAL_BONUS, {
    type: "referral_bonus",
    description: `Referral Signup Bonus for matching new user registration`,
    meta: { referredUid }
  });

  // Update Referrer Metrics
  await updateDoc(doc(db, "users", referrer.uid), {
    referralCount: increment(1),
    referralEarnings: increment(REFERRAL_BONUS)
  });

  await notify(referrer.uid, "New Affiliate Signed Up! 👥", `You earned ${fmtN(REFERRAL_BONUS)} as direct affiliate rewards.`, "success");
}

export async function getReferrals(uid) {
  const q = query(collection(db, "referrals"), where("referrerId", "==", uid), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// Notifications Dispatcher
export async function notify(uid, title, message, type = "info", meta = {}) {
  const nRef = doc(collection(db, "notifications"));
  await setDoc(nRef, {
    uid,
    title,
    message,
    type,
    read: false,
    meta,
    createdAt: serverTimestamp()
  });
}

export async function adminNotify(title, message, type = "info") {
  const q = query(collection(db, "users"), where("role", "==", "admin"));
  const snap = await getDocs(q);
  const batch = writeBatch(db);
  snap.docs.forEach(adminDoc => {
    const nRef = doc(collection(db, "notifications"));
    batch.set(nRef, {
      uid: adminDoc.id,
      title,
      message,
      type,
      read: false,
      meta: { isAdminEvent: true },
      createdAt: serverTimestamp()
    });
  });
  await batch.commit();
}

export async function broadcast(title, message, type = "info") {
  const bId = "broadcast_" + Date.now();
  await setDoc(doc(db, "broadcasts", bId), {
    title,
    message,
    type,
    sentAt: serverTimestamp()
  });

  // Create notifications in batches for scalability
  const usersSnap = await getDocs(collection(db, "users"));
  const batch = writeBatch(db);
  usersSnap.docs.forEach(uDoc => {
    const nRef = doc(collection(db, "notifications"));
    batch.set(nRef, {
      uid: uDoc.id,
      title: "Broadcast: " + title,
      message,
      type,
      read: false,
      meta: { isBroadcast: true, broadcastId: bId },
      createdAt: serverTimestamp()
    });
  });
  await batch.commit();
}

export async function markRead(notifId) {
  await updateDoc(doc(db, "notifications", notifId), { read: true });
}

export async function markAllRead(uid) {
  const q = query(collection(db, "notifications"), where("uid", "==", uid), where("read", "==", false));
  const snap = await getDocs(q);
  const batch = writeBatch(db);
  snap.docs.forEach(d => {
    batch.update(doc(db, "notifications", d.id), { read: true });
  });
  await batch.commit();
}

// Support Conversations (Threads Engine)
export async function getOrCreateThread(uid, userEmail, userName, agentName) {
  const tRef = doc(db, "support", uid);
  const snap = await getDoc(tRef);
  if (!snap.exists()) {
    const threadData = {
      uid,
      userEmail,
      userName,
      agentName,
      status: "open",
      lastMessage: `Hi ${userName}! I'm ${agentName}, your personal support agent at BluePay. How can I help you today? 😊`,
      unreadAdmin: 0,
      unreadUser: 1,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    await setDoc(tRef, threadData);

    const mRef = doc(collection(db, "support", uid, "messages"));
    await setDoc(mRef, {
      senderUid: "system",
      senderName: agentName,
      message: threadData.lastMessage,
      isAdmin: true,
      createdAt: serverTimestamp()
    });
  }
  return uid;
}

export async function sendMsg(threadId, senderUid, senderName, message, isAdmin = false) {
  const mRef = doc(collection(db, "support", threadId, "messages"));
  await setDoc(mRef, {
    senderUid,
    senderName,
    message,
    isAdmin,
    createdAt: serverTimestamp()
  });

  const threadRef = doc(db, "support", threadId);
  const updates = {
    lastMessage: message,
    updatedAt: serverTimestamp()
  };

  if (isAdmin) {
    updates.unreadUser = increment(1);
  } else {
    updates.unreadAdmin = increment(1);
  }

  await updateDoc(threadRef, updates);
}

// KYC Verification Portal
export async function submitKYC(uid, kycData) {
  const kycRef = doc(db, "kyc", uid);
  await setDoc(kycRef, {
    uid,
    ...kycData,
    status: "pending",
    submittedAt: serverTimestamp()
  });

  await updateUserDoc(uid, { kycStatus: "pending" });
  await adminNotify("KYC Pending Review", `${kycData.fullName} has uploaded documents for verification.`, "info");
}

export async function approveKYC(uid) {
  const kycRef = doc(db, "kyc", uid);
  await updateDoc(kycRef, {
    status: "verified",
    reviewedAt: serverTimestamp()
  });
  await updateUserDoc(uid, { kycStatus: "verified" });
  await notify(uid, "KYC Profile Verified! ✅", "Your documents have been approved. Full platform capabilities are active.", "success");
}

export async function rejectKYC(uid, reason) {
  const kycRef = doc(db, "kyc", uid);
  await updateDoc(kycRef, {
    status: "rejected",
    reviewNote: reason,
    reviewedAt: serverTimestamp()
  });
  await updateUserDoc(uid, { kycStatus: "rejected" });
  await notify(uid, "KYC Submission Declined ❌", `Documents rejected. Reason: ${reason}. Please update your portal and resubmit.`, "error");
}

// Auth Status Guards & Validation Helper
export function requireAuth(callback) {
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      window.location.href = "login.html";
    } else {
      callback(user);
    }
  });
}

export function requireAdmin(callback) {
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      window.location.href = "login.html";
      return;
    }
    const adminRef = doc(db, "users", user.uid);
    const snap = await getDoc(adminRef);
    if (snap.exists() && snap.data().role === "admin") {
      callback(user, snap.data());
    } else {
      window.location.href = "dashboard.html";
    }
  });
}

export function redirectIfAuthed() {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      window.location.href = "dashboard.html";
    }
  });
}

export async function updateLastSeen(uid) {
  await updateDoc(doc(db, "users", uid), { lastSeen: serverTimestamp() });
}

// Paystack Integration Helper
export function triggerPaystack({ email, amount, description, onSuccess, onCancel }) {
  if (typeof PaystackPop === "undefined") {
    const script = document.createElement("script");
    script.src = "https://js.paystack.co/v1/inline.js";
    script.onload = () => initPaystackPopup();
    document.head.appendChild(script);
  } else {
    initPaystackPopup();
  }

  function initPaystackPopup() {
    const ref = 'BLP_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9).toUpperCase();
    const handler = PaystackPop.setup({
      key:      'pk_test_914662bcd8cdc4c28bfbdeb8f48653dbf00c595a',
      email,
      amount:   amount * 100,
      currency: 'NGN',
      ref,
      metadata: { description },
      onClose:  () => { if (onCancel) onCancel(); },
      callback: (response) => onSuccess(response)
    });
    handler.openIframe();
  }
}

// Administrative Global Fetches
export async function getAllUsers() {
  const snap = await getDocs(collection(db, "users"));
  return snap.docs.map(d => d.data());
}
export async function getAllWithdrawals() {
  const snap = await getDocs(query(collection(db, "withdrawals"), orderBy("createdAt", "desc")));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
export async function getAllDeposits() {
  const snap = await getDocs(query(collection(db, "deposits"), orderBy("createdAt", "desc")));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
export async function getAllTxs() {
  const snap = await getDocs(query(collection(db, "transactions"), orderBy("createdAt", "desc")));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
export async function getAllInvestments() {
  const snap = await getDocs(query(collection(db, "investments"), orderBy("createdAt", "desc")));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
export async function getAllKYC() {
  const snap = await getDocs(collection(db, "kyc"));
  return snap.docs.map(d => d.data());
}
export async function getAllThreads() {
  const snap = await getDocs(query(collection(db, "support"), orderBy("updatedAt", "desc")));
  return snap.docs.map(d => d.data());
}

// Real-Time Listener Hookups
export function listenUser(uid, callback) {
  return onSnapshot(doc(db, "users", uid), (snap) => {
    if (snap.exists()) callback(snap.data());
  });
}
export function listenTxs(uid, callback) {
  const q = query(collection(db, "transactions"), where("uid", "==", uid), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}
export function listenWithdrawals(uid, callback) {
  const q = query(collection(db, "withdrawals"), where("uid", "==", uid), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}
export function listenNotifs(uid, callback) {
  const q = query(collection(db, "notifications"), where("uid", "==", uid), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}
export function listenBroadcasts(callback) {
  const q = query(collection(db, "broadcasts"), orderBy("sentAt", "desc"), limit(5));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}
export function listenMessages(threadId, callback) {
  const q = query(collection(db, "support", threadId, "messages"), orderBy("createdAt", "asc"));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}

// Real-Time Listeners (Admin Interfaces)
export function listenAllUsers(callback) {
  return onSnapshot(collection(db, "users"), (snap) => {
    callback(snap.docs.map(d => d.data()));
  });
}
export function listenAllW(callback) {
  const q = query(collection(db, "withdrawals"), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}
export function listenAdminNotifs(callback) {
  const q = query(collection(db, "notifications"), where("meta.isAdminEvent", "==", true), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}
export function listenAllThreads(callback) {
  const q = query(collection(db, "support"), orderBy("updatedAt", "desc"));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => d.data()));
  });
}
