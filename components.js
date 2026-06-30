/* 
 * BluePay Components Engine
 * Handles Navigation, Modals, and Reusable UI Parts
 */

import { auth, ADMIN_EMAIL } from './firebase-config.js';

/**
 * Injects navigation based on device and user role
 */
export function initNavigation(activeId = 'dashboard') {
    const sidebar = document.querySelector('.sidebar');
    const bottomNav = document.querySelector('.bottom-nav');
    const mobileHeader = document.querySelector('.mobile-header');

    const links = [
        { id: 'dashboard', icon: 'fa-house', label: 'Home', url: 'dashboard.html' },
        { id: 'invest', icon: 'fa-chart-line', label: 'Invest', url: 'invest.html' },
        { id: 'withdraw', icon: 'fa-bank', label: 'Withdraw', url: 'withdraw.html' },
        { id: 'support', icon: 'fa-headset', label: 'Support', url: 'support.html' },
        { id: 'profile', icon: 'fa-user-circle', label: 'Account', url: 'profile.html' }
    ];

    // Sidebar Injection (Desktop)
    if (sidebar) {
        sidebar.innerHTML = `
            <div class="flex" style="gap: 12px; margin-bottom: 40px;">
                <div style="width: 35px; height: 35px; background: var(--blue); border-radius: 8px; display: flex; align-items: center; justify-content: center;"><i class="fa-solid fa-b" style="color: white;"></i></div>
                <span style="font-size: 22px; font-weight: 900;">BluePay</span>
            </div>
            <nav style="flex: 1;">
                ${links.map(l => `
                    <a href="${l.url}" class="nav-item ${activeId === l.id ? 'active' : ''}" style="display:flex; align-items:center; gap:15px; padding:14px 18px; border-radius:10px; color:var(--muted2); font-weight:600; text-decoration:none; margin-bottom:5px;">
                        <i class="fa-solid ${l.icon}" style="width:20px; text-align:center;"></i> ${l.label}
                    </a>
                `).join('')}
                <a href="transactions.html" class="nav-item"><i class="fa-solid fa-list-ul"></i> History</a>
                <a href="referrals.html" class="nav-item"><i class="fa-solid fa-users"></i> Referrals</a>
            </nav>
            <div style="padding-top: 20px; border-top: 1px solid var(--border);">
                <button id="logout-btn" style="background:none; border:none; color:var(--red); font-weight:700; cursor:pointer; display:flex; align-items:center; gap:15px; padding:10px 18px;">
                    <i class="fa-solid fa-right-from-bracket"></i> Logout
                </button>
            </div>
        `;
    }

    // Bottom Nav Injection (Mobile)
    if (bottomNav) {
        bottomNav.innerHTML = links.map(l => `
            <a href="${l.url}" class="b-nav-item ${activeId === l.id ? 'active' : ''}" style="display:flex; flex-direction:column; align-items:center; gap:4px; color:${activeId === l.id ? 'var(--blue2)' : 'var(--muted2)'}; text-decoration:none; font-size:10px; font-weight:700;">
                <i class="fa-solid ${l.icon}" style="font-size:20px;"></i>
                <span>${l.label}</span>
            </a>
        `).join('');
    }

    // Setup Logout
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.onclick = () => auth.signOut().then(() => window.location.href = 'login.html');
    }
}

/**
 * Custom Confirmation Modal (Replaces native confirm)
 */
export function showConfirm({ title, message, onConfirm }) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.style.display = 'flex';
    
    overlay.innerHTML = `
        <div class="modal-content">
            <h3>${title}</h3>
            <p style="margin: 15px 0 30px; color: var(--muted2); font-size: 14px;">${message}</p>
            <div class="grid-2">
                <button class="btn btn-outline" id="m-cancel">Cancel</button>
                <button class="btn btn-primary" id="m-ok">Proceed</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(overlay);
    
    document.getElementById('m-cancel').onclick = () => overlay.remove();
    document.getElementById('m-ok').onclick = () => {
        onConfirm();
        overlay.remove();
    };
}
