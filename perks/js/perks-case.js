/* Zomato Perks case study — interactions */
(function () {
  "use strict";
  document.documentElement.classList.remove("no-js");
  var RM = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var inr = function (n) { return "₹" + Math.round(n).toLocaleString("en-IN"); };

  /* ---------- reveal, with sibling cascade ---------- */
  var groups = new Map();
  $$(".reveal").forEach(function (el) {
    var p = el.parentElement;
    var i = groups.get(p) || 0;
    el.style.setProperty("--d", Math.min(i, 6) * 90 + "ms");
    groups.set(p, i + 1);
  });
  if ("IntersectionObserver" in window && !RM) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    $$(".reveal").forEach(function (el) { io.observe(el); });
  } else {
    $$(".reveal").forEach(function (el) { el.classList.add("is-in"); });
  }

  /* ---------- count up ---------- */
  function countUp(el) {
    var to = +el.dataset.count, t0 = null, dur = 1400;
    if (RM) { el.textContent = to; return; }
    function step(t) {
      if (!t0) t0 = t;
      var k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(2, -10 * k);
      el.textContent = Math.round(to * (k === 1 ? 1 : e));
      if (k < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  var cio = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { countUp(e.target); cio.unobserve(e.target); } });
  }, { threshold: 0.6 });
  $$("[data-count]").forEach(function (el) { cio.observe(el); });

  /* ---------- progress, chapter label, rail, read time ---------- */
  var bar = $("#progressBar"), topbar = $("#topbar"), chap = $("#topChapter"), left = $("#readLeft"), rail = $("#rail");
  var secs = $$("section[data-chapter]");
  var railLinks = $$("#rail a");
  var TOTAL_MIN = 18, lastY = 0, ticking = false;
  function onScroll() {
    var y = window.scrollY, h = document.documentElement.scrollHeight - innerHeight;
    var p = h > 0 ? y / h : 0;
    bar.style.transform = "scaleX(" + p + ")";
    if (left) left.textContent = Math.max(1, Math.ceil(TOTAL_MIN * (1 - p)));
    // hide bar on fast scroll down, show on up
    if (topbar) { if (y > 400 && y > lastY + 6) topbar.classList.add("is-hidden");
    else if (y < lastY - 6 || y < 400) topbar.classList.remove("is-hidden"); }
    lastY = y;
    var cur = null;
    secs.forEach(function (s) { if (s.getBoundingClientRect().top < innerHeight * 0.4) cur = s; });
    if (chap) chap.textContent = cur ? cur.dataset.chapter : "Case study";
    rail.classList.toggle("is-on", !!cur && y < h - 200);
    railLinks.forEach(function (a) { a.classList.toggle("is-active", !!cur && a.getAttribute("href") === "#" + cur.id); });
    ticking = false;
  }
  window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();

  /* ---------- personas ---------- */
  var P = [
    { n: "The New Joiner", c: "Converts on desire", l: ["Category cards you can grab and flip", "The salary story: it's their story", "Treats framed as guilt-free, not as savings"] },
    { n: "The Smart Saver", c: "Converts on effort", l: ["Process step 2 is literally \"change nothing\"", "Real rates in rupees, Indian grouping", "Wallet that answers \"where's my money\" in three states"] },
    { n: "The Big Spender", c: "Converts on breadth", l: ["1500+ brands on a drifting clothesline", "The 25+ category reel", "Luxury as its own tier"] },
    { n: "The Skeptic", c: "Converts only on proof", l: ["A testimonial section titled after their objection: \"toooo gooood to be true\"", "Real CashKaro rates, even when smaller than invented ones", "Every fake stat, fake bonus and fake success state removed", "An assistant that says \"I don't have that yet\" instead of guessing"] }
  ];
  var pOut = $("#personaOut");
  function showP(i) {
    $$(".persona").forEach(function (b) { b.setAttribute("aria-selected", +b.dataset.p === i ? "true" : "false"); });
    var d = P[i];
    pOut.innerHTML = "<div><b class=\"big\">" + d.n + "</b><p class=\"tiny\">" + d.c + "</p></div><div><p class=\"eyebrow\" style=\"margin-bottom:8px\">What in the product is for them</p><ul>" + d.l.map(function (x) { return "<li>" + x + "</li>"; }).join("") + "</ul></div>";
  }
  $$(".persona").forEach(function (b) { b.addEventListener("click", function () { showP(+b.dataset.p); }); });
  showP(3);

  /* ---------- salary story chart ---------- */
  var B = [
    { v: 50000, l: "Salary credited", s: "Payday." },
    { v: 45000, l: "The trip", s: "“Let's start with a trip!”" },
    { v: 30000, l: "The watch", s: "“Let me get my dream watch.”" },
    { v: 22500, l: "The brunch", s: "“I need a fancy brunch.”" },
    { v: 12500, l: "Car EMI", s: "“Oh! It's EMI time for my car.”" },
    { v: 10000, l: "Saving the rest", s: "“High time I save the rest.”" },
    { v: 10000, l: "The low point", s: "“I wish I could do more :(”", low: 1 },
    { v: 10000, l: "The turn", s: "Introducing a better way to spend: Zomato Perks.", turn: 1 }
  ];
  var svg = $("#salSvg"), NS = "http://www.w3.org/2000/svg";
  if (svg) {
    var W = 720, H = 260, pl = 20, pr = 20, pt = 20, pb = 50;
    var x = function (i) { return pl + i * ((W - pl - pr) / (B.length - 1)); };
    var y = function (v) { return pt + (1 - v / 50000) * (H - pt - pb); };
    var mk = function (t, a) { var e = document.createElementNS(NS, t); for (var k in a) e.setAttribute(k, a[k]); return e; };
    var defs = mk("defs", {});
    defs.innerHTML = '<linearGradient id="gf" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e23744" stop-opacity=".18"/><stop offset="1" stop-color="#e23744" stop-opacity="0"/></linearGradient>';
    svg.appendChild(defs);
    [0, 25000, 50000].forEach(function (g) {
      svg.appendChild(mk("line", { x1: pl, x2: W - pr, y1: y(g), y2: y(g), stroke: "#eee8e8", "stroke-dasharray": "3 5" }));
    });
    var pts = B.slice(0, 7).map(function (b, i) { return x(i) + "," + y(b.v); });
    svg.appendChild(mk("polygon", { points: pts.join(" ") + " " + x(6) + "," + (H - pb) + " " + x(0) + "," + (H - pb), fill: "url(#gf)" }));
    var line = mk("polyline", { points: pts.join(" "), fill: "none", stroke: "#242c51", "stroke-width": 2.5, "stroke-linejoin": "round", "stroke-linecap": "round" });
    svg.appendChild(line);
    // the turn: dashed rise
    svg.appendChild(mk("path", { d: "M" + x(6) + "," + y(10000) + " C" + (x(6) + 40) + "," + y(10000) + " " + (x(7) - 30) + "," + y(36000) + " " + x(7) + "," + y(36000), fill: "none", stroke: "#e23744", "stroke-width": 2.5, "stroke-dasharray": "5 6" }));
    var beats = [];
    B.forEach(function (b, i) {
      var g = mk("g", { class: "beat", tabindex: 0, role: "button", "aria-label": b.l });
      var cy = b.turn ? y(36000) : y(b.v);
      g.appendChild(mk("circle", { class: "hit", cx: x(i), cy: cy, r: 22 }));
      g.appendChild(mk("circle", { class: "dot", cx: x(i), cy: cy, r: 6, fill: b.turn ? "#e23744" : b.low ? "#9aa0ad" : "#242c51", stroke: "#fff", "stroke-width": 2.5 }));
      var t = mk("text", { x: x(i), y: H - 18, "text-anchor": "middle", "font-size": 12, "font-family": "Nunito Sans, sans-serif", "font-weight": 700, fill: b.turn ? "#d74446" : "#7a8090" });
      t.textContent = b.l.replace("Salary credited", "Payday").replace("Saving the rest", "Save").replace("The low point", "Low").replace("The turn", "Perks").replace("The ", "");
      g.appendChild(t);
      g.addEventListener("mouseenter", function () { setBeat(i); });
      g.addEventListener("focus", function () { setBeat(i); });
      g.addEventListener("click", function () { setBeat(i); });
      svg.appendChild(g);
      beats.push(g);
    });
    var amt = $("#salAmt"), lab = $("#salLabel"), say = $("#salSay"), box = $(".salary"), cur = 0, rolling = null;
    function roll(from, to) {
      cancelAnimationFrame(rolling);
      if (RM) { amt.textContent = inr(to); return; }
      var t0 = null;
      (function f(t) { if (!t0) t0 = t; var k = Math.min(1, (t - t0) / 600), e = 1 - Math.pow(1 - k, 3); amt.textContent = inr(from + (to - from) * e); if (k < 1) rolling = requestAnimationFrame(f); })(performance.now());
    }
    function setBeat(i) {
      var b = B[i];
      beats.forEach(function (g, j) { g.classList.toggle("is-on", j === i); });
      lab.textContent = b.l; say.textContent = b.s;
      box.classList.toggle("is-low", !!b.low); box.classList.toggle("is-turn", !!b.turn);
      if (b.turn) { cancelAnimationFrame(rolling); amt.textContent = "Perks"; }
      else roll(B[cur].turn ? b.v : B[cur].v, b.v);
      cur = i;
    }
    setBeat(0);
    // autoplay once when visible
    var played = false;
    new IntersectionObserver(function (es) {
      if (es[0].isIntersecting && !played) {
        played = true;
        if (RM) return;
        var i = 0, iv = setInterval(function () { i++; setBeat(i); if (i >= B.length - 1) clearInterval(iv); }, 1100);
        box.addEventListener("pointerenter", function () { clearInterval(iv); }, { once: true });
      }
    }, { threshold: 0.5 }).observe(box);
  }

  /* ---------- objection map ---------- */
  var O = [
    { q: "I don't have a problem.", s: "Intro film", img: "intro-armed", m: "Show the salary vanishing first. Create the gap before selling the fix." },
    { q: "What is this?", s: "Hero", img: "lp-hero", m: "One promise line and the categories as cards you can play with." },
    { q: "Does it cover what I buy?", s: "Category reel", img: "lp-s2-travel", m: "Seven categories narrated one by one, then “25+ categories”." },
    { q: "Is it complicated?", s: "Process", img: "lp-process-1", m: "Three steps, and step two is: shop like you always do." },
    { q: "How big is it really?", s: "Brands", img: "lp-brands", m: "1500+ brands on a drifting clothesline, real rates on hover." },
    { q: "Sounds fake.", s: "Testimonials", img: "lp-testimonials", m: "Name the objection in the headline: “toooo gooood to be true”. Peers, not strangers." },
    { q: "What's the catch?", s: "FAQ", img: "lp-faq", m: "“It's a benefit your company offers. Nothing comes out of your salary.”" },
    { q: "Fine. How do I start?", s: "Accept invite", img: "lp-cta", m: "One field. Your work email. Nothing else." }
  ];
  var list = $(".omap__list"), oImg = $("#omapImg"), oCap = $("#omapCap"), oUrl = $("#omapUrl");
  if (list) {
    O.forEach(function (o, i) {
      var li = document.createElement("li");
      li.innerHTML = '<button role="tab" aria-selected="false"><span class="omap__i">' + (i + 1) + '</span><span class="omap__q">“' + o.q + '”</span><span class="omap__a">Answered by <b>' + o.s + "</b></span></button>";
      li.firstChild.addEventListener("click", function () { setO(i, true); });
      li.firstChild.addEventListener("mouseenter", function () { setO(i); });
      list.appendChild(li);
    });
    var oi = -1;
    function setO(i) {
      if (i === oi) return; oi = i;
      $$("button", list).forEach(function (b, j) { b.classList.toggle("on", j === i); b.setAttribute("aria-selected", j === i); });
      var o = O[i];
      oImg.style.opacity = 0;
      setTimeout(function () { oImg.src = "assets/shots/" + o.img + ".webp"; oImg.alt = o.s + " section"; oImg.style.opacity = 1; }, RM ? 0 : 180);
      oUrl.textContent = "zomato-perks · " + o.s.toLowerCase();
      oCap.innerHTML = "<b>" + o.s + ".</b> " + o.m;
    }
    setO(0);
    O.forEach(function (o) { var im = new Image(); im.src = "assets/shots/" + o.img + ".webp"; });
  }

  /* ---------- easing demo ---------- */
  var play = $("#easePlay");
  if (play) {
    var curves = { expo: "cubic-bezier(.16,1,.3,1)", soft: "cubic-bezier(.22,1,.36,1)", lin: "linear" };
    var out = false;
    function run() {
      out = !out;
      $$(".ease__dot").forEach(function (d) {
        var tr = d.parentElement.clientWidth - 34;
        d.style.transition = "transform 1.1s " + curves[d.dataset.ease];
        d.style.transform = out ? "translateX(" + tr + "px)" : "translateX(0)";
      });
      play.textContent = out ? "↺ Back" : "▶ Play";
    }
    play.addEventListener("click", run);
    new IntersectionObserver(function (es, ob) { if (es[0].isIntersecting) { setTimeout(run, 400); ob.disconnect(); } }, { threshold: 0.7 }).observe(play.parentElement);
  }

  /* ---------- lightbox ---------- */
  var lb = $("#lightbox"), lbImg = $("img", lb), lbCap = $(".lightbox__cap", lb), lastFocus = null;
  function openLb(src, alt, cap) {
    lastFocus = document.activeElement;
    lbImg.src = src; lbImg.alt = alt || ""; lbCap.innerHTML = cap || alt || "";
    lb.hidden = false; document.body.style.overflow = "hidden"; $(".lightbox__x", lb).focus();
  }
  function closeLb() { lb.hidden = true; document.body.style.overflow = ""; if (lastFocus) lastFocus.focus(); }
  document.addEventListener("click", function (e) {
    var f = e.target.closest("[data-zoom]");
    if (f && !lb.contains(f)) {
      var img = f.tagName === "IMG" ? f : $("img", f);
      if (!img) return;
      var cap = $("figcaption", f);
      openLb(img.currentSrc || img.src, img.alt, cap ? cap.innerHTML : img.alt);
    }
  });
  lb.addEventListener("click", function (e) { if (e.target !== lbImg) closeLb(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !lb.hidden) closeLb(); });
  $$("[data-zoom]").forEach(function (f) {
    f.setAttribute("tabindex", "0");
    f.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); f.click(); } });
  });

  /* ---------- hero card tilt ---------- */
  if (!RM && window.matchMedia("(hover: hover)").matches) {
    $$(".tilt").forEach(function (c) {
      c.addEventListener("pointermove", function (e) {
        var r = c.getBoundingClientRect(), px = (e.clientX - r.left) / r.width - .5, py = (e.clientY - r.top) / r.height - .5;
        c.style.transform = "perspective(700px) rotateY(" + px * 18 + "deg) rotateX(" + -py * 18 + "deg) scale(1.06)";
      });
      c.addEventListener("pointerleave", function () { c.style.transform = ""; });
    });
  }
})();
