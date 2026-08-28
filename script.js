const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const scoreElement = document.getElementById("score");
const livesElement = document.getElementById("lives");

const startScreen = document.getElementById("startScreen");
const gameOverScreen = document.getElementById("gameOverScreen");

const finalScore = document.getElementById("finalScore");

const startButton = document.getElementById("startButton");
const restartButton = document.getElementById("restartButton");


// ============================================================
// CONTROLES MOBILE
// ============================================================

const mobileControls =
  document.getElementById("mobileControls");

const moveLeftButton =
  document.getElementById("moveLeftButton");

const moveRightButton =
  document.getElementById("moveRightButton");

const shootButton =
  document.getElementById("shootButton");


// ============================================================
// ESTADO DO JOGO
// ============================================================

let animationId;

let running = false;

let score = 0;

let lives = 3;

let lastTime = 0;

let enemyTimer = 0;

let shootTimer = 0;


// ============================================================
// TECLADO
// ============================================================

const keys = {};


// ============================================================
// PLAYER
// ============================================================

const player = {

  x: 0,

  y: 0,

  width: 42,

  height: 32,

  speed: 420

};


// ============================================================
// OBJETOS DO JOGO
// ============================================================

let bullets = [];

let enemies = [];

let stars = [];


// ============================================================
// DETECÇÃO DE TOUCH
// ============================================================

const isTouchDevice =
  "ontouchstart" in window ||
  navigator.maxTouchPoints > 0 ||
  navigator.msMaxTouchPoints > 0;


/*
  Adiciona a classe ao body
  somente em dispositivos touch.
*/

if (isTouchDevice) {

  document.body.classList.add(
    "touch-device"
  );

}


// ============================================================
// POSIÇÃO DA NAVE
// ============================================================

function updatePlayerPosition(rect) {

  /*
    COMPUTADOR
    ----------------------------------------------------------

    Mantemos exatamente a posição original.

    A nave continua próxima da parte inferior.
  */

  if (!isTouchDevice) {

    player.y =
      rect.height - 65;

    return;

  }


  /*
    CELULAR
    ----------------------------------------------------------

    Aqui está a correção principal.

    Em vez de simplesmente colocar a nave
    em "rect.height - 65", calculamos a posição
    considerando a altura REAL dos controles.

    Isso garante que a nave fique acima dos
    botões.
  */

  const controlsHeight =
    mobileControls.offsetHeight;


  /*
    Espaço extra entre a nave e os controles.

    Quanto maior esse número,
    maior será a distância.
  */

  const gap = 40;


  /*
    A parte inferior dos controles é definida
    pelo CSS.

    Como a nave possui aproximadamente 32px
    de altura, adicionamos essa altura ao cálculo.
  */

  player.y =
    rect.height -
    controlsHeight -
    18 -
    player.height -
    gap;


  /*
    Proteção para telas muito pequenas.

    Nunca deixa a nave subir demais.
  */

  const minimumY = 80;


  player.y =
    Math.max(
      minimumY,
      player.y
    );

}


// ============================================================
// RESIZE CANVAS
// ============================================================

function resizeCanvas() {

  const rect =
    canvas.getBoundingClientRect();

  const dpr =
    window.devicePixelRatio || 1;


  canvas.width =
    rect.width * dpr;

  canvas.height =
    rect.height * dpr;


  ctx.setTransform(

    dpr,
    0,
    0,
    dpr,
    0,
    0

  );


  /*
    Define a posição vertical
    da nave.

    No celular é calculada acima
    dos controles.

    No computador continua
    como antes.
  */

  updatePlayerPosition(rect);


  /*
    Centraliza a nave horizontalmente
    somente quando o canvas é redimensionado.

    Isso preserva o comportamento original.
  */

  player.x =
    rect.width / 2 -
    player.width / 2;

}


// ============================================================
// ESTRELAS
// ============================================================

function createStars() {

  stars = [];

  const rect =
    canvas.getBoundingClientRect();


  for (
    let i = 0;
    i < 100;
    i++
  ) {

    stars.push({

      x:
        Math.random() *
        rect.width,

      y:
        Math.random() *
        rect.height,

      size:
        Math.random() * 2 +
        0.5,

      speed:
        Math.random() * 40 +
        20

    });

  }

}


// ============================================================
// RESET GAME
// ============================================================

function resetGame() {

  score = 0;

  lives = 3;

  bullets = [];

  enemies = [];


  scoreElement.textContent =
    score;

  livesElement.textContent =
    lives;


  resizeCanvas();

  createStars();


  /*
    Limpa controles.
  */

  keys["ArrowLeft"] = false;

  keys["ArrowRight"] = false;

  keys["a"] = false;

  keys["d"] = false;

  keys[" "] = false;


  moveLeftButton.classList.remove(
    "active"
  );

  moveRightButton.classList.remove(
    "active"
  );

  shootButton.classList.remove(
    "active"
  );

}


// ============================================================
// START GAME
// ============================================================

function startGame() {

  resetGame();


  startScreen.classList.add(
    "hidden"
  );

  gameOverScreen.classList.add(
    "hidden"
  );


  running = true;

  lastTime =
    performance.now();


  cancelAnimationFrame(
    animationId
  );


  animationId =
    requestAnimationFrame(
      gameLoop
    );

}


// ============================================================
// GAME OVER
// ============================================================

function gameOver() {

  running = false;


  finalScore.textContent =
    score;


  gameOverScreen.classList.remove(
    "hidden"
  );


  /*
    Libera controles.
  */

  keys["ArrowLeft"] = false;

  keys["ArrowRight"] = false;

  keys["a"] = false;

  keys["d"] = false;

  keys[" "] = false;


  moveLeftButton.classList.remove(
    "active"
  );

  moveRightButton.classList.remove(
    "active"
  );

  shootButton.classList.remove(
    "active"
  );


  cancelAnimationFrame(
    animationId
  );

}


// ============================================================
// SHOOT
// ============================================================

function shoot() {

  if (!running) return;


  bullets.push({

    x:
      player.x +
      player.width / 2 -
      2,

    y:
      player.y - 10,

    width: 4,

    height: 14,

    speed: 650

  });

}


// ============================================================
// CREATE ENEMY
// ============================================================

function createEnemy() {

  const rect =
    canvas.getBoundingClientRect();


  const size =
    Math.random() * 18 +
    28;


  enemies.push({

    x:
      Math.random() *
      (rect.width - size),

    y:
      -size,

    width: size,

    height: size,

    speed:
      Math.random() * 100 +
      100,

    rotation:
      Math.random() *
      Math.PI

  });

}


// ============================================================
// COLLISION
// ============================================================

function collision(a, b) {

  return (

    a.x <
      b.x + b.width &&

    a.x + a.width >
      b.x &&

    a.y <
      b.y + b.height &&

    a.y + a.height >
      b.y

  );

}


// ============================================================
// UPDATE
// ============================================================

function update(delta) {

  const rect =
    canvas.getBoundingClientRect();


  // ==========================================================
  // MOVIMENTO DA NAVE
  // ==========================================================

  if (

    keys["ArrowLeft"] ||
    keys["a"]

  ) {

    player.x -=
      player.speed * delta;

  }


  if (

    keys["ArrowRight"] ||
    keys["d"]

  ) {

    player.x +=
      player.speed * delta;

  }


  /*
    Impede a nave de sair da tela
    horizontalmente.
  */

  player.x = Math.max(

    0,

    Math.min(

      rect.width -
      player.width,

      player.x

    )

  );


  // ==========================================================
  // TIRO
  // ==========================================================

  shootTimer -= delta;


  if (

    keys[" "] &&
    shootTimer <= 0

  ) {

    shoot();

    shootTimer = 0.22;

  }


  // ==========================================================
  // BALAS
  // ==========================================================

  bullets.forEach(
    bullet => {

      bullet.y -=
        bullet.speed * delta;

    }
  );


  bullets =
    bullets.filter(
      bullet =>
        bullet.y > -30
    );


  // ==========================================================
  // INIMIGOS
  // ==========================================================

  enemyTimer -= delta;


  if (enemyTimer <= 0) {

    createEnemy();


    const difficulty =
      Math.min(
        score / 500,
        0.5
      );


    enemyTimer =
      Math.max(
        0.25,
        0.8 - difficulty
      );

  }


  enemies.forEach(
    enemy => {

      enemy.y +=
        enemy.speed * delta;

      enemy.rotation +=
        delta;

    }
  );


  // ==========================================================
  // COLISÃO BALA X INIMIGO
  // ==========================================================

  for (
    let i =
      enemies.length - 1;

    i >= 0;

    i--
  ) {

    let destroyed = false;


    for (
      let j =
        bullets.length - 1;

      j >= 0;

      j--
    ) {

      if (
        collision(
          enemies[i],
          bullets[j]
        )
      ) {

        enemies.splice(
          i,
          1
        );

        bullets.splice(
          j,
          1
        );


        score += 10;


        scoreElement.textContent =
          score;


        destroyed = true;


        break;

      }

    }


    if (destroyed) {
      continue;
    }


    // ========================================================
    // INIMIGO ATINGIU A NAVE
    // ========================================================

    if (
      collision(
        enemies[i],
        player
      )
    ) {

      enemies.splice(
        i,
        1
      );


      lives--;


      livesElement.textContent =
        lives;


      if (lives <= 0) {

        gameOver();

        return;

      }

    }

  }


  // ==========================================================
  // INIMIGOS QUE PASSARAM
  // ==========================================================

  for (
    let i =
      enemies.length - 1;

    i >= 0;

    i--
  ) {

    if (
      enemies[i].y >
      rect.height
    ) {

      enemies.splice(
        i,
        1
      );


      lives--;


      livesElement.textContent =
        lives;


      if (lives <= 0) {

        gameOver();

        return;

      }

    }

  }


  // ==========================================================
  // ESTRELAS
  // ==========================================================

  stars.forEach(
    star => {

      star.y +=
        star.speed * delta;


      if (
        star.y >
        rect.height
      ) {

        star.y = 0;


        star.x =
          Math.random() *
          rect.width;

      }

    }
  );

}


// ============================================================
// DRAW BACKGROUND
// ============================================================

function drawBackground() {

  const rect =
    canvas.getBoundingClientRect();


  ctx.fillStyle =
    "#020205";


  ctx.fillRect(

    0,
    0,

    rect.width,
    rect.height

  );


  stars.forEach(
    star => {

      ctx.fillStyle =
        "#ffffff";


      ctx.globalAlpha =
        Math.random() *
        0.6 +
        0.3;


      ctx.fillRect(

        star.x,
        star.y,

        star.size,
        star.size

      );

    }
  );


  ctx.globalAlpha = 1;

}


// ============================================================
// DRAW PLAYER
// ============================================================

function drawPlayer() {

  const x =
    player.x;

  const y =
    player.y;


  ctx.save();


  ctx.shadowBlur =
    20;

  ctx.shadowColor =
    "#ff1493";


  ctx.fillStyle =
    "#ff1493";


  ctx.beginPath();


  ctx.moveTo(

    x +
    player.width / 2,

    y

  );


  ctx.lineTo(

    x +
    player.width,

    y +
    player.height

  );


  ctx.lineTo(

    x +
    player.width / 2,

    y +
    player.height -
    8

  );


  ctx.lineTo(

    x,

    y +
    player.height

  );


  ctx.closePath();


  ctx.fill();


  ctx.fillStyle =
    "#ffffff";


  ctx.beginPath();


  ctx.moveTo(

    x +
    player.width / 2,

    y + 8

  );


  ctx.lineTo(

    x +
    player.width / 2 +
    7,

    y + 20

  );


  ctx.lineTo(

    x +
    player.width / 2 -
    7,

    y + 20

  );


  ctx.closePath();


  ctx.fill();


  ctx.restore();

}


// ============================================================
// DRAW BULLETS
// ============================================================

function drawBullets() {

  bullets.forEach(
    bullet => {

      ctx.save();


      ctx.shadowBlur =
        15;

      ctx.shadowColor =
        "#ffffff";


      ctx.fillStyle =
        "#ffffff";


      ctx.fillRect(

        bullet.x,

        bullet.y,

        bullet.width,

        bullet.height

      );


      ctx.restore();

    }
  );

}


// ============================================================
// DRAW ENEMIES
// ============================================================

function drawEnemies() {

  enemies.forEach(
    enemy => {

      ctx.save();


      ctx.translate(

        enemy.x +
        enemy.width / 2,

        enemy.y +
        enemy.height / 2

      );


      ctx.rotate(
        enemy.rotation
      );


      ctx.shadowBlur =
        15;

      ctx.shadowColor =
        "#ff1493";


      ctx.strokeStyle =
        "#ff1493";

      ctx.lineWidth = 3;


      ctx.strokeRect(

        -enemy.width / 2,

        -enemy.height / 2,

        enemy.width,

        enemy.height

      );


      ctx.strokeStyle =
        "#ffffff";

      ctx.lineWidth = 2;


      ctx.beginPath();


      ctx.moveTo(

        -enemy.width / 2,

        0

      );


      ctx.lineTo(

        enemy.width / 2,

        0

      );


      ctx.moveTo(

        0,

        -enemy.height / 2

      );


      ctx.lineTo(

        0,

        enemy.height / 2

      );


      ctx.stroke();


      ctx.restore();

    }
  );

}


// ============================================================
// DRAW
// ============================================================

function draw() {

  drawBackground();

  drawBullets();

  drawEnemies();

  drawPlayer();

}


// ============================================================
// GAME LOOP
// ============================================================

function gameLoop(timestamp) {

  if (!running) {
    return;
  }


  const delta =
    Math.min(

      (timestamp - lastTime) /
      1000,

      0.05

    );


  lastTime =
    timestamp;


  update(delta);

  draw();


  animationId =
    requestAnimationFrame(
      gameLoop
    );

}


// ============================================================
// KEYBOARD - KEYDOWN
// ============================================================

window.addEventListener(
  "keydown",
  event => {

    keys[event.key] = true;


    if (event.key === " ") {

      event.preventDefault();

    }


    if (

      (
        event.key === " " ||
        event.key === "Enter"
      ) &&

      !running &&

      startScreen.classList.contains(
        "hidden"
      ) === false

    ) {

      startGame();

    }

  }
);


// ============================================================
// KEYBOARD - KEYUP
// ============================================================

window.addEventListener(
  "keyup",
  event => {

    keys[event.key] = false;

  }
);


// ============================================================
// TOUCH CONTROLS
// ============================================================

function setupTouchButton(
  button,
  key
) {

  // ----------------------------------------------------------
  // POINTER DOWN
  // ----------------------------------------------------------

  button.addEventListener(
    "pointerdown",
    event => {

      event.preventDefault();


      keys[key] = true;


      button.classList.add(
        "active"
      );


      if (
        button.setPointerCapture
      ) {

        try {

          button.setPointerCapture(
            event.pointerId
          );

        } catch (error) {

          // Ignora incompatibilidades.

        }

      }

    }
  );


  // ----------------------------------------------------------
  // POINTER UP
  // ----------------------------------------------------------

  button.addEventListener(
    "pointerup",
    event => {

      event.preventDefault();


      keys[key] = false;


      button.classList.remove(
        "active"
      );

    }
  );


  // ----------------------------------------------------------
  // POINTER CANCEL
  // ----------------------------------------------------------

  button.addEventListener(
    "pointercancel",
    event => {

      event.preventDefault();


      keys[key] = false;


      button.classList.remove(
        "active"
      );

    }
  );


  // ----------------------------------------------------------
  // LOST POINTER
  // ----------------------------------------------------------

  button.addEventListener(
    "lostpointercapture",
    () => {

      keys[key] = false;


      button.classList.remove(
        "active"
      );

    }
  );


  // ----------------------------------------------------------
  // CONTEXT MENU
  // ----------------------------------------------------------

  button.addEventListener(
    "contextmenu",
    event => {

      event.preventDefault();

    }
  );

}


// ============================================================
// CONFIGURA CONTROLES
// ============================================================

setupTouchButton(
  moveLeftButton,
  "ArrowLeft"
);


setupTouchButton(
  moveRightButton,
  "ArrowRight"
);


setupTouchButton(
  shootButton,
  " "
);


// ============================================================
// START / RESTART
// ============================================================

startButton.addEventListener(
  "click",
  startGame
);


restartButton.addEventListener(
  "click",
  startGame
);


// ============================================================
// RESIZE
// ============================================================

window.addEventListener(
  "resize",
  () => {

    if (running) {

      resizeCanvas();

    }

  }
);


// ============================================================
// ORIENTATION CHANGE
// ============================================================

window.addEventListener(
  "orientationchange",
  () => {

    setTimeout(
      () => {

        resizeCanvas();

      },
      150
    );

  }
);


// ============================================================
// INICIALIZAÇÃO
// ============================================================

resizeCanvas();

createStars();

draw();