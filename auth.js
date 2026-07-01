/**
 * === BluePay Authentication Logic ===
 * Responsibility: Secure Auth Flow, Redirect Routing, Duplicate Prevention.
 */

import { 
    auth, db, syncUserIdentity, ADMIN_EMAIL, 
    googleProvider, handleAuthError 
} from './firebase-config.js';
import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signInWithPopup, 
    sendEmailVerification,
    updateProfile
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { showToast } from './components.js';

/**
 * Master Redirect Logic
 */
export function routeUser(user) {
    const email = user.email.toLowerCase();
    if (email === ADMIN_EMAIL) {
        window.location.href = "admin-dashboard.html";
    } else if (!user.emailVerified) {
        window.location.href = "verify.html";
    } else {
        window.location.href = "dashboard.html";
    }
}

/**
 * Email/Password Login
 */
export async function performLogin(email, password) {
    try {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        const user = cred.user;
        
        // Identity Sync
        await syncUserIdentity(user);
        
        showToast("Secure access granted.", "success");
        setTimeout(() => routeUser(user), 1000);
    } catch (e) {
        showToast(handleAuthError(e.code), "error");
    }
}

/**
 * Official Google Authentication
 */
export async function performGoogleAuth() {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;
        
        // Identity Sync (Duplicate prevention logic inside)
        const userData = await syncUserIdentity(user);
        
        showToast(`Welcome back, ${userData.displayName}`, "success");
        setTimeout(() => routeUser(user), 1000);
    } catch (e) {
        if (e.code === 'auth/account-exists-with-different-credential') {
            showToast("Account already exists via email/password. Please login normally.", "warning");
        } else {
            showToast(handleAuthError(e.code), "error");
        }
    }
}

/**
 * Multi-Step Professional Registration
 */
export async function performRegistration(data) {
    const { email, password, fullName, phone, referredBy } = data;
    
    try {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        const user = cred.user;

        // 1. Set Auth Profile
        await updateProfile(user, { displayName: fullName });

        // 2. Sync Firestore (Duplicate check inside)
        await syncUserIdentity(user, { fullName, phone, referredBy });

        // 3. Dispatch Verification
        await sendEmailVerification(user);
        
        showToast("Success! Verification email dispatched.", "success");
        setTimeout(() => window.location.href = "verify.html", 2000);
        return true;
    } catch (e) {
        showToast(handleAuthError(e.code), "error");
        return false;
    }
}
