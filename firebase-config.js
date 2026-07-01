/**
 * === BluePay Firebase Configuration & Fintech Core ===
 * Version: 4.0.0 (Unified Production)
 * Responsibility: Firestore Initialization, Plan Definitions, Atomic Wallet Logic, 
 * Transaction Logging, and Global Formatters.
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { 
    getFirestore, doc, getDoc, setDoc, updateDoc, collection, 
    query, where, orderBy, limit, onSnapshot, serverTimestamp, 
    increment, runTransaction, getDocs, writeBatch 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// --- 1. GLOBAL CONSTANTS & CONFIGURATION ---
export const ADMIN_EMAIL = "liger4683@gmail.com";
export const WELCOME_BONUS = 200000;   // ₦200,000 Initial credit
export const REFERRAL_BONUS = 2000;    // ₦2,000 per valid referral
export const WITHDRAWAL_CODE_PRICE = 10000; // ₦10,000 flat rate for WDC
export const MIN_WITHDRAWAL = 1000;    // Minimum ₦1,000
export const SITE_NAME = "BluePay";

/**
 * Investment Plan Registry
 * Formula: daily_yield = (principal × roi_percent / 100) / duration_days
 */
export const INVESTMENT_PLANS = [
    { id: "nano", name: "Nano", roiPercent: 10, durationDays: 3, min: 1000, max: 4999, color: "#60a5fa" },
    { id: "starter", name: "Starter", roiPercent: 15, durationDays: 7, min: 5000, max: 19999, color: "#3b82f6" },
    { id: "bronze", name: "Bronze", roiPercent: 20, durationDays: 7, min: 20000, max: 49999, color: "#2563eb" },
    { id: "silver", name: "Silver", roiPercent: 28, durationDays: 14, min: 50000, max: 99999, color: "#1d4ed8" },
    { id: "gold", name: "Gold", roiPercent: 35, durationDays: 14, min: 100000, max: 199999, color: "#d4af37" },
    { id: "diamond", name: "Diamond", roiPercent: 45, durationDays: 21, min: 200000, max: 499999, color: "#facc15" },
    { id: "platinum", name: "Platinum", roiPercent: 60, durationDays: 30, min: 500000, max: 999999, color: "#eab308" },
    { id: "elite", name: "Elite", roiPercent: 75, durationDays: 30, min: 1000000, max: 1999999, color: "#a855f7" },
    { id: "vip", name: "VIP", roiPercent: 90, durationDays: 45, min: 2000000, max: 4999999, color: "#d946ef" },
    { id: "apex", name: "APEX", roiPercent: 120, durationDays: 60, min: 5000000, max: Infinity, color: "#ec4899" }
];

// --- 2. FIREBASE INITIALIZATION ---
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

// --- 3. IDENTITY & DUPLICATE PREVENTION LOGIC ---

/**
 * Standardizes user identity across Auth providers.
 * Checks for existing emails before creating new documents to prevent data fragmentation.
 */
export async function syncUserIdentity(authUser, profileData = {}) {
    const userRef = doc(db, "users", authUser.uid);
    const snap = await getDoc(userRef);

    if (snap.exists()) {
        await updateDoc(userRef, { lastSeen: serverTimestamp() });
        return snap.data();
    }

    // Duplicate Prevention: Check if email is already in the collection under a different UID
    const q = query(collection(db, "users"), where("email", "==", authUser.email));
    const querySnap = await getDocs(q);

    if (!querySnap.empty) {
        // User already has a document with this email. Return that document's data.
        return querySnap.docs[0].data();
    }

    // Fresh User Creation
    const userData = {
        uid: authUser.uid,
        email: authUser.email.toLowerCase(),
        displayName: profileData.fullName || authUser.displayName || "Investor",
        phone: profileData.phone || "",
        photoURL: authUser.photoURL || "",
        balance: WELCOME_BONUS,
        totalDeposited: 0,
        totalInvested: 0,
        totalWithdrawn: 0,
        totalEarned: 0,
        referralCode: Math.random().toString(36).substring(2, 10).toUpperCase(),
        referredBy: profileData.referredBy || "",
        referralCount: 0,
        referralEarnings: 0,
        role: authUser.email.toLowerCase() === ADMIN_EMAIL ? "admin" : "user",
        kycStatus: "not_submitted",
        isActive: true,
        agentName: "Sarah Mitchell", // Shared support pool start
        createdAt: serverTimestamp(),
        lastSeen: serverTimestamp(),
        updatedAt: serverTimestamp()
    };

    await setDoc(userRef, userData);
    
    // Log Welcome Bonus
    await logTransaction(authUser.uid, {
        type: "bonus",
        amount: WELCOME_BONUS,
        description: "Welcome Bonus Credited",
        status: "completed"
    });

    // Handle Referral Logic if applicable
    if (userData.referredBy) {
        await processReferral(userData.referredBy, userData.uid);
    }

    return userData;
}

// --- 4. ATOMIC FINANCIAL OPERATIONS ---

/**
 * Safe transaction logger
 */
export async function logTransaction(uid, data) {
    const txRef = doc(collection(db, "transactions"));
    await setDoc(txRef, {
        ...data,
        uid,
        createdAt: serverTimestamp()
    });
    return txRef.id;
}

/**
 * Universal balance updater using runTransaction for safety.
 * Validates balance before debiting.
 */
export async function updateWallet(uid, amount, direction = 'credit', meta = {}) {
    const userRef = doc(db, "users", uid);
    try {
        await runTransaction(db, async (transaction) => {
            const uSnap = await transaction.get(userRef);
            if (!uSnap.exists()) throw "User record not found";

            const currentBal = uSnap.data().balance || 0;
            const newBal = direction === 'credit' ? currentBal + amount : currentBal - amount;

            if (newBal < 0) throw "Insufficient wallet balance";

            const updates = { 
                balance: newBal,
                updatedAt: serverTimestamp()
            };

            // Update specific historical aggregators
            if (meta.type === 'deposit') updates.totalDeposited = increment(amount);
            if (meta.type === 'withdrawal') updates.totalWithdrawn = increment(amount);
            if (meta.type === 'return' || meta.type === 'daily_claim') updates.totalEarned = increment(amount);
            if (meta.type === 'investment') updates.totalInvested = increment(amount);

            transaction.update(userRef, updates);
        });

        // Record the transaction after success
        await logTransaction(uid, {
            type: meta.type || 'adjustment',
            amount: amount,
            description: meta.description || 'System adjustment',
            status: meta.status || 'completed'
        });

        return true;
    } catch (e) {
        console.error("Wallet Transaction Failed:", e);
        throw e;
    }
}

/**
 * Handles referral bonus distribution
 */
async function processReferral(code, newUserId) {
    const q = query(collection(db, "users"), where("referralCode", "==", code));
    const snap = await getDocs(q);
    if (snap.empty) return;

    const referrer = snap.docs[0];
    const refId = referrer.id;

    const batch = writeBatch(db);
    
    // Credit Referrer
    batch.update(doc(db, "users", refId), {
        balance: increment(REFERRAL_BONUS),
        referralCount: increment(1),
        referralEarnings: increment(REFERRAL_BONUS)
    });

    // Create Notification for Referrer
    const notifRef = doc(collection(db, "notifications"));
    batch.set(notifRef, {
        uid: refId,
        title: "Referral Bonus! 👥",
        message: `You earned ${fmtN(REFERRAL_BONUS)} from a new referral.`,
        read: false,
        type: "success",
        createdAt: serverTimestamp()
    });

    await batch.commit();
    
    // Log Referrer Transaction
    await logTransaction(refId, {
        type: "referral_bonus",
        amount: REFERRAL_BONUS,
        description: "New Referral Signup Reward",
        status: "completed"
    });
}

// --- 5. SHARED FORMATTERS & DYNAMIC UI HELPERS ---

/**
 * Professional Naira Formatter (₦1,000.00)
 */
export function fmtN(amount) {
    if (amount === null || amount === undefined || isNaN(amount)) return "₦0.00";
    return "₦" + Number(amount).toLocaleString("en-NG", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

/**
 * Precise ROI Calculator
 */
export function calculateROI(principal, planId) {
    const plan = INVESTMENT_PLANS.find(p => p.id === planId);
    if (!plan) return 0;
    const profit = principal * (plan.roiPercent / 100);
    const daily = profit / plan.durationDays;
    return { profit, daily, total: principal + profit };
}

/**
 * Relative and Absolute Date Formatters
 */
export function fmtDate(ts) {
    if (!ts) return "---";
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    return date.toLocaleDateString("en-NG", { day: 'numeric', month: 'short', year: 'numeric' });
}

export function fmtTime(ts) {
    if (!ts) return "---";
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    return date.toLocaleTimeString("en-NG", { hour: '2-digit', minute: '2-digit' });
}

export function timeAgo(ts) {
    if (!ts) return "---";
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

/**
 * Dynamic Status Badge Class Resolver
 */
export function badge(status) {
    const s = String(status).toLowerCase();
    const map = {
        'pending': 'badge-warning',
        'approved': 'badge-success',
        'active': 'badge-success',
        'completed': 'badge-success',
        'verified': 'badge-success',
        'matured': 'badge-info',
        'declined': 'badge-danger',
        'failed': 'badge-danger',
        'expired': 'badge-danger',
        'used': 'badge-muted'
    };
    return map[s] || 'badge-muted';
}

// --- 6. GLOBAL NOTIFICATION DISPATCHER ---

export async function notifyUser(uid, title, message, type = "info") {
    await setDoc(doc(collection(db, "notifications")), {
        uid, title, message, type,
        read: false,
        createdAt: serverTimestamp()
    });
}
