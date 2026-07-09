/* ============================================================
   NoEggPlant — site interactivity
   ------------------------------------------------------------
   Plain vanilla JavaScript. No frameworks, no build step.
   Two parts:
     1) A tiny helper that makes the design's "style-hover" and
        "style-focus" attributes work (the design tool used these
        instead of CSS :hover / :focus rules).
     2) The page behaviour: autoplay videos, sticky nav, scroll
        reveals, the impact calculator, the solution carousel,
        the contact form, and the nav scroll-spy.
   Every block below is guarded so it does nothing if the element
   it needs isn't on the current page — that lets both index.html
   and methodology.html share this one file safely.
   ============================================================ */

(function () {
  "use strict";

  /* ---------- 1. Hover / focus style helper ----------
     Elements carry extra styles in "style-hover" / "style-focus"
     attributes. We apply them on hover/focus and remove them
     after. We snapshot the element's current inline style each
     time so it still works if other code changed the element. */
  function wireStateStyles() {
    document.querySelectorAll("[style-hover]").forEach(function (el) {
      var extra = el.getAttribute("style-hover");
      var base = "";
      el.addEventListener("mouseenter", function () {
        base = el.getAttribute("style") || "";
        el.style.cssText = base + ";" + extra;
      });
      el.addEventListener("mouseleave", function () {
        el.style.cssText = base;
      });
    });

    document.querySelectorAll("[style-focus]").forEach(function (el) {
      var extra = el.getAttribute("style-focus");
      var base = "";
      el.addEventListener("focus", function () {
        base = el.getAttribute("style") || "";
        el.style.cssText = base + ";" + extra;
      });
      el.addEventListener("blur", function () {
        el.style.cssText = base;
      });
    });
  }

  /* ---------- 2. Page behaviour ---------- */
  function init() {
    wireStateStyles();

    // Custom "bean" cursor: on load it sits on the dot after "Scramble",
    // then slow-drags after the mouse. Only on real-mouse (fine pointer)
    // devices and only on the page that has the Scramble dot.
    (function beanCursor() {
      if (!window.matchMedia || !window.matchMedia("(pointer: fine)").matches) return;
      var dotEl = document.getElementById("scrambleDot");
      if (!dotEl) return;

      var HALF = 20; // cursor image is 40x40 with its hotspot in the centre
      var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      var EASE = reduce ? 1 : 0.35; // lower = slower/draggier, higher = snappier
      var moved = false;
      var target = { x: 0, y: 0 }, pos = { x: 0, y: 0 };

      var bean = document.createElement("img");
      bean.src = "assets/cursor-bean.png";
      bean.alt = "";
      bean.setAttribute("aria-hidden", "true");
      bean.style.cssText = "position:fixed;left:0;top:0;width:40px;height:40px;z-index:2147483000;pointer-events:none;will-change:transform;transition:opacity .2s ease";
      document.body.appendChild(bean);

      // Hide the native cursor so only the bean shows (kept behind this class
      // so the native cursor stays if the script never runs).
      var hide = document.createElement("style");
      hide.textContent = "html.bean-cursor, html.bean-cursor *{cursor:none !important}";
      document.head.appendChild(hide);
      document.documentElement.classList.add("bean-cursor");

      // Position of the dot (period) after "Scramble". A period sits low in
      // its line box, so bias downward to land on the visible glyph.
      var dotCenter = function () {
        var r = dotEl.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height * 0.75 };
      };
      var start = dotCenter();
      target.x = pos.x = start.x;
      target.y = pos.y = start.y;

      window.addEventListener("mousemove", function (e) { target.x = e.clientX; target.y = e.clientY; moved = true; }, { passive: true });
      document.addEventListener("mouseleave", function () { bean.style.opacity = "0"; });
      document.addEventListener("mouseenter", function () { bean.style.opacity = "1"; });

      (function loop() {
        if (!moved) {
          // Before the first real mouse move, stay glued to the dot
          // (re-read each frame so it survives the web font loading in).
          var d = dotCenter();
          pos.x = target.x = d.x;
          pos.y = target.y = d.y;
        } else {
          pos.x += (target.x - pos.x) * EASE;
          pos.y += (target.y - pos.y) * EASE;
        }
        bean.style.transform = "translate(" + (pos.x - HALF) + "px," + (pos.y - HALF) + "px)";
        requestAnimationFrame(loop);
      })();
    })();

    // Keep background videos playing and looping (some browsers pause them).
    var kick = function () {
      document.querySelectorAll("video").forEach(function (v) {
        v.muted = true; v.defaultMuted = true; v.loop = true; v.playsInline = true;
        if (v.ended || (v.duration && v.currentTime >= v.duration - 0.1)) {
          try { v.currentTime = 0; } catch (e) {}
        }
        if (v.paused) { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
      });
    };
    kick();
    setInterval(kick, 2000);

    // Sticky nav: turns solid aubergine once you scroll past the top.
    var nav = document.getElementById("nmnav");
    var setNav = function (solid) {
      if (!nav) return;
      nav.style.background = solid ? "rgba(25,4,31,.92)" : "transparent";
      nav.style.backdropFilter = solid ? "blur(8px)" : "none";
      nav.style.webkitBackdropFilter = solid ? "blur(8px)" : "none";
      nav.style.boxShadow = solid ? "0 6px 24px rgba(20,4,24,.35)" : "none";
      nav.style.borderBottomColor = solid ? "rgba(241,252,122,.16)" : "transparent";
    };
    var sentinel = document.getElementById("nmsentinel");
    if (sentinel && "IntersectionObserver" in window) {
      new IntersectionObserver(function (ents) {
        setNav(!ents[0].isIntersecting);
      }, { threshold: 0 }).observe(sentinel);
    }

    // Mobile hamburger menu: toggle the dropdown, animate the icon to an X,
    // and close it after a link is tapped or when tapping outside.
    var navToggle = document.getElementById("navToggle");
    var mobileMenu = document.getElementById("mobileMenu");
    if (navToggle && mobileMenu) {
      var bars = navToggle.querySelectorAll("span");
      var menuOpen = false;
      var setMenu = function (open) {
        menuOpen = open;
        mobileMenu.style.display = open ? "block" : "none";
        navToggle.setAttribute("aria-expanded", open ? "true" : "false");
        navToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
        if (bars.length === 3) {
          bars[0].style.transform = open ? "translateY(7px) rotate(45deg)" : "none";
          bars[1].style.opacity = open ? "0" : "1";
          bars[2].style.transform = open ? "translateY(-7px) rotate(-45deg)" : "none";
        }
      };
      navToggle.addEventListener("click", function (e) { e.stopPropagation(); setMenu(!menuOpen); });
      mobileMenu.querySelectorAll("a").forEach(function (a) {
        a.addEventListener("click", function () { setMenu(false); });
      });
      document.addEventListener("click", function (e) {
        if (menuOpen && !mobileMenu.contains(e.target) && !navToggle.contains(e.target)) setMenu(false);
      });
    }

    // Scroll reveals: fade sections in as they enter the viewport.
    var els = document.querySelectorAll("[data-reveal]");
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { e.target.style.opacity = "1"; e.target.style.transform = "none"; }
        });
      }, { threshold: 0.14 });
      els.forEach(function (el) { io.observe(el); });
    } else {
      els.forEach(function (el) { el.style.opacity = "1"; el.style.transform = "none"; });
    }

    // Contact forms: send the submission to a Google Apps Script, which
    // emails ton@nomadplant.co and logs it to a Google Sheet, then shows
    // the thank-you message. (no-cors: the browser can't read Google's
    // reply, which is fine — we confirm to the visitor optimistically.)
    // Wires every .contact-form (one mid-page, one in the bottom Contact section).
    var FORM_ENDPOINT = "https://script.google.com/macros/s/AKfycbxxWmajDWehtBQtMMJXwgKzcguZtpBbi4MXU3-ZK-E6ljL5BrPeStFR8d-7F0Y8iA4gqA/exec";
    document.querySelectorAll(".contact-form").forEach(function (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        // Let the browser show its "please fill this in" prompts if invalid.
        if (form.reportValidity && !form.reportValidity()) return;

        var data = new URLSearchParams();
        form.querySelectorAll("input,textarea").forEach(function (el) {
          if (el.name) data.append(el.name, el.value);
        });
        fetch(FORM_ENDPOINT, { method: "POST", mode: "no-cors", body: data }).catch(function () {});

        var status = form.querySelector(".contact-status");
        if (status) status.style.display = "inline";
        form.querySelectorAll("input,textarea").forEach(function (el) { el.value = ""; el.blur(); });
      });
    });

    // Impact calculator: portions/week -> hens, animal lives, nitrogen saved per year.
    // NOTE: coefficients are provisional and to be confirmed with the Louis Bolk Institute.
    var IMPACT = {
      eggsPerPortion: 3,      // scramble portion = 3 whole eggs
      eggsPerHenYear: 300,    // eggs a laying hen produces per year (CBS/WUR)
      malesPerHen: 1,         // ~1 male layer chick culled per hen (historical 1:1)
      nSavedPerEggG: 3.0      // grams reactive N saved per whole egg replaced (PROVISIONAL)
    };
    var slider = document.getElementById("impactSlider");
    if (slider) {
      var MIN = 1, MAX = 50, TYPE_MAX = 1000000;
      var value = 3;
      var typing = false; // true while the user is typing in the number field
      var fmt = function (n) { return n.toLocaleString("en-US").replace(/,/g, "."); };
      var fill = document.getElementById("impactFill");
      var thumb = document.getElementById("impactThumb");
      var updateImpact = function () {
        var pct = Math.max(0, Math.min(100, ((value - MIN) / (MAX - MIN)) * 100));
        if (fill) fill.style.width = pct + "%";
        if (thumb) thumb.style.left = pct + "%";
        slider.setAttribute("aria-valuenow", value);
        var eggsYear = value * IMPACT.eggsPerPortion * 52;
        var hens = eggsYear / IMPACT.eggsPerHenYear;
        var animals = hens * (1 + IMPACT.malesPerHen);
        var nG = eggsYear * IMPACT.nSavedPerEggG;
        var pEl = document.getElementById("impPortions"); if (pEl) pEl.textContent = value;
        // Show the value in the number field, unless the user is mid-typing.
        var vInput = document.getElementById("impValueInput");
        if (vInput && !typing) {
          var vTxt = String(value);
          vInput.value = vTxt;
          vInput.style.fontSize = vTxt.length <= 2 ? "26px" : (vTxt.length <= 4 ? "18px" : (vTxt.length <= 6 ? "14px" : "12px"));
        }
        var hEl = document.getElementById("impHens"); if (hEl) hEl.textContent = fmt(Math.round(hens));
        var aEl = document.getElementById("impAnimals"); if (aEl) aEl.textContent = fmt(Math.round(animals));
        var nEl = document.getElementById("impN");
        if (nEl) {
          var kg = nG / 1000;
          if (kg >= 1000) {
            var t = kg / 1000;
            nEl.textContent = "≈ " + t.toLocaleString("en-US", { maximumFractionDigits: t >= 100 ? 0 : 1 }).replace(/,/g, ".") + " t";
          } else if (kg >= 1) {
            nEl.textContent = "≈ " + kg.toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 }).replace(/,/g, ".") + " kg";
          } else {
            nEl.textContent = "≈ " + Math.round(nG) + " g";
          }
        }
        // Keep the matching scale preset highlighted (yellow) as the active choice.
        document.querySelectorAll(".imp-preset").forEach(function (b) {
          b.classList.toggle("is-active", parseInt(b.getAttribute("data-portions"), 10) === value);
        });
      };
      var setFromX = function (clientX) {
        typing = false;
        var rect = slider.getBoundingClientRect();
        var t = (clientX - rect.left) / rect.width;
        t = Math.max(0, Math.min(1, t));
        value = Math.round(MIN + t * (MAX - MIN));
        updateImpact();
      };
      // Number field: type an exact value. On phones this opens the
      // device's native numeric keyboard (inputmode="numeric").
      var vInput = document.getElementById("impValueInput");
      if (vInput) {
        var commit = function () {
          typing = false;
          var digits = vInput.value.replace(/[^0-9]/g, "");
          value = digits === "" ? MIN : Math.max(MIN, Math.min(TYPE_MAX, parseInt(digits, 10)));
          updateImpact();
        };
        vInput.addEventListener("focus", function () { typing = true; vInput.select(); });
        vInput.addEventListener("input", function () {
          typing = true;
          var digits = vInput.value.replace(/[^0-9]/g, "");
          if (digits === "") return; // wait until there's a number to read
          value = Math.max(MIN, Math.min(TYPE_MAX, parseInt(digits, 10)));
          updateImpact(); // update the results live without overwriting what they're typing
        });
        vInput.addEventListener("blur", commit);
        vInput.addEventListener("change", commit);
        vInput.addEventListener("keydown", function (e) { if (e.key === "Enter") vInput.blur(); });
      }
      var stepBy = function (d) { typing = false; value = Math.max(MIN, Math.min(MAX, value + d)); updateImpact(); };
      var minusBtn = document.getElementById("impMinus");
      var plusBtn = document.getElementById("impPlus");
      if (minusBtn) minusBtn.addEventListener("click", function () { stepBy(-1); });
      if (plusBtn) plusBtn.addEventListener("click", function () { stepBy(1); });

      // "See it at scale" quick-pick buttons: jump the value to a preset.
      document.querySelectorAll(".imp-preset").forEach(function (btn) {
        btn.addEventListener("click", function () {
          typing = false;
          value = Math.max(MIN, Math.min(TYPE_MAX, parseInt(btn.getAttribute("data-portions"), 10) || MIN));
          updateImpact();
        });
      });
      var dragging = false;
      slider.addEventListener("pointerdown", function (e) { dragging = true; if (slider.setPointerCapture) slider.setPointerCapture(e.pointerId); setFromX(e.clientX); });
      slider.addEventListener("pointermove", function (e) { if (!dragging) return; e.preventDefault(); setFromX(e.clientX); });
      window.addEventListener("pointerup", function () { dragging = false; });
      slider.addEventListener("keydown", function (e) {
        if (e.key === "ArrowLeft" || e.key === "ArrowDown") { value = Math.max(MIN, value - 1); updateImpact(); e.preventDefault(); }
        else if (e.key === "ArrowRight" || e.key === "ArrowUp") { value = Math.min(MAX, value + 1); updateImpact(); e.preventDefault(); }
      });
      updateImpact();
    }

    // Solution carousel: three equal cards, arrows + dots.
    var solTrack = document.getElementById("solTrack");
    if (solTrack) {
      var dots = [].slice.call(document.querySelectorAll("[data-sol-dot]"));
      var cardW = function () {
        var first = solTrack.children[0];
        if (!first) return 0;
        var gap = 22;
        return first.getBoundingClientRect().width + gap;
      };
      var activeCard = function () { return Math.round(solTrack.scrollLeft / (cardW() || 1)); };
      var syncDots = function () {
        var idx = activeCard();
        dots.forEach(function (d, i) {
          var on = i === idx;
          d.style.background = on ? "#F1FC7A" : "rgba(241,252,122,.28)";
          d.style.width = on ? "22px" : "9px";
          d.style.borderRadius = on ? "999px" : "50%";
        });
      };
      dots.forEach(function (d, i) {
        d.addEventListener("click", function () { solTrack.scrollTo({ left: i * cardW(), behavior: "smooth" }); });
      });
      var pv = document.getElementById("solPrev"), nx = document.getElementById("solNext");
      if (pv) pv.addEventListener("click", function () { solTrack.scrollBy({ left: -cardW(), behavior: "smooth" }); });
      if (nx) nx.addEventListener("click", function () { solTrack.scrollBy({ left: cardW(), behavior: "smooth" }); });
      var raf = null;
      solTrack.addEventListener("scroll", function () {
        if (raf) cancelAnimationFrame(raf);
        raf = requestAnimationFrame(syncDots);
      });
      syncDots();
    }

    // Scroll-spy: underline the nav item whose section is in view.
    var spyLinks = [].slice.call(document.querySelectorAll("[data-spy]"));
    var spyIds = ["problem", "solution", "product", "about", "contact"];
    var activeId = null;
    var paint = function (a) {
      var on = a.getAttribute("data-spy") === activeId;
      var hov = a.getAttribute("data-hover") === "1";
      a.style.color = (on || hov) ? "#F1FC7A" : "rgba(255,255,255,.9)";
      a.style.textDecorationLine = (on || hov) ? "underline" : "none";
    };
    var setActive = function (id) { activeId = id; spyLinks.forEach(paint); };
    spyLinks.forEach(function (a) {
      a.addEventListener("mouseenter", function () { a.setAttribute("data-hover", "1"); paint(a); });
      a.addEventListener("mouseleave", function () { a.removeAttribute("data-hover"); paint(a); });
      paint(a);
    });

    // Footer links: same underline-on-hover as the top nav.
    document.querySelectorAll("[data-fhover]").forEach(function (a) {
      a.addEventListener("mouseenter", function () { a.style.color = "#F1FC7A"; a.style.textDecorationLine = "underline"; });
      a.addEventListener("mouseleave", function () { a.style.color = "rgba(255,255,255,.82)"; a.style.textDecorationLine = "none"; });
    });

    var spySections = spyIds.map(function (id) { return document.getElementById(id); }).filter(Boolean);
    if (spySections.length && "IntersectionObserver" in window) {
      var visible = {};
      var spyio = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { visible[e.target.id] = e.isIntersecting ? e.intersectionRatio : 0; });
        var best = null, bestTop = Infinity;
        spySections.forEach(function (s) {
          if (visible[s.id] > 0) {
            var top = Math.abs(s.getBoundingClientRect().top - 120);
            if (top < bestTop) { bestTop = top; best = s.id; }
          }
        });
        if (best) setActive(best);
      }, { rootMargin: "-120px 0px -55% 0px", threshold: [0, 0.2, 0.5] });
      spySections.forEach(function (s) { spyio.observe(s); });
    }

    // Safety net: never leave a reveal section stuck invisible.
    setTimeout(function () {
      els.forEach(function (el) {
        if (getComputedStyle(el).opacity === "0") { el.style.opacity = "1"; el.style.transform = "none"; }
      });
    }, 2500);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
