// auth.js
import { 
  auth, 
  createUserDoc, 
  updateLastSeen, 
  toast, 
  googleProvider,
  getUserDoc,
  WELCOME_BONUS,
  logTx,
  notify
} from "./firebase-config.js";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  sendEmailVerification, 
  sendPasswordResetEmail,
  signInWithPopup,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// Human-readable errors mapping
export function firebaseError(code) {
  switch (code) {
    case "auth/email-already-in-use":
      return "An account with this email address already exists.";
    case "auth/invalid-email":
      return "Please input a valid email formatting address.";
    case "auth/operation-not-allowed":
      return "Email/Password accounts are currently deactivated.";
    case "auth/weak-password":
      return "Password strength failed security check.";
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Incorrect email credentials or password.";
    case "auth/too-many-requests":
      return "Access to this account has been temporarily blocked. Please wait a few moments.";
    case "auth/user-disabled":
      return "This account profile has been locked by administrative order.";
    default:
      return "An unknown authentication anomaly occurred. Try again.";
  }
}

// Indicator helper
export function setLoading(btn, isLoading, originalHtml = "") {
  if (isLoading) {
    btn.disabled = true;
    btn.dataset.original = originalHtml || btn.innerHTML;
    btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Processing...`;
  } else {
    btn.disabled = false;
    btn.innerHTML = btn.dataset.original || originalHtml;
  }
}

// Form fields validation helper
function validateFields(fields) {
  for (const f of fields) {
    if (!f.value || f.value.trim() === "") {
      toast(`${f.name || f.placeholder} is required`, "warning");
      f.focus();
      return false;
    }
  }
  return true;
}

// Password Strength Engine
export function checkPasswordStrength(password) {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  let label = "Weak";
  let color = "var(--red)";
  if (score === 2) { label = "Fair"; color = "var(--orange)"; }
  else if (score === 3) { label = "Good"; color = "var(--blue2)"; }
  else if (score === 4) { label = "Strong"; color = "var(--green)"; }

  return { score, label, color };
}

// DOM Page Engine Mapper
document.addEventListener("DOMContentLoaded", () => {
  const page = document.body.dataset.page;
  if (!page) return;

  // Global Signout Handler (Unified attribute selector)
  document.querySelectorAll("[data-logout]").forEach(el => {
    el.addEventListener("click", async (e) => {
      e.preventDefault();
      try {
        await signOut(auth);
        toast("Successfully logged out", "success");
        setTimeout(() => { window.location.href = "login.html"; }, 1500);
      } catch (err) {
        toast("Logout failed. Try again.", "error");
      }
    });
  });

  // Password Input Visibility Toggles
  document.querySelectorAll(".eye-toggle").forEach(toggle => {
    toggle.addEventListener("click", () => {
      const input = toggle.parentElement.querySelector("input");
      if (input.type === "password") {
        input.type = "text";
        toggle.classList.replace("fa-eye-slash", "fa-eye");
      } else {
        input.type = "password";
        toggle.classList.replace("fa-eye", "fa-eye-slash");
      }
    });
  });

  if (page === "register") {
    const regForm = document.getElementById("reg-form");
    const pwdInput = document.getElementById("reg-password");
    const strengthMeter = document.getElementById("strength-bar");
    const strengthText = document.getElementById("strength-text");
    const googleBtn = document.getElementById("google-reg");

    if (pwdInput && strengthMeter && strengthText) {
      pwdInput.addEventListener("input", () => {
        const password = pwdInput.value;
        if (!password) {
          strengthMeter.style.width = "0%";
          strengthText.innerText = "";
          return;
        }
        const { score, label, color } = checkPasswordStrength(password);
        strengthMeter.style.width = `${(score / 4) * 100}%`;
        strengthMeter.style.backgroundColor = color;
        strengthText.innerText = `Strength: ${label}`;
        strengthText.style.color = color;
      });
    }

    if (regForm) {
      regForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const name = document.getElementById("reg-name");
        const email = document.getElementById("reg-email");
        const phone = document.getElementById("reg-phone");
        const password = document.getElementById("reg-password");
        const confirm = document.getElementById("reg-confirm");
        const referral = document.getElementById("reg-referral");
        const terms = document.getElementById("reg-terms");
        const btn = regForm.querySelector("button[type='submit']");

        if (!validateFields([name, email, phone, password, confirm])) return;
        if (password.value !== confirm.value) {
          toast("Passwords do not match", "error");
          return;
        }
        if (checkPasswordStrength(password.value).score < 2) {
          toast("Please enter a stronger password", "warning");
          return;
        }
        if (!terms.checked) {
          toast("You must accept our investment terms", "warning");
          return;
        }

        setLoading(btn, true);

        try {
          const cred = await createUserWithEmailAndPassword(auth, email.value.trim(), password.value);
          await updateProfile(cred.user, { displayName: name.value.trim() });
          
          await createUserDoc(cred.user.uid, {
            email: email.value.trim(),
            displayName: name.value.trim(),
            phone: phone.value.trim(),
            referredBy: referral ? referral.value.trim() : ""
          });

          await sendEmailVerification(cred.user);
          toast("Registration complete. Verification link sent!", "success");
          setTimeout(() => { window.location.href = "verify.html"; }, 2000);
        } catch (err) {
          toast(firebaseError(err.code), "error");
          setLoading(btn, false);
        }
      });
    }

    if (googleBtn) {
      googleBtn.addEventListener("click", async () => {
        try {
          const res = await signInWithPopup(auth, googleProvider);
          const existing = await getUserDoc(res.user.uid);
          if (!existing) {
            await createUserDoc(res.user.uid, {
              email: res.user.email,
              displayName: res.user.displayName,
              phone: res.user.phoneNumber || ""
            });
            window.location.href = "welcome.html";
          } else {
            await updateLastSeen(res.user.uid);
            window.location.href = "dashboard.html";
          }
        } catch (err) {
          toast(firebaseError(err.code), "error");
        }
      });
    }
  }

  if (page === "login") {
    const loginForm = document.getElementById("login-form");
    const googleBtn = document.getElementById("google-login");

    if (loginForm) {
      loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const email = document.getElementById("login-email");
        const password = document.getElementById("login-password");
        const btn = loginForm.querySelector("button[type='submit']");

        if (!validateFields([email, password])) return;

        setLoading(btn, true);

        try {
          const cred = await signInWithEmailAndPassword(auth, email.value.trim(), password.value);
          if (!cred.user.emailVerified) {
            toast("Please verify your email address before signing in.", "warning");
            await sendEmailVerification(cred.user);
            setTimeout(() => { window.location.href = "verify.html"; }, 2000);
            await signOut(auth);
          } else {
            await updateLastSeen(cred.user.uid);
            toast("Access granted, redirecting...", "success");
            setTimeout(() => { window.location.href = "dashboard.html"; }, 1500);
          }
        } catch (err) {
          toast(firebaseError(err.code), "error");
          setLoading(btn, false);
        }
      });
    }

    if (googleBtn) {
      googleBtn.addEventListener("click", async () => {
        try {
          const res = await signInWithPopup(auth, googleProvider);
          const existing = await getUserDoc(res.user.uid);
          if (!existing) {
            await createUserDoc(res.user.uid, {
              email: res.user.email,
              displayName: res.user.displayName,
              phone: res.user.phoneNumber || ""
            });
            window.location.href = "welcome.html";
          } else {
            await updateLastSeen(res.user.uid);
            toast("Welcome back!", "success");
            window.location.href = "dashboard.html";
          }
        } catch (err) {
          toast(firebaseError(err.code), "error");
        }
      });
    }
  }

  if (page === "verify") {
    const emailEl = document.getElementById("user-verify-email");
    const resendBtn = document.getElementById("resend-btn");
    let cooldown = 0;

    onAuthStateChanged(auth, async (user) => {
      if (!user) {
        window.location.href = "login.html";
        return;
      }
      if (emailEl) emailEl.innerText = user.email;

      // Checking Loop Poll
      const interval = setInterval(async () => {
        await user.reload();
        if (user.emailVerified) {
          clearInterval(interval);
          toast("Email successfully verified!", "success");
          setTimeout(() => { window.location.href = "welcome.html"; }, 1500);
        }
      }, 4000);
    });

    if (resendBtn) {
      resendBtn.addEventListener("click", async () => {
        if (cooldown > 0) return;
        try {
          const user = auth.currentUser;
          if (user) {
            await sendEmailVerification(user);
            toast("Verification email re-sent successfully", "success");
            cooldown = 60;
            resendBtn.disabled = true;
            const timer = setInterval(() => {
              cooldown--;
              if (cooldown <= 0) {
                clearInterval(timer);
                resendBtn.innerText = "Resend Verification Link";
                resendBtn.disabled = false;
              } else {
                resendBtn.innerText = `Resend in ${cooldown}s...`;
              }
            }, 1000);
          }
        } catch (err) {
          toast("Failed to dispatch verification email.", "error");
        }
      });
    }
  }

  if (page === "welcome") {
    const titleEl = document.getElementById("welcome-title");
    const countEl = document.getElementById("welcome-countdown");
    const balEl = document.getElementById("welcome-bonus");
    const btn = document.getElementById("go-dash-btn");

    onAuthStateChanged(auth, async (user) => {
      if (!user) {
        window.location.href = "login.html";
        return;
      }
      if (titleEl) titleEl.innerText = `Welcome to BluePay, ${user.displayName || "Investor"}! 🎉`;
      
      // Animate Naira Bonus Counter
      if (balEl) {
        let current = 0;
        const target = WELCOME_BONUS;
        const increment = target / 50;
        const speed = 20;
        const countInterval = setInterval(() => {
          current += increment;
          if (current >= target) {
            current = target;
            clearInterval(countInterval);
          }
          balEl.innerText = "₦" + Math.floor(current).toLocaleString("en-NG");
        }, speed);
      }

      // Confetti Init
      initConfetti();

      // Countdown Timer Auto-redirect
      let left = 5;
      const redirectTimer = setInterval(() => {
        left--;
        if (countEl) countEl.innerText = `Redirecting in ${left}s...`;
        if (left <= 0) {
          clearInterval(redirectTimer);
          window.location.href = "dashboard.html";
        }
      }, 1000);

      if (btn) {
        btn.onclick = () => {
          clearInterval(redirectTimer);
          window.location.href = "dashboard.html";
        };
      }
    });
  }

  if (page === "forgot") {
    const fForm = document.getElementById("forgot-form");
    if (fForm) {
      fForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const email = document.getElementById("forgot-email");
        const btn = fForm.querySelector("button[type='submit']");
        
        if (!validateFields([email])) return;
        setLoading(btn, true);

        try {
          await sendPasswordResetEmail(auth, email.value.trim());
          toast("Password recovery instructions sent to your inbox", "success");
          fForm.innerHTML = `
            <div style="text-align: center; padding: 20px 0;">
              <i class="fa-solid fa-circle-check" style="color: var(--green); font-size: 54px; margin-bottom: 16px;"></i>
              <h3 style="margin-bottom: 10px;">Reset Link Dispatched</h3>
              <p style="color: var(--muted2); font-size: 14px; margin-bottom: 24px;">Check your mailbox for a password restoration link.</p>
              <a href="login.html" class="btn btn-primary" style="display: inline-block; text-decoration: none;">Return to Sign In</a>
            </div>
          `;
        } catch (err) {
          toast(firebaseError(err.code), "error");
          setLoading(btn, false);
        }
      });
    }
  }
});

// Canvas Confetti Particles
function initConfetti() {
  const canvas = document.createElement("canvas");
  canvas.style.cssText = "position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; pointer-events: none; z-index: 9999;";
  document.body.appendChild(canvas);
  const ctx = canvas.getContext("2d");

  let width = canvas.width = window.innerWidth;
  let height = canvas.height = window.innerHeight;

  window.addEventListener("resize", () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  const colors = ["#1a56db", "#3b82f6", "#60a5fa", "#d4af37", "#f0d878"];
  const particles = [];

  for (let i = 0; i < 120; i++) {
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height - height,
      r: Math.random() * 6 + 4,
      d: Math.random() * height,
      color: colors[Math.floor(Math.random() * colors.length)],
      tilt: Math.random() * 10 - 5,
      tiltAngleIncremental: Math.random() * 0.07 + 0.02,
      tiltAngle: 0
    });
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    particles.forEach((p, idx) => {
      p.tiltAngle += p.tiltAngleIncremental;
      p.y += (Math.cos(p.d) + 3 + p.r / 2) / 2;
      p.x += Math.sin(p.tiltAngle);
      p.tilt = Math.sin(p.tiltAngle - idx / 3) * 15;

      ctx.beginPath();
      ctx.lineWidth = p.r;
      ctx.strokeStyle = p.color;
      ctx.moveTo(p.x + p.tilt + p.r / 2, p.y);
      ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 2);
      ctx.stroke();
    });

    updateConfetti();
  }

  function updateConfetti() {
    let remaining = 0;
    particles.forEach(p => {
      if (p.y < height) remaining++;
    });
    if (remaining > 0) {
      requestAnimationFrame(draw);
    } else {
      canvas.remove();
    }
  }

  draw();
}
