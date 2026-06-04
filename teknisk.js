/* ============================================================
   Svalinn Technology — teknisk dypdykk · interaksjon
   ============================================================ */
(function () {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- scroll reveal ---------- */
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: "0px 0px -30% 0px" },
  );
  $$(".rv:not(.in)").forEach((el, i) => {
    /* below-hero reveals slide in from alternating sides as you scroll;
       elements with an explicit sl/sr in markup keep their chosen side */
    if (
      !reduce &&
      !el.classList.contains("sl") &&
      !el.classList.contains("sr") &&
      !el.classList.contains("sb") &&
      !el.classList.contains("st")
    ) {
      el.classList.add(i % 2 ? "sr" : "sl");
    }
    io.observe(el);
  });

  /* ---------- scroll progress + nav hide ---------- */
  const prog = $("#progress"),
    nav = $("#nav");
  let lastY = 0;
  addEventListener(
    "scroll",
    () => {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      const y = h.scrollTop || document.body.scrollTop;
      prog.style.width = (max > 0 ? (y / max) * 100 : 0) + "%";
      // hide nav on scroll down (but not at top)
      if (y > 140 && y > lastY + 4) {
        nav.classList.add("hidden");
      } else if (y < lastY - 4 || y < 140) {
        nav.classList.remove("hidden");
      }
      lastY = y;
    },
    { passive: true },
  );

  /* ---------- active nav link (driven from journey scroll-spy below; nothing active in hero) ---------- */
  const links = $$("#navlinks a");
  const map = {};
  links.forEach((a) => {
    const id = a.getAttribute("href").slice(1);
    const sec = document.getElementById(id);
    if (sec) map[id] = a;
  });

  /* ---------- smart anchor scroll: center chapters that fit, top-align tall ones ---------- */
  function scrollToSection(id) {
    const s = document.getElementById(id);
    if (!s) return;
    const navOffset = 84;
    const avail = innerHeight;
    let target;
    if (s.offsetHeight <= avail - 24) {
      target = s.offsetTop - (avail - s.offsetHeight) / 2; // fits → center vertically
    } else {
      target = s.offsetTop - navOffset; // taller than viewport → start at top
    }
    const max = document.documentElement.scrollHeight - innerHeight;
    target = Math.max(0, Math.min(target, max));
    window.scrollTo({ top: target, behavior: "smooth" });
  }
  $$('a[href^="#"]').forEach((a) => {
    const href = a.getAttribute("href");
    if (href === "#" || href.length < 2) return;
    const id = href.slice(1);
    if (!document.getElementById(id)) return;
    a.addEventListener("click", (e) => {
      e.preventDefault();
      scrollToSection(id);
    });
  });
  const navHome = document.getElementById("navHome");
  if (navHome)
    navHome.addEventListener("click", (e) => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

  /* ---------- mobile hamburger menu ---------- */
  (function () {
    const burger = document.getElementById("navBurger");
    const menu = document.getElementById("navMenu");
    const scrim = document.getElementById("navScrim");
    if (!burger || !menu) return;
    function setOpen(open) {
      burger.classList.toggle("open", open);
      menu.classList.toggle("open", open);
      if (scrim) scrim.classList.toggle("open", open);
      burger.setAttribute("aria-expanded", open ? "true" : "false");
      menu.setAttribute("aria-hidden", open ? "false" : "true");
    }
    burger.addEventListener("click", () =>
      setOpen(!menu.classList.contains("open")),
    );
    if (scrim) scrim.addEventListener("click", () => setOpen(false));
    menu
      .querySelectorAll("a")
      .forEach((a) => a.addEventListener("click", () => setOpen(false)));
    addEventListener("keydown", (e) => {
      if (e.key === "Escape") setOpen(false);
    });
  })();

  /* ============================================================
     THERMAL STORE — self-running demo loop (batteri-seksjon)
     ============================================================ */
  (function () {
    const fill = $("#socFill"),
      st = $("#socState"),
      pc = $("#socPct"),
      pw = $("#socPower");
    if (!fill) return;
    const bottomY = 226,
      fullH = 204,
      topMin = 22;
    let t = 0;
    function frame() {
      t += 0.006;
      // soc oscillates 0.35..0.95 over a slow cycle
      const soc = 0.65 + 0.3 * Math.sin(t);
      const rate = Math.cos(t); // derivative sign -> charging/discharging
      const h = clamp(soc * fullH, 0, fullH);
      fill.setAttribute("y", (bottomY - h).toFixed(1));
      fill.setAttribute("height", h.toFixed(1));
      pc.textContent = Math.round(soc * 100) + "%";
      if (rate > 0.12) {
        st.textContent = "LADER";
        st.setAttribute("fill", "#47D7AC");
        pw.textContent = "+" + Math.round(40 + rate * 40) + " kW";
        pw.setAttribute("fill", "#47D7AC");
      } else if (rate < -0.12) {
        st.textContent = "TØMMER";
        st.setAttribute("fill", "#59CBE8");
        pw.textContent = "−" + Math.round(30 + -rate * 35) + " kW";
        pw.setAttribute("fill", "#9fd8ee");
      } else {
        st.textContent = "HOLDER";
        st.setAttribute("fill", "#cfe0ee");
        pw.textContent = "≈ 0 kW";
        pw.setAttribute("fill", "#cfe0ee");
      }
      if (!reduce && document.body.dataset.motion !== "off")
        raf = requestAnimationFrame(frame);
    }
    let raf;
    // only animate when visible
    const vis = new IntersectionObserver(
      (e) => {
        if (e[0].isIntersecting) {
          if (!raf) frame();
        } else {
          cancelAnimationFrame(raf);
          raf = null;
        }
      },
      { threshold: 0.1 },
    );
    vis.observe(fill.closest(".hero-card") || fill);
    if (reduce) {
      // static mid state
      const h = 0.7 * fullH;
      fill.setAttribute("y", bottomY - h);
      fill.setAttribute("height", h);
      pc.textContent = "70%";
      st.textContent = "LADER";
    }
  })();

  /* ============================================================
     24H SIMULATION
     ============================================================ */
  (function () {
    const chart = $("#simChart");
    if (!chart) return;
    const HRS = 24;
    // ---- authored daily profiles ----
    const price = [
      0.42, 0.4, 0.4, 0.41, 0.45, 0.55, 0.85, 1.2, 1.35, 1.1, 0.75, 0.55, 0.48,
      0.45, 0.5, 0.62, 0.88, 1.25, 1.5, 1.4, 1.05, 0.78, 0.6, 0.48,
    ];
    const solar = [
      0, 0, 0, 0, 0, 2, 12, 30, 55, 80, 100, 115, 120, 118, 105, 82, 55, 28, 10,
      2, 0, 0, 0, 0,
    ];
    const base = 40;
    const demand = [
      30, 28, 28, 30, 32, 36, 42, 46, 48, 50, 52, 54, 55, 54, 52, 50, 48, 46,
      44, 42, 38, 35, 33, 31,
    ];
    // Svalinn schedule
    const chillerS = [
      40, 40, 40, 38, 38, 36, 18, 10, 20, 45, 78, 86, 90, 86, 76, 54, 26, 10, 8,
      16, 34, 38, 40, 38,
    ];
    const socS = [
      49, 53, 58, 64, 67, 70, 70, 59, 44, 32, 30, 41, 55, 70, 83, 93, 95, 86,
      70, 55, 44, 42, 44, 47,
    ];
    // Naive (no storage, follows demand)
    const chillerN = [
      40, 38, 38, 40, 42, 46, 52, 56, 58, 60, 62, 64, 65, 64, 62, 60, 58, 56,
      54, 52, 48, 45, 43, 41,
    ];
    const socN = new Array(24).fill(50);
    const gridOf = (ch) => ch.map((c, i) => Math.max(0, c + base - solar[i]));
    const gridS = gridOf(chillerS),
      gridN = gridOf(chillerN);

    // phases & decisions (Svalinn)
    function phase(h) {
      if (h < 6)
        return {
          ph: "NATT",
          d: "Billig nattstrøm — lader termisk lager i forkant av morgentopp.",
        };
      if (h < 10)
        return {
          ph: "MORGENRUSH",
          d: "Dyreste timer — henter kulde fra lager, kjøper minimalt fra nett.",
        };
      if (h < 16)
        return {
          ph: "SOL",
          d: "Soloverskudd dekker drift og lader lageret. Tilnærmet null nettkjøp.",
        };
      if (h < 21)
        return {
          ph: "KVELDSTOPP",
          d: "Ny pristopp — tømmer lager fremfor å kjøpe dyr effekt.",
        };
      return {
        ph: "NATT",
        d: "Pris faller — starter forsiktig opplading mot neste døgn.",
      };
    }
    function phaseN(h) {
      if (h >= 6 && h < 10)
        return "Kjøper full effekt i den dyreste morgentimen.";
      if (h >= 16 && h < 21)
        return "Kjøper full effekt i kveldstoppen — ingen lastutjevning.";
      if (h >= 10 && h < 16)
        return "Bruker noe sol, men overskudd selges billig ut.";
      return "Konstant drift uavhengig av pris.";
    }

    // ---- chart geometry ----
    const W = 1000,
      H = 320,
      padR = 8;
    const X = (h) => (h / HRS) * (W - padR);
    const yPrice = (v) => lerp(300, 24, clamp(v / 1.6, 0, 1));
    const yKW = (v) => lerp(304, 46, clamp(v / 130, 0, 1));
    const ySoc = (v) => lerp(300, 30, clamp(v / 100, 0, 1));

    function smooth(points) {
      // catmull-rom -> path
      if (!points.length) return "";
      let d = "M" + points[0][0].toFixed(1) + "," + points[0][1].toFixed(1);
      for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[i - 1] || points[i],
          p1 = points[i],
          p2 = points[i + 1],
          p3 = points[i + 2] || p2;
        const c1x = p1[0] + (p2[0] - p0[0]) / 6,
          c1y = p1[1] + (p2[1] - p0[1]) / 6;
        const c2x = p2[0] - (p3[0] - p1[0]) / 6,
          c2y = p2[1] - (p3[1] - p1[1]) / 6;
        d +=
          "C" +
          c1x.toFixed(1) +
          "," +
          c1y.toFixed(1) +
          " " +
          c2x.toFixed(1) +
          "," +
          c2y.toFixed(1) +
          " " +
          p2[0].toFixed(1) +
          "," +
          p2[1].toFixed(1);
      }
      return d;
    }
    const pts = (arr, yf) => arr.map((v, i) => [X(i), yf(v)]);

    let mode = "svalinn",
      curHour = 13,
      playing = false,
      timer = null;

    function seriesFor() {
      return mode === "svalinn"
        ? { chiller: chillerS, soc: socS, grid: gridS }
        : { chiller: chillerN, soc: socN, grid: gridN };
    }

    function drawStatic() {
      const s = seriesFor();
      const socPath = smooth(pts(s.soc, ySoc));
      const socArea = socPath + `L${X(23)},300 L0,300 Z`;
      const solarPath = smooth(pts(solar, yKW));
      const solarArea = solarPath + `L${X(23)},304 L0,304 Z`;
      const pricePath = smooth(pts(price, yPrice));
      const chillerPath = smooth(pts(s.chiller, yKW));
      const gridPath = smooth(pts(s.grid, yKW));

      chart.innerHTML = `
        <defs>
          <linearGradient id="socGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="rgba(71,215,172,.34)"/><stop offset="1" stop-color="rgba(71,215,172,.02)"/></linearGradient>
          <linearGradient id="solGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="rgba(255,176,32,.26)"/><stop offset="1" stop-color="rgba(255,176,32,0)"/></linearGradient>
        </defs>
        <g stroke="rgba(150,190,225,.10)" stroke-width="1">
          <line x1="0" y1="76" x2="${W}" y2="76"/><line x1="0" y1="160" x2="${W}" y2="160"/><line x1="0" y1="244" x2="${W}" y2="244"/>
        </g>
        <path d="${socArea}" fill="url(#socGrad)"/>
        <path d="${socPath}" fill="none" stroke="rgba(71,215,172,.6)" stroke-width="1.6" stroke-dasharray="${mode === "naive" ? "4 6" : "0"}"/>
        <path d="${solarArea}" fill="url(#solGrad)"/>
        <path d="${solarPath}" fill="none" stroke="#ffb020" stroke-width="2" opacity=".85"/>
        <path d="${gridPath}" fill="none" stroke="#ff6b4a" stroke-width="2.4"/>
        <path d="${chillerPath}" fill="none" stroke="#59CBE8" stroke-width="2.4"/>
        <path d="${pricePath}" fill="none" stroke="#00629B" stroke-width="2.6"/>
        <g id="scrub">
          <line id="scrubLine" x1="0" y1="14" x2="0" y2="310" stroke="rgba(255,255,255,.5)" stroke-width="1.4" stroke-dasharray="3 4"/>
          <circle id="dotPrice" r="5" fill="#00629B" stroke="#0a1f33" stroke-width="1.6"/>
          <circle id="dotChiller" r="4.5" fill="#59CBE8" stroke="#0a1f33" stroke-width="1.6"/>
          <circle id="dotGrid" r="4.5" fill="#ff6b4a" stroke="#0a1f33" stroke-width="1.6"/>
        </g>`;
      updateScrub();
    }

    function valAt(arr, h) {
      const i = Math.floor(h),
        f = h - i;
      return lerp(arr[i], arr[Math.min(i + 1, 23)], f);
    }

    function updateScrub() {
      const s = seriesFor();
      const x = X(curHour);
      const line = $("#scrubLine");
      if (line) {
        line.setAttribute("x1", x);
        line.setAttribute("x2", x);
      }
      const dp = $("#dotPrice"),
        dc = $("#dotChiller"),
        dg = $("#dotGrid");
      if (dp) {
        dp.setAttribute("cx", x);
        dp.setAttribute("cy", yPrice(valAt(price, curHour)));
      }
      if (dc) {
        dc.setAttribute("cx", x);
        dc.setAttribute("cy", yKW(valAt(s.chiller, curHour)));
      }
      if (dg) {
        dg.setAttribute("cx", x);
        dg.setAttribute("cy", yKW(valAt(s.grid, curHour)));
      }
    }

    // ---- readouts ----
    const elClock = $("#simClock"),
      elPhase = $("#simPhase"),
      elPhaseD = $("#simPhaseDesc");
    const roDec = $("#roDecision"),
      roPrice = $("#roPrice"),
      roGrid = $("#roGrid"),
      roSoc = $("#roSoc");
    const fillBar = $("#simFill"),
      marker = $("#simMarker");

    function fmtHour(h) {
      const hh = Math.floor(h) % 24;
      const mm = Math.round((h - Math.floor(h)) * 60);
      return String(hh).padStart(2, "0") + ":" + String(mm).padStart(2, "0");
    }

    function render() {
      const s = seriesFor();
      const pr = valAt(price, curHour),
        gr = valAt(s.grid, curHour),
        so = valAt(s.soc, curHour);
      elClock.textContent = fmtHour(curHour);
      const hi = Math.round(curHour) % 24;
      if (mode === "svalinn") {
        const ph = phase(hi);
        elPhase.textContent = ph.ph;
        elPhaseD.textContent =
          ph.ph === "SOL"
            ? "Overskudd dekker drift — lader lager"
            : ph.ph === "MORGENRUSH" || ph.ph === "KVELDSTOPP"
              ? "Dyr strøm — tømmer lager"
              : "Lav pris — lader";
        roDec.textContent = ph.d;
      } else {
        elPhase.textContent =
          pr > 1.0 ? "DYR TIME" : solar[hi] > 40 ? "SOL" : "DRIFT";
        elPhaseD.textContent = "Ingen lastutjevning";
        roDec.textContent = phaseN(hi);
      }
      roPrice.innerHTML =
        pr.toFixed(2).replace(".", ",") + '<span class="u">kr/kWh</span>';
      roGrid.innerHTML = Math.round(gr) + '<span class="u">kW</span>';
      roGrid.classList.toggle("hot", gr > 70);
      roSoc.innerHTML = Math.round(so) + '<span class="u">%</span>';
      const f = (curHour / HRS) * 100;
      fillBar.style.width = f + "%";
      marker.style.left = f + "%";
      updateScrub();
    }

    function setHour(h, smoothMove) {
      curHour = clamp(h, 0, 23.99);
      render();
    }

    // ---- mode toggle ----
    $$("#simMode button").forEach((b) =>
      b.addEventListener("click", () => {
        $$("#simMode button").forEach((x) => x.classList.remove("active"));
        b.classList.add("active");
        b.classList.toggle("naive", b.dataset.mode === "naive");
        mode = b.dataset.mode;
        // keep .naive class only on naive button when active
        $$("#simMode button").forEach((x) => {
          if (x.dataset.mode !== "naive") x.classList.remove("naive");
        });
        drawStatic();
        render();
      }),
    );

    // ---- track drag ----
    const track = $("#simTrack");
    function fromEvent(e) {
      const r = track.getBoundingClientRect();
      const cx = e.touches ? e.touches[0].clientX : e.clientX;
      const f = clamp((cx - r.left) / r.width, 0, 1);
      setHour(f * 23.99);
    }
    let dragging = false;
    track.addEventListener("pointerdown", (e) => {
      dragging = true;
      stop();
      fromEvent(e);
      track.setPointerCapture(e.pointerId);
    });
    track.addEventListener("pointermove", (e) => {
      if (dragging) fromEvent(e);
    });
    track.addEventListener("pointerup", () => {
      dragging = false;
    });
    track.addEventListener("pointercancel", () => {
      dragging = false;
    });

    // ---- play ----
    const playBtn = $("#simPlay"),
      hint = $("#simHint");
    function setPlayIcon(p) {
      playBtn.innerHTML =
        '<svg viewBox="0 0 24 24"><use href="#' +
        (p ? "ic-pause" : "ic-play") +
        '"/></svg>';
    }
    let rafId = null,
      lastTs = 0;
    const DAY_MS = reduce ? 40000 : 29000; // varighet for et helt døgn (jevn fart)
    function stop() {
      playing = false;
      if (rafId) cancelAnimationFrame(rafId);
      rafId = null;
      setPlayIcon(false);
    }
    function play() {
      playing = true;
      setPlayIcon(true);
      hint.textContent = "Spiller av døgnet…";
      if (rafId) cancelAnimationFrame(rafId);
      lastTs = 0;
      const tick = (ts) => {
        if (!playing) return;
        if (!lastTs) lastTs = ts;
        const dt = ts - lastTs;
        lastTs = ts;
        curHour += (dt / DAY_MS) * 24;
        if (curHour >= 23.999) curHour = 0;
        render();
        rafId = requestAnimationFrame(tick);
      };
      rafId = requestAnimationFrame(tick);
    }
    playBtn.addEventListener("click", () => {
      playing ? stop() : play();
      if (!playing) hint.textContent = "Dra i tidslinjen for å utforske.";
    });

    // init
    drawStatic();
    setHour(13);
    // redraw on resize (viewBox scales but dot positions are fine; nothing needed)
  })();

  /* ============================================================
     TWEAKS host (motion / depth / accent) — applied via attrs
     handled by tweaks-panel.jsx if present; expose helper
     ============================================================ */
  window.__svalinnApply = function (t) {
    if (t.depth) document.body.dataset.depth = t.depth;
    if (t.motion) document.body.dataset.motion = t.motion;
    if (t.accent) {
      document.documentElement.style.setProperty("--accent", t.accent);
      // derive soft + line
      document.documentElement.style.setProperty(
        "--accent-soft",
        hexA(t.accent, 0.14),
      );
      document.documentElement.style.setProperty(
        "--accent-line",
        hexA(t.accent, 0.34),
      );
    }
  };
  function hexA(hex, a) {
    const h = hex.replace("#", "");
    const r = parseInt(h.slice(0, 2), 16),
      g = parseInt(h.slice(2, 4), 16),
      b = parseInt(h.slice(4, 6), 16);
    return `rgba(${r},${g},${b},${a})`;
  }

  /* ============================================================
     LEFT SCROLL TIMELINE — appears past hero, marks the journey
     ============================================================ */
  (function () {
    const tl = document.getElementById("timeline");
    if (!tl) return;
    const items = [...tl.querySelectorAll(".tl-item")];
    const secs = items.map((a) => document.getElementById(a.dataset.sec));
    const fill = document.getElementById("tlFill");
    const hero = document.querySelector(".hero");
    secs.forEach((s) => {
      if (s) s.classList.add("journey");
    });

    // click a timeline anchor → center if it fits the viewport, else align its start to the top
    const TOP_OFF = 84;
    // custom smooth scroll with a controllable (gentler) duration
    function animateScrollTo(target, duration) {
      target = Math.max(0, Math.round(target));
      const root = document.documentElement;
      const startY = window.pageYOffset || root.scrollTop;
      const dist = target - startY;
      if (reduce || Math.abs(dist) < 2) {
        window.scrollTo(0, target);
        return;
      }
      // turn off CSS smooth + snap so they don't fight the rAF animation (jank)
      const prevSnap = root.style.scrollSnapType,
        prevBeh = root.style.scrollBehavior;
      root.style.scrollSnapType = "none";
      root.style.scrollBehavior = "auto";
      const t0 = performance.now();
      const ease = (t) =>
        t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; // easeInOutCubic
      (function step(now) {
        const t = Math.min(1, (now - t0) / duration);
        window.scrollTo(0, Math.round(startY + dist * ease(t)));
        if (t < 1) {
          requestAnimationFrame(step);
        } else {
          root.style.scrollSnapType = prevSnap;
          root.style.scrollBehavior = prevBeh;
        }
      })(t0);
    }
    items.forEach((a, i) => {
      a.addEventListener("click", (e) => {
        e.preventDefault();
        const s = secs[i];
        if (!s) return;
        const vh = innerHeight,
          h = s.offsetHeight;
        const target =
          h <= vh ? s.offsetTop - (vh - h) / 2 : s.offsetTop - TOP_OFF;
        animateScrollTo(target, 1300);
      });
    });

    let lastActive = -1;
    function update() {
      const y = window.pageYOffset || document.documentElement.scrollTop;
      const vh = innerHeight;
      const threshold = hero ? hero.offsetHeight * 0.55 : vh * 0.6;
      const show = y > threshold;
      tl.classList.toggle("show", show);
      document.body.classList.toggle("journey-on", show);
      // focus = the section whose start has reached the upper reading zone;
      // a higher line keeps tall sections in focus until you've scrolled through them
      const mid = y + vh * 0.42;
      let active = 0;
      secs.forEach((s, i) => {
        if (s && s.offsetTop <= mid) active = i;
      });
      items.forEach((a, i) => {
        a.classList.toggle("active", i === active);
        a.classList.toggle("done", i < active);
      });
      if (active !== lastActive) {
        secs.forEach((s, i) => {
          if (s) s.classList.toggle("in-focus", i === active);
        });
        lastActive = active;
      }
      // drive top nav from same logic — nothing active while in hero (so Problemet ≠ hero)
      links.forEach((l) => l.classList.remove("active"));
      if (show) {
        const id = items[active].dataset.sec;
        if (map[id]) map[id].classList.add("active");
      }
      if (fill) {
        const frac = items.length > 1 ? active / (items.length - 1) : 0;
        fill.style.height = frac * 100 + "%";
      }
    }
    addEventListener("scroll", update, { passive: true });
    addEventListener("resize", update);
    update();
  })();
})();
