/* 
 * BluePay Main Application Controller
 * Global Lifecycle & Scroll Animations
 */

import { auth } from './firebase-config.js';
import { initNavigation } from './components.js';

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initial Loader Fade
    const loader = document.getElementById('global-loader');
    if (loader) {
        setTimeout(() => {
            loader.style.opacity = '0';
            setTimeout(() => loader.style.display = 'none', 400);
        }, 800);
    }

    // 2. Responsive Navigation
    const pageId = document.body.dataset.page;
    if (pageId && !['login', 'register', 'index'].includes(pageId)) {
        initNavigation(pageId);
    }

    // 3. Premium Reveal Animations
    const observerOptions = { threshold: 0.1, rootMargin: '0px 0px -50px 0px' };
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                revealObserver.unobserve(entry.target);
            }
        });
    }, observerOptions);

    document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

    // 4. PWA Registration
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/service-worker.js')
                .then(reg => console.log('Service Worker Registered'))
                .catch(err => console.log('SW Registration Failed', err));
        });
    }
});
