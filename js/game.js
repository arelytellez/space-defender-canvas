const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const levelTxt = document.getElementById("level");
const scoreTxt = document.getElementById("score");
const livesTxt = document.getElementById("lives");
const recordTxt = document.getElementById("highScore");
const levelBar = document.getElementById("levelBar");

const collectSound = document.getElementById("collectSound");

const pauseBtn = document.getElementById("pauseBtn");
const stopBtn = document.getElementById("stopBtn");
const restartBtn = document.getElementById("restartBtn");

const instructionsPanel = document.getElementById("instructionsPanel");
const startGameBtn = document.getElementById("startGameBtn");

/* =====================================================
   🌌 INTRO FULLSCREEN
===================================================== */

const introCanvas = document.getElementById("introCanvas");
const introCtx = introCanvas.getContext("2d");

let introStars = [];
let introStartTime = Date.now();
let introDuration = 10000;
let introFinished = false;
let gameStarted = false; // 🔥 el juego aún no inicia

// 🚀 demo nave
let demoShipX = 200;
let demoShipY = 0;
let demoShipDir = 1;
let demoStarsIntro = [];

// ajustar fullscreen
function resizeIntro() {
  introCanvas.width = window.innerWidth;
  introCanvas.height = window.innerHeight;
}
resizeIntro();
window.addEventListener("resize", resizeIntro);

// ⭐ estrellas fondo sin encimarse
function createIntroStars(total = 80) {
  introStars = [];

  for (let i = 0; i < total; i++) {
    let placed = false, attempts = 0;

    while (!placed && attempts < 2000) {
      attempts++;

      let star = {
        x: Math.random() * introCanvas.width,
        y: Math.random() * introCanvas.height,
        r: Math.random() * 2.5 + 0.5,
        speed: Math.random() * 0.3 + 0.1,
        alpha: Math.random(),
        blink: Math.random() * 0.02 + 0.005
      };

      let collision = introStars.some(s => {
        let dx = s.x - star.x;
        let dy = s.y - star.y;
        return Math.sqrt(dx * dx + dy * dy) < (s.r + star.r + 2);
      });

      if (!collision) {
        introStars.push(star);
        placed = true;
      }
    }
  }
}
createIntroStars();

// ⭐ estrellas grandes estilo juego
function createDemoStarIntro(){

  let attempts = 0;
  let placed = false;

  while(!placed && attempts < 100){
    attempts++;

    let newStar = {
      x: Math.random()*introCanvas.width,
      y: -20,
      r: 6+Math.random()*8,
      vy: 1.2+Math.random()*1.5
    };

    // 🔥 detectar colisión con estrellas existentes
    let collision = demoStarsIntro.some(s=>{
      let dx = s.x - newStar.x;
      let dy = s.y - newStar.y;
      let dist = Math.sqrt(dx*dx + dy*dy);
      return dist < (s.r + newStar.r);
    });

    if(!collision){
      demoStarsIntro.push(newStar);
      placed = true;
    }
  }
}

/* =====================================================
   🚀 NAVE GALÁCTICA (tu función original)
===================================================== */
function drawShip(x, y) {
  ctx.save();
  ctx.translate(x, y);

  ctx.shadowColor = "#00eaff";
  ctx.shadowBlur = 18;

  ctx.beginPath();
  ctx.moveTo(0, -24);
  ctx.lineTo(16, 14);
  ctx.lineTo(6, 8);
  ctx.lineTo(-6, 8);
  ctx.lineTo(-16, 14);
  ctx.closePath();

  const grad = ctx.createLinearGradient(0, -24, 0, 20);
  grad.addColorStop(0, "#ffffff");
  grad.addColorStop(1, "#00eaff");

  ctx.fillStyle = grad;
  ctx.fill();

  ctx.shadowBlur = 0;
  ctx.beginPath();
  ctx.arc(0, -6, 5, 0, Math.PI * 2);
  ctx.fillStyle = "#001a4d";
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(-4, 14);
  ctx.lineTo(0, 26 + Math.random() * 5);
  ctx.lineTo(4, 14);
  ctx.fillStyle = "orange";
  ctx.fill();

  ctx.restore();
}

/* =====================================================
   ✨ ANIMACIÓN INTRO
===================================================== */
function animateIntro() {

  if (introFinished) return;

  introCtx.fillStyle = "black";
  introCtx.fillRect(0, 0, introCanvas.width, introCanvas.height);

  // 🚀 mover nave demo
  demoShipY = introCanvas.height - 120;
  demoShipX += 2.2 * demoShipDir;

  if (demoShipX > introCanvas.width - 80) demoShipDir = -1;
  if (demoShipX < 80) demoShipDir = 1;

  drawShip(demoShipX, demoShipY);

  // ⭐ fondo parpadeante
  introStars.forEach(star => {
    star.y += star.speed;
    if (star.y > introCanvas.height) star.y = 0;

    star.alpha += star.blink;
    if (star.alpha > 1 || star.alpha < 0) star.blink *= -1;

    introCtx.globalAlpha = star.alpha;
    introCtx.fillStyle = "white";
    introCtx.beginPath();
    introCtx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
    introCtx.fill();
  });

  introCtx.globalAlpha = 1;

  // ⭐ spawn estrellas grandes
  if (Math.random() < 0.04) {
    createDemoStarIntro();
  }

  // ⭐ mover estrellas grandes
  for (let i = demoStarsIntro.length - 1; i >= 0; i--) {
    let s = demoStarsIntro[i];
    s.y += s.vy;

    introCtx.save();
    introCtx.beginPath();
    for (let j = 0; j < 5; j++) {
      introCtx.lineTo(
        s.x + s.r * Math.cos((18 + j * 72) * Math.PI / 180),
        s.y - s.r * Math.sin((18 + j * 72) * Math.PI / 180)
      );
      introCtx.lineTo(
        s.x + (s.r / 2) * Math.cos((54 + j * 72) * Math.PI / 180),
        s.y - (s.r / 2) * Math.sin((54 + j * 72) * Math.PI / 180)
      );
    }
    introCtx.closePath();

    const g = introCtx.createRadialGradient(s.x, s.y, 1, s.x, s.y, s.r);
    g.addColorStop(0, "#fff");
    g.addColorStop(1, "#00eaff");
    introCtx.fillStyle = g;
    introCtx.fill();
    introCtx.restore();

    if (s.y > introCanvas.height + 40) {
      demoStarsIntro.splice(i, 1);
    }
  }


  // 🚀 mover nave demo
  demoShipY = introCanvas.height - 120;
  demoShipX += 2.2 * demoShipDir;

  if (demoShipX > introCanvas.width - 80) demoShipDir = -1;
  if (demoShipX < 80) demoShipDir = 1;

  drawShip(demoShipX, demoShipY);

  /* ==============================
   🌟 TEXTO RECOLECTOR ESTELAR
============================== */

  let elapsed = Date.now() - introStartTime;
  let alpha = Math.min(1, elapsed / 1500);

  introCtx.save();
  introCtx.globalAlpha = alpha;

  introCtx.textAlign = "center";
  introCtx.textBaseline = "middle";

  introCtx.font = "bold 72px Orbitron";
  introCtx.fillStyle = "#00eaff";
  introCtx.shadowColor = "#00eaff";
  introCtx.shadowBlur = 30;

  introCtx.fillText(
    "Recolector Estelar",
    introCanvas.width / 2,
    introCanvas.height / 2
  );

  introCtx.restore();

  // ⏱️ terminar intro
  if (Date.now() - introStartTime > introDuration) {
    endIntro();
    return;
  }

  requestAnimationFrame(animateIntro);
}

function endIntro() {
  introFinished = true;
  introCanvas.classList.add("hide");

  setTimeout(() => {
    introCanvas.style.display = "none";

    // 🔥 MOSTRAR instrucciones aquí
    instructionsPanel.style.display = "flex";
    instructionsPanel.style.opacity = "1";

  }, 800);
}

animateIntro();

/* =====================================================
   🎮 ===== TU JUEGO (INTACTO) =====
===================================================== */

let level = 1;
let score = 0;
let lives = 5;
let highScore = localStorage.getItem("starRecord") || 0;

let paused = false;
let gameOver = false;
let progress = 0;

let stars = [];
let explosions = [];
let sparkles = [];
let groundHits = [];

let spawnTimer = 0;
let spawnInterval = 90;

let mouseX = canvas.width / 2;
let mouseY = canvas.height - 60;
const catcherRadius = 26;

/* ===== VIDAS UI ===== */
function updateLivesUI() {
  livesTxt.innerHTML = "";
  for (let i = 0; i < 5; i++) {
    const s = document.createElement("span");
    s.textContent = "⭐";
    if (i >= lives) s.classList.add("life-lost");
    livesTxt.appendChild(s);
  }
}
updateLivesUI();

/* ===== SONIDO ===== */
function playCollectSound() {
  collectSound.currentTime = 0;
  collectSound.play().catch(() => { });
}

/* ===== SHAKE ===== */
function triggerScreenShake() {
  canvas.classList.remove("shake");
  void canvas.offsetWidth;
  canvas.classList.add("shake");
}

/* ===== CREAR ESTRELLA ===== */
function createStar(){

  const size = 6 + Math.random()*10;
  const speedBase = 1 + level*0.35;

  let attempts = 0;
  let placed = false;

  while(!placed && attempts < 150){
    attempts++;

    let newStar = {
      x: size + Math.random()*(canvas.width - size*2),
      y: -size,
      r: size,
      vx: (Math.random()-0.5)*1.2,
      vy: speedBase + Math.random()*1.2,
      missed:false,
      missTimer:0,
      colorOverride:null
    };

    // 🔥 COLISIÓN REAL POR BORDE
    let collision = stars.some(s=>{
      let dx = s.x - newStar.x;
      let dy = s.y - newStar.y;
      let dist = Math.sqrt(dx*dx + dy*dy);
      return dist < (s.r + newStar.r);
    });

    if(!collision){
      stars.push(newStar);
      placed = true;
    }
  }
}

/* ===== EXPLOSION ===== */
function createExplosion(x, y) {
  for (let i = 0; i < 12; i++) {
    explosions.push({
      x, y,
      vx: (Math.random() - 0.5) * 4,
      vy: (Math.random() - 0.5) * 4,
      life: 30 + Math.random() * 10
    });
  }
}

/* ===== SUELO ===== */
function createGroundHit(x) {
  groundHits.push({
    x,
    y: canvas.height - 4,
    life: 20,
    radius: 8
  });
}

/* ===== SPARKLES ===== */
function createSparkle() {
  sparkles.push({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    r: Math.random() * 1.5,
    life: 60 + Math.random() * 60
  });
}

/* ===== UPDATE ===== */
function update() {
  if (paused || gameOver || !introFinished || !gameStarted) return;

  progress += 0.05 + level * 0.01;
  levelBar.style.width = Math.min(progress, 100) + "%";

  if (progress >= 100) {
    level++;
    progress = 0;
    spawnInterval = Math.max(25, spawnInterval - 8);
  }

  spawnTimer++;
  if (spawnTimer >= spawnInterval) {
    createStar();
    spawnTimer = 0;
  }

  for (let i = stars.length - 1; i >= 0; i--) {
    const s = stars[i];

    s.x += s.vx;
    s.y += s.vy;

    if (s.x - s.r < 0) { s.x = s.r; s.vx *= -1; }
    if (s.x + s.r > canvas.width) { s.x = canvas.width - s.r; s.vx *= -1; }

    if (!s.missed && s.y + s.r >= canvas.height) {
      s.y = canvas.height - s.r;
      s.missed = true;
      s.missTimer = 60;
      s.colorOverride = "red";

      createExplosion(s.x, canvas.height - 10);
      createGroundHit(s.x);
      triggerScreenShake();

      lives = Math.max(0, lives - 1);
      updateLivesUI();

      if (lives <= 0) gameOver = true;
    }

    if (s.missed) {
      s.missTimer--;
      if (s.missTimer <= 0) {
        stars.splice(i, 1);
        continue;
      }
    }

    const d = Math.hypot(s.x - mouseX, s.y - mouseY);
    if (!s.missed && d < s.r + catcherRadius) {
      score += 10;
      createExplosion(s.x, s.y);
      playCollectSound();
      stars.splice(i, 1);
      continue;
    }
  }

  if (score > highScore) {
    highScore = score;
    localStorage.setItem("starRecord", highScore);
  }

  levelTxt.textContent = level;
  scoreTxt.textContent = score;
  recordTxt.textContent = highScore;
}

/* ===== DRAW ===== */
function draw() {
  if (!introFinished) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (Math.random() < 0.25) createSparkle();

  for (let i = sparkles.length - 1; i >= 0; i--) {
    const s = sparkles[i];
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fillStyle = "white";
    ctx.fill();
    s.life--;
    if (s.life <= 0) sparkles.splice(i, 1);
  }

  stars.forEach(s => {
    drawStar(s.x, s.y, s.r, s.colorOverride);
  });

  drawShip(mouseX, mouseY);

  if (gameOver) {
    ctx.fillStyle = "red";
    ctx.font = "48px Arial";
    ctx.fillText("GAME OVER", canvas.width / 2 - 140, canvas.height / 2);
  }
}

/* ===== DIBUJAR ESTRELLA ===== */
function drawStar(x, y, r, colorOverride) {
  ctx.save();
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    ctx.lineTo(
      x + r * Math.cos((18 + i * 72) * Math.PI / 180),
      y - r * Math.sin((18 + i * 72) * Math.PI / 180)
    );
    ctx.lineTo(
      x + (r / 2) * Math.cos((54 + i * 72) * Math.PI / 180),
      y - (r / 2) * Math.sin((54 + i * 72) * Math.PI / 180)
    );
  }
  ctx.closePath();

  if (colorOverride) {
    ctx.fillStyle = colorOverride;
  } else {
    const g = ctx.createRadialGradient(x, y, 1, x, y, r);
    g.addColorStop(0, "#fff");
    g.addColorStop(1, "#00eaff");
    ctx.fillStyle = g;
  }

  ctx.fill();
  ctx.restore();
}

/* ===== LOOP ===== */
function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}
loop();

/* ===== MOUSE ===== */
canvas.addEventListener("mousemove", e => {
  const rect = canvas.getBoundingClientRect();
  mouseX = e.clientX - rect.left;
});

/* ===== BOTONES ===== */
pauseBtn.onclick = () => { if (!gameOver) paused = true; };
stopBtn.onclick = () => { if (!gameOver) paused = false; };

restartBtn.onclick = () => {
  level = 1;
  score = 0;
  lives = 5;
  progress = 0;

  stars = [];
  explosions = [];
  sparkles = [];
  groundHits = [];

  spawnTimer = 0;
  spawnInterval = 90;

  paused = false;
  gameOver = false;

  updateLivesUI();
  levelBar.style.width = "0%";
};
startGameBtn.addEventListener("click", function(){

  instructionsPanel.style.opacity = "0";

  setTimeout(()=>{
    instructionsPanel.style.display = "none";

    // 🔥 AQUÍ reiniciamos todo limpio
    level = 1;
    score = 0;
    lives = 5;
    progress = 0;

    stars = [];
    explosions = [];
    sparkles = [];
    groundHits = [];

    spawnTimer = 0;
    spawnInterval = 90;

    paused = false;
    gameOver = false;

    updateLivesUI();
    levelBar.style.width = "0%";

    gameStarted = true; // 🚀 AHORA SÍ inicia
  },300);

});

