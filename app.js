/**
 * === BluePay Main Application Controller ===
 * Responsibility: App Lifecycle, Real-time Dashboard Sync, PWA registration.
 */

import { auth, db } from './firebase-config.js';
import { onSnapshot, doc, collection, query, where } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { initAppShell } from './components.js';

document.addEventListener('DOMContentLoaded', () => {
    // 1. PWA Registration
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/service-worker.js')
                .then(reg => console.log('BluePay SW Active'))
                .catch(err => console.error('PWA Fail', err));
        });
    }

    // 2. Clear Global Loader
    const loader = document.getElementById('global-loader');
    if (loader) {
        setTimeout(() => {
            loader.style.opacity = '0';
            setTimeout(() => loader.style.display = 'none', 500);
        }, 800);
    }

    // 3. Intersection Observer for Page Transitions
    const obs = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                obs.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });
    document.querySelectorAll('.reveal').forEach(el => obs.observe(el));

    // 4. Global Auth Watcher for Core UI
    auth.onAuthStateChanged(user => {
        if (user) {
            setupGlobalListeners(user.uid);
        }
    });
});

/**
 * Dashboard Listener for Unread Alerts
 */
function setupGlobalListeners(uid) {
    // Watch unread notifications for the dot
    const qNotif = query(collection(db, "notifications"), where("uid", "==", uid), where("read", "==", false));
    onSnapshot(qNotif, (snap) => {
        const dot = document.getElementById('header-notif-dot');
        if (dot) dot.style.display = snap.empty ? 'none' : 'block';
    });

    // Update Header Avatar
    onSnapshot(doc(db, "users", uid), (snap) => {
        const u = snap.data();
        const avatarEl = document.getElementById('header-avatar');
        if (avatarEl && u) {
            avatarEl.innerText = u.displayName.split(' ').map(n => n[0]).join('').toUpperCase();
        }
    });
}
