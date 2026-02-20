const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// ===== SONIDOS =====
const shootSound = document.getElementById("shootSound");
const explosionSound = document.getElementById("explosionSound");

// ===== VARIABLES =====
let score = 0;
let level = 1;
let lives = 5;
let highScore = localStorage.getItem("highScore") || 0;
let gamePaused = false;

document.getElementById("highScore").textContent = highScore;

let enemies = [];
let bullets = [];
let particles = [];
let stars = [];

let mouseX = canvas.width / 2;
let mouseY = canvas.height - 60;

canvas.style.cursor = "none";

// ===== ESTRELLAS TITILANTES =====
function initStars() {
  for (let i = 0; i < 60; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 2 + 1,
      alpha: Math.random(),
      speed: Math.random() * 0.02 + 0.005
    });
  }
}

function drawBackground() {
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  stars.forEach(s => {
    s.alpha += s.speed;
    if (s.alpha > 1 || s.alpha < 0) s.speed *= -1;

    ctx.globalAlpha = s.alpha;
    ctx.fillStyle = "white";
    ctx.fillRect(s.x, s.y, s.size, s.size);
    ctx.globalAlpha = 1;
  });
}

// ===== UI VIDAS =====
function updateLivesUI() {
  let hearts = "";
  for (let i = 0; i < 5; i++) {
    hearts += i < lives ? "❤️" : "💔";
  }
  document.getElementById("lives").textContent = hearts;
}
updateLivesUI();

// ===== BARRA =====
function updateLevelBar() {
  const totalEnemies = level * 5;
  const defeated = totalEnemies - enemies.length;
  const progress = Math.max(0, Math.min(defeated / totalEnemies, 1));

  const bar = document.getElementById("levelBar");
  bar.style.width = (progress * 100) + "%";

  if (progress > 0.8) bar.style.background = "red";
  else if (progress > 0.5) bar.style.background = "yellow";
  else bar.style.background = "green";
}

// ===== PARTICULAS =====
class Particle {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = Math.random() * 6 + 2;
    this.vx = (Math.random() - 0.5) * 6;
    this.vy = (Math.random() - 0.5) * 6;
    this.life = 1;
    this.color = ["orange","yellow","red","white"][Math.floor(Math.random()*4)];
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.life -= 0.03;
  }

  draw() {
    ctx.save();
    ctx.globalAlpha = this.life;
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.size, this.size);
    ctx.restore();
  }
}

// ===== MARCIANO =====
const alienShape = [
  [0,1,0,0,0,1,0],
  [0,0,1,0,1,0,0],
  [0,1,1,1,1,1,0],
  [1,1,0,1,0,1,1],
  [1,1,1,1,1,1,1],
  [0,1,0,0,0,1,0],
  [1,0,0,0,0,0,1]
];

class Enemy {
  constructor() {
    this.pixelSize = 4 + Math.random() * 6;
    this.width = alienShape[0].length * this.pixelSize;
    this.height = alienShape.length * this.pixelSize;
    this.x = Math.random() * (canvas.width - this.width);
    this.y = -this.height;

    this.vx = (Math.random() - 0.5) * 1.2;
    this.vy = 0.6 + Math.random() * (0.4 + level * 0.25);

    this.alpha = 1;
    this.dying = false;
  }

  update() {
    if (!this.dying) {
      this.x += this.vx;
      this.y += this.vy;

      // rebote en paredes
      if (this.x <= 0 || this.x + this.width >= canvas.width) {
        this.vx *= -1;
      }
    } else {
      this.alpha -= 0.06;
    }
  }

  draw() {
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle = "#39FF14";

    for (let r = 0; r < alienShape.length; r++) {
      for (let c = 0; c < alienShape[r].length; c++) {
        if (alienShape[r][c] === 1) {
          ctx.fillRect(
            this.x + c * this.pixelSize,
            this.y + r * this.pixelSize,
            this.pixelSize,
            this.pixelSize
          );
        }
      }
    }
    ctx.restore();
  }
}

// ===== COLISION CON REBOTE =====
function resolveEnemyCollisions() {
  for (let i = 0; i < enemies.length; i++) {
    for (let j = i + 1; j < enemies.length; j++) {
      const a = enemies[i];
      const b = enemies[j];

      if (
        !a.dying && !b.dying &&
        a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y
      ) {
        // empuje
        const dx = (a.x + a.width/2) - (b.x + b.width/2);
        const dy = (a.y + a.height/2) - (b.y + b.height/2);

        a.vx += dx * 0.01;
        b.vx -= dx * 0.01;

        a.x += dx * 0.05;
        b.x -= dx * 0.05;
        a.y += dy * 0.02;
        b.y -= dy * 0.02;
      }
    }
  }
}

// ===== SPAWN =====
function spawnEnemy() {
  enemies.push(new Enemy());
}

function spawnMultipleEnemies(count) {
  for (let i = 0; i < count; i++) spawnEnemy();
}

// ===== BALA =====
class Bullet {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 4;
    this.height = 15;
    this.speed = 8;
  }

  update() { this.y -= this.speed; }

  draw() {
    ctx.fillStyle = "yellow";
    ctx.fillRect(this.x, this.y, this.width, this.height);
  }
}

// ===== JUGADOR =====
function drawPlayer() {
  ctx.fillStyle = "#ff7a00";
  ctx.beginPath();
  ctx.moveTo(mouseX, mouseY);
  ctx.lineTo(mouseX - 18, mouseY + 40);
  ctx.lineTo(mouseX + 18, mouseY + 40);
  ctx.closePath();
  ctx.fill();
}

// ===== LOOP =====
function updateGame() {
  if (gamePaused) {
    requestAnimationFrame(updateGame);
    return;
  }

  drawBackground();
  updateLevelBar();

  enemies.forEach((enemy, eIndex) => {
    enemy.update();
    enemy.draw();

    bullets.forEach((bullet, bIndex) => {
      if (
        !enemy.dying &&
        bullet.x < enemy.x + enemy.width &&
        bullet.x + bullet.width > enemy.x &&
        bullet.y < enemy.y + enemy.height &&
        bullet.y + bullet.height > enemy.y
      ) {
        enemy.dying = true;

        for (let i = 0; i < 25; i++) {
          particles.push(
            new Particle(
              enemy.x + enemy.width / 2,
              enemy.y + enemy.height / 2
            )
          );
        }

        explosionSound.currentTime = 0;
        explosionSound.play();

        bullets.splice(bIndex, 1);

        score += 10;
        document.getElementById("score").textContent = score;

        if (score > highScore) {
          highScore = score;
          localStorage.setItem("highScore", highScore);
          document.getElementById("highScore").textContent = highScore;
        }
      }
    });

    if (enemy.alpha <= 0) enemies.splice(eIndex, 1);

    if (!enemy.dying && enemy.y > canvas.height) {
      enemies.splice(eIndex, 1);
      lives--;
      updateLivesUI();
    }
  });

  resolveEnemyCollisions();

  // balas
  bullets.forEach((b, i) => {
    b.update();
    b.draw();
    if (b.y < 0) bullets.splice(i, 1);
  });

  // partículas
  particles.forEach((p, i) => {
    p.update();
    p.draw();
    if (p.life <= 0) particles.splice(i, 1);
  });

  drawPlayer();

  // siguiente nivel
  if (enemies.length === 0) {
    level++;
    document.getElementById("level").textContent = level;
    spawnMultipleEnemies(level * 5);
  }

  requestAnimationFrame(updateGame);
}

// ===== EVENTOS =====
canvas.addEventListener("mousemove", e => {
  const rect = canvas.getBoundingClientRect();
  mouseX = e.clientX - rect.left;
  mouseY = canvas.height - 50;
});

canvas.addEventListener("click", () => {
  bullets.push(new Bullet(mouseX - 2, mouseY));
  shootSound.currentTime = 0;
  shootSound.play();
});

// ===== BOTONES =====
document.getElementById("pauseBtn").onclick = () => gamePaused = !gamePaused;
document.getElementById("stopBtn").onclick = () => gamePaused = true;
document.getElementById("restartBtn").onclick = () => location.reload();

// ===== START =====
initStars();
spawnMultipleEnemies(level * 5);
updateGame();