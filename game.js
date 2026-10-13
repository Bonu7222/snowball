// ===== SNOWBALL DASH =====
const canvas = document.getElementById("gameCanvas") || document.getElementById("game") || document.querySelector("canvas");
const ctx = canvas.getContext("2d");
const W = canvas.width, H = canvas.height;

// ------------------------ LEVELS -----------------
const LEVELS = [
  { name: "Snowy Hills", length: 6000, speed: 4, gap: 190, double: 0.1,
    types: ["tree", "tree", "rock", "snowman"], top: "#eaf4ff", bottom: "#cfe6fa" },
  { name: "Pine Forest", length: 8000, speed: 4.5, gap: 160, double: 0.25,
    types: ["tree", "tree", "tree", "rock", "ice", "snowman"], top: "#e3f1e8", bottom: "#bfdccb" },
  { name: "Icy Lake", length: 10000, speed: 5, gap: 140, double: 0.3,
    types: ["ice", "ice", "tree", "rock", "log", "snowman"], top: "#dff3ff", bottom: "#a9d8f5" },
  { name: "Rocky Ridge", length: 12000, speed: 5.5, gap: 125, double: 0.4,
    types: ["rock", "rock", "log", "tree", "ice", "snowman"], top: "#e9e6ee", bottom: "#c3bccd" },
  { name: "Avalanche!", length: 15000, speed: 6, gap: 110, double: 0.5,
    types: ["rock", "tree", "log", "ice", "snowman"], top: "#f3e4e4", bottom: "#e0b7b7" },
];

const HARMFUL = ["tree", "rock", "log"];
const BASE_R = 16, MAX_SIZE = 14;

// ------------------------ GAME STATE -----------------
let state = "menu"; // menu | playing | paused | levelComplete | gameover | win
let levelIndex = 0, dist = 0, score = 0, lives = 3;
let invuln = 0, shield = false, onIce = false, nextSpawn = 0;
let objects = [], particles = [];
const ball = { x: W / 2, y: 480, vx: 0, size: 0 };
const flakes = Array.from({ length: 50 }, () => ({
  x: Math.random() * W, y: Math.random() * H, z: 0.3 + Math.random(),
}));
let highScore = 0;
try { highScore = Number(localStorage.getItem("snowballHigh")) || 0; } catch (e) {}

const rand = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const radius = () => BASE_R + ball.size;

// ------------------------ CONTROL -----------------
const keys = {};
document.addEventListener("keydown", (e) => {
  if (["ArrowLeft", "ArrowRight", " "].includes(e.key)) e.preventDefault();
  keys[e.key.toLowerCase()] = true;
  if (e.repeat) return;
  const k = e.key.toLowerCase();
  if (k === "enter" || k === " ") {
    if (state === "menu" || state === "gameover" || state === "win") newGame();
    else if (state === "levelComplete") startLevel(levelIndex + 1);
    else if (state === "paused") state = "playing";
  }
  if (k === "p") {
    if (state === "playing") state = "paused";
    else if (state === "paused") state = "playing";
  }
});
document.addEventListener("keyup", (e) => (keys[e.key.toLowerCase()] = false));

// ------------------------ GAME CONTROL -----------------
function newGame() {
  score = 0; lives = 3; shield = false;
  startLevel(0);
}

function startLevel(i) {
  levelIndex = i;
  dist = 0; objects = []; particles = [];
  nextSpawn = 200; invuln = 0; onIce = false;
  ball.x = W / 2; ball.vx = 0; ball.size = 0;
  state = "playing";
}

function endGame(newState) {
  state = newState;
  if (score > highScore) {
    highScore = score;
    try { localStorage.setItem("snowballHigh", String(highScore)); } catch (e) {}
  }
}

// ------------------------ CREATING THINGS -----------------
function makeObject(type, x, y) {
  switch (type) {
    case "tree":    return { type, x, y, r: 18 };
    case "rock":    return { type, x, y, r: 15 };
    case "log":     return { type, x: clamp(x, 55, W - 55), y, w: 90, h: 18 };
    case "ice":     return { type, x, y, rx: 55, ry: 30 };
    case "snowman": return { type, x, y, r: 14 };
    case "shield":  return { type, x, y, r: 13 };
  }
}

function spawn(lv) {
  const used = [];
  const count = Math.random() < lv.double ? 2 : 1;
  for (let i = 0; i < count; i++) {
    let type = pick(lv.types);
    if (Math.random() < 0.04) type = "shield";
    let x, tries = 0;
    do { x = rand(40, W - 40); tries++; } while (used.some((u) => Math.abs(u - x) < 130) && tries < 10);
    used.push(x);
    objects.push(makeObject(type, x, H + 60));
  }
  if (Math.random() < 0.45) {
    const cx = rand(40, W - 40);
    for (let k = 0; k < 3; k++) objects.push({ type: "coin", x: cx, y: H + 60 + k * 34, r: 9 });
  }
  nextSpawn = lv.gap * rand(0.7, 1.3);
}

function burst(x, y, color, n = 8) {
  for (let i = 0; i < n; i++) {
    particles.push({ x, y, vx: rand(-2, 2), vy: rand(-2, 2), life: rand(15, 30), color });
  }
}

function hurt() {
  if (invuln > 0) return;
  if (shield) { shield = false; invuln = 60; burst(ball.x, ball.y, "#5aa9ff", 14); return; }
  lives--;
  ball.size = Math.max(0, ball.size - 5);
  invuln = 100;
  ball.vx = (Math.random() < 0.5 ? -1 : 1) * 5;
  burst(ball.x, ball.y, "#ffffff", 14);
  if (lives <= 0) endGame("gameover");
}

// ------------------------ UPDATE -----------------
function update(dt) {
  const lv = LEVELS[levelIndex];
  const speed = lv.speed * (1 + (dist / lv.length) * 0.25);

  // boshqaruv (muzda sirpanadi)
  const accel = onIce ? 0.45 : 0.9;
  if (keys["arrowleft"] || keys["a"]) ball.vx -= accel * dt;
  if (keys["arrowright"] || keys["d"]) ball.vx += accel * dt;
  ball.vx *= Math.pow(onIce ? 0.985 : 0.86, dt);
  ball.vx = clamp(ball.vx, -7, 7);
  ball.x += ball.vx * dt;
  const R = radius();
  if (ball.x < R) { ball.x = R; ball.vx = 0; }
  if (ball.x > W - R) { ball.x = W - R; ball.vx = 0; }

  dist += speed * dt;
  score += 0.05 * speed * dt;
  if (invuln > 0) invuln -= dt;

  // spawn
  nextSpawn -= speed * dt;
  if (nextSpawn <= 0 && lv.length - dist > 350) spawn(lv);

  // ACTION
  onIce = false;
  for (let i = objects.length - 1; i >= 0; i--) {
    const o = objects[i];
    o.y -= speed * dt;
    if (o.y < -80) { objects.splice(i, 1); continue; }

    if (o.type === "ice") {
      const nx = (ball.x - o.x) / o.rx, ny = (ball.y - o.y) / o.ry;
      if (nx * nx + ny * ny < 1) onIce = true;
    } else if (o.type === "log") {
      const cx = clamp(ball.x, o.x - o.w / 2, o.x + o.w / 2);
      const cy = clamp(ball.y, o.y - o.h / 2, o.y + o.h / 2);
      if (Math.hypot(ball.x - cx, ball.y - cy) < R * 0.9) hurt();
    } else {
      const reach = R + o.r * (HARMFUL.includes(o.type) ? 0.8 : 1);
      if (Math.hypot(ball.x - o.x, ball.y - o.y) < reach) {
        if (HARMFUL.includes(o.type)) {
          hurt();
        } else {
          if (o.type === "coin") { score += 10; burst(o.x, o.y, "#ffc83d"); }
          if (o.type === "snowman") {
            ball.size = Math.min(MAX_SIZE, ball.size + 3);
            score += 5; burst(o.x, o.y, "#ffffff");
          }
          if (o.type === "shield") { shield = true; burst(o.x, o.y, "#5aa9ff"); }
          objects.splice(i, 1);
        }
      }
    }
  }
  if (state !== "playing") return;

  // marra chizig'i
  if (dist >= lv.length) {
    score += 100 + lives * 50;
    endGame(levelIndex === LEVELS.length - 1 ? "win" : "levelComplete");
    return;
  }

  // iz zarralari
  if (Math.random() < 0.7) {
    particles.push({ x: ball.x + rand(-R, R), y: ball.y + R * 0.7, vx: rand(-0.5, 0.5), vy: -speed * 0.5, life: 20, color: "#ffffff" });
  }
}

function updateParticles(dt) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt;
    if (p.life <= 0) particles.splice(i, 1);
  }
}

// ------------------------ DRAWING -----------------
function drawObject(o) {
  if (o.type === "tree") {
    ctx.fillStyle = "#6b4226";
    ctx.fillRect(o.x - 4, o.y + 8, 8, 14);
    for (let i = 0; i < 3; i++) {
      const y = o.y + 10 - i * 14, tw = 24 - i * 5;
      ctx.beginPath();
      ctx.moveTo(o.x, y - 16); ctx.lineTo(o.x - tw, y + 4); ctx.lineTo(o.x + tw, y + 4);
      ctx.closePath();
      ctx.fillStyle = "#2f7d4f"; ctx.fill();
      ctx.beginPath();
      ctx.moveTo(o.x, y - 16); ctx.lineTo(o.x - tw * 0.45, y - 5); ctx.lineTo(o.x + tw * 0.45, y - 5);
      ctx.closePath();
      ctx.fillStyle = "#ffffff"; ctx.fill();
    }
  } else if (o.type === "rock") {
    ctx.beginPath(); ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
    ctx.fillStyle = "#7d8590"; ctx.fill();
    ctx.beginPath(); ctx.arc(o.x - 4, o.y - 4, o.r * 0.45, 0, Math.PI * 2);
    ctx.fillStyle = "#a6adb7"; ctx.fill();
  } else if (o.type === "log") {
    ctx.fillStyle = "#7a4a24";
    ctx.fillRect(o.x - o.w / 2, o.y - o.h / 2, o.w, o.h);
    ctx.fillStyle = "#a06a3a";
    ctx.fillRect(o.x - o.w / 2, o.y - o.h / 2, o.w, 5);
    ctx.fillStyle = "#5c3817";
    ctx.beginPath(); ctx.arc(o.x - o.w / 2, o.y, o.h / 2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(o.x + o.w / 2, o.y, o.h / 2, 0, Math.PI * 2); ctx.fill();
  } else if (o.type === "ice") {
    ctx.beginPath(); ctx.ellipse(o.x, o.y, o.rx, o.ry, 0, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(140, 205, 255, 0.55)"; ctx.fill();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.8)"; ctx.lineWidth = 2; ctx.stroke();
  } else if (o.type === "coin") {
    ctx.beginPath(); ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
    ctx.fillStyle = "#ffc83d"; ctx.fill();
    ctx.strokeStyle = "#d99a00"; ctx.lineWidth = 2; ctx.stroke();
  } else if (o.type === "snowman") {
    // pastki va yuqori shar
    ctx.fillStyle = "#ffffff"; ctx.strokeStyle = "#7fb4e6"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(o.x, o.y + 5, 10, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(o.x, o.y - 7, 7, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    // ko'zlar va sabzi burun
    ctx.fillStyle = "#1b2a41";
    ctx.fillRect(o.x - 3, o.y - 9, 2, 2); ctx.fillRect(o.x + 1, o.y - 9, 2, 2);
    ctx.fillStyle = "#ff8a1f";
    ctx.beginPath(); ctx.moveTo(o.x, o.y - 6); ctx.lineTo(o.x + 6, o.y - 5); ctx.lineTo(o.x, o.y - 4); ctx.closePath(); ctx.fill();
  } else if (o.type === "shield") {
    ctx.beginPath(); ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
    ctx.fillStyle = "#cfe6ff"; ctx.fill();
    ctx.strokeStyle = "#2f7de0"; ctx.lineWidth = 3; ctx.stroke();
  }
}

function drawBall() {
  if (invuln > 0 && Math.floor(invuln / 6) % 2 === 0) return;
  const R = radius();
  ctx.beginPath(); ctx.arc(ball.x, ball.y, R, 0, Math.PI * 2);
  ctx.fillStyle = "#ffffff"; ctx.fill();
  ctx.strokeStyle = "#8fb8de"; ctx.lineWidth = 3; ctx.stroke();

  const a = dist * 0.05 + ball.x * 0.03;
  ctx.beginPath(); ctx.arc(ball.x, ball.y, R * 0.6, a, a + 1.2);
  ctx.strokeStyle = "#c5dcf2"; ctx.lineWidth = 3; ctx.stroke();
  if (shield) {
    ctx.beginPath(); ctx.arc(ball.x, ball.y, R + 6, 0, Math.PI * 2);
    ctx.strokeStyle = "#2f7de0"; ctx.lineWidth = 3; ctx.stroke();
  }
}

function drawFinish(y) {
  const sq = 20;
  for (let x = 0; x < W; x += sq) {
    for (let r = 0; r < 2; r++) {
      ctx.fillStyle = (x / sq + r) % 2 === 0 ? "#111111" : "#ffffff";
      ctx.fillRect(x, y - sq + r * sq, sq, sq);
    }
  }
  ctx.fillStyle = "#c0392b";
  ctx.fillRect(0, y - 70, 8, 70); ctx.fillRect(W - 8, y - 70, 8, 70);
  ctx.fillRect(0, y - 70, W, 24);
  ctx.fillStyle = "#ffffff"; ctx.font = "bold 16px sans-serif"; ctx.textAlign = "center";
  ctx.fillText("FINISH", W / 2, y - 53);
}

function drawHUD() {
  const lv = LEVELS[levelIndex];
  ctx.textAlign = "left"; ctx.fillStyle = "#1b2a41"; ctx.font = "bold 15px sans-serif";
  ctx.fillText(`Level ${levelIndex + 1}: ${lv.name}`, 12, 24);
  ctx.textAlign = "right";
  ctx.fillText(`Score: ${Math.floor(score)}`, W - 12, 24);
  ctx.fillStyle = "#d63b3b"; ctx.textAlign = "left"; ctx.font = "18px sans-serif";
  ctx.fillText("\u2665".repeat(Math.max(0, lives)), 12, 48);
  // progress bar
  ctx.fillStyle = "rgba(27,42,65,0.2)"; ctx.fillRect(12, 58, W - 24, 8);
  ctx.fillStyle = "#2f7de0"; ctx.fillRect(12, 58, (W - 24) * Math.min(1, dist / lv.length), 8);
}

function overlay(title, lines) {
  ctx.fillStyle = "rgba(27,42,65,0.78)"; ctx.fillRect(0, 0, W, H);
  ctx.textAlign = "center"; ctx.fillStyle = "#ffffff";
  ctx.font = "bold 36px sans-serif"; ctx.fillText(title, W / 2, 230);
  ctx.font = "16px sans-serif";
  lines.forEach((t, i) => ctx.fillText(t, W / 2, 285 + i * 28));
}

function draw() {
  const lv = LEVELS[levelIndex];
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, lv.top); g.addColorStop(1, lv.bottom);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

  // yer chiziqlari (harakat ko'rinishi uchun)
  ctx.strokeStyle = "rgba(255,255,255,0.5)"; ctx.lineWidth = 2;
  for (let y = -(dist % 80); y < H; y += 80) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }

  // yog'ayotgan qor
  ctx.fillStyle = "rgba(255,255,255,0.8)";
  const flowSpeed = state === "playing" ? lv.speed : 1.5;
  flakes.forEach((f) => {
    f.y -= flowSpeed * f.z * 0.4; f.x += Math.sin(f.y * 0.02) * 0.3;
    if (f.y < -5) { f.y = H + 5; f.x = Math.random() * W; }
    ctx.beginPath(); ctx.arc(f.x, f.y, 1.5 * f.z + 0.5, 0, Math.PI * 2); ctx.fill();
  });

  if (state === "menu") {
    overlay("SNOWBALL DASH", [
      "Steer with \u2190 \u2192 or A / D",
      "Collect coins and snowmen, dodge trees, rocks and logs",
      "Ice makes you slide. Blue rings are shields.",
      "",
      "Press ENTER to start",
      `High score: ${Math.floor(highScore)}`,
    ]);
    return;
  }

  objects.filter((o) => o.type === "ice").forEach(drawObject);
  const finishY = ball.y + (lv.length - dist);
  if (finishY < H + 80) drawFinish(finishY);
  objects.filter((o) => o.type !== "ice").forEach(drawObject);

  particles.forEach((p) => {
    ctx.globalAlpha = Math.max(0, p.life / 25);
    ctx.fillStyle = p.color;
    ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, Math.PI * 2); ctx.fill();
  });
  ctx.globalAlpha = 1;

  drawBall();
  drawHUD();

  if (state === "paused") overlay("Paused", ["Press P or ENTER to continue"]);
  if (state === "levelComplete") overlay("Level complete!", [`Score: ${Math.floor(score)}`, `Next: ${LEVELS[levelIndex + 1].name}`, "Press ENTER to continue"]);
  if (state === "gameover") overlay("Game over", [`Score: ${Math.floor(score)}`, `High score: ${Math.floor(highScore)}`, "Press ENTER to try again"]);
  if (state === "win") overlay("You made it!", [`Final score: ${Math.floor(score)}`, `High score: ${Math.floor(highScore)}`, "Press ENTER to play again"]);
}

// ------------------------ MAIN LOOP -----------------
let last = performance.now();
function loop(t) {
  const dt = Math.min(3, (t - last) / 16.667);
  last = t;
  if (state === "playing") update(dt);
  if (state !== "paused" && state !== "menu") updateParticles(dt);
  draw();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);