const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const scoreElement = document.getElementById("score");
const livesElement = document.getElementById("lives");
const startScreen = document.getElementById("startScreen");
const gameOverScreen = document.getElementById("gameOverScreen");
const finalScore = document.getElementById("finalScore");
const startButton = document.getElementById("startButton");
const restartButton = document.getElementById("restartButton");

let animationId;
let running = false;
let score = 0;
let lives = 3;
let lastTime = 0;
let enemyTimer = 0;
let shootTimer = 0;

const keys = {};

const player = {
  x: 0,
  y: 0,
  width: 42,
  height: 32,
  speed: 420
};

let bullets = [];
let enemies = [];
let stars = [];

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;

  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  player.y = rect.height - 65;
  player.x = rect.width / 2 - player.width / 2;
}

function createStars() {
  stars = [];

  const rect = canvas.getBoundingClientRect();

  for (let i = 0; i < 100; i++) {
    stars.push({
      x: Math.random() * rect.width,
      y: Math.random() * rect.height,
      size: Math.random() * 2 + 0.5,
      speed: Math.random() * 40 + 20
    });
  }
}

function resetGame() {
  score = 0;
  lives = 3;
  bullets = [];
  enemies = [];

  scoreElement.textContent = score;
  livesElement.textContent = lives;

  resizeCanvas();
  createStars();
}

function startGame() {
  resetGame();

  startScreen.classList.add("hidden");
  gameOverScreen.classList.add("hidden");

  running = true;
  lastTime = performance.now();

  cancelAnimationFrame(animationId);
  animationId = requestAnimationFrame(gameLoop);
}

function gameOver() {
  running = false;

  finalScore.textContent = score;
  gameOverScreen.classList.remove("hidden");

  cancelAnimationFrame(animationId);
}

function shoot() {
  if (!running) return;

  bullets.push({
    x: player.x + player.width / 2 - 2,
    y: player.y - 10,
    width: 4,
    height: 14,
    speed: 650
  });
}

function createEnemy() {
  const rect = canvas.getBoundingClientRect();
  const size = Math.random() * 18 + 28;

  enemies.push({
    x: Math.random() * (rect.width - size),
    y: -size,
    width: size,
    height: size,
    speed: Math.random() * 100 + 100,
    rotation: Math.random() * Math.PI
  });
}

function collision(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

function update(delta) {
  const rect = canvas.getBoundingClientRect();

  // Movimento da nave
  if (keys["ArrowLeft"] || keys["a"]) {
    player.x -= player.speed * delta;
  }

  if (keys["ArrowRight"] || keys["d"]) {
    player.x += player.speed * delta;
  }

  player.x = Math.max(
    0,
    Math.min(rect.width - player.width, player.x)
  );

  // Tiro automático enquanto espaço estiver pressionado
  shootTimer -= delta;

  if (keys[" "] && shootTimer <= 0) {
    shoot();
    shootTimer = 0.22;
  }

  // Balas
  bullets.forEach(bullet => {
    bullet.y -= bullet.speed * delta;
  });

  bullets = bullets.filter(bullet => bullet.y > -30);

  // Inimigos
  enemyTimer -= delta;

  if (enemyTimer <= 0) {
    createEnemy();

    const difficulty = Math.min(score / 500, 0.5);
    enemyTimer = Math.max(0.25, 0.8 - difficulty);
  }

  enemies.forEach(enemy => {
    enemy.y += enemy.speed * delta;
    enemy.rotation += delta;
  });

  // Colisão bala x inimigo
  for (let i = enemies.length - 1; i >= 0; i--) {
    let destroyed = false;

    for (let j = bullets.length - 1; j >= 0; j--) {
      if (collision(enemies[i], bullets[j])) {
        enemies.splice(i, 1);
        bullets.splice(j, 1);

        score += 10;
        scoreElement.textContent = score;

        destroyed = true;
        break;
      }
    }

    if (destroyed) continue;

    // Inimigo atingiu a nave
    if (collision(enemies[i], player)) {
      enemies.splice(i, 1);
      lives--;
      livesElement.textContent = lives;

      if (lives <= 0) {
        gameOver();
        return;
      }
    }
  }

  // Inimigos que passaram
  for (let i = enemies.length - 1; i >= 0; i--) {
    if (enemies[i].y > rect.height) {
      enemies.splice(i, 1);
      lives--;

      livesElement.textContent = lives;

      if (lives <= 0) {
        gameOver();
        return;
      }
    }
  }

  // Estrelas
  stars.forEach(star => {
    star.y += star.speed * delta;

    if (star.y > rect.height) {
      star.y = 0;
      star.x = Math.random() * rect.width;
    }
  });
}

function drawBackground() {
  const rect = canvas.getBoundingClientRect();

  ctx.fillStyle = "#020205";
  ctx.fillRect(0, 0, rect.width, rect.height);

  stars.forEach(star => {
    ctx.fillStyle = "#ffffff";
    ctx.globalAlpha = Math.random() * 0.6 + 0.3;
    ctx.fillRect(star.x, star.y, star.size, star.size);
  });

  ctx.globalAlpha = 1;
}

function drawPlayer() {
  const x = player.x;
  const y = player.y;

  ctx.save();

  ctx.shadowBlur = 20;
  ctx.shadowColor = "#ff1493";

  ctx.fillStyle = "#ff1493";

  ctx.beginPath();
  ctx.moveTo(x + player.width / 2, y);
  ctx.lineTo(x + player.width, y + player.height);
  ctx.lineTo(x + player.width / 2, y + player.height - 8);
  ctx.lineTo(x, y + player.height);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#ffffff";

  ctx.beginPath();
  ctx.moveTo(x + player.width / 2, y + 8);
  ctx.lineTo(x + player.width / 2 + 7, y + 20);
  ctx.lineTo(x + player.width / 2 - 7, y + 20);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

function drawBullets() {
  bullets.forEach(bullet => {
    ctx.save();

    ctx.shadowBlur = 15;
    ctx.shadowColor = "#ffffff";

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(
      bullet.x,
      bullet.y,
      bullet.width,
      bullet.height
    );

    ctx.restore();
  });
}

function drawEnemies() {
  enemies.forEach(enemy => {
    ctx.save();

    ctx.translate(
      enemy.x + enemy.width / 2,
      enemy.y + enemy.height / 2
    );

    ctx.rotate(enemy.rotation);

    ctx.shadowBlur = 15;
    ctx.shadowColor = "#ff1493";

    ctx.strokeStyle = "#ff1493";
    ctx.lineWidth = 3;

    ctx.strokeRect(
      -enemy.width / 2,
      -enemy.height / 2,
      enemy.width,
      enemy.height
    );

    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(-enemy.width / 2, 0);
    ctx.lineTo(enemy.width / 2, 0);
    ctx.moveTo(0, -enemy.height / 2);
    ctx.lineTo(0, enemy.height / 2);
    ctx.stroke();

    ctx.restore();
  });
}

function draw() {
  drawBackground();
  drawBullets();
  drawEnemies();
  drawPlayer();
}

function gameLoop(timestamp) {
  if (!running) return;

  const delta = Math.min((timestamp - lastTime) / 1000, 0.05);
  lastTime = timestamp;

  update(delta);
  draw();

  animationId = requestAnimationFrame(gameLoop);
}

window.addEventListener("keydown", event => {
  keys[event.key] = true;

  if (event.key === " ") {
    event.preventDefault();
  }

  if (
    (event.key === " " || event.key === "Enter") &&
    !running &&
    startScreen.classList.contains("hidden") === false
  ) {
    startGame();
  }
});

window.addEventListener("keyup", event => {
  keys[event.key] = false;
});

startButton.addEventListener("click", startGame);
restartButton.addEventListener("click", startGame);

window.addEventListener("resize", () => {
  if (running) {
    resizeCanvas();
  }
});

resizeCanvas();
createStars();
draw();
