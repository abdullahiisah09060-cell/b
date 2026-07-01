/**
 * === BluePay Firebase Configuration & Fintech Core ===
 * Version: 5.0.0 (Final Unified Rebuild)
 * Responsibility: Centralized Constants, Firestore Initialization, Shared Helpers.
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { 
    getFirestore, doc, getDoc, setDoc, updateDoc, collection, 
    query, where, orderBy, limit, onSnapshot, serverTimestamp, 
    increment, runTransaction, getDocs, writeBatch 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// --- 1. GLOBAL CONSTANTS ---
export const ADMIN_EMAIL = "liger4683@gmail.com";
export const PAYSTACK_PUBLIC_KEY = "pk_test_914662bcd8cdc4c28bfbdeb8f48653dbf00c595a";
export const WELCOME_BONUS_AMOUNT = 200000; // ₦200,000
export const REFERRAL_BONUS_AMOUNT = 2000; // ₦2,000
export const MIN_DEPOSIT = 1000;
export const MIN_WITHDRAWAL = 1000;
export const CODE_PRICE = 10000; // ₦10,000 for WDC

/**
 * Investment Plan Registry
 * Formula: daily_yield = (principal × roi_percent / 100) / duration_days
 */
export const PLAN_DEFINITIONS = [
    { id: "nano", name: "Nano", roi: 10, days: 3, min: 1000, max: 4999, color: "#60a5fa" },
    { id: "starter", name: "Starter", roi: 15, days: 7, min: 5000, max: 19999, color: "#3b82f6" },
    { id: "bronze", name: "Bronze", roi: 20, days: 7, min: 20000, max: 49999, color: "#2563eb" },
    { id: "silver", name: "Silver", roi: 28, days: 14, min: 50000, max: 99999, color: "#1d4ed8" },
    { id: "gold", name: "Gold", roi: 35, days: 14, min: 100000, max: 199999, color: "#d4af37" },
    { id: "diamond", name: "Diamond", roi: 45, days: 21, min: 200000, max: 499999, color: "#facc15" },
    { id: "platinum", name: "Platinum", roi: 60, days: 30, min: 500000, max: 999999, color: "#eab308" },
    { id: "elite", name: "Elite", roi: 75, days: 30, min: 1000000, max: 1999999, color: "#a855f7" },
    { id: "vip", name: "VIP", roi: 90, days: 45, min: 2000000, max: 4999999, color: "#d946ef" },
    { id: "apex", name: "APEX", roi: 120, days: 60, min: 5000000, max: Infinity, color: "#ec4899" }
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

// --- 3. SHARED HELPER FUNCTIONS ---

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
 * Flexible Date Formatter
 */
export function fmtDate(ts, type = 'full') {
    if (!ts) return "---";
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    if (type === 'time') return date.toLocaleTimeString("en-NG", { hour: '2-digit', minute: '2-digit' });
    if (type === 'date') return date.toLocaleDateString("en-NG", { day: 'numeric', month: 'short', year: 'numeric' });
    return date.toLocaleString("en-NG", { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

/**
 * Relative Time Helper
 */
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
 * Dynamic Status Badge Resolver
 */
export function badge(status) {
    const s = String(status).toLowerCase();
    const map = {
        'pending': 'badge-warning',
        'active': 'badge-success',
        'completed': 'badge-success',
        'approved': 'badge-success',
        'verified': 'badge-success',
        'declined': 'badge-danger',
        'failed': 'badge-danger',
        'expired': 'badge-danger',
        'used': 'badge-muted'
    };
    return map[s] || 'badge-muted';
}

/**
 * Standard Firebase Error Handler
 */
export function handleAuthError(code) {
    switch (code) {
        case "auth/user-not-found": return "No account found with this email.";
        case "auth/wrong-password": return "Incorrect password.";
        case "auth/invalid-email": return "Please enter a valid email address.";
        case "auth/email-already-in-use": return "An account with this email already exists.";
        case "auth/weak-password": return "Password must be at least 8 characters.";
        case "auth/too-many-requests": return "Too many attempts. Please wait 60 seconds.";
        case "auth/network-request-failed": return "Network error. Check your connection.";
        case "auth/user-disabled": return "This account has been disabled by admin.";
        default: return "An unexpected error occurred. Try again.";
    }
}

// --- 4. DATA CORE OPERATIONS ---

/**
 * Atomic Wallet Transaction
 */
export async function updateWallet(uid, amount, type = 'credit', meta = {}) {
    const userRef = doc(db, "users", uid);
    try {
        await runTransaction(db, async (transaction) => {
            const snap = await transaction.get(userRef);
            if (!snap.exists()) throw "User not found";
            
            const currentBal = snap.data().balance || 0;
            const newBal = type === 'credit' ? currentBal + amount : currentBal - amount;
            
            if (newBal < 0) throw "Insufficient balance";

            const updates = { 
                balance: newBal, 
                updatedAt: serverTimestamp() 
            };

            // Aggregate statistics
            if (meta.type === 'deposit') updates.totalDeposited = increment(amount);
            if (meta.type === 'withdrawal') updates.totalWithdrawn = increment(amount);
            if (meta.type === 'earning' || meta.type === 'daily_claim') updates.totalEarned = increment(amount);
            if (meta.type === 'investment') updates.totalInvested = increment(amount);

            transaction.update(userRef, updates);
        });

        // Log transaction record
        const txRef = doc(collection(db, "transactions"));
        await setDoc(txRef, {
            uid,
            amount,
            type: meta.type || 'adjustment',
            description: meta.description || 'System adjustment',
            status: meta.status || 'completed',
            createdAt: serverTimestamp()
        });

        return true;
    } catch (e) {
        console.error("Wallet Error:", e);
        throw e;
    }
}
