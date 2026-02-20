const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let score = 0;
let level = 1;
let highScore = localStorage.getItem("highScore") || 0;

document.getElementById("highScore").textContent = highScore;

let enemies = [];
let bullets = [];

let mouseX = canvas.width / 2;
let mouseY = canvas.height - 60;

// ===== MARCIANO PIXEL =====
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
    this.pixelSize = 6;
    this.width = alienShape[0].length * this.pixelSize;
    this.height = alienShape.length * this.pixelSize;
    this.x = Math.random() * (canvas.width - this.width);
    this.y = -this.height;
    this.speed = 1 + Math.random() * level;
  }

  update() {
    this.y += this.speed;
  }

  draw() {
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
  }
}

// ===== COHETE =====
class Bullet {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 4;
    this.height = 15;
    this.speed = 6;
  }

  update() {
    this.y -= this.speed;
  }

  draw() {
    ctx.fillStyle = "red";
    ctx.fillRect(this.x, this.y, this.width, this.height);
  }
}

// ===== DIBUJAR NAVE DEL JUGADOR =====
function drawPlayer() {
  ctx.fillStyle = "cyan";

  ctx.beginPath();
  ctx.moveTo(mouseX, mouseY);
  ctx.lineTo(mouseX - 15, mouseY + 30);
  ctx.lineTo(mouseX + 15, mouseY + 30);
  ctx.closePath();
  ctx.fill();
}

// ===== FONDO =====
function drawBackground() {
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < 40; i++) {
    ctx.fillStyle = "white";
    ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 2, 2);
  }
}

// ===== SPAWN ENEMIGOS =====
function spawnEnemy() {
  enemies.push(new Enemy());
}

// ===== COLISION =====
function checkCollision(bullet, enemy) {
  return (
    bullet.x < enemy.x + enemy.width &&
    bullet.x + bullet.width > enemy.x &&
    bullet.y < enemy.y + enemy.height &&
    bullet.y + bullet.height > enemy.y
  );
}

// ===== GAME LOOP =====
function updateGame() {
  drawBackground();

  // Enemigos
  enemies.forEach((enemy, eIndex) => {
    enemy.update();
    enemy.draw();

    bullets.forEach((bullet, bIndex) => {
      if (checkCollision(bullet, enemy)) {
        enemies.splice(eIndex, 1);
        bullets.splice(bIndex, 1);

        score += 10;

        if (score % 100 === 0) {
          level++;
          document.getElementById("level").textContent = level;
        }

        if (score > highScore) {
          highScore = score;
          localStorage.setItem("highScore", highScore);
        }

        document.getElementById("score").textContent = score;
        document.getElementById("highScore").textContent = highScore;
      }
    });

    if (enemy.y > canvas.height) {
      enemies.splice(eIndex, 1);
    }
  });

  // Balas
  bullets.forEach((bullet, index) => {
    bullet.update();
    bullet.draw();

    if (bullet.y < 0) {
      bullets.splice(index, 1);
    }
  });

  drawPlayer();

  requestAnimationFrame(updateGame);
}

// ===== EVENTOS =====
canvas.addEventListener("mousemove", (e) => {
  const rect = canvas.getBoundingClientRect();
  mouseX = e.clientX - rect.left;
  mouseY = canvas.height - 50; // fija en parte inferior
});

canvas.addEventListener("click", () => {
  bullets.push(new Bullet(mouseX - 2, mouseY));
});

// Intervalo enemigos
setInterval(spawnEnemy, 1500);

updateGame();
