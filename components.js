/**
 * === BluePay Component Engine ===
 * Responsibility: Navigation Injection, Global Toast Stacking, Custom Confirm Modals,
 * and Persistent UI elements.
 */

import { auth, fmtN, ADMIN_EMAIL } from './firebase-config.js';

/**
 * Registry of Application Links
 */
const ROUTES = [
    { id: 'dashboard', icon: 'fa-house', label: 'Home', url: 'dashboard.html' },
    { id: 'deposit', icon: 'fa-wallet', label: 'Deposit', url: 'deposit.html' },
    { id: 'invest', icon: 'fa-chart-line', label: 'Invest', url: 'invest.html' },
    { id: 'withdraw', icon: 'fa-bank', label: 'Withdraw', url: 'withdraw.html' },
    { id: 'buy-code', icon: 'fa-key', label: 'Validator', url: 'buy-code.html' },
    { id: 'transactions', icon: 'fa-list-ul', label: 'History', url: 'transactions.html' },
    { id: 'referrals', icon: 'fa-users', label: 'Referrals', url: 'referrals.html' },
    { id: 'support', icon: 'fa-headset', label: 'Support', url: 'support.html' },
    { id: 'profile', icon: 'fa-user-circle', label: 'Profile', url: 'profile.html' }
];

/**
 * Injects Desktop Sidebar, Mobile Header, and Bottom Navigation.
 * Should be called on every dashboard-level page.
 */
export function initAppShell(activeId) {
    const sidebar = document.querySelector('.sidebar');
    const bottomNav = document.querySelector('.bottom-nav');
    const mobileHeader = document.querySelector('.mobile-header');

    // 1. Desktop Sidebar
    if (sidebar) {
        sidebar.innerHTML = `
            <div class="flex" style="gap: 12px; margin-bottom: 40px; padding-left: 10px;">
                <div style="width: 40px; height: 40px; background: var(--blue); border-radius: 12px; display: flex; align-items: center; justify-content: center;"><i class="fa-solid fa-b" style="color: white; font-size: 20px;"></i></div>
                <span style="font-size: 24px; font-weight: 900; letter-spacing: -1px;">BluePay</span>
            </div>
            <nav style="flex: 1; display: flex; flex-direction: column; gap: 4px;">
                ${ROUTES.map(route => `
                    <a href="${route.url}" class="nav-item ${activeId === route.id ? 'active' : ''}" 
                       style="display:flex; align-items:center; gap:16px; padding:14px 18px; border-radius:12px; color:${activeId === route.id ? 'white' : 'var(--muted2)'}; background:${activeId === route.id ? 'var(--bg3)' : 'transparent'}; font-weight:600; text-decoration:none; transition:0.2s;">
                        <i class="fa-solid ${route.icon}" style="width:20px; text-align:center; color:${activeId === route.id ? 'var(--blue2)' : 'inherit'}"></i> ${route.label}
                    </a>
                `).join('')}
            </nav>
            <div style="padding-top: 20px; border-top: 1px solid var(--border);">
                <button id="btn-logout-shell" style="background:none; border:none; color:var(--red); font-weight:700; cursor:pointer; display:flex; align-items:center; gap:16px; padding:14px 18px; font-family:inherit; font-size:15px; width:100%;">
                    <i class="fa-solid fa-right-from-bracket"></i> Logout
                </button>
            </div>
        `;
    }

    // 2. Mobile Bottom Nav (Core 5 items)
    if (bottomNav) {
        const core = [ROUTES[0], ROUTES[2], ROUTES[3], ROUTES[7], ROUTES[8]];
        bottomNav.innerHTML = core.map(route => `
            <a href="${route.url}" class="b-nav-item ${activeId === route.id ? 'active' : ''}" style="display:flex; flex-direction:column; align-items:center; gap:4px; color:${activeId === route.id ? 'var(--blue2)' : 'var(--muted2)'}; text-decoration:none; font-size:10px; font-weight:700;">
                <i class="fa-solid ${route.icon}" style="font-size:20px;"></i>
                <span>${route.label}</span>
            </a>
        `).join('');
    }

    // 3. Mobile Top Header
    if (mobileHeader) {
        mobileHeader.innerHTML = `
            <div class="flex" style="gap: 10px;">
                <div style="width: 32px; height: 32px; background: var(--blue); border-radius: 8px; display: flex; align-items: center; justify-content: center;"><i class="fa-solid fa-b" style="color: white; font-size: 14px;"></i></div>
                <span style="font-size: 20px; font-weight: 900; letter-spacing: -0.5px;">BluePay</span>
            </div>
            <div class="flex" style="gap: 20px;">
                <a href="notifications.html" style="position: relative; color: var(--text);">
                    <i class="fa-solid fa-bell" style="font-size: 22px;"></i>
                    <div id="shell-notif-dot" style="display:none; position:absolute; top:-2px; right:-2px; width:10px; height:10px; background:var(--red); border-radius:50%; border:2px solid var(--bg2);"></div>
                </a>
                <a href="profile.html"><div id="shell-avatar" style="width:32px; height:32px; border-radius:50%; background:var(--bg3); border:1px solid var(--border); display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:800;">BP</div></a>
            </div>
        `;
    }

    // Handle Global Logout
    const logoutBtn = document.getElementById('btn-logout-shell');
    if (logoutBtn) {
        logoutBtn.onclick = () => {
            showConfirm({
                title: "Log Out?",
                message: "Are you sure you want to end your secure session?",
                confirmText: "Yes, Logout",
                onConfirm: () => auth.signOut().then(() => window.location.href = 'login.html')
            });
        };
    }
}

/**
 * Premium Toast Notification System (Stackable)
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
    const icons = { success: "fa-circle-check", error: "fa-circle-xmark", warning: "fa-triangle-exclamation", info: "fa-circle-info" };

    toast.style.cssText = `
        background: #0b0f1a; color: white; padding: 16px 20px; border-radius: 12px;
        border: 1px solid rgba(255,255,255,0.1); border-left: 4px solid ${colors[type]};
        box-shadow: 0 20px 40px rgba(0,0,0,0.4); display: flex; align-items: center; gap: 12px;
        font-size: 14px; font-weight: 600; cursor: pointer; pointer-events: all;
        animation: slideInToast 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
    `;

    toast.innerHTML = `<i class="fa-solid ${icons[type]}" style="color:${colors[type]}; font-size:18px;"></i> <span>${message}</span>`;
    container.appendChild(toast);

    const close = () => {
        toast.style.animation = "slideOutToast 0.4s ease forwards";
        setTimeout(() => toast.remove(), 400);
    };

    toast.onclick = close;
    setTimeout(close, 5000);
}

/**
 * Standardized Custom Confirmation Modal
 */
export function showConfirm({ title, message, confirmText = "Proceed", cancelText = "Cancel", onConfirm }) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.style.display = 'flex';
    
    overlay.innerHTML = `
        <div class="modal-card">
            <h3 style="font-size: 22px; margin-bottom: 12px;">${title}</h3>
            <p style="color: var(--muted2); font-size: 15px; margin-bottom: 32px; line-height:1.5;">${message}</p>
            <div class="grid-2">
                <button class="btn btn-outline" id="m-cancel">${cancelText}</button>
                <button class="btn btn-primary" id="m-confirm">${confirmText}</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(overlay);
    const cancel = overlay.querySelector('#m-cancel');
    const confirm = overlay.querySelector('#m-confirm');
    
    const close = () => {
        overlay.style.opacity = '0';
        setTimeout(() => overlay.remove(), 300);
    };
    
    cancel.onclick = close;
    confirm.onclick = () => { onConfirm(); close(); };
    overlay.onclick = (e) => { if(e.target === overlay) close(); };
}

/**
 * Button Loading State Controller
 */
export function toggleLoader(btn, isLoading, originalText) {
    if (isLoading) {
        btn.disabled = true;
        btn.dataset.original = originalText || btn.innerHTML;
        btn.innerHTML = `<div class="spinner"></div>`;
    } else {
        btn.disabled = false;
        btn.innerHTML = btn.dataset.original || originalText;
    }
}
