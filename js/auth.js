/* CampusBloom demo authentication.
  No backend is used; local accounts and planner data stay in this browser.
   This is for a college demo, not production-grade authentication. */
(() => {
  "use strict";
  const ACCOUNTS_KEY = "deadlineRadar_accounts";
  const SESSION_KEY = "deadlineRadar_activeUser";
  const Auth = (window.DRAuth = window.DRAuth || {});
  Auth.currentUser = null;
  function readAccounts() {
    try {
      const value = JSON.parse(localStorage.getItem(ACCOUNTS_KEY) || "[]");
      return Array.isArray(value)
        ? value.filter(
            (user) => user && user.id && user.email && user.passwordHash,
          )
        : [];
    } catch (error) {
      console.warn("Could not read local demo accounts.", error);
      return [];
    }
  }
  function saveAccounts(accounts) {
    try {
      localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
      return true;
    } catch (error) {
      console.error("Could not save local demo accounts.", error);
      return false;
    }
  }
  function publicUser(user) {
    if (!user) return null;
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
    };
  }
  function userFromSession() {
    const id = localStorage.getItem(SESSION_KEY);
    if (!id) return null;
    const found = readAccounts().find((user) => user.id === id);
    if (!found) localStorage.removeItem(SESSION_KEY);
    return publicUser(found);
  }
  function randomSalt() {
    try {
      const bytes = new Uint8Array(16);
      window.crypto.getRandomValues(bytes);
      return Array.from(bytes, (byte) =>
        byte.toString(16).padStart(2, "0"),
      ).join("");
    } catch (_) {
      return `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
    }
  }
  // Pure JavaScript SHA-256 keeps sign-in hashes consistent when opened via file:// or Live Server.
  // This is suitable for a local demo only; production password storage belongs on a server.
  function sha256Hex(text) {
    const constants = [
      0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1,
      0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
      0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786,
      0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
      0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147,
      0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
      0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b,
      0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
      0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a,
      0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
      0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
    ];
    const state = [
      0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c,
      0x1f83d9ab, 0x5be0cd19,
    ];
    const bytes = new TextEncoder().encode(text);
    const bitLength = bytes.length * 8;
    const paddedLength = Math.ceil((bytes.length + 9) / 64) * 64;
    const padded = new Uint8Array(paddedLength);
    padded.set(bytes);
    padded[bytes.length] = 0x80;
    const view = new DataView(padded.buffer);
    view.setUint32(
      paddedLength - 8,
      Math.floor(bitLength / 0x100000000),
      false,
    );
    view.setUint32(paddedLength - 4, bitLength >>> 0, false);
    const rotateRight = (value, amount) =>
      (value >>> amount) | (value << (32 - amount));
    for (let offset = 0; offset < paddedLength; offset += 64) {
      const words = new Uint32Array(64);
      for (let i = 0; i < 16; i++)
        words[i] = view.getUint32(offset + i * 4, false);
      for (let i = 16; i < 64; i++) {
        const x = words[i - 15],
          y = words[i - 2];
        const s0 = rotateRight(x, 7) ^ rotateRight(x, 18) ^ (x >>> 3);
        const s1 = rotateRight(y, 17) ^ rotateRight(y, 19) ^ (y >>> 10);
        words[i] = (words[i - 16] + s0 + words[i - 7] + s1) >>> 0;
      }
      let [a, b, c, d, e, f, g, h] = state;
      for (let i = 0; i < 64; i++) {
        const sum1 =
          rotateRight(e, 6) ^ rotateRight(e, 11) ^ rotateRight(e, 25);
        const choose = (e & f) ^ (~e & g);
        const temp1 = (h + sum1 + choose + constants[i] + words[i]) >>> 0;
        const sum0 =
          rotateRight(a, 2) ^ rotateRight(a, 13) ^ rotateRight(a, 22);
        const majority = (a & b) ^ (a & c) ^ (b & c);
        const temp2 = (sum0 + majority) >>> 0;
        h = g;
        g = f;
        f = e;
        e = (d + temp1) >>> 0;
        d = c;
        c = b;
        b = a;
        a = (temp1 + temp2) >>> 0;
      }
      const working = [a, b, c, d, e, f, g, h];
      for (let i = 0; i < 8; i++) state[i] = (state[i] + working[i]) >>> 0;
    }
    return state.map((value) => value.toString(16).padStart(8, "0")).join("");
  }
  async function digestPassword(password, salt) {
    return sha256Hex(`${salt}:${password}`);
  }
  function setError(id, message) {
    const element = document.getElementById(id);
    if (element) element.textContent = message || "";
  }
  function showPanel(panelName) {
    const isRegister = panelName === "register";
    document.getElementById("loginPanel").hidden = isRegister;
    document.getElementById("registerPanel").hidden = !isRegister;
    document.getElementById("loginTab").classList.toggle("active", !isRegister);
    document
      .getElementById("registerTab")
      .classList.toggle("active", isRegister);
    document
      .getElementById("loginTab")
      .setAttribute("aria-selected", String(!isRegister));
    document
      .getElementById("registerTab")
      .setAttribute("aria-selected", String(isRegister));
    document.getElementById("authTitle").textContent = isRegister
      ? "Create your account."
      : "Good to see you again.";
    setError("loginError", "");
    setError("registerError", "");
  }
  Auth.showAuth = function (panelName = "login") {
    // Keep the sign-in screen neutral; each user's theme is reapplied after login.
    document.body.dataset.theme = "light";
    const authScreen = document.getElementById("authScreen");
    const appShell = document.getElementById("appShell");
    if (authScreen) authScreen.hidden = false;
    if (appShell) appShell.hidden = true;
    showPanel(panelName);
    if (panelName === "register")
      document.getElementById("registerName")?.focus();
    else document.getElementById("loginEmail")?.focus();
  };
  Auth.showApp = function () {
    const authScreen = document.getElementById("authScreen");
    const appShell = document.getElementById("appShell");
    if (authScreen) authScreen.hidden = true;
    if (appShell) appShell.hidden = false;
  };
  Auth.logout = function () {
    if (window.DR?.stopFocusTimerForLogout) window.DR.stopFocusTimerForLogout();
    Auth.currentUser = null;
    localStorage.removeItem(SESSION_KEY);
    const loginForm = document.getElementById("loginForm");
    const registerForm = document.getElementById("registerForm");
    loginForm?.reset();
    registerForm?.reset();
    document.querySelectorAll("[data-password-toggle]").forEach((button) => {
      const input = document.getElementById(button.dataset.passwordToggle);
      if (input) input.type = "password";
      button.textContent = "Show";
    });
    Auth.showAuth("login");
  };
  function signIn(user) {
    Auth.currentUser = publicUser(user);
    localStorage.setItem(SESSION_KEY, user.id);
    Auth.showApp();
    if (window.DR?.init) window.DR.init();
  }
  async function handleLogin(event) {
    event.preventDefault();
    setError("loginError", "");
    const email = document
      .getElementById("loginEmail")
      .value.trim()
      .toLowerCase();
    const password = document.getElementById("loginPassword").value;
    if (!email || !password) {
      setError("loginError", "Enter your email address and password.");
      return;
    }
    const user = readAccounts().find(
      (entry) => entry.email.toLowerCase() === email,
    );
    if (!user) {
      setError(
        "loginError",
        "No account found for that email. Create an account first.",
      );
      return;
    }
    try {
      const digest = await digestPassword(password, user.salt);
      if (digest !== user.passwordHash) {
        setError("loginError", "That password does not match this account.");
        return;
      }
      signIn(user);
    } catch (error) {
      console.error(error);
      setError(
        "loginError",
        "Could not check the password in this browser. Try opening the project with VS Code Live Server.",
      );
    }
  }
  async function handleRegister(event) {
    event.preventDefault();
    setError("registerError", "");
    const name = document
      .getElementById("registerName")
      .value.trim()
      .replace(/\s+/g, " ");
    const email = document
      .getElementById("registerEmail")
      .value.trim()
      .toLowerCase();
    const password = document.getElementById("registerPassword").value;
    const confirmPassword = document.getElementById(
      "registerConfirmPassword",
    ).value;
    if (name.length < 2) {
      setError("registerError", "Enter your name (at least 2 characters).");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("registerError", "Enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      setError("registerError", "Use a password with at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("registerError", "The passwords do not match.");
      return;
    }
    const accounts = readAccounts();
    if (accounts.some((user) => user.email.toLowerCase() === email)) {
      setError(
        "registerError",
        "An account with this email already exists. Please log in.",
      );
      return;
    }
    const salt = randomSalt();
    try {
      const passwordHash = await digestPassword(password, salt);
      const user = {
        id: `u-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`,
        name,
        email,
        salt,
        passwordHash,
        createdAt: new Date().toISOString(),
      };
      if (!saveAccounts([...accounts, user])) {
        setError(
          "registerError",
          "Could not save the account. Check your browser storage settings.",
        );
        return;
      }
      signIn(user);
    } catch (error) {
      console.error(error);
      setError(
        "registerError",
        "Could not create the account in this browser. Try VS Code Live Server.",
      );
    }
  }
  function init() {
    Auth.currentUser = userFromSession();
    document
      .getElementById("loginTab")
      .addEventListener("click", () => showPanel("login"));
    document
      .getElementById("registerTab")
      .addEventListener("click", () => showPanel("register"));
    document
      .getElementById("showRegisterLink")
      .addEventListener("click", () => showPanel("register"));
    document
      .getElementById("showLoginLink")
      .addEventListener("click", () => showPanel("login"));
    document
      .getElementById("loginForm")
      .addEventListener("submit", handleLogin);
    document
      .getElementById("registerForm")
      .addEventListener("submit", handleRegister);
    document.querySelectorAll("[data-password-toggle]").forEach((button) =>
      button.addEventListener("click", () => {
        const input = document.getElementById(button.dataset.passwordToggle);
        const show = input.type === "password";
        input.type = show ? "text" : "password";
        button.textContent = show ? "Hide" : "Show";
      }),
    );
    if (Auth.currentUser) Auth.showApp();
    else Auth.showAuth();
  }
  document.addEventListener("DOMContentLoaded", init);
})();
