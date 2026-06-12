/* ============================================================
   Aevrium Biosystems — interaction layer
   Vanilla JS, no dependencies. Reduced-motion aware.
   ============================================================ */
(function () {
  "use strict";

  var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------- Year ---------- */
  var yearEl = $("#year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ---------- Mobile nav ---------- */
  var navToggle = $(".nav-toggle");
  var nav = $("#primary-navigation");
  if (navToggle && nav) {
    navToggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", String(open));
    });
    nav.addEventListener("click", function (e) {
      if (e.target.tagName === "A") {
        nav.classList.remove("is-open");
        navToggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* ---------- Smooth scroll for in-page links (respects reduced-motion) ---------- */
  $$('a[href^="#"]').forEach(function (link) {
    link.addEventListener("click", function (e) {
      var id = link.getAttribute("href");
      if (id.length < 2) return;
      var target = document.getElementById(id.slice(1));
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: prefersReduced ? "auto" : "smooth", block: "start" });
      history.replaceState(null, "", id);
    });
  });

  /* ---------- Scroll progress bar ---------- */
  var bar = $("#scrollProgress");
  if (bar) {
    var updateBar = function () {
      var h = document.documentElement;
      var max = h.scrollHeight - h.clientHeight;
      var pct = max > 0 ? (h.scrollTop / max) * 100 : 0;
      bar.style.width = pct.toFixed(2) + "%";
    };
    document.addEventListener("scroll", updateBar, { passive: true });
    updateBar();
  }

  /* ---------- Scrollspy (active nav link) ---------- */
  var navLinks = $$('#primary-navigation a[href^="#"]');
  var sections = navLinks
    .map(function (a) { return document.getElementById(a.getAttribute("href").slice(1)); })
    .filter(Boolean);

  if ("IntersectionObserver" in window && sections.length) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var id = en.target.id;
        navLinks.forEach(function (a) {
          a.classList.toggle("is-active", a.getAttribute("href") === "#" + id);
        });
      });
    }, { rootMargin: "-45% 0px -50% 0px", threshold: 0 });
    sections.forEach(function (s) { spy.observe(s); });
  }

  /* ---------- Reveal on scroll ---------- */
  var reveals = $$(".reveal");
  if (prefersReduced || !("IntersectionObserver" in window)) {
    reveals.forEach(function (el) { el.classList.add("is-in"); });
  } else {
    var revObs = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add("is-in");
          obs.unobserve(en.target);
        }
      });
    }, { rootMargin: "0px 0px -10% 0px", threshold: 0.08 });
    reveals.forEach(function (el) { revObs.observe(el); });
  }

  /* ---------- Animated counters ---------- */
  var counters = $$("[data-count]");
  var runCounter = function (el) {
    var target = parseFloat(el.getAttribute("data-count"));
    if (isNaN(target)) return;
    var dur = 1400, start = null;
    var fmt = function (n) { return Math.round(n).toLocaleString("en-US"); };
    var tick = function (ts) {
      if (start === null) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3); // ease-out cubic
      el.textContent = fmt(target * eased);
      if (p < 1) requestAnimationFrame(tick);
      else el.textContent = fmt(target);
    };
    requestAnimationFrame(tick);
  };
  if (counters.length) {
    if (prefersReduced || !("IntersectionObserver" in window)) {
      counters.forEach(function (el) { el.textContent = parseFloat(el.getAttribute("data-count")).toLocaleString("en-US"); });
    } else {
      var cObs = new IntersectionObserver(function (entries, obs) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { runCounter(en.target); obs.unobserve(en.target); }
        });
      }, { threshold: 0.6 });
      counters.forEach(function (el) { cObs.observe(el); });
    }
  }

  /* ---------- Contact form ---------- */
  var form = $("#deckForm");
  if (!form) return;

  var statusEl = $("#formStatus");
  var submitBtn = $("#submitBtn");
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  var setError = function (name, msg) {
    var field = form.querySelector('[name="' + name + '"]');
    var errEl = form.querySelector('[data-error-for="' + name + '"]');
    if (field) field.setAttribute("aria-invalid", msg ? "true" : "false");
    if (errEl) errEl.textContent = msg || "";
  };

  var validate = function () {
    var ok = true;
    var name = form.name.value.trim();
    var email = form.email.value.trim();

    if (!name) { setError("name", "Please enter your name."); ok = false; } else setError("name", "");
    if (!email) { setError("email", "Please enter your email."); ok = false; }
    else if (!EMAIL_RE.test(email)) { setError("email", "Please enter a valid email address."); ok = false; }
    else setError("email", "");

    if (!form.consent.checked) {
      statusEl.className = "form-status err";
      statusEl.textContent = "Please confirm consent to be contacted.";
      ok = false;
    }
    return ok;
  };

  // validate on blur (not keystroke)
  ["name", "email"].forEach(function (n) {
    var f = form.querySelector('[name="' + n + '"]');
    if (f) f.addEventListener("blur", function () {
      if (n === "name" && !f.value.trim()) setError("name", "Please enter your name.");
      else if (n === "email" && f.value.trim() && !EMAIL_RE.test(f.value.trim())) setError("email", "Please enter a valid email address.");
      else setError(n, "");
    });
  });

  var mailtoFallback = function (data) {
    var subject = "Aevrium Biosystems — Investor Deck Request";
    var body =
      "Name: " + data.name + "\n" +
      "Firm: " + (data.firm || "—") + "\n" +
      "Email: " + data.email + "\n\n" +
      (data.message || "");
    window.location.href =
      "mailto:contact@aevrium.com?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
  };

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    // honeypot: silently succeed for bots
    if (form.company_url && form.company_url.value) {
      statusEl.className = "form-status ok";
      statusEl.textContent = "Thank you — we'll be in touch.";
      form.reset();
      return;
    }

    statusEl.className = "form-status";
    statusEl.textContent = "";
    if (!validate()) {
      var firstInvalid = form.querySelector('[aria-invalid="true"]');
      if (firstInvalid) firstInvalid.focus();
      return;
    }

    var data = {
      name: form.name.value.trim(),
      firm: form.firm.value.trim(),
      email: form.email.value.trim(),
      message: form.message.value.trim()
    };

    submitBtn.disabled = true;
    submitBtn.textContent = "Sending…";
    statusEl.className = "form-status";
    statusEl.textContent = "Submitting your request…";

    fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    })
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json().catch(function () { return {}; });
      })
      .then(function () {
        statusEl.className = "form-status ok";
        statusEl.textContent = "Thank you — your request was received. We'll be in touch shortly.";
        form.reset();
      })
      .catch(function () {
        // API not available (e.g. local static preview) → graceful mailto fallback
        statusEl.className = "form-status";
        statusEl.textContent = "Opening your email client to complete the request…";
        mailtoFallback(data);
      })
      .finally(function () {
        submitBtn.disabled = false;
        submitBtn.textContent = "Request investor deck";
      });
  });
})();
