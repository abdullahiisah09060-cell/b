/**
 * === BluePay Component Engine ===
 * Responsibility: Shell Injection (Sidebar/Nav), Stackable Toasts, Confirm Modals,
 * and Persistent UI elements.
 */

import { auth, fmtN, ADMIN_EMAIL } from './firebase-config.js';

/**
 * Global Navigation Definitions
 */
const NAV_ITEMS = [
    { id: 'dashboard', icon: 'fa-house', label: 'Home', url: 'dashboard.html' },
    { id: 'invest', icon: 'fa-chart-line', label: 'Invest', url: 'invest.html' },
    { id: 'deposit', icon: 'fa-wallet', label: 'Deposit', url: 'deposit.html' },
    { id: 'withdraw', icon: 'fa-bank', label: 'Withdraw', url: 'withdraw.html' },
    { id: 'buy-code', icon: 'fa-key', label: 'Validator', url: 'buy-code.html' },
    { id: 'transactions', icon: 'fa-list-ul', label: 'History', url: 'transactions.html' },
    { id: 'referrals', icon: 'fa-users', label: 'Referrals', url: 'referrals.html' },
    { id: 'support', icon: 'fa-headset', label: 'Support', url: 'support.html' },
    { id: 'profile', icon: 'fa-user-circle', label: 'Profile', url: 'profile.html' }
];

/**
 * Initializes the Dashboard Shell (Sidebar + Bottom Nav + Header)
 */
export function initAppShell(activeId) {
    const sidebar = document.querySelector('.sidebar');
    const bottomNav = document.querySelector('.bottom-nav');
    const mobileHeader = document.querySelector('.mobile-header');

    // 1. Sidebar Injection
    if (sidebar) {
        sidebar.innerHTML = `
            <div class="flex" style="gap: 12px; margin-bottom: 40px; padding-left: 10px;">
                <div style="width: 40px; height: 40px; background: var(--blue); border-radius: 12px; display: flex; align-items: center; justify-content: center;"><i class="fa-solid fa-b" style="color: white; font-size: 20px;"></i></div>
                <span style="font-size: 24px; font-weight: 900; letter-spacing: -1.5px;">BluePay</span>
            </div>
            <nav style="flex: 1; display: flex; flex-direction: column; gap: 4px;">
                ${NAV_ITEMS.map(item => `
                    <a href="${item.url}" class="nav-item ${activeId === item.id ? 'active' : ''}" 
                       style="display:flex; align-items:center; gap:16px; padding:14px 18px; border-radius:12px; color:${activeId === item.id ? 'white' : 'var(--muted2)'}; background:${activeId === item.id ? 'var(--bg3)' : 'transparent'}; font-weight:600; text-decoration:none; transition:0.2s;">
                        <i class="fa-solid ${item.icon}" style="width:20px; text-align:center; color:${activeId === item.id ? 'var(--blue2)' : 'inherit'}"></i> ${item.label}
                    </a>
                `).join('')}
            </nav>
            <div style="padding-top: 20px; border-top: 1px solid var(--border);">
                <button id="nav-logout-btn" style="background:none; border:none; color:var(--red); font-weight:700; cursor:pointer; display:flex; align-items:center; gap:16px; padding:14px 18px; font-family:inherit; font-size:15px; width:100%;">
                    <i class="fa-solid fa-right-from-bracket"></i> Logout
                </button>
            </div>
        `;
    }

    // 2. Bottom Navigation Injection
    if (bottomNav) {
        const coreLinks = [NAV_ITEMS[0], NAV_ITEMS[1], NAV_ITEMS[2], NAV_ITEMS[3], NAV_ITEMS[8]];
        bottomNav.innerHTML = coreLinks.map(item => `
            <a href="${item.url}" class="b-nav-item ${activeId === item.id ? 'active' : ''}" style="display:flex; flex-direction:column; align-items:center; gap:4px; color:${activeId === item.id ? 'var(--blue2)' : 'var(--muted2)'}; text-decoration:none; font-size:10px; font-weight:700;">
                <i class="fa-solid ${item.icon}" style="font-size:20px;"></i>
                <span>${item.label}</span>
            </a>
        `).join('');
    }

    // 3. Mobile Header Injection
    if (mobileHeader) {
        mobileHeader.innerHTML = `
            <div class="flex" style="gap: 10px;">
                <div style="width: 32px; height: 32px; background: var(--blue); border-radius: 8px; display: flex; align-items: center; justify-content: center;"><i class="fa-solid fa-b" style="color: white; font-size: 14px;"></i></div>
                <span style="font-size: 20px; font-weight: 900; letter-spacing: -0.5px;">BluePay</span>
            </div>
            <div class="flex" style="gap: 20px;">
                <a href="notifications.html" style="position: relative; color: var(--text);">
                    <i class="fa-solid fa-bell" style="font-size: 22px;"></i>
                    <div id="header-notif-dot" style="display:none; position:absolute; top:-2px; right:-2px; width:10px; height:10px; background:var(--red); border-radius:50%; border:2px solid var(--bg2);"></div>
                </a>
                <a href="profile.html"><div id="header-avatar" style="width:32px; height:32px; border-radius:50%; background:var(--bg3); border:1px solid var(--border); display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:800;">BP</div></a>
            </div>
        `;
    }

    // Setup Logout Trigger
    const lBtn = document.getElementById('nav-logout-btn');
    if (lBtn) lBtn.onclick = () => auth.signOut().then(() => window.location.href = 'login.html');
}

/**
 * High-Performance Toast System
 */
export function showToast(message, type = "info") {
    let container = document.getElementById("toast-container");
    if (!container) {
        container = document.createElement("div");
        container.id = "toast-container";
        document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    const colors = { success: "#22c55e", error: "#ef4444", warning: "#f59e0b", info: "#3b82f6" };
    const icons = { success: "fa-check-circle", error: "fa-circle-xmark", warning: "fa-triangle-exclamation", info: "fa-circle-info" };

    toast.style.cssText = `
        background: #0b0f1a; color: white; padding: 16px 20px; border-radius: 12px;
        border: 1px solid rgba(255,255,255,0.1); border-left: 4px solid ${colors[type]};
        box-shadow: 0 20px 40px rgba(0,0,0,0.4); display: flex; align-items: center; gap: 12px;
        font-size: 14px; font-weight: 600; cursor: pointer; pointer-events: all;
        animation: slideIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
    `;

    toast.innerHTML = `<i class="fa-solid ${icons[type]}" style="color:${colors[type]}; font-size:18px;"></i> <span>${message}</span>`;
    container.appendChild(toast);

    const close = () => {
        toast.style.animation = "slideOut 0.4s ease forwards";
        setTimeout(() => toast.remove(), 400);
    };
    setTimeout(close, 5000);
    toast.onclick = close;
}

/**
 * Professional Confirm Modal
 */
export function showModal({ title, message, confirmText = "Proceed", cancelText = "Cancel", onConfirm }) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.style.display = 'flex';
    
    overlay.innerHTML = `
        <div class="card" style="width: 100%; max-width: 440px; animation: slideIn 0.3s ease-out;">
            <h3 style="font-size: 22px; margin-bottom: 12px;">${title}</h3>
            <p style="color: var(--muted2); font-size: 15px; margin-bottom: 32px; line-height: 1.5;">${message}</p>
            <div class="grid" style="grid-template-columns: 1fr 1fr; gap: 12px;">
                <button class="btn btn-outline" id="modal-cancel-btn">${cancelText}</button>
                <button class="btn btn-primary" id="modal-confirm-btn">${confirmText}</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(overlay);
    
    const close = () => {
        overlay.style.opacity = '0';
        setTimeout(() => overlay.remove(), 300);
    };

    overlay.querySelector('#modal-cancel-btn').onclick = close;
    overlay.querySelector('#modal-confirm-btn').onclick = () => { onConfirm(); close(); };
    overlay.onclick = (e) => { if(e.target === overlay) close(); };
}

/**
 * Standard Loading State Handler
 */
export function setLoading(btn, isLoading, originalHtml = null) {
    if (isLoading) {
        btn.disabled = true;
        btn.dataset.original = originalHtml || btn.innerHTML;
        btn.innerHTML = `<div class="spinner"></div>`;
    } else {
        btn.disabled = false;
        btn.innerHTML = btn.dataset.original || "Proceed";
    }
}
