/* Live prototype embed + phone screen reels */
(function () {
  "use strict";
  var SITE = "https://zomato-perks.angysingh.workers.dev/";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* Render the site at its real size (1440x900 / 390x844) and scale it to fit,
     so the frame shows the true desktop or phone layout, not a squashed one. */
  function fit(vp) {
    var f = $("iframe", vp); if (!f) return;
    var s = vp.clientWidth / +vp.dataset.w;
    f.style.transform = "scale(" + s + ")";
  }
  function unload(vp) {
    var f = $("iframe", vp);
    if (f) vp.removeChild(f);
    vp.classList.remove("is-live");
  }
  function launch(key) {
    var vp = $('[data-vp="' + key + '"]');
    unload(vp);
    var f = document.createElement("iframe");
    f.src = SITE;
    f.title = "Zomato Perks live prototype (" + (key === "desk" ? "desktop" : "phone") + ")";
    f.width = vp.dataset.w; f.height = vp.dataset.h;
    f.setAttribute("allow", "autoplay; fullscreen; clipboard-write");
    vp.appendChild(f);
    vp.classList.add("is-live");
    fit(vp);
    f.focus();
  }
  $$("[data-launch]").forEach(function (b) { b.addEventListener("click", function () { launch(b.dataset.launch); }); });
  $$("[data-reload]").forEach(function (b) { b.addEventListener("click", function () { launch(b.dataset.reload); }); });
  if ("ResizeObserver" in window) {
    var ro = new ResizeObserver(function (es) { es.forEach(function (e) { fit(e.target); }); });
    $$(".proto__vp").forEach(function (vp) { ro.observe(vp); });
  }

  /* Desktop / phone toggle. Leaving a mode unloads its iframe so two copies
     of a video-heavy site never run at once. */
  var stage = $(".proto__stage");
  var modeBtns = $$(".proto .seg button");
  modeBtns.forEach(function (b) {
    b.addEventListener("click", function () {
      var mode = b.dataset.mode;
      modeBtns.forEach(function (x) { x.setAttribute("aria-selected", x === b); });
      stage.dataset.mode = mode;
      unload($('[data-vp="' + (mode === "desktop" ? "phone" : "desk") + '"]'));
      $$(".proto__vp").forEach(fit);
    });
  });
  if (window.matchMedia("(max-width: 760px)").matches) {
    var pb = $('.proto .seg [data-mode="phone"]'); if (pb) pb.click();
  }

  /* Phone screen reels */
  var sets = $$(".screens .seg button");
  function reel() { return $(".reel:not([hidden])"); }
  sets.forEach(function (b) {
    b.addEventListener("click", function () {
      sets.forEach(function (x) { x.setAttribute("aria-selected", x === b); });
      $$(".reel").forEach(function (r) { r.hidden = r.dataset.set !== b.dataset.set; r.classList.add("is-in"); r.scrollLeft = 0; });
    });
  });
  $$(".screens__nav .rnd").forEach(function (b) {
    b.addEventListener("click", function () {
      var r = reel(); r.scrollBy({ left: +b.dataset.dir * r.clientWidth * 0.8, behavior: "smooth" });
    });
  });
  // drag to scroll with a mouse; a drag never opens the lightbox
  $$(".reel").forEach(function (r) {
    var down = false, x0 = 0, s0 = 0, moved = false;
    r.addEventListener("pointerdown", function (e) { if (e.pointerType !== "mouse") return; down = true; moved = false; x0 = e.clientX; s0 = r.scrollLeft; r.style.scrollSnapType = "none"; });
    window.addEventListener("pointermove", function (e) { if (!down) return; var dx = e.clientX - x0; if (Math.abs(dx) > 4) moved = true; r.scrollLeft = s0 - dx; });
    window.addEventListener("pointerup", function () { if (!down) return; down = false; r.style.scrollSnapType = ""; });
    r.addEventListener("click", function (e) { if (moved) { e.stopPropagation(); e.preventDefault(); moved = false; } }, true);
    r.addEventListener("dragstart", function (e) { e.preventDefault(); });
  });
})();
