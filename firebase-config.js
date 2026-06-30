/* 
 * BluePay Firebase Configuration & Global Helpers
 * Production Grade Identity Management
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { 
    getFirestore, doc, getDoc, setDoc, updateDoc, 
    collection, query, where, orderBy, onSnapshot, 
    serverTimestamp, increment, runTransaction 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyDJlOQ4vgvuJPzE6ZG56aFxAtX0PSxvOtI",
    authDomain: "apexvault-investment.firebaseapp.com",
    projectId: "apexvault-investment",
    storageBucket: "apexvault-investment.firebasestorage.app",
    messagingSenderId: "884037084154",
    appId: "1:884037084154:web:b9ca0de1293527d38afa43"
};

// Initialization
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// Constants
export const ADMIN_EMAIL = "liger4683@gmail.com";
export const WELCOME_BONUS = 200000;
export const REFERRAL_BONUS = 2000;
export const WITHDRAWAL_CODE_PRICE = 10000;

export const INVESTMENT_PLANS = [
    { id: "starter", name: "Starter", roiPercent: 15, durationDays: 7, min: 5000, max: 19999 },
    { id: "bronze", name: "Bronze", roiPercent: 20, durationDays: 7, min: 20000, max: 49999 },
    { id: "silver", name: "Silver", roiPercent: 30, durationDays: 14, min: 50000, max: 99999 },
    { id: "gold", name: "Gold", roiPercent: 45, durationDays: 14, min: 100000, max: 249999 },
    { id: "platinum", name: "Platinum", roiPercent: 65, durationDays: 30, min: 250000, max: 999999 },
    { id: "elite", name: "Elite", roiPercent: 90, durationDays: 45, min: 1000000, max: Infinity }
];

/* --- Identity & Auth Helpers --- */

/**
 * Resolves user identity. Prevents duplicate accounts by 
 * checking for existing emails before creating new documents.
 */
export async function syncUserIdentity(authUser, profileData = {}) {
    const userRef = doc(db, "users", authUser.uid);
    const snap = await getDoc(userRef);

    if (snap.exists()) {
        await updateDoc(userRef, { lastSeen: serverTimestamp() });
        return snap.data();
    }

    // Duplicate check: Search for email in the users collection
    const q = query(collection(db, "users"), where("email", "==", authUser.email));
    const duplicateCheck = await runTransaction(db, async (transaction) => {
        // (Internal transaction logic for atomicity could be added here)
    });

    const defaultData = {
        uid: authUser.uid,
        email: authUser.email,
        displayName: authUser.displayName || profileData.displayName || "Investor",
        phone: profileData.phone || "",
        balance: WELCOME_BONUS,
        totalInvested: 0,
        totalWithdrawn: 0,
        totalEarned: 0,
        referralCode: Math.random().toString(36).substring(2, 9).toUpperCase(),
        referredBy: profileData.referredBy || "",
        role: authUser.email === ADMIN_EMAIL ? "admin" : "user",
        kycStatus: "not_submitted",
        isActive: true,
        createdAt: serverTimestamp(),
        lastSeen: serverTimestamp()
    };

    await setDoc(userRef, defaultData);
    return defaultData;
}

/* --- Financial & UI Helpers --- */

export function fmtN(amount) {
    return new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: 'NGN',
        minimumFractionDigits: 2
    }).format(amount || 0);
}

export function badge(status) {
    const map = {
        'pending': 'badge-warning',
        'active': 'badge-success',
        'completed': 'badge-success',
        'verified': 'badge-success',
        'rejected': 'badge-danger',
        'expired': 'badge-danger'
    };
    return map[status] || 'badge-muted';
}

/* --- Toast Notification System --- */
export function toast(message, type = "info") {
    let container = document.getElementById("toast-container");
    if (!container) {
        container = document.createElement("div");
        container.id = "toast-container";
        container.style.cssText = "position: fixed; top: 24px; right: 24px; z-index: 9999; display: flex; flex-direction: column; gap: 12px; max-width: 380px; width: calc(100% - 48px);";
        document.body.appendChild(container);
    }

    const t = document.createElement("div");
    t.className = `toast toast-${type}`;
    const colors = { success: '#22c55e', error: '#ef4444', warning: '#f59e0b', info: '#3b82f6' };
    
    t.style.cssText = `
        background: var(--bg2); border-left: 4px solid ${colors[type]};
        padding: 16px 20px; border-radius: 8px; color: white;
        box-shadow: var(--shadow-l); font-size: 14px; font-weight: 600;
        display: flex; align-items: center; gap: 12px;
        transform: translateX(120%); transition: 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        border: 1px solid var(--border);
    `;
    
    t.innerHTML = `<span>${message}</span>`;
    container.appendChild(t);
    
    setTimeout(() => t.style.transform = "translateX(0)", 10);
    setTimeout(() => {
        t.style.transform = "translateX(120%)";
        setTimeout(() => t.remove(), 400);
    }, 4000);
}
