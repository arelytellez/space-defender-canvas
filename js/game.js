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

/* ===== ESTADO ===== */
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

/* ===== SPAWN POR NIVEL ===== */
let spawnTimer = 0;
let spawnInterval = 90;

/* ===== MOUSE ===== */
let mouseX = canvas.width / 2;
let mouseY = canvas.height - 60;
const catcherRadius = 26;

/* ===== VIDAS UI ===== */
function updateLivesUI(){
  livesTxt.innerHTML = "";
  for(let i = 0; i < 5; i++){
    const s = document.createElement("span");
    s.textContent = "⭐";
    if(i >= lives) s.classList.add("life-lost");
    livesTxt.appendChild(s);
  }
}
updateLivesUI();

/* ===== SONIDO ===== */
function playCollectSound(){
  collectSound.currentTime = 0;
  collectSound.play().catch(()=>{});
}

/* ===== SCREEN SHAKE ===== */
function triggerScreenShake(){
  canvas.classList.remove("shake");
  void canvas.offsetWidth;
  canvas.classList.add("shake");
}

/* ===== 🚀 NAVE GALÁCTICA ===== */
function drawShip(x, y){
  ctx.save();
  ctx.translate(x, y);

  // glow gamer
  ctx.shadowColor = "#00eaff";
  ctx.shadowBlur = 18;

  // ===== CUERPO =====
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

  // ===== CABINA =====
  ctx.shadowBlur = 0;
  ctx.beginPath();
  ctx.arc(0, -6, 5, 0, Math.PI * 2);
  ctx.fillStyle = "#001a4d";
  ctx.fill();

  // ===== FLAMA =====
  ctx.beginPath();
  ctx.moveTo(-4, 14);
  ctx.lineTo(0, 26 + Math.random()*5);
  ctx.lineTo(4, 14);
  ctx.fillStyle = "orange";
  ctx.fill();

  ctx.restore();
}

/* ===== CREAR ESTRELLA ===== */
function createStar(){
  const size = 6 + Math.random() * 10;
  const speedBase = 1 + level * 0.35;

  stars.push({
    x: size + Math.random() * (canvas.width - size * 2),
    y: -size,
    r: size,
    vx: (Math.random() - 0.5) * 1.2,
    vy: speedBase + Math.random() * 1.2,
    missed: false,
    missTimer: 0,
    colorOverride: null
  });
}

/* ===== EXPLOSION ===== */
function createExplosion(x, y){
  for(let i = 0; i < 12; i++){
    explosions.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 4,
      vy: (Math.random() - 0.5) * 4,
      life: 30 + Math.random() * 10
    });
  }
}

/* ===== EFECTO SUELO ===== */
function createGroundHit(x){
  groundHits.push({
    x: x,
    y: canvas.height - 4,
    life: 20,
    radius: 8
  });
}

/* ===== DESTELLOS ===== */
function createSparkle(){
  sparkles.push({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    r: Math.random() * 1.5,
    life: 60 + Math.random() * 60
  });
}

/* ===== UPDATE ===== */
function update(){
  if(paused || gameOver) return;

  progress += 0.05 + level * 0.01;
  levelBar.style.width = Math.min(progress, 100) + "%";

  if(progress >= 100){
    level++;
    progress = 0;
    spawnInterval = Math.max(25, spawnInterval - 8);
  }

  spawnTimer++;
  if(spawnTimer >= spawnInterval){
    createStar();
    spawnTimer = 0;
  }

  for(let i = stars.length - 1; i >= 0; i--){
    const s = stars[i];

    s.x += s.vx;
    s.y += s.vy;

    if(s.x - s.r < 0){
      s.x = s.r;
      s.vx *= -1;
    }
    if(s.x + s.r > canvas.width){
      s.x = canvas.width - s.r;
      s.vx *= -1;
    }

    if(!s.missed && s.y + s.r >= canvas.height){
      s.y = canvas.height - s.r;
      s.missed = true;
      s.missTimer = 60;
      s.colorOverride = "red";

      createExplosion(s.x, canvas.height - 10);
      createGroundHit(s.x);
      triggerScreenShake();

      lives = Math.max(0, lives - 1);
      updateLivesUI();

      if(lives <= 0) gameOver = true;
    }

    if(s.missed){
      s.missTimer--;
      if(s.missTimer <= 0){
        stars.splice(i, 1);
        continue;
      }
    }

    const d = Math.hypot(s.x - mouseX, s.y - mouseY);
    if(!s.missed && d < s.r + catcherRadius){
      score += 10;
      createExplosion(s.x, s.y);
      playCollectSound();
      stars.splice(i, 1);
      continue;
    }
  }

  if(score > highScore){
    highScore = score;
    localStorage.setItem("starRecord", highScore);
  }

  levelTxt.textContent = level;
  scoreTxt.textContent = score;
  recordTxt.textContent = highScore;
}

/* ===== DRAW ===== */
function draw(){
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if(Math.random() < 0.25) createSparkle();

  for(let i = sparkles.length - 1; i >= 0; i--){
    const s = sparkles[i];
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fillStyle = "white";
    ctx.fill();
    s.life--;
    if(s.life <= 0) sparkles.splice(i, 1);
  }

  stars.forEach(s => {
    drawStar(s.x, s.y, s.r, s.colorOverride);
  });

  for(let i = explosions.length - 1; i >= 0; i--){
    const p = explosions[i];
    ctx.beginPath();
    ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
    ctx.fillStyle = "cyan";
    ctx.fill();
    p.x += p.vx;
    p.y += p.vy;
    p.life--;
    if(p.life <= 0) explosions.splice(i, 1);
  }

  for(let i = groundHits.length - 1; i >= 0; i--){
    const g = groundHits[i];
    ctx.beginPath();
    ctx.arc(g.x, g.y, g.radius, 0, Math.PI * 2);
    ctx.strokeStyle = "red";
    ctx.lineWidth = 2;
    ctx.stroke();
    g.radius += 1.2;
    g.life--;
    if(g.life <= 0) groundHits.splice(i, 1);
  }

  // 🚀 NAVE DEL JUGADOR
  drawShip(mouseX, mouseY);

  if(gameOver){
    ctx.fillStyle = "red";
    ctx.font = "48px Arial";
    ctx.fillText("GAME OVER", canvas.width/2 - 140, canvas.height/2);
  }
}

/* ===== DIBUJAR ESTRELLA ===== */
function drawStar(x,y,r,colorOverride){
  ctx.save();
  ctx.beginPath();
  for(let i=0;i<5;i++){
    ctx.lineTo(
      x + r*Math.cos((18+i*72)*Math.PI/180),
      y - r*Math.sin((18+i*72)*Math.PI/180)
    );
    ctx.lineTo(
      x + (r/2)*Math.cos((54+i*72)*Math.PI/180),
      y - (r/2)*Math.sin((54+i*72)*Math.PI/180)
    );
  }
  ctx.closePath();

  if(colorOverride){
    ctx.fillStyle = colorOverride;
  }else{
    const g = ctx.createRadialGradient(x,y,1,x,y,r);
    g.addColorStop(0,"#fff");
    g.addColorStop(1,"#00eaff");
    ctx.fillStyle = g;
  }

  ctx.fill();
  ctx.restore();
}

/* ===== LOOP ===== */
function loop(){
  update();
  draw();
  requestAnimationFrame(loop);
}

/* ===== EVENTOS ===== */
canvas.addEventListener("mousemove", e=>{
  const rect = canvas.getBoundingClientRect();
  mouseX = e.clientX - rect.left;
});

/* ===== BOTONES ===== */

// 🔴 PAUSAR
pauseBtn.onclick = () => {
  if(gameOver) return;
  paused = true;
};

// 🟢 CONTINUAR
stopBtn.onclick = () => {
  if(gameOver) return;
  paused = false;
};

// 🔄 REINICIAR
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

/* ===== START ===== */
loop();