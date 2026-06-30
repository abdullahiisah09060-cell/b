// app.js
import { auth, listenNotifs, listenBroadcasts, markRead, markAllRead, toast } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

document.addEventListener("DOMContentLoaded", () => {
  // Global Loader Animation Handler
  const loader = document.getElementById("global-loader");
  if (loader) {
    setTimeout(() => {
      loader.style.opacity = "0";
      setTimeout(() => { loader.style.display = "none"; }, 400);
    }, 600);
  }

  // IntersectionObserver for CSS Scroll Reveals
  const revealElements = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("revealed");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    revealElements.forEach(el => observer.observe(el));
  } else {
    revealElements.forEach(el => el.classList.add("revealed"));
  }

  // Initialize Authenticated Sidebars and Live Badges
  onAuthStateChanged(auth, (user) => {
    if (user) {
      initRealtimeSystemNotifications(user.uid);
    }
  });
});

// Real-Time System Notifications Pipeline (Synchronizes Bell Badge & Sidebar Updates)
function initRealtimeSystemNotifications(uid) {
  const bell = document.querySelector(".notif-bell-icon");
  const badgeContainer = document.querySelector(".notif-badge-count");
  
  listenNotifs(uid, (notifications) => {
    const unread = notifications.filter(n => !n.read).length;
    
    // Update Document Header Title
    if (unread > 0) {
      document.title = `(${unread}) BluePay Platform`;
      if (badgeContainer) {
        badgeContainer.style.display = "flex";
        badgeContainer.innerText = unread > 99 ? "99+" : unread;
      }
    } else {
      document.title = "BluePay Platform";
      if (badgeContainer) {
        badgeContainer.style.display = "none";
      }
    }

    // Direct Sync to Sidebar Badge (If exists)
    const sidebarBadge = document.getElementById("sidebar-notif-badge");
    if (sidebarBadge) {
      if (unread > 0) {
        sidebarBadge.style.display = "inline-flex";
        sidebarBadge.innerText = unread;
      } else {
        sidebarBadge.style.display = "none";
      }
    }
  });
}

// Global Clipboard Copy Mechanism
export function copyToClipboard(text, successMessage = "Copied to clipboard") {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      toast(successMessage, "success");
    }).catch(() => {
      fallbackCopy(text, successMessage);
    });
  } else {
    fallbackCopy(text, successMessage);
  }
}

function fallbackCopy(text, successMessage) {
  const input = document.createElement("textarea");
  input.value = text;
  input.style.position = "fixed";
  document.body.appendChild(input);
  input.focus();
  input.select();
  try {
    document.execCommand("copy");
    toast(successMessage, "success");
  } catch (err) {
    toast("Clipboard command failed.", "error");
  }
  document.body.removeChild(input);
}

// Numerical Statistic Counter Animation Engine
export function animateCounter(elementId, targetValue, duration = 1500) {
  const el = document.getElementById(elementId);
  if (!el) return;

  let start = 0;
  const step = Math.ceil(targetValue / (duration / 20));
  const timer = setInterval(() => {
    start += step;
    if (start >= targetValue) {
      start = targetValue;
      clearInterval(timer);
    }
    el.innerText = start.toLocaleString("en-NG");
  }, 20);
}

// Custom Promises Dialogues (Bypasses Native Confirm Windows)
export function confirmDialog(title, message) {
  return new Promise((resolve) => {
    const overlay = document.createElement("div");
    overlay.style.cssText = "position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(6,8,15,0.85); display: flex; align-items: center; justify-content: center; z-index: 100000; padding: 24px; backdrop-filter: blur(8px); animation: fadeIn .25s ease-out;";
    
    const card = document.createElement("div");
    card.style.cssText = "background: var(--bg2); border: 1px solid var(--borderb); width: 100%; max-width: 420px; border-radius: var(--radius); padding: 28px; box-shadow: var(--shadow-l); transform: translateY(20px); animation: slideUp .3s cubic-bezier(0.175, 0.885, 0.32, 1.2) forwards;";
    
    card.innerHTML = `
      <h3 style="font-size: 20px; font-weight: 800; margin-bottom: 12px; color: var(--text);">${title}</h3>
      <p style="color: var(--muted2); font-size: 14px; line-height: 1.6; margin-bottom: 24px;">${message}</p>
      <div style="display: flex; gap: 12px; justify-content: flex-end;">
        <button id="conf-cancel-btn" class="btn" style="background: var(--bg3); color: var(--text); padding: 10px 18px; border-radius: var(--radius-s); font-weight: 600; font-size: 14px; border: 1px solid var(--border); cursor: pointer; transition: background .2s;">Cancel</button>
        <button id="conf-yes-btn" class="btn btn-primary" style="padding: 10px 22px; border-radius: var(--radius-s); font-weight: 700; font-size: 14px; cursor: pointer;">Proceed</button>
      </div>
    `;

    overlay.appendChild(card);
    document.body.appendChild(overlay);

    const cancel = card.querySelector("#conf-cancel-btn");
    const yes = card.querySelector("#conf-yes-btn");

    const cleanup = () => {
      card.style.animation = "slideDown .2s ease-in forwards";
      overlay.style.animation = "fadeOut .2s ease-in forwards";
      setTimeout(() => { overlay.remove(); }, 200);
    };

    cancel.onclick = () => {
      cleanup();
      resolve(false);
    };

    yes.onclick = () => {
      cleanup();
      resolve(true);
    };
  });
}

// CSV Processing Utility
export function exportToCSV(filename, headers, rows) {
  let content = headers.join(",") + "\n";
  rows.forEach(r => {
    const cleanRow = r.map(val => {
      let str = val === null || val === undefined ? "" : String(val);
      // Escape Quotes
      str = str.replace(/"/g, '""');
      if (str.search(/("|,|\n)/g) >= 0) str = `"${str}"`;
      return str;
    });
    content += cleanRow.join(",") + "\n";
  });

  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Media Converter Base64 Module
export function imageToBase64(file) {
  return new Promise((resolve, reject) => {
    if (file.size > 2 * 1024 * 1024) {
      reject("File dimensions exceed 2MB payload threshold.");
      return;
    }
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
}
