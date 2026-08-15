const CONFIG = {
  // Update with deployed Google Apps Script Web App URL
  GOOGLE_SCRIPT_URL: "https://script.google.com/macros/s/AKfycbwBEAiq8jeLyoL5DkdXd9gby15pEyu-f47d4ufq6WPVVtpX_C1rYYZmwF2_Jkt_QREu/exec",

  ADMIN_USERNAME: "admin",
  ADMIN_PASSWORD: "admin123",

  LOCAL_STORAGE_KEY: "portfolio_responses",
  ADMIN_SESSION_KEY: "portfolio_admin_session",
};

function initTheme() {
  const root = document.documentElement;
  const toggleBtn = document.getElementById("themeToggle");
  const iconSun = document.getElementById("iconSun");
  const iconMoon = document.getElementById("iconMoon");

  if (!toggleBtn) return;

  const saved = localStorage.getItem("portfolio_theme");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const initial = saved || (prefersDark ? "dark" : "light");
  applyTheme(initial);

  toggleBtn.addEventListener("click", () => {
    const current = root.getAttribute("data-theme");
    const next = current === "dark" ? "light" : "dark";
    applyTheme(next);
    localStorage.setItem("portfolio_theme", next);
  });

  function applyTheme(theme) {
    root.setAttribute("data-theme", theme);
    toggleBtn.setAttribute("aria-pressed", String(theme === "dark"));
    if (iconSun) iconSun.hidden = theme !== "light";
    if (iconMoon) iconMoon.hidden = theme !== "dark";
  }
}

function initNav() {
  const hamburger = document.getElementById("hamburger");
  const nav = document.getElementById("primaryNav");
  if (!hamburger || !nav) return;

  hamburger.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("is-open");
    hamburger.setAttribute("aria-expanded", String(isOpen));
  });

  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      nav.classList.remove("is-open");
      hamburger.setAttribute("aria-expanded", "false");
    });
  });
}

function initTerminal() {
  const body = document.getElementById("terminalBody");
  if (!body) return;

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const lines = [
    { prompt: "$ ", text: "whoami" },
    { output: "Raj Kishore Lenka — Front-End Developer" },
    { prompt: "$ ", text: "cat skills.json" },
    { output: '["Prompt Engineering", "HTML", "CSS", "JavaScript", "React", "Git", "GitHub"]' },
    { prompt: "$ ", text: "echo $STATUS" },
    { output: "Open to interesting problems." },
  ];

  if (prefersReducedMotion) {
    body.textContent = lines.map((l) => (l.prompt ? l.prompt + l.text : l.output)).join("\n");
    return;
  }

  let lineIndex = 0;
  let charIndex = 0;
  let html = "";

  function typeNext() {
    if (lineIndex >= lines.length) {
      body.innerHTML = html + '<span class="cursor"></span>';
      return;
    }
    const line = lines[lineIndex];

    if (line.output) {
      html += `<span class="accent">${line.output}</span>\n\n`;
      body.innerHTML = html + '<span class="cursor"></span>';
      lineIndex++;
      charIndex = 0;
      setTimeout(typeNext, 260);
      return;
    }

    if (charIndex === 0) {
      html += `<span class="prompt">${line.prompt}</span>`;
    }

    if (charIndex < line.text.length) {
      html += line.text[charIndex];
      charIndex++;
      body.innerHTML = html + '<span class="cursor"></span>';
      setTimeout(typeNext, 38);
    } else {
      html += "\n";
      lineIndex++;
      charIndex = 0;
      setTimeout(typeNext, 320);
    }
  }

  typeNext();
}

function initContactForm() {
  const form = document.getElementById("contactForm");
  const status = document.getElementById("formStatus");
  const submitBtn = document.getElementById("contactSubmit");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const entry = {
      name: form.name.value.trim(),
      email: form.email.value.trim(),
      subject: form.subject.value.trim(),
      message: form.message.value.trim(),
      timestamp: new Date().toLocaleString(),
    };

    if (!entry.name || !entry.email || !entry.subject || !entry.message) {
      setStatus("Please fill in every field.", "error");
      return;
    }

    submitBtn.disabled = true;
    setStatus("Sending…", "pending");

    saveToLocalStorage(entry);
    const sentToSheet = await sendToGoogleSheet(entry);

    submitBtn.disabled = false;

    if (sentToSheet) {
      setStatus("Message sent — thanks for reaching out!", "ok");
    } else {
      setStatus("Saved locally (offline or script not configured yet). It'll show in the admin panel.", "ok");
    }

    form.reset();
  });

  function setStatus(text, state) {
    if (!status) return;
    status.textContent = text;
    status.dataset.state = state;
  }
}

function saveToLocalStorage(entry) {
  const existing = JSON.parse(localStorage.getItem(CONFIG.LOCAL_STORAGE_KEY) || "[]");
  existing.unshift(entry);
  localStorage.setItem(CONFIG.LOCAL_STORAGE_KEY, JSON.stringify(existing));
}

async function sendToGoogleSheet(entry) {
  if (!CONFIG.GOOGLE_SCRIPT_URL || CONFIG.GOOGLE_SCRIPT_URL.includes("PASTE_YOUR")) {
    return false;
  }
  try {
    await fetch(CONFIG.GOOGLE_SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(entry),
    });
    return true;
  } catch (err) {
    console.error("Google Sheet submission failed, falling back to localStorage:", err);
    return false;
  }
}

function initAdmin() {
  const loginForm = document.getElementById("adminLoginForm");
  const loginCard = document.getElementById("adminLoginCard");
  const panel = document.getElementById("adminPanel");
  const loginStatus = document.getElementById("adminLoginStatus");
  const logoutBtn = document.getElementById("adminLogout");
  const refreshBtn = document.getElementById("refreshResponses");
  const clearBtn = document.getElementById("clearResponses");

  if (!loginForm) return;

  if (sessionStorage.getItem(CONFIG.ADMIN_SESSION_KEY) === "true") {
    showPanel();
  }

  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const username = loginForm.username.value.trim();
    const password = loginForm.password.value;

    if (username === CONFIG.ADMIN_USERNAME && password === CONFIG.ADMIN_PASSWORD) {
      sessionStorage.setItem(CONFIG.ADMIN_SESSION_KEY, "true");
      if (loginStatus) loginStatus.textContent = "";
      loginForm.reset();
      showPanel();
    } else if (loginStatus) {
      loginStatus.textContent = "Incorrect username or password.";
      loginStatus.dataset.state = "error";
    }
  });

  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      sessionStorage.removeItem(CONFIG.ADMIN_SESSION_KEY);
      panel.classList.add("hidden");
      loginCard.classList.remove("hidden");
    });
  }

  if (refreshBtn) refreshBtn.addEventListener("click", () => renderResponses());
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      if (confirm("Clear all locally stored responses? This cannot be undone.")) {
        localStorage.removeItem(CONFIG.LOCAL_STORAGE_KEY);
        renderResponses();
      }
    });
  }

  function showPanel() {
    if (loginCard) loginCard.classList.add("hidden");
    if (panel) panel.classList.remove("hidden");
    renderResponses();
  }

  async function renderResponses() {
    const list = document.getElementById("responsesList");
    if (!list) return;

    list.innerHTML = '<p class="responses-empty">Loading…</p>';

    let responses = await fetchFromGoogleSheet();
    if (!responses) {
      responses = JSON.parse(localStorage.getItem(CONFIG.LOCAL_STORAGE_KEY) || "[]");
    }

    if (!responses.length) {
      list.innerHTML = '<p class="responses-empty">No responses yet — check back after someone submits the form.</p>';
      return;
    }

    list.innerHTML = responses
      .map(
        (r) => `
      <div class="response-card">
        <div class="response-card__row"><strong>Name</strong>${escapeHtml(r.name)}</div>
        <div class="response-card__row"><strong>Email</strong><a href="mailto:${escapeHtml(r.email)}">${escapeHtml(r.email)}</a></div>
        <div class="response-card__row"><strong>Subject</strong>${escapeHtml(r.subject)}</div>
        <div class="response-card__row"><strong>Message</strong>${escapeHtml(r.message)}</div>
        <div class="response-card__time">${escapeHtml(r.timestamp)}</div>
      </div>`
      )
      .join("");
  }

  async function fetchFromGoogleSheet() {
    if (!CONFIG.GOOGLE_SCRIPT_URL || CONFIG.GOOGLE_SCRIPT_URL.includes("PASTE_YOUR")) {
      return null;
    }
    try {
      const res = await fetch(CONFIG.GOOGLE_SCRIPT_URL, { method: "GET" });
      if (!res.ok) throw new Error("Bad response from Apps Script");
      const data = await res.json();
      return Array.isArray(data) ? data : null;
    } catch (err) {
      console.error("Could not fetch responses from Google Sheet, using local data:", err);
      return null;
    }
  }
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}

document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  initNav();
  initTerminal();
  initContactForm();
  initAdmin();
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
});
