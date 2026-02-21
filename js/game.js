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

/* ===== CREAR ESTRELLA (FIX CANVAS) ===== */
function createStar(){
  const size = 6 + Math.random() * 10;
  const speedBase = 1 + level * 0.35;

  stars.push({
    x: size + Math.random() * (canvas.width - size * 2),
    y: -size,
    r: size,
    vx: (Math.random() - 0.5) * 1.2,
    vy: speedBase + Math.random() * 1.2
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

  /* ===== PROGRESO NIVEL ===== */
  progress += 0.05 + level * 0.01;
  levelBar.style.width = Math.min(progress, 100) + "%";

  if(progress >= 100){
    level++;
    progress = 0;
    spawnInterval = Math.max(25, spawnInterval - 8);
  }

  /* ===== SPAWN PROGRESIVO ===== */
  spawnTimer++;
  if(spawnTimer >= spawnInterval){
    createStar();
    spawnTimer = 0;
  }

  /* ===== MOVER ESTRELLAS ===== */
  for(let i = stars.length - 1; i >= 0; i--){
    const s = stars[i];

    s.x += s.vx;
    s.y += s.vy;

    /* ===== REBOTE LATERAL FIX ===== */
    if(s.x - s.r < 0){
      s.x = s.r;
      s.vx *= -1;
    }
    if(s.x + s.r > canvas.width){
      s.x = canvas.width - s.r;
      s.vx *= -1;
    }

    /* ===== TOCA FONDO ===== */
    if(s.y - s.r > canvas.height){

      createExplosion(s.x, canvas.height - 10);
      createGroundHit(s.x);

      stars.splice(i, 1);

      lives = Math.max(0, lives - 1);
      updateLivesUI();

      if(lives <= 0) gameOver = true;
      continue;
    }

    /* ===== RECOLECTOR ===== */
    const d = Math.hypot(s.x - mouseX, s.y - mouseY);
    if(d < s.r + catcherRadius){
      score += 10;
      createExplosion(s.x, s.y);
      playCollectSound();
      stars.splice(i, 1);
      continue;
    }
  }

  /* ===== RECORD ===== */
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

  /* ===== DESTELLOS ===== */
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

  /* ===== ESTRELLAS ===== */
  stars.forEach(s => {
    drawStar(s.x, s.y, s.r);
  });

  /* ===== EXPLOSIONES ===== */
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

  /* ===== IMPACTO SUELO ===== */
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

  /* ===== RECOLECTOR ===== */
  ctx.beginPath();
  ctx.arc(mouseX, mouseY, catcherRadius, 0, Math.PI * 2);
  ctx.strokeStyle = "#00eaff";
  ctx.lineWidth = 3;
  ctx.stroke();

  /* ===== GAME OVER ===== */
  if(gameOver){
    ctx.fillStyle = "red";
    ctx.font = "48px Arial";
    ctx.fillText("GAME OVER", canvas.width/2 - 140, canvas.height/2);
  }
}

/* ===== DIBUJAR ESTRELLA ===== */
function drawStar(x,y,r){
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

  const g = ctx.createRadialGradient(x,y,1,x,y,r);
  g.addColorStop(0,"#fff");
  g.addColorStop(1,"#00eaff");

  ctx.fillStyle = g;
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
pauseBtn.onclick = () => {
  paused = !paused;
  pauseBtn.textContent = paused ? "Continuar" : "Pausar";
};

stopBtn.onclick = () => {
  paused = false;
  gameOver = true;
};

restartBtn.onclick = () => {
  location.reload();
};

/* ===== START ===== */
loop();