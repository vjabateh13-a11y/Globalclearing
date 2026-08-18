/* ==========================================================================
   GLOBAL CLEARING AND FORWARDING FIRM (GCFF)
   script.js — Site interactivity, forms, EmailJS + WhatsApp integration
   Vanilla JS, no dependencies (EmailJS SDK is loaded separately in HTML)
   ========================================================================= */

/* ==========================================================================
   0. CONFIGURATION
   ========================================================================== */

/**
 * EmailJS configuration.
 * Replace the placeholder values below with real EmailJS credentials.
 * The destination inbox (gforwardingfirm26@gmail.com) is configured
 * inside the EmailJS email TEMPLATE itself, not here in the code.
 */
const EMAILJS_CONFIG = {
  publicKey: "VqgpHyCH2hFTdW8OK",
  serviceId: "service_9t6njhc",
  templateId: "template_x1ihp2k"
};

/** Breakpoint (px) above which the mobile nav should never remain open. */
const DESKTOP_BREAKPOINT = 1024;

/** Header scroll threshold before adding `.scrolled`. */
const HEADER_SCROLL_THRESHOLD = 60;

/** Scroll distance before showing the back-to-top button. */
const BACK_TO_TOP_THRESHOLD = 500;

/** Cached reduced-motion preference. */
const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
).matches;

/* ==========================================================================
   1. INITIALIZATION
   ========================================================================== */
document.addEventListener("DOMContentLoaded", () => {
  initCurrentYear();
  initStickyHeader();
  initMobileMenu();
  initSmoothNavigation();
  initActiveNavigation();
  initScrollReveal();
  initCounters();
  initBackToTop();
  initLogoMarquee();
  initEmailJS();
  initQuoteForm();
  initServiceCtaPreselect();
  initGeneralWhatsAppLinks();
  initExternalLinkSafety();
  initLazyImages();
  initCardPointerInteraction();
});

/* ==========================================================================
   2. UTILITIES
   ========================================================================== */

/** Safe querySelector that never throws on a null root. */
function qs(selector, root = document) {
  return root ? root.querySelector(selector) : null;
}

function qsa(selector, root = document) {
  return root ? Array.from(root.querySelectorAll(selector)) : [];
}

/** Lightweight rAF-based throttle for scroll/resize handlers. */
function throttleRAF(callback) {
  let ticking = false;
  return (...args) => {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(() => {
      callback(...args);
      ticking = false;
    });
  };
}

/** Basic debounce for resize handling. */
function debounce(callback, wait = 150) {
  let timeoutId;
  return (...args) => {
    window.clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => callback(...args), wait);
  };
}

/* ==========================================================================
   3. CURRENT YEAR
   ========================================================================== */
function initCurrentYear() {
  const yearEl = document.getElementById("currentYear");
  if (!yearEl) return;
  yearEl.textContent = String(new Date().getFullYear());
}

/* ==========================================================================
   4. STICKY HEADER
   ========================================================================== */
function initStickyHeader() {
  const header = document.getElementById("siteHeader");
  if (!header) return;

  const applyHeaderState = () => {
    if (window.scrollY > HEADER_SCROLL_THRESHOLD) {
      header.classList.add("scrolled");
    } else {
      header.classList.remove("scrolled");
    }
  };

  applyHeaderState();
  window.addEventListener("scroll", throttleRAF(applyHeaderState), { passive: true });
}

/* ==========================================================================
   5. MOBILE HAMBURGER MENU
   ========================================================================== */
function initMobileMenu() {
  const menuToggle = document.getElementById("menuToggle");
  const mobileNav = document.getElementById("mobileNav");
  const mobileNavOverlay = document.getElementById("mobileNavOverlay");
  const mobileNavClose = document.getElementById("mobileNavClose");

  if (!menuToggle || !mobileNav) return;

  const mobileNavLinks = qsa(".mobile-nav__link", mobileNav);

  const openMenu = () => {
    mobileNav.hidden = false;
    if (mobileNavOverlay) mobileNavOverlay.hidden = false;

    // Force reflow so the transition applies after removing [hidden].
    void mobileNav.offsetWidth;

    mobileNav.classList.add("active");
    if (mobileNavOverlay) mobileNavOverlay.classList.add("active");
    menuToggle.classList.add("active");
    menuToggle.setAttribute("aria-expanded", "true");
    document.body.classList.add("menu-open");
  };

  const closeMenu = ({ restoreFocus = false } = {}) => {
    mobileNav.classList.remove("active");
    if (mobileNavOverlay) mobileNavOverlay.classList.remove("active");
    menuToggle.classList.remove("active");
    menuToggle.setAttribute("aria-expanded", "false");
    document.body.classList.remove("menu-open");

    // Wait for the CSS transition before hiding from the accessibility tree.
    const cleanup = () => {
      mobileNav.hidden = true;
      if (mobileNavOverlay) mobileNavOverlay.hidden = true;
    };

    if (prefersReducedMotion) {
      cleanup();
    } else {
      window.setTimeout(cleanup, 350);
    }

    if (restoreFocus) menuToggle.focus();
  };

  const isMenuOpen = () => menuToggle.classList.contains("active");

  menuToggle.addEventListener("click", () => {
    if (isMenuOpen()) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  if (mobileNavClose) {
    mobileNavClose.addEventListener("click", () => closeMenu({ restoreFocus: true }));
  }

  if (mobileNavOverlay) {
    mobileNavOverlay.addEventListener("click", () => closeMenu());
  }

  mobileNavLinks.forEach((link) => {
    link.addEventListener("click", () => closeMenu());
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && isMenuOpen()) {
      closeMenu({ restoreFocus: true });
    }
  });

  window.addEventListener(
    "resize",
    debounce(() => {
      if (window.innerWidth > DESKTOP_BREAKPOINT && isMenuOpen()) {
        closeMenu();
      }
    }, 150)
  );
}

/* ==========================================================================
   6. SMOOTH INTERNAL NAVIGATION
   ========================================================================== */
function initSmoothNavigation() {
  const header = document.getElementById("siteHeader");
  const utilityBar = document.getElementById("utilityBar");

  const getScrollOffset = () => {
    const headerHeight = header ? header.getBoundingClientRect().height : 0;
    const utilityHeight =
      utilityBar && window.getComputedStyle(utilityBar).display !== "none"
        ? utilityBar.getBoundingClientRect().height
        : 0;
    return headerHeight + utilityHeight + 12;
  };

  const anchorLinks = qsa('a[href^="#"]').filter((link) => {
    const href = link.getAttribute("href");
    return href && href.length > 1;
  });

  anchorLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      const href = link.getAttribute("href");
      const targetId = href.slice(1);
      const target = document.getElementById(targetId);
      if (!target) return;

      event.preventDefault();

      const targetTop =
        target.getBoundingClientRect().top + window.scrollY - getScrollOffset();

      window.scrollTo({
        top: Math.max(targetTop, 0),
        behavior: prefersReducedMotion ? "auto" : "smooth"
      });

      // Update the URL hash without an extra jump.
      if (history.pushState) {
        history.pushState(null, "", href);
      }
    });
  });
}

/* ==========================================================================
   7. ACTIVE NAVIGATION HIGHLIGHTING
   ========================================================================== */
function initActiveNavigation() {
  const pageName =
    window.location.pathname.split("/").pop().toLowerCase() || "index.html";
  const navLinks = qsa(".main-nav__link, .mobile-nav__link");

  navLinks.forEach((link) => {
    const href = link.getAttribute("href") || "";
    const targetPage = href.split(/[?#]/)[0].toLowerCase() || "index.html";
    const isCurrentPage = targetPage === pageName;

    link.classList.toggle("is-active", isCurrentPage);
    if (isCurrentPage) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });

  const quoteLinks = qsa(
    '.btn-nav-quote, .mobile-nav__footer a[href^="quote.html"]'
  );
  const isQuotePage = pageName === "quote.html";

  quoteLinks.forEach((link) => {
    link.classList.toggle("is-active", isQuotePage);
    if (isQuotePage) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });
}

/* ==========================================================================
   8. SCROLL REVEAL ANIMATIONS
   ========================================================================== */
function initScrollReveal() {
  const revealSelectors = ".reveal, .fade-up, .fade-left, .fade-right";
  const revealEls = qsa(revealSelectors);
  if (!revealEls.length) return;

  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    revealEls.forEach((el) => el.classList.add("active"));
    return;
  }

  // Apply short, staggered delays to siblings within the same grid/parent.
  const delayGroups = new Map();
  revealEls.forEach((el) => {
    const parent = el.parentElement;
    if (!parent) return;
    const count = delayGroups.get(parent) || 0;
    if (count < 6) {
      el.style.transitionDelay = `${count * 70}ms`;
    }
    delayGroups.set(parent, count + 1);
  });

  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("active");
          obs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
  );

  revealEls.forEach((el) => observer.observe(el));
}

/* ==========================================================================
   9. NUMERIC COUNTERS
   ========================================================================== */
function initCounters() {
  const counterEls = qsa("[data-counter]");
  if (!counterEls.length) return;

  const animateCounter = (el) => {
    const target = parseFloat(el.getAttribute("data-target"));
    if (Number.isNaN(target)) return;

    const suffixEl = el.querySelector(".stat-item__suffix");
    const suffixText = suffixEl ? suffixEl.textContent : "";
    const prefixText = el.getAttribute("data-prefix") || "";

    if (prefersReducedMotion) {
      el.textContent = `${prefixText}${target}`;
      if (suffixText) {
        const span = document.createElement("span");
        span.className = "stat-item__suffix";
        span.textContent = suffixText;
        el.appendChild(span);
      }
      return;
    }

    const duration = 1200;
    const startTime = performance.now();

    const step = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      const currentValue = Math.round(target * eased);

      el.textContent = `${prefixText}${currentValue}`;
      if (suffixText) {
        const span = document.createElement("span");
        span.className = "stat-item__suffix";
        span.textContent = suffixText;
        el.appendChild(span);
      }

      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };

    window.requestAnimationFrame(step);
  };

  if (!("IntersectionObserver" in window)) {
    counterEls.forEach(animateCounter);
    return;
  }

  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          obs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.5 }
  );

  counterEls.forEach((el) => observer.observe(el));
}

/* ==========================================================================
   10. BACK TO TOP
   ========================================================================== */
function initBackToTop() {
  const backToTopBtn = document.getElementById("backToTop");
  if (!backToTopBtn) return;

  const toggleVisibility = () => {
    backToTopBtn.classList.toggle("visible", window.scrollY > BACK_TO_TOP_THRESHOLD);
    backToTopBtn.hidden = false; // rely on CSS opacity/visibility once shown once
  };

  toggleVisibility();
  window.addEventListener("scroll", throttleRAF(toggleVisibility), { passive: true });

  backToTopBtn.addEventListener("click", () => {
    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion ? "auto" : "smooth"
    });
  });
}

/* ==========================================================================
   11. LOGO MARQUEE (Trusted Relationships)
   ========================================================================== */
function initLogoMarquee() {
  const track = qs(".logo-strip__track");
  if (!track) return;

  if (prefersReducedMotion) {
    track.style.animation = "none";
    return;
  }

  // The HTML already duplicates the logo set once for a seamless loop.
  // No further DOM duplication is necessary; CSS handles the animation.
}

/* ==========================================================================
   12. EMAILJS SETUP
   ========================================================================== */
function isEmailJSConfigured() {
  return (
    EMAILJS_CONFIG.publicKey !== "YOUR_EMAILJS_PUBLIC_KEY" &&
    EMAILJS_CONFIG.serviceId !== "YOUR_EMAILJS_SERVICE_ID" &&
    EMAILJS_CONFIG.templateId !== "YOUR_EMAILJS_TEMPLATE_ID" &&
    Boolean(EMAILJS_CONFIG.publicKey) &&
    Boolean(EMAILJS_CONFIG.serviceId) &&
    Boolean(EMAILJS_CONFIG.templateId)
  );
}

function initEmailJS() {
  if (typeof emailjs === "undefined") {
    console.warn("EmailJS SDK not found. Quote form will fall back to WhatsApp only.");
    return;
  }

  if (!isEmailJSConfigured()) {
    console.info(
      "EmailJS is not yet configured. Replace the placeholders in EMAILJS_CONFIG to enable email delivery."
    );
    return;
  }

  try {
    emailjs.init({ publicKey: EMAILJS_CONFIG.publicKey });
  } catch (error) {
    console.error("EmailJS failed to initialize:", error);
  }
}

/* ==========================================================================
   13. QUOTE FORM — VALIDATION HELPERS
   ========================================================================== */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[+()\s\-0-9]{7,20}$/;

function showFieldError(field, message) {
  if (!field) return;
  const group = field.closest(".form-group");
  if (group) group.classList.add("is-invalid");
  field.setAttribute("aria-invalid", "true");

  let errorEl = group ? group.querySelector(".field-error") : null;
  if (group && !errorEl) {
    errorEl = document.createElement("small");
    errorEl.className = "field-error";
    errorEl.setAttribute("role", "alert");
    group.appendChild(errorEl);
  }
  if (errorEl) errorEl.textContent = message;
}

function clearFieldError(field) {
  if (!field) return;
  const group = field.closest(".form-group");
  if (group) group.classList.remove("is-invalid");
  field.removeAttribute("aria-invalid");

  const errorEl = group ? group.querySelector(".field-error") : null;
  if (errorEl) errorEl.textContent = "";
}

/**
 * Validates the quote form.
 * Returns { isValid, firstInvalidField }.
 */
/**
 * Honeypot check: the "website" field is hidden from real visitors via CSS
 * and skipped in tab order. If it has a value, the submission almost
 * certainly came from an automated bot filling every field it can find.
 */
function isHoneypotTripped(form) {
  const honeypot = qs("#website", form);
  return Boolean(honeypot && honeypot.value.trim().length > 0);
}

function validateQuoteForm(form) {
  let isValid = true;
  let firstInvalidField = null;

  const fullName = qs("#fullName", form);
  const email = qs("#email", form);
  const phone = qs("#phone", form);
  const serviceRequired = qs("#serviceRequired", form);

  const fieldsToCheck = [fullName, email, phone, serviceRequired];
  fieldsToCheck.forEach((field) => clearFieldError(field));

  if (!fullName || !fullName.value.trim() || fullName.value.trim().length < 2) {
    showFieldError(fullName, "Please enter your full name.");
    isValid = false;
    firstInvalidField = firstInvalidField || fullName;
  }

  if (!email || !EMAIL_REGEX.test(email.value.trim())) {
    showFieldError(email, "Please enter a valid email address.");
    isValid = false;
    firstInvalidField = firstInvalidField || email;
  }

  if (!phone || !PHONE_REGEX.test(phone.value.trim())) {
    showFieldError(phone, "Please enter a valid phone or WhatsApp number.");
    isValid = false;
    firstInvalidField = firstInvalidField || phone;
  }

  if (!serviceRequired || !serviceRequired.value) {
    showFieldError(serviceRequired, "Please select the service you need.");
    isValid = false;
    firstInvalidField = firstInvalidField || serviceRequired;
  }

  return { isValid, firstInvalidField };
}

/** Attaches live-clearing of error state as the user corrects a field. */
function attachLiveValidationClearing(form) {
  const fields = qsa("input, select, textarea", form);
  fields.forEach((field) => {
    const eventName = field.tagName === "SELECT" ? "change" : "input";
    field.addEventListener(eventName, () => clearFieldError(field));
  });
}

/* ==========================================================================
   14. QUOTE FORM — VALUE READING HELPERS
   ========================================================================== */
function getFieldValue(form, selector) {
  const field = qs(selector, form);
  if (!field) return "";
  return field.value.trim();
}

function valueOrFallback(value, fallback = "Not provided") {
  return value && value.length ? value : fallback;
}

function readQuoteFormValues(form) {
  return {
    fullName: getFieldValue(form, "#fullName"),
    companyName: getFieldValue(form, "#companyName"),
    email: getFieldValue(form, "#email"),
    phone: getFieldValue(form, "#phone"),
    serviceRequired: getFieldValue(form, "#serviceRequired"),
    shipmentType: getFieldValue(form, "#shipmentType"),
    cargoType: getFieldValue(form, "#cargoType"),
    origin: getFieldValue(form, "#origin"),
    destination: getFieldValue(form, "#destination"),
    weightVolume: getFieldValue(form, "#weightVolume"),
    preferredContact: getFieldValue(form, "#preferredContact"),
    shipmentDate: getFieldValue(form, "#shipmentDate"),
    additionalDetails: getFieldValue(form, "#additionalDetails")
  };
}

/* ==========================================================================
   15. QUOTE FORM — SUBMIT BUTTON STATE
   ========================================================================== */
function setButtonLoading(button, isLoading, loadingText = "Sending Request...") {
  if (!button) return;

  if (isLoading) {
    if (!button.dataset.originalText) {
      button.dataset.originalText = button.textContent;
    }
    button.disabled = true;
    button.setAttribute("aria-busy", "true");
    button.textContent = loadingText;
  } else {
    button.disabled = false;
    button.removeAttribute("aria-busy");
    if (button.dataset.originalText) {
      button.textContent = button.dataset.originalText;
    }
  }
}

/* ==========================================================================
   16. QUOTE FORM — STATUS MESSAGING
   ========================================================================== */
function setFormStatus(statusEl, message, type) {
  if (!statusEl) return;
  statusEl.textContent = message;
  statusEl.classList.remove("success", "error");
  if (type) statusEl.classList.add(type);
  statusEl.setAttribute("role", "status");
}

/* ==========================================================================
   17. QUOTE FORM — EMAILJS SUBMISSION
   ========================================================================== */
function buildEmailMessage(values) {
  return [
    "NEW GCFF QUOTE REQUEST",
    "",
    "Customer:",
    valueOrFallback(values.fullName),
    "",
    "Company:",
    valueOrFallback(values.companyName),
    "",
    "Email:",
    valueOrFallback(values.email),
    "",
    "Phone / WhatsApp:",
    valueOrFallback(values.phone),
    "",
    "Service:",
    valueOrFallback(values.serviceRequired),
    "",
    "Shipment Type:",
    valueOrFallback(values.shipmentType),
    "",
    "Cargo:",
    valueOrFallback(values.cargoType),
    "",
    "Origin:",
    valueOrFallback(values.origin),
    "",
    "Destination:",
    valueOrFallback(values.destination),
    "",
    "Weight / Volume:",
    valueOrFallback(values.weightVolume),
    "",
    "Preferred Contact:",
    valueOrFallback(values.preferredContact),
    "",
    "Expected Shipment Date:",
    valueOrFallback(values.shipmentDate),
    "",
    "Additional Details:",
    valueOrFallback(values.additionalDetails, "None provided")
  ].join("\n");
}

function buildTemplateParams(values) {
  return {
    from_name: valueOrFallback(values.fullName),
    company: valueOrFallback(values.companyName),
    email: valueOrFallback(values.email),
    reply_to: values.email || "",
    phone: valueOrFallback(values.phone),
    service: valueOrFallback(values.serviceRequired),
    shipment_type: valueOrFallback(values.shipmentType),
    cargo_type: valueOrFallback(values.cargoType),
    origin: valueOrFallback(values.origin),
    destination: valueOrFallback(values.destination),
    cargo_size: valueOrFallback(values.weightVolume),
    preferred_contact: valueOrFallback(values.preferredContact),
    shipment_date: valueOrFallback(values.shipmentDate),
    message: buildEmailMessage(values),
    submitted_at: new Date().toLocaleString()
  };
}

async function sendQuoteViaEmailJS(values) {
  if (typeof emailjs === "undefined" || !isEmailJSConfigured()) {
    return { sent: false, reason: "not_configured" };
  }

  const templateParams = buildTemplateParams(values);

  try {/* ==========================================================================
   GLOBAL CLEARING AND FORWARDING FIRM (GCFF)
   script.js — Site interactivity, forms, EmailJS + WhatsApp integration
   Vanilla JS, no dependencies (EmailJS SDK is loaded separately in HTML)
   ========================================================================== */

/* ==========================================================================
   0. CONFIGURATION
   ========================================================================== */

/**
 * EmailJS configuration.
 * Replace the placeholder values below with real EmailJS credentials.
 * The destination inbox (gforwardingfirm26@gmail.com) is configured
 * inside the EmailJS email TEMPLATE itself, not here in the code.
 */
const EMAILJS_CONFIG = {
  publicKey: "VqgpHyCH2hFTdW8OK",
  serviceId: "service_9t6njhc",
  templateId: "template_x1ihp2k"
};

/** Breakpoint (px) above which the mobile nav should never remain open. */
const DESKTOP_BREAKPOINT = 1024;

/** Header scroll threshold before adding `.scrolled`. */
const HEADER_SCROLL_THRESHOLD = 60;

/** Scroll distance before showing the back-to-top button. */
const BACK_TO_TOP_THRESHOLD = 500;

/** Cached reduced-motion preference. */
const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
).matches;

/* ==========================================================================
   1. INITIALIZATION
   ========================================================================== */
document.addEventListener("DOMContentLoaded", () => {
  initCurrentYear();
  initStickyHeader();
  initMobileMenu();
  initSmoothNavigation();
  initActiveNavigation();
  initScrollReveal();
  initCounters();
  initBackToTop();
  initLogoMarquee();
  initEmailJS();
  initQuoteForm();
  initServiceCtaPreselect();
  initGeneralWhatsAppLinks();
  initExternalLinkSafety();
  initLazyImages();
  initCardPointerInteraction();
});

/* ==========================================================================
   2. UTILITIES
   ========================================================================== */

/** Safe querySelector that never throws on a null root. */
function qs(selector, root = document) {
  return root ? root.querySelector(selector) : null;
}

function qsa(selector, root = document) {
  return root ? Array.from(root.querySelectorAll(selector)) : [];
}

/** Lightweight rAF-based throttle for scroll/resize handlers. */
function throttleRAF(callback) {
  let ticking = false;
  return (...args) => {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(() => {
      callback(...args);
      ticking = false;
    });
  };
}

/** Basic debounce for resize handling. */
function debounce(callback, wait = 150) {
  let timeoutId;
  return (...args) => {
    window.clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => callback(...args), wait);
  };
}

/* ==========================================================================
   3. CURRENT YEAR
   ========================================================================== */
function initCurrentYear() {
  const yearEl = document.getElementById("currentYear");
  if (!yearEl) return;
  yearEl.textContent = String(new Date().getFullYear());
}

/* ==========================================================================
   4. STICKY HEADER
   ========================================================================== */
function initStickyHeader() {
  const header = document.getElementById("siteHeader");
  if (!header) return;

  const applyHeaderState = () => {
    if (window.scrollY > HEADER_SCROLL_THRESHOLD) {
      header.classList.add("scrolled");
    } else {
      header.classList.remove("scrolled");
    }
  };

  applyHeaderState();
  window.addEventListener("scroll", throttleRAF(applyHeaderState), { passive: true });
}

/* ==========================================================================
   5. MOBILE HAMBURGER MENU
   ========================================================================== */
function initMobileMenu() {
  const menuToggle = document.getElementById("menuToggle");
  const mobileNav = document.getElementById("mobileNav");
  const mobileNavOverlay = document.getElementById("mobileNavOverlay");
  const mobileNavClose = document.getElementById("mobileNavClose");

  if (!menuToggle || !mobileNav) return;

  const mobileNavLinks = qsa(".mobile-nav__link", mobileNav);

  const openMenu = () => {
    mobileNav.hidden = false;
    if (mobileNavOverlay) mobileNavOverlay.hidden = false;

    // Force reflow so the transition applies after removing [hidden].
    void mobileNav.offsetWidth;

    mobileNav.classList.add("active");
    if (mobileNavOverlay) mobileNavOverlay.classList.add("active");
    menuToggle.classList.add("active");
    menuToggle.setAttribute("aria-expanded", "true");
    document.body.classList.add("menu-open");
  };

  const closeMenu = ({ restoreFocus = false } = {}) => {
    mobileNav.classList.remove("active");
    if (mobileNavOverlay) mobileNavOverlay.classList.remove("active");
    menuToggle.classList.remove("active");
    menuToggle.setAttribute("aria-expanded", "false");
    document.body.classList.remove("menu-open");

    // Wait for the CSS transition before hiding from the accessibility tree.
    const cleanup = () => {
      mobileNav.hidden = true;
      if (mobileNavOverlay) mobileNavOverlay.hidden = true;
    };

    if (prefersReducedMotion) {
      cleanup();
    } else {
      window.setTimeout(cleanup, 350);
    }

    if (restoreFocus) menuToggle.focus();
  };

  const isMenuOpen = () => menuToggle.classList.contains("active");

  menuToggle.addEventListener("click", () => {
    if (isMenuOpen()) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  if (mobileNavClose) {
    mobileNavClose.addEventListener("click", () => closeMenu({ restoreFocus: true }));
  }

  if (mobileNavOverlay) {
    mobileNavOverlay.addEventListener("click", () => closeMenu());
  }

  mobileNavLinks.forEach((link) => {
    link.addEventListener("click", () => closeMenu());
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && isMenuOpen()) {
      closeMenu({ restoreFocus: true });
    }
  });

  window.addEventListener(
    "resize",
    debounce(() => {
      if (window.innerWidth > DESKTOP_BREAKPOINT && isMenuOpen()) {
        closeMenu();
      }
    }, 150)
  );
}

/* ==========================================================================
   6. SMOOTH INTERNAL NAVIGATION
   ========================================================================== */
function initSmoothNavigation() {
  const header = document.getElementById("siteHeader");
  const utilityBar = document.getElementById("utilityBar");

  const getScrollOffset = () => {
    const headerHeight = header ? header.getBoundingClientRect().height : 0;
    const utilityHeight =
      utilityBar && window.getComputedStyle(utilityBar).display !== "none"
        ? utilityBar.getBoundingClientRect().height
        : 0;
    return headerHeight + utilityHeight + 12;
  };

  const anchorLinks = qsa('a[href^="#"]').filter((link) => {
    const href = link.getAttribute("href");
    return href && href.length > 1;
  });

  anchorLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      const href = link.getAttribute("href");
      const targetId = href.slice(1);
      const target = document.getElementById(targetId);
      if (!target) return;

      event.preventDefault();

      const targetTop =
        target.getBoundingClientRect().top + window.scrollY - getScrollOffset();

      window.scrollTo({
        top: Math.max(targetTop, 0),
        behavior: prefersReducedMotion ? "auto" : "smooth"
      });

      // Update the URL hash without an extra jump.
      if (history.pushState) {
        history.pushState(null, "", href);
      }
    });
  });
}

/* ==========================================================================
   7. ACTIVE NAVIGATION HIGHLIGHTING
   ========================================================================== */
function initActiveNavigation() {
  const pageName =
    window.location.pathname.split("/").pop().toLowerCase() || "index.html";
  const navLinks = qsa(".main-nav__link, .mobile-nav__link");

  navLinks.forEach((link) => {
    const href = link.getAttribute("href") || "";
    const targetPage = href.split(/[?#]/)[0].toLowerCase() || "index.html";
    const isCurrentPage = targetPage === pageName;

    link.classList.toggle("is-active", isCurrentPage);
    if (isCurrentPage) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });

  const quoteLinks = qsa(
    '.btn-nav-quote, .mobile-nav__footer a[href^="quote.html"]'
  );
  const isQuotePage = pageName === "quote.html";

  quoteLinks.forEach((link) => {
    link.classList.toggle("is-active", isQuotePage);
    if (isQuotePage) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });
}

/* ==========================================================================
   8. SCROLL REVEAL ANIMATIONS
   ========================================================================== */
function initScrollReveal() {
  const revealSelectors = ".reveal, .fade-up, .fade-left, .fade-right";
  const revealEls = qsa(revealSelectors);
  if (!revealEls.length) return;

  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    revealEls.forEach((el) => el.classList.add("active"));
    return;
  }

  // Apply short, staggered delays to siblings within the same grid/parent.
  const delayGroups = new Map();
  revealEls.forEach((el) => {
    const parent = el.parentElement;
    if (!parent) return;
    const count = delayGroups.get(parent) || 0;
    if (count < 6) {
      el.style.transitionDelay = `${count * 70}ms`;
    }
    delayGroups.set(parent, count + 1);
  });

  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("active");
          obs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
  );

  revealEls.forEach((el) => observer.observe(el));
}

/* ==========================================================================
   9. NUMERIC COUNTERS
   ========================================================================== */
function initCounters() {
  const counterEls = qsa("[data-counter]");
  if (!counterEls.length) return;

  const animateCounter = (el) => {
    const target = parseFloat(el.getAttribute("data-target"));
    if (Number.isNaN(target)) return;

    const suffixEl = el.querySelector(".stat-item__suffix");
    const suffixText = suffixEl ? suffixEl.textContent : "";
    const prefixText = el.getAttribute("data-prefix") || "";

    if (prefersReducedMotion) {
      el.textContent = `${prefixText}${target}`;
      if (suffixText) {
        const span = document.createElement("span");
        span.className = "stat-item__suffix";
        span.textContent = suffixText;
        el.appendChild(span);
      }
      return;
    }

    const duration = 1200;
    const startTime = performance.now();

    const step = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      const currentValue = Math.round(target * eased);

      el.textContent = `${prefixText}${currentValue}`;
      if (suffixText) {
        const span = document.createElement("span");
        span.className = "stat-item__suffix";
        span.textContent = suffixText;
        el.appendChild(span);
      }

      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };

    window.requestAnimationFrame(step);
  };

  if (!("IntersectionObserver" in window)) {
    counterEls.forEach(animateCounter);
    return;
  }

  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          obs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.5 }
  );

  counterEls.forEach((el) => observer.observe(el));
}

/* ==========================================================================
   10. BACK TO TOP
   ========================================================================== */
function initBackToTop() {
  const backToTopBtn = document.getElementById("backToTop");
  if (!backToTopBtn) return;

  const toggleVisibility = () => {
    backToTopBtn.classList.toggle("visible", window.scrollY > BACK_TO_TOP_THRESHOLD);
    backToTopBtn.hidden = false; // rely on CSS opacity/visibility once shown once
  };

  toggleVisibility();
  window.addEventListener("scroll", throttleRAF(toggleVisibility), { passive: true });

  backToTopBtn.addEventListener("click", () => {
    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion ? "auto" : "smooth"
    });
  });
}

/* ==========================================================================
   11. LOGO MARQUEE (Trusted Relationships)
   ========================================================================== */
function initLogoMarquee() {
  const track = qs(".logo-strip__track");
  if (!track) return;

  if (prefersReducedMotion) {
    track.style.animation = "none";
    return;
  }

  // The HTML already duplicates the logo set once for a seamless loop.
  // No further DOM duplication is necessary; CSS handles the animation.
}

/* ==========================================================================
   12. EMAILJS SETUP
   ========================================================================== */
function isEmailJSConfigured() {
  return (
    EMAILJS_CONFIG.publicKey !== "YOUR_EMAILJS_PUBLIC_KEY" &&
    EMAILJS_CONFIG.serviceId !== "YOUR_EMAILJS_SERVICE_ID" &&
    EMAILJS_CONFIG.templateId !== "YOUR_EMAILJS_TEMPLATE_ID" &&
    Boolean(EMAILJS_CONFIG.publicKey) &&
    Boolean(EMAILJS_CONFIG.serviceId) &&
    Boolean(EMAILJS_CONFIG.templateId)
  );
}

function initEmailJS() {
  if (typeof emailjs === "undefined") {
    console.warn("EmailJS SDK not found. Quote form will fall back to WhatsApp only.");
    return;
  }

  if (!isEmailJSConfigured()) {
    console.info(
      "EmailJS is not yet configured. Replace the placeholders in EMAILJS_CONFIG to enable email delivery."
    );
    return;
  }

  try {
    emailjs.init({ publicKey: EMAILJS_CONFIG.publicKey });
  } catch (error) {
    console.error("EmailJS failed to initialize:", error);
  }
}

/* ==========================================================================
   13. QUOTE FORM — VALIDATION HELPERS
   ========================================================================== */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[+()\s\-0-9]{7,20}$/;

function showFieldError(field, message) {
  if (!field) return;
  const group = field.closest(".form-group");
  if (group) group.classList.add("is-invalid");
  field.setAttribute("aria-invalid", "true");

  let errorEl = group ? group.querySelector(".field-error") : null;
  if (group && !errorEl) {
    errorEl = document.createElement("small");
    errorEl.className = "field-error";
    errorEl.setAttribute("role", "alert");
    group.appendChild(errorEl);
  }
  if (errorEl) errorEl.textContent = message;
}

function clearFieldError(field) {
  if (!field) return;
  const group = field.closest(".form-group");
  if (group) group.classList.remove("is-invalid");
  field.removeAttribute("aria-invalid");

  const errorEl = group ? group.querySelector(".field-error") : null;
  if (errorEl) errorEl.textContent = "";
}

/**
 * Validates the quote form.
 * Returns { isValid, firstInvalidField }.
 */
/**
 * Honeypot check: the "website" field is hidden from real visitors via CSS
 * and skipped in tab order. If it has a value, the submission almost
 * certainly came from an automated bot filling every field it can find.
 */
function isHoneypotTripped(form) {
  const honeypot = qs("#website", form);
  return Boolean(honeypot && honeypot.value.trim().length > 0);
}

function validateQuoteForm(form) {
  let isValid = true;
  let firstInvalidField = null;

  const fullName = qs("#fullName", form);
  const email = qs("#email", form);
  const phone = qs("#phone", form);
  const serviceRequired = qs("#serviceRequired", form);

  const fieldsToCheck = [fullName, email, phone, serviceRequired];
  fieldsToCheck.forEach((field) => clearFieldError(field));

  if (!fullName || !fullName.value.trim() || fullName.value.trim().length < 2) {
    showFieldError(fullName, "Please enter your full name.");
    isValid = false;
    firstInvalidField = firstInvalidField || fullName;
  }

  if (!email || !EMAIL_REGEX.test(email.value.trim())) {
    showFieldError(email, "Please enter a valid email address.");
    isValid = false;
    firstInvalidField = firstInvalidField || email;
  }

  if (!phone || !PHONE_REGEX.test(phone.value.trim())) {
    showFieldError(phone, "Please enter a valid phone or WhatsApp number.");
    isValid = false;
    firstInvalidField = firstInvalidField || phone;
  }

  if (!serviceRequired || !serviceRequired.value) {
    showFieldError(serviceRequired, "Please select the service you need.");
    isValid = false;
    firstInvalidField = firstInvalidField || serviceRequired;
  }

  return { isValid, firstInvalidField };
}

/** Attaches live-clearing of error state as the user corrects a field. */
function attachLiveValidationClearing(form) {
  const fields = qsa("input, select, textarea", form);
  fields.forEach((field) => {
    const eventName = field.tagName === "SELECT" ? "change" : "input";
    field.addEventListener(eventName, () => clearFieldError(field));
  });
}

/* ==========================================================================
   14. QUOTE FORM — VALUE READING HELPERS
   ========================================================================== */
function getFieldValue(form, selector) {
  const field = qs(selector, form);
  if (!field) return "";
  return field.value.trim();
}

function valueOrFallback(value, fallback = "Not provided") {
  return value && value.length ? value : fallback;
}

function readQuoteFormValues(form) {
  return {
    fullName: getFieldValue(form, "#fullName"),
    companyName: getFieldValue(form, "#companyName"),
    email: getFieldValue(form, "#email"),
    phone: getFieldValue(form, "#phone"),
    serviceRequired: getFieldValue(form, "#serviceRequired"),
    shipmentType: getFieldValue(form, "#shipmentType"),
    cargoType: getFieldValue(form, "#cargoType"),
    origin: getFieldValue(form, "#origin"),
    destination: getFieldValue(form, "#destination"),
    weightVolume: getFieldValue(form, "#weightVolume"),
    preferredContact: getFieldValue(form, "#preferredContact"),
    shipmentDate: getFieldValue(form, "#shipmentDate"),
    additionalDetails: getFieldValue(form, "#additionalDetails")
  };
}

/* ==========================================================================
   15. QUOTE FORM — SUBMIT BUTTON STATE
   ========================================================================== */
function setButtonLoading(button, isLoading, loadingText = "Sending Request...") {
  if (!button) return;

  if (isLoading) {
    if (!button.dataset.originalText) {
      button.dataset.originalText = button.textContent;
    }
    button.disabled = true;
    button.setAttribute("aria-busy", "true");
    button.textContent = loadingText;
  } else {
    button.disabled = false;
    button.removeAttribute("aria-busy");
    if (button.dataset.originalText) {
      button.textContent = button.dataset.originalText;
    }
  }
}

/* ==========================================================================
   16. QUOTE FORM — STATUS MESSAGING
   ========================================================================== */
function setFormStatus(statusEl, message, type) {
  if (!statusEl) return;
  statusEl.textContent = message;
  statusEl.classList.remove("success", "error");
  if (type) statusEl.classList.add(type);
  statusEl.setAttribute("role", "status");
}

/* ==========================================================================
   17. QUOTE FORM — EMAILJS SUBMISSION
   ========================================================================== */
function buildEmailMessage(values) {
  return [
    "NEW GCFF QUOTE REQUEST",
    "",
    "Customer:",
    valueOrFallback(values.fullName),
    "",
    "Company:",
    valueOrFallback(values.companyName),
    "",
    "Email:",
    valueOrFallback(values.email),
    "",
    "Phone / WhatsApp:",
    valueOrFallback(values.phone),
    "",
    "Service:",
    valueOrFallback(values.serviceRequired),
    "",
    "Shipment Type:",
    valueOrFallback(values.shipmentType),
    "",
    "Cargo:",
    valueOrFallback(values.cargoType),
    "",
    "Origin:",
    valueOrFallback(values.origin),
    "",
    "Destination:",
    valueOrFallback(values.destination),
    "",
    "Weight / Volume:",
    valueOrFallback(values.weightVolume),
    "",
    "Preferred Contact:",
    valueOrFallback(values.preferredContact),
    "",
    "Expected Shipment Date:",
    valueOrFallback(values.shipmentDate),
    "",
    "Additional Details:",
    valueOrFallback(values.additionalDetails, "None provided")
  ].join("\n");
}

function buildTemplateParams(values) {
  return {
    from_name: valueOrFallback(values.fullName),
    company: valueOrFallback(values.companyName),
    email: valueOrFallback(values.email),
    reply_to: values.email || "",
    phone: valueOrFallback(values.phone),
    service: valueOrFallback(values.serviceRequired),
    shipment_type: valueOrFallback(values.shipmentType),
    cargo_type: valueOrFallback(values.cargoType),
    origin: valueOrFallback(values.origin),
    destination: valueOrFallback(values.destination),
    cargo_size: valueOrFallback(values.weightVolume),
    preferred_contact: valueOrFallback(values.preferredContact),
    shipment_date: valueOrFallback(values.shipmentDate),
    message: buildEmailMessage(values),
    submitted_at: new Date().toLocaleString()
  };
}

async function sendQuoteViaEmailJS(values) {
  if (typeof emailjs === "undefined" || !isEmailJSConfigured()) {
    return { sent: false, reason: "not_configured" };
  }

  const templateParams = buildTemplateParams(values);

  try {
    await emailjs.send(
      EMAILJS_CONFIG.serviceId,
      EMAILJS_CONFIG.templateId,
      templateParams
    );
    return { sent: true };
  } catch (error) {
    console.error("EmailJS send failed:", error);
    return { sent: false, reason: "send_error" };
  }
}

/* ==========================================================================
   18. QUOTE FORM — INIT
   ========================================================================== */
function initQuoteForm() {
  const form = document.getElementById("quoteForm");
  if (!form) return;

  const submitBtn = document.getElementById("quoteSubmitBtn");
  const statusEl = document.getElementById("formStatus");

  // Basic repeated-submission protection: once a request has gone out,
  // enforce a short cooldown before another can be sent.
  let isSubmitting = false;
  let lastSubmittedAt = 0;
  const RESUBMIT_COOLDOWN_MS = 15000;

  attachLiveValidationClearing(form);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (isSubmitting) return;

    // Silently ignore bot submissions caught by the honeypot field —
    // no error is shown, so automated scripts get no useful feedback.
    if (isHoneypotTripped(form)) {
      console.warn("Quote form submission blocked by honeypot check.");
      return;
    }

    const now = Date.now();
    if (lastSubmittedAt && now - lastSubmittedAt < RESUBMIT_COOLDOWN_MS) {
      setFormStatus(
        statusEl,
        "Your request has already been sent. Please wait a moment before submitting again.",
        null
      );
      return;
    }

    const { isValid, firstInvalidField } = validateQuoteForm(form);

    if (!isValid) {
      if (firstInvalidField) firstInvalidField.focus();
      setFormStatus(
        statusEl,
        "Please correct the highlighted fields and try again.",
        "error"
      );
      return;
    }

    isSubmitting = true;
    setButtonLoading(submitBtn, true, "Sending Request...");
    setFormStatus(statusEl, "Sending your request…", null);

    const values = readQuoteFormValues(form);

    try {
      const result = await sendQuoteViaEmailJS(values);

      if (result.sent) {
        lastSubmittedAt = Date.now();
        setFormStatus(
          statusEl,
          "Thank you. Your request has been sent successfully. A member of the GCFF team will contact you shortly.",
          "success"
        );
        form.reset();
        qsa("input, select, textarea", form).forEach((field) => clearFieldError(field));
      } else {
        setFormStatus(
          statusEl,
          "We couldn't send your request at this time. Please check your connection and try again.",
          "error"
        );
      }
    } catch (error) {
      console.error("Unexpected error sending quote request:", error);
      setFormStatus(
        statusEl,
        "We couldn't send your request at this time. Please check your connection and try again.",
        "error"
      );
    } finally {
      isSubmitting = false;
      setButtonLoading(submitBtn, false);
    }
  });
}

/* ==========================================================================
   19. SERVICE-SPECIFIC CTA → QUOTE FORM PRE-SELECT
   ========================================================================== */
/**
 * Any CTA marked with data-service="<value>" scrolls to the quote form
 * (via its existing #quote anchor behavior) and automatically selects the
 * matching option in the "Service Required" dropdown, so a visitor who
 * clicked a specific service card doesn't have to re-select it manually.
 */
function initServiceCtaPreselect() {
  const serviceCtas = qsa("[data-service]");
  const serviceSelect = document.getElementById("serviceRequired");

  serviceCtas.forEach((cta) => {
    const desiredValue = cta.getAttribute("data-service");
    if (!desiredValue) return;

    if (cta.tagName === "A") {
      const destination = new URL(
        cta.getAttribute("href") || "quote.html",
        window.location.href
      );
      destination.searchParams.set("service", desiredValue);
      cta.setAttribute(
        "href",
        destination.pathname.split("/").pop() +
          destination.search +
          destination.hash
      );
    }

    if (serviceSelect) {
      cta.addEventListener("click", () => {
        const optionExists = qsa("option", serviceSelect).some(
          (option) => option.value === desiredValue
        );
        if (!optionExists) return;

        serviceSelect.value = desiredValue;
        clearFieldError(serviceSelect);
      });
    }
  });

  if (!serviceSelect) return;

  const requestedService = new URLSearchParams(window.location.search).get(
    "service"
  );
  if (!requestedService) return;

  const optionExists = qsa("option", serviceSelect).some(
    (option) => option.value === requestedService
  );
  if (!optionExists) return;

  serviceSelect.value = requestedService;
  clearFieldError(serviceSelect);
}

/* ==========================================================================
   20. GENERAL WHATSAPP LINKS
   ========================================================================== */
function initGeneralWhatsAppLinks() {
  const whatsappLinks = qsa('a[href*="wa.me"]');

  whatsappLinks.forEach((link) => {
    // Respect any href the HTML already provides — only ensure safe target behavior.
    if (link.target === "_blank") {
      const relValues = new Set((link.getAttribute("rel") || "").split(" ").filter(Boolean));
      relValues.add("noopener");
      relValues.add("noreferrer");
      link.setAttribute("rel", Array.from(relValues).join(" "));
    }
  });
}

/* ==========================================================================
   21. EXTERNAL LINK SAFETY
   ========================================================================== */
function initExternalLinkSafety() {
  const externalLinks = qsa('a[target="_blank"]');

  externalLinks.forEach((link) => {
    const relValues = new Set((link.getAttribute("rel") || "").split(" ").filter(Boolean));
    relValues.add("noopener");
    relValues.add("noreferrer");
    link.setAttribute("rel", Array.from(relValues).join(" "));
  });
}

/* ==========================================================================
   22. LAZY IMAGE LOADING (below-the-fold only)
   ========================================================================== */
function initLazyImages() {
  const allImages = qsa("main img");

  allImages.forEach((img) => {
    // Skip the hero image so the first paint is not delayed.
    if (img.closest(".hero")) return;
    if (!img.hasAttribute("loading")) {
      img.setAttribute("loading", "lazy");
    }
    if (!img.hasAttribute("decoding")) {
      img.setAttribute("decoding", "async");
    }
  });
}

/* ==========================================================================
   23. SUBTLE CARD POINTER INTERACTION (desktop pointer devices only)
   ========================================================================== */
function initCardPointerInteraction() {
  const supportsFinePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (!supportsFinePointer || prefersReducedMotion) return;

  const interactiveCards = qsa(
    ".service-card, .industry-card, .value-card, .why-card, .philosophy-card"
  );
  if (!interactiveCards.length) return;

  interactiveCards.forEach((card) => {
    card.addEventListener("pointermove", (event) => {
      const rect = card.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 100;
      const y = ((event.clientY - rect.top) / rect.height) * 100;
      card.style.setProperty("--pointer-x", `${x}%`);
      card.style.setProperty("--pointer-y", `${y}%`);
    });

    card.addEventListener("pointerleave", () => {
      card.style.removeProperty("--pointer-x");
      card.style.removeProperty("--pointer-y");
    });
  });
}
