/**
 * === BluePay Authentication Controller ===
 * Responsibility: Secure Registration, Login, Google Auth, 
 * Duplicate Prevention, and Admin Routing.
 */

import { 
    auth, db, syncUserIdentity, ADMIN_EMAIL, 
    googleProvider, notifyUser 
} from './firebase-config.js';
import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signInWithPopup, 
    sendEmailVerification,
    sendPasswordResetEmail,
    updateProfile
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { showToast } from './components.js';

/**
 * Smart Redirector: Hard-coded Admin gate
 */
export function routeUser(user) {
    if (user.email.toLowerCase() === ADMIN_EMAIL) {
        window.location.href = "admin-dashboard.html";
    } else {
        window.location.href = "dashboard.html";
    }
}

/**
 * Real-time Password Strength Evaluator
 */
export function checkPasswordStrength(password) {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    const map = [
        { label: "Very Weak", color: "var(--red)" },
        { label: "Weak", color: "var(--orange)" },
        { label: "Fair", color: "var(--blue2)" },
        { label: "Strong", color: "var(--green)" },
        { label: "Secure", color: "var(--green)" }
    ];
    return map[score];
}

/**
 * Handle Official Google Sign-In (Fintech Standard)
 */
export async function handleGoogleSignIn() {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        const userData = await syncUserIdentity(result.user);
        
        showToast(`Welcome, ${userData.displayName}`, "success");
        setTimeout(() => routeUser(result.user), 1000);
    } catch (error) {
        if (error.code === 'auth/account-exists-with-different-credential') {
            showToast("This email is already registered via password. Please login normally.", "warning");
        } else {
            showToast(error.message, "error");
        }
    }
}

/**
 * Full Registration Flow
 */
export async function performRegistration(data) {
    const { email, password, fullName, phone, referredBy } = data;

    try {
        // 1. Pre-check for duplicate email in Firestore
        const q = query(collection(db, "users"), where("email", "==", email.toLowerCase()));
        const exists = await getDocs(q);
        if (!exists.empty) {
            showToast("Email address already registered. Please login.", "warning");
            return false;
        }

        // 2. Create Firebase Auth
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(cred.user, { displayName: fullName });

        // 3. Sync to Firestore (Duplicate check inside handles race conditions)
        await syncUserIdentity(cred.user, { fullName, phone, referredBy });

        // 4. Verification
        await sendEmailVerification(cred.user);
        
        showToast("Success! Please check your email for the verification link.", "success");
        return true;
    } catch (error) {
        showToast(error.message, "error");
        return false;
    }
}

/**
 * Login Flow
 */
export async function performLogin(email, password) {
    try {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        const user = cred.user;

        // Strict Verification Gate
        if (!user.emailVerified && user.email !== ADMIN_EMAIL) {
            showToast("Verification Required. A new link has been sent.", "warning");
            await sendEmailVerification(user);
            setTimeout(() => window.location.href = "verify.html", 1500);
            return;
        }

        await syncUserIdentity(user);
        showToast("Secure login successful.", "success");
        setTimeout(() => routeUser(user), 1000);
    } catch (error) {
        showToast("Invalid credentials provided.", "error");
    }
}
