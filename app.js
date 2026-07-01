/**
 * === BluePay App Controller ===
 * Responsibility: PWA Lifecycle, Real-time Dashboard Sync, 
 * Scroll Reveal Animations, and UI Initializers.
 */

import { auth, db } from './firebase-config.js';
import { onSnapshot, doc, collection, query, where } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { initAppShell } from './components.js';

document.addEventListener('DOMContentLoaded', () => {
    // 1. PWA Service Worker Registration
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/service-worker.js')
                .then(reg => console.log('BluePay SW Active'))
                .catch(err => console.error('PWA Fail', err));
        });
    }

    // 2. Fade Loader
    const loader = document.getElementById('global-loader');
    if (loader) {
        setTimeout(() => {
            loader.style.opacity = '0';
            setTimeout(() => loader.style.display = 'none', 500);
        }, 800);
    }

    // 3. Scroll Reveal Engine
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

    // 4. Global Auth State & Shared Listeners
    auth.onAuthStateChanged(user => {
        if (user) {
            startGlobalListeners(user.uid);
        }
    });
});

/**
 * Listeners for persistent shell elements (Notif counts, etc.)
 */
function startGlobalListeners(uid) {
    // Listen for unread notifications
    const q = query(collection(db, "notifications"), where("uid", "==", uid), where("read", "==", false));
    onSnapshot(q, (snap) => {
        const dot = document.getElementById('shell-notif-dot');
        if (dot) dot.style.display = snap.empty ? 'none' : 'block';
    });

    // Sync Avatar to shell
    onSnapshot(doc(db, "users", uid), (snap) => {
        const data = snap.data();
        const avatar = document.getElementById('shell-avatar');
        if (avatar && data) {
            avatar.innerText = data.displayName.split(' ').map(n => n[0]).join('').toUpperCase();
        }
    });
}
