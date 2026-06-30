/* auth.js - Identity Layer (Rebuilt) */
import { auth, googleProvider, getOrCreateUser, isAdmin, ADMIN_EMAIL, toast } from './firebase-config.js';
import { signInWithPopup, signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { toggleLoader } from './components.js';

// Logic to prevent duplicate account creation and handle admin routing
export async function handleGoogleSignIn() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const userData = await getOrCreateUser(result.user);
    
    toast("Identity Verified", "success");
    
    // 6.1 Admin Routing
    if (userData.email === ADMIN_EMAIL) {
      window.location.href = "admin-dashboard.html";
    } else {
      window.location.href = userData.isNew ? "welcome.html" : "dashboard.html";
    }
  } catch (error) {
    toast(error.message, "error");
  }
}

// Unified Auth Guard
onAuthStateChanged(auth, async (user) => {
  const path = window.location.pathname;
  if (user) {
    // Force admin to admin panel if they try to access user dashboard
    if (user.email === ADMIN_EMAIL && !path.includes('admin')) {
      window.location.href = 'admin-dashboard.html';
    }
    // Block regular users from admin
    if (user.email !== ADMIN_EMAIL && path.includes('admin')) {
      window.location.href = 'dashboard.html';
    }
  }
});
