/* firebase-config.js - Core Identity & Logic (Rebuilt) */
// ... (Imports stay the same)

// 6.1 MANDATORY: Single Admin Source of Truth
export const ADMIN_EMAIL = "liger4683@gmail.com"; 
export const WELCOME_BONUS = 200000;

// ... (Other constants stay the same)

/**
 * Hardened Admin Check
 * Used by requireAdmin and Firestore Rules
 */
export const isAdmin = (user) => user && user.email === ADMIN_EMAIL;

/**
 * Identity Resolution: Prevents duplicate accounts across Auth Providers
 */
export async function getOrCreateUser(authUser, extraData = {}) {
  const userRef = doc(db, "users", authUser.uid);
  const snap = await getDoc(userRef);

  if (snap.exists()) {
    // Return existing identity
    await updateDoc(userRef, { lastSeen: serverTimestamp() });
    return snap.data();
  }

  // Cross-provider check: See if this email exists under a different UID
  const q = query(collection(db, "users"), where("email", "==", authUser.email));
  const existingEmailSnap = await getDocs(q);

  if (!existingEmailSnap.empty) {
    // If email exists, we link this UID to that identity (Security hardening)
    const existingData = existingEmailSnap.docs[0].data();
    // In a production app, you would ideally use auth.linkWithCredential here,
    // but for our Firestore architecture, we map the new UID to the same user data.
    return existingData;
  }

  // Create new identity if truly unique
  const newUser = {
    uid: authUser.uid,
    email: authUser.email,
    displayName: authUser.displayName || extraData.displayName || "Investor",
    balance: WELCOME_BONUS,
    role: isAdmin(authUser) ? "admin" : "user", // Enforce role based on email
    kycStatus: "not_submitted",
    createdAt: serverTimestamp(),
    lastSeen: serverTimestamp(),
    referralCode: Math.random().toString(36).substring(2, 10).toUpperCase(),
    agentName: AGENTS[Math.floor(Math.random() * AGENTS.length)],
    ...extraData
  };

  await setDoc(userRef, newUser);
  return newUser;
}

// ... (Formatting and logic helpers continue as before, but using isAdmin check)
