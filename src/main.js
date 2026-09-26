(() => {
  // Local mean solar times for the displayed site, in minutes after midnight.
  const SUNRISE = 6 * 60 + 5;
  const SUNSET = 16 * 60 + 34;

  // Timeline: 80 ticks, sunrise on tick 8, sunset on tick 71 (~10 min per tick).
  const TICKS = 80;
  const SUNRISE_TICK = 8;
  const SUNSET_TICK = 71;
  const MIN_PER_TICK = (SUNSET - SUNRISE) / (SUNSET_TICK - SUNRISE_TICK);

  const ZONES = 24; // 15° of longitude each, Zone #1 = Coordinated Mars Time
  let zone = 0;

  const $ = (id) => document.getElementById(id);
  const timeline = $("timeline");

  const pad = (n) => String(n).padStart(2, "0");
  const hm = (min, padHour = true) => {
    const m = ((Math.floor(min) % 1440) + 1440) % 1440;
    const h = Math.floor(m / 60);
    return `${padHour ? pad(h) : h}:${pad(m % 60)}`;
  };

  // Coordinated Mars Time in hours (Allison & McEwen 2000 / Mars24 algorithm).
  function marsHours(ms) {
    const jdUT = ms / 86400000 + 2440587.5;
    const jdTT = jdUT + (37 + 32.184) / 86400;
    const msd = (jdTT - 2405522.0028779) / 1.0274912517;
    return (((24 * msd) % 24) + 24) % 24;
  }

  function tick(src, w, h) {
    const img = document.createElement("img");
    img.src = src;
    img.width = w;
    img.height = h;
    img.alt = "";
    return img;
  }

  function renderTicks(nowIdx) {
    timeline.querySelectorAll("img[data-tick]").forEach((n) => n.remove());
    const frag = document.createDocumentFragment();
    const imgs = [];
    for (let i = 0; i < TICKS; i++) {
      let img;
      if (i === nowIdx) img = tick("/images/tick-now.svg", 1, 15);
      else if (i === nowIdx - 1 || i === nowIdx + 1) img = tick("/images/tick-now-side.svg", 1, 7);
      else if (i === SUNRISE_TICK || i === SUNSET_TICK) img = tick("/images/tick-hour.svg", 1, 15);
      else img = tick("/images/tick-small.svg", 1, 3);
      img.dataset.tick = i;
      imgs.push(img);
      frag.appendChild(img);
    }
    timeline.appendChild(frag);
    return imgs;
  }

  let ticks = [];
  let lastNowIdx = -1;

  function centerOn(el, tickEl) {
    el.style.left = `${tickEl.offsetLeft + tickEl.offsetWidth / 2}px`;
  }

  function layoutLabels() {
    if (!ticks.length) return;
    centerOn($("now-label"), ticks[lastNowIdx]);
    centerOn($("sunrise-mark"), ticks[SUNRISE_TICK]);
    centerOn($("sunset-mark"), ticks[SUNSET_TICK]);
  }

  function update() {
    const now = Date.now();
    const mtcH = marsHours(now);
    const localH = (mtcH + zone) % 24;
    const localMin = localH * 60;
    const secs = Math.floor((localH * 3600) % 60);

    $("clock-hm").textContent = hm(localMin);
    $("clock-s").textContent = pad(secs);

    // Time until next sunset
    let untilSunset = SUNSET - localMin;
    if (untilSunset < 0) untilSunset += 1440;
    const uh = Math.floor(untilSunset / 60);
    const um = Math.floor(untilSunset % 60);
    $("to-sunset").innerHTML = `${uh}h<span class="badge__gap"> </span>${um}m`;

    // Timeline "now" marker, clamped so its side ticks stay inside the bar
    const idx = Math.round(SUNRISE_TICK + (localMin - SUNRISE) / MIN_PER_TICK);
    const nowIdx = Math.min(TICKS - 2, Math.max(1, idx));
    if (nowIdx !== lastNowIdx) {
      lastNowIdx = nowIdx;
      ticks = renderTicks(nowIdx);
      layoutLabels();
    }
    $("now-label").textContent = hm(localMin);

    // Details
    const d = new Date(now);
    const utcMin = d.getUTCHours() * 60 + d.getUTCMinutes() + d.getUTCSeconds() / 60;
    const mtcMin = mtcH * 60;
    let delta = utcMin - mtcMin;
    if (delta > 720) delta -= 1440;
    if (delta <= -720) delta += 1440;
    $("delta").textContent = `${hm(Math.abs(delta), false)} ${delta >= 0 ? "+" : "−"}`;
    $("utc").textContent = hm(utcMin);
    $("mtc").textContent = hm(mtcMin);
  }

  $("zone").addEventListener("click", () => {
    zone = (zone + 1) % ZONES;
    $("zone-label").textContent = `Time Zone #${zone + 1}`;
    update();
  });

  $("sunrise-label").textContent = hm(SUNRISE, false);
  $("sunset-label").textContent = hm(SUNSET, false);

  update();
  setInterval(update, 1000);
  window.addEventListener("resize", layoutLabels);
  document.fonts?.ready.then(layoutLabels);
})();
