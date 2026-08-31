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


if (isTouchDevice) {

  document.body.classList.add(
    "touch-device"
  );

}


// ============================================================
// SISTEMA DE ÁUDIO
// ============================================================

let audioContext = null;

let masterGain = null;

let musicGain = null;

let musicInterval = null;

let musicStep = 0;

let musicPlaying = false;


/*
  Inicializa o sistema de áudio.

  A criação só acontece após uma interação do usuário,
  pois navegadores bloqueiam autoplay com áudio.
*/

function initializeAudio() {

  if (!audioContext) {

    const AudioContextClass =
      window.AudioContext ||
      window.webkitAudioContext;


    audioContext =
      new AudioContextClass();


    /*
      Controle geral de volume.
    */

    masterGain =
      audioContext.createGain();


    masterGain.gain.value = 0.45;


    masterGain.connect(
      audioContext.destination
    );


    /*
      Volume específico da música.
    */

    musicGain =
      audioContext.createGain();


    musicGain.gain.value = 0.20;


    musicGain.connect(
      masterGain
    );

  }


  /*
    Alguns navegadores deixam o contexto
    inicialmente suspenso.
  */

  if (
    audioContext.state ===
    "suspended"
  ) {

    audioContext.resume();

  }

}


// ============================================================
// FUNÇÃO AUXILIAR PARA TOCAR NOTAS
// ============================================================

function playTone(
  frequency,
  duration,
  type = "sine",
  volume = 0.1,
  destination = masterGain
) {

  if (
    !audioContext ||
    !destination
  ) {
    return;
  }


  const oscillator =
    audioContext.createOscillator();


  const gain =
    audioContext.createGain();


  oscillator.type =
    type;


  oscillator.frequency.setValueAtTime(
    frequency,
    audioContext.currentTime
  );


  gain.gain.setValueAtTime(
    0.0001,
    audioContext.currentTime
  );


  gain.gain.exponentialRampToValueAtTime(
    volume,
    audioContext.currentTime + 0.01
  );


  gain.gain.exponentialRampToValueAtTime(
    0.0001,
    audioContext.currentTime + duration
  );


  oscillator.connect(gain);

  gain.connect(destination);


  oscillator.start();


  oscillator.stop(
    audioContext.currentTime +
    duration +
    0.05
  );

}


// ============================================================
// SOM DE TIRO
// ============================================================

function playShootSound() {

  if (!audioContext) {
    return;
  }


  const oscillator =
    audioContext.createOscillator();


  const gain =
    audioContext.createGain();


  oscillator.type =
    "square";


  const now =
    audioContext.currentTime;


  /*
    O som começa em uma frequência alta
    e desce rapidamente.
  */

  oscillator.frequency.setValueAtTime(
    900,
    now
  );


  oscillator.frequency.exponentialRampToValueAtTime(
    220,
    now + 0.12
  );


  gain.gain.setValueAtTime(
    0.14,
    now
  );


  gain.gain.exponentialRampToValueAtTime(
    0.001,
    now + 0.12
  );


  oscillator.connect(gain);

  gain.connect(masterGain);


  oscillator.start(now);

  oscillator.stop(
    now + 0.13
  );

}


// ============================================================
// CRIAR BUFFER DE RUÍDO
// ============================================================

function createNoiseBuffer(
  duration = 0.4
) {

  const bufferSize =
    audioContext.sampleRate *
    duration;


  const buffer =
    audioContext.createBuffer(

      1,

      bufferSize,

      audioContext.sampleRate

    );


  const data =
    buffer.getChannelData(0);


  for (
    let i = 0;
    i < bufferSize;
    i++
  ) {

    /*
      Ruído com queda gradual.
    */

    const progress =
      i / bufferSize;


    data[i] =
      (Math.random() * 2 - 1) *
      (1 - progress);

  }


  return buffer;

}


// ============================================================
// SOM DE EXPLOSÃO
// ============================================================

function playExplosionSound() {

  if (!audioContext) {
    return;
  }


  const now =
    audioContext.currentTime;


  // ----------------------------------------------------------
  // RUÍDO DA EXPLOSÃO
  // ----------------------------------------------------------

  const noise =
    audioContext.createBufferSource();


  const noiseGain =
    audioContext.createGain();


  const noiseFilter =
    audioContext.createBiquadFilter();


  noise.buffer =
    createNoiseBuffer(0.35);


  noiseFilter.type =
    "lowpass";


  noiseFilter.frequency.setValueAtTime(
    1800,
    now
  );


  noiseFilter.frequency.exponentialRampToValueAtTime(
    120,
    now + 0.35
  );


  noiseGain.gain.setValueAtTime(
    0.28,
    now
  );


  noiseGain.gain.exponentialRampToValueAtTime(
    0.001,
    now + 0.35
  );


  noise.connect(noiseFilter);

  noiseFilter.connect(noiseGain);

  noiseGain.connect(masterGain);


  noise.start(now);


  // ----------------------------------------------------------
  // IMPACTO GRAVE
  // ----------------------------------------------------------

  const oscillator =
    audioContext.createOscillator();


  const oscillatorGain =
    audioContext.createGain();


  oscillator.type =
    "sawtooth";


  oscillator.frequency.setValueAtTime(
    160,
    now
  );


  oscillator.frequency.exponentialRampToValueAtTime(
    45,
    now + 0.25
  );


  oscillatorGain.gain.setValueAtTime(
    0.18,
    now
  );


  oscillatorGain.gain.exponentialRampToValueAtTime(
    0.001,
    now + 0.25
  );


  oscillator.connect(
    oscillatorGain
  );


  oscillatorGain.connect(
    masterGain
  );


  oscillator.start(now);


  oscillator.stop(
    now + 0.28
  );

}


// ============================================================
// SOM DE PERDA DE VIDA
// ============================================================

function playPlayerHitSound() {

  if (!audioContext) {
    return;
  }


  const oscillator =
    audioContext.createOscillator();


  const gain =
    audioContext.createGain();


  const now =
    audioContext.currentTime;


  oscillator.type =
    "sawtooth";


  oscillator.frequency.setValueAtTime(
    260,
    now
  );


  oscillator.frequency.exponentialRampToValueAtTime(
    60,
    now + 0.5
  );


  gain.gain.setValueAtTime(
    0.22,
    now
  );


  gain.gain.exponentialRampToValueAtTime(
    0.001,
    now + 0.5
  );


  oscillator.connect(gain);

  gain.connect(masterGain);


  oscillator.start(now);


  oscillator.stop(
    now + 0.52
  );

}


// ============================================================
// MÚSICA DE FUNDO
// ============================================================

/*
  Sequência de notas com uma atmosfera
  arcade / sci-fi.
*/

const musicSequence = [

  110,
  164.81,
  196,
  220,

  110,
  146.83,
  174.61,
  196,

  98,
  146.83,
  174.61,
  220,

  110,
  164.81,
  220,
  261.63

];


/*
  Cada nota possui duração curta.

  O intervalo cria um loop contínuo.
*/

function playMusicStep() {

  if (
    !musicPlaying ||
    !audioContext
  ) {
    return;
  }


  const frequency =
    musicSequence[
      musicStep
    ];


  // ----------------------------------------------------------
  // CAMADA PRINCIPAL
  // ----------------------------------------------------------

  playTone(

    frequency,

    0.24,

    "triangle",

    0.18,

    musicGain

  );


  // ----------------------------------------------------------
  // HARMONIA
  // ----------------------------------------------------------

  if (
    musicStep % 2 === 0
  ) {

    playTone(

      frequency * 2,

      0.14,

      "sine",

      0.06,

      musicGain

    );

  }


  // ----------------------------------------------------------
  // PRÓXIMA NOTA
  // ----------------------------------------------------------

  musicStep++;


  if (
    musicStep >=
    musicSequence.length
  ) {

    musicStep = 0;

  }

}


// ============================================================
// INICIAR MÚSICA
// ============================================================

function startBackgroundMusic() {

  if (musicPlaying) {
    return;
  }


  if (!audioContext) {
    return;
  }


  musicPlaying = true;


  musicStep = 0;


  playMusicStep();


  musicInterval =
    setInterval(

      playMusicStep,

      280

    );

}


// ============================================================
// PARAR MÚSICA
// ============================================================

function stopBackgroundMusic() {

  musicPlaying = false;


  if (musicInterval) {

    clearInterval(
      musicInterval
    );


    musicInterval = null;

  }

}


// ============================================================
// POSIÇÃO DA NAVE
// ============================================================

function updatePlayerPosition(rect) {

  /*
    COMPUTADOR
  */

  if (!isTouchDevice) {

    player.y =
      rect.height - 65;

    return;

  }


  /*
    CELULAR
  */

  const controlsHeight =
    mobileControls.offsetHeight;


  /*
    DISTÂNCIA ENTRE A NAVE
    E OS CONTROLES.
  */

  const gap = 40;


  player.y =
    rect.height -
    controlsHeight -
    18 -
    player.height -
    gap;


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


  updatePlayerPosition(rect);


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

  /*
    Inicializa o áudio após
    interação do jogador.
  */

  initializeAudio();


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


  startBackgroundMusic();


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


  stopBackgroundMusic();


  finalScore.textContent =
    score;


  gameOverScreen.classList.remove(
    "hidden"
  );


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

  if (!running) {
    return;
  }


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


  /*
    SOM DO TIRO
  */

  playShootSound();

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
  // MOVIMENTO
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


        /*
          SOM DE EXPLOSÃO
        */

        playExplosionSound();


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


      /*
        SOM DE COLISÃO
      */

      playPlayerHitSound();


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


      /*
        SOM DE VIDA PERDIDA
      */

      playPlayerHitSound();


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

  const x = player.x;
  const y = player.y;


  ctx.save();


  ctx.shadowBlur = 20;
  ctx.shadowColor = "#ff1493";


  ctx.fillStyle = "#ff1493";


  ctx.beginPath();


  ctx.moveTo(
    x + player.width / 2,
    y
  );


  ctx.lineTo(
    x + player.width,
    y + player.height
  );


  ctx.lineTo(
    x + player.width / 2,
    y + player.height - 8
  );


  ctx.lineTo(
    x,
    y + player.height
  );


  ctx.closePath();

  ctx.fill();


  ctx.fillStyle = "#ffffff";


  ctx.beginPath();


  ctx.moveTo(
    x + player.width / 2,
    y + 8
  );


  ctx.lineTo(
    x + player.width / 2 + 7,
    y + 20
  );


  ctx.lineTo(
    x + player.width / 2 - 7,
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
// CONTROLES TOUCH
// ============================================================

function setupTouchButton(
  button,
  key
) {

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


  button.addEventListener(
    "lostpointercapture",
    () => {

      keys[key] = false;


      button.classList.remove(
        "active"
      );

    }
  );


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