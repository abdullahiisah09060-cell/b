/* 
 * BluePay Authentication Controller
 * Production-Ready Login/Register Flow
 */

import { auth, googleProvider, syncUserIdentity, ADMIN_EMAIL, toast } from './firebase-config.js';
import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signInWithPopup, 
    onAuthStateChanged,
    sendEmailVerification
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const isMobile = window.innerWidth < 1024;

/**
 * Official Google Branding Button Handler
 */
export async function handleGoogleAuth() {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        const userData = await syncUserIdentity(result.user);
        
        toast(`Welcome back, ${userData.displayName}`, "success");
        redirectUser(userData);
    } catch (error) {
        toast(error.message, "error");
    }
}

/**
 * Role-Based Routing
 */
function redirectUser(userData) {
    if (userData.email === ADMIN_EMAIL) {
        window.location.href = 'admin-dashboard.html';
    } else {
        window.location.href = 'dashboard.html';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const page = document.body.dataset.page;
    
    // 1. Login Form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.onsubmit = async (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const pass = document.getElementById('login-password').value;
            
            try {
                const res = await signInWithEmailAndPassword(auth, email, pass);
                if (!res.user.emailVerified) {
                    toast("Please verify your email address", "warning");
                    // Optionally resend verification
                }
                const userData = await syncUserIdentity(res.user);
                redirectUser(userData);
            } catch (error) {
                toast("Invalid login credentials", "error");
            }
        };
    }

    // 2. Registration Form
    const regForm = document.getElementById('reg-form');
    if (regForm) {
        regForm.onsubmit = async (e) => {
            e.preventDefault();
            const name = document.getElementById('reg-name').value;
            const email = document.getElementById('reg-email').value;
            const phone = document.getElementById('reg-phone').value;
            const pass = document.getElementById('reg-password').value;
            const confirm = document.getElementById('reg-confirm').value;

            if (pass !== confirm) return toast("Passwords do not match", "error");
            if (phone.length < 10) return toast("Invalid Nigerian phone number", "error");

            try {
                const res = await createUserWithEmailAndPassword(auth, email, pass);
                await sendEmailVerification(res.user);
                const userData = await syncUserIdentity(res.user, { displayName: name, phone });
                toast("Account created! Verify your email to continue.", "success");
                setTimeout(() => window.location.href = 'verify.html', 2000);
            } catch (error) {
                toast(error.message, "error");
            }
        };
    }

    // 3. Password Visibility Toggle
    document.querySelectorAll('.eye-toggle').forEach(btn => {
        btn.onclick = () => {
            const input = btn.parentElement.querySelector('input');
            input.type = input.type === 'password' ? 'text' : 'password';
            btn.classList.toggle('fa-eye');
            btn.classList.toggle('fa-eye-slash');
        };
    });
});
