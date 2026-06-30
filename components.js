/* components.js - Shared UI Engine */
import { toast } from './firebase-config.js';

/**
 * Replaces native confirm() with a branded BluePay modal
 */
export function confirmModal({ title, message, confirmText = "Proceed", cancelText = "Cancel" }) {
  return new Promise((resolve) => {
    const existing = document.getElementById('global-confirm-modal');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'global-confirm-modal';
    overlay.className = 'modal-overlay';
    overlay.style.display = 'flex';
    
    overlay.innerHTML = `
      <div class="modal-content">
        <h3 style="margin-bottom: 12px; font-size: 20px;">${title}</h3>
        <p style="color: var(--muted2); margin-bottom: 24px; font-size: 14px;">${message}</p>
        <div class="flex" style="gap: 12px; justify-content: flex-end;">
          <button class="btn btn-outline" id="modal-cancel" style="padding: 10px 20px; font-size: 14px;">${cancelText}</button>
          <button class="btn btn-primary" id="modal-confirm" style="padding: 10px 20px; font-size: 14px;">${confirmText}</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    document.getElementById('modal-cancel').onclick = () => { overlay.remove(); resolve(false); };
    document.getElementById('modal-confirm').onclick = () => { overlay.remove(); resolve(true); };
    overlay.onclick = (e) => { if (e.target === overlay) { overlay.remove(); resolve(false); } };
  });
}

/**
 * Global Loading State Manager
 */
export function toggleLoader(show, button = null) {
  const loader = document.getElementById('global-loader');
  if (loader) {
    loader.style.display = show ? 'flex' : 'none';
    loader.style.opacity = show ? '1' : '0';
  }
  if (button) {
    if (show) {
      button.disabled = true;
      button.dataset.oldText = button.innerHTML;
      button.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing...';
    } else {
      button.disabled = false;
      button.innerHTML = button.dataset.oldText || button.innerHTML;
    }
  }
}

/**
 * Standardized Input Validation Feedback
 */
export function showInputError(inputEl, message) {
  const group = inputEl.closest('.auth-input-group');
  let errorEl = group.querySelector('.error-msg');
  if (!errorEl) {
    errorEl = document.createElement('p');
    errorEl.className = 'error-msg';
    errorEl.style.cssText = 'color: var(--red); font-size: 11px; margin-top: 5px; font-weight: 700;';
    group.appendChild(errorEl);
  }
  errorEl.innerText = message;
  inputEl.style.borderColor = 'var(--red)';
  setTimeout(() => {
    errorEl.innerText = '';
    inputEl.style.borderColor = '';
  }, 5000);
}
