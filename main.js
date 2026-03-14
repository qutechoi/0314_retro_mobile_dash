const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const scoreEl = document.getElementById('score');
const bestEl = document.getElementById('best');
const livesEl = document.getElementById('lives');

const leftBtn = document.getElementById('leftBtn');
const rightBtn = document.getElementById('rightBtn');
const startBtn = document.getElementById('startBtn');

const W = canvas.width;
const H = canvas.height;

let gameOn = false;
let score = 0;
let lives = 3;
let best = Number(localStorage.getItem('retro_mobile_dash_best') || 0);
bestEl.textContent = best;

const player = {
  w: 34,
  h: 16,
  x: W / 2 - 17,
  y: H - 44,
  speed: 5,
  vx: 0,
  hitCooldown: 0,
};

const obstacles = [];
let spawnTick = 0;
let speedScale = 1;
let frame = 0;

const keys = { left: false, right: false };

function resetGame() {
  score = 0;
  lives = 3;
  player.x = W / 2 - player.w / 2;
  player.vx = 0;
  player.hitCooldown = 0;
  obstacles.length = 0;
  spawnTick = 0;
  speedScale = 1;
  frame = 0;
  updateHud();
}

function startGame() {
  resetGame();
  gameOn = true;
}

function updateHud() {
  scoreEl.textContent = score;
  livesEl.textContent = lives;
  bestEl.textContent = best;
}

function spawnObstacle() {
  const size = 12 + Math.random() * 18;
  obstacles.push({
    x: Math.random() * (W - size),
    y: -size,
    w: size,
    h: size,
    vy: (2 + Math.random() * 2.2) * speedScale,
    color: Math.random() > 0.6 ? '#ff4d6d' : '#ffcc00',
  });
}

function collide(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function loseLife() {
  if (player.hitCooldown > 0) return;
  lives -= 1;
  player.hitCooldown = 45;
  if (lives <= 0) {
    gameOn = false;
    if (score > best) {
      best = score;
      localStorage.setItem('retro_mobile_dash_best', String(best));
    }
  }
  updateHud();
}

function update() {
  if (!gameOn) return;

  frame += 1;
  spawnTick += 1;

  speedScale = 1 + Math.min(frame / 2400, 1.2);

  if (spawnTick > Math.max(18, 42 - Math.floor(frame / 250))) {
    spawnTick = 0;
    spawnObstacle();
  }

  player.vx = 0;
  if (keys.left) player.vx -= player.speed;
  if (keys.right) player.vx += player.speed;

  player.x += player.vx;
  if (player.x < 4) player.x = 4;
  if (player.x + player.w > W - 4) player.x = W - player.w - 4;

  if (player.hitCooldown > 0) player.hitCooldown -= 1;

  for (let i = obstacles.length - 1; i >= 0; i--) {
    const o = obstacles[i];
    o.y += o.vy;

    if (collide(player, o)) {
      obstacles.splice(i, 1);
      loseLife();
      continue;
    }

    if (o.y > H + 10) {
      obstacles.splice(i, 1);
      score += 1;
      updateHud();
    }
  }
}

function drawGrid() {
  ctx.strokeStyle = 'rgba(125,255,114,0.06)';
  ctx.lineWidth = 1;
  for (let y = 0; y < H; y += 24) {
    ctx.beginPath();
    ctx.moveTo(0, y + (frame % 24));
    ctx.lineTo(W, y + (frame % 24));
    ctx.stroke();
  }
}

function draw() {
  ctx.clearRect(0, 0, W, H);

  drawGrid();

  // obstacles
  for (const o of obstacles) {
    ctx.fillStyle = o.color;
    ctx.fillRect(o.x, o.y, o.w, o.h);
    ctx.fillStyle = 'rgba(0,0,0,.25)';
    ctx.fillRect(o.x + 3, o.y + 3, o.w - 6, o.h - 6);
  }

  // player
  const blink = player.hitCooldown > 0 && Math.floor(player.hitCooldown / 5) % 2 === 0;
  if (!blink) {
    ctx.fillStyle = '#00e5ff';
    ctx.fillRect(player.x, player.y, player.w, player.h);
    ctx.fillStyle = '#a5f3fc';
    ctx.fillRect(player.x + 8, player.y + 3, player.w - 16, 4);
  }

  if (!gameOn) {
    ctx.fillStyle = 'rgba(0,0,0,.58)';
    ctx.fillRect(26, H / 2 - 68, W - 52, 136);
    ctx.strokeStyle = '#00e5ff';
    ctx.strokeRect(26, H / 2 - 68, W - 52, 136);

    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.font = 'bold 18px monospace';
    ctx.fillText('RETRO MOBILE DASH', W / 2, H / 2 - 26);
    ctx.font = '14px monospace';
    ctx.fillText(`SCORE: ${score} | BEST: ${best}`, W / 2, H / 2 + 2);
    ctx.fillStyle = '#7dff72';
    ctx.fillText('Tap START or press Space', W / 2, H / 2 + 30);
  }
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

function setLeft(down) { keys.left = down; }
function setRight(down) { keys.right = down; }

window.addEventListener('keydown', (e) => {
  if (e.code === 'ArrowLeft' || e.code === 'KeyA') setLeft(true);
  if (e.code === 'ArrowRight' || e.code === 'KeyD') setRight(true);
  if (e.code === 'Space') {
    e.preventDefault();
    if (!gameOn) startGame();
  }
});
window.addEventListener('keyup', (e) => {
  if (e.code === 'ArrowLeft' || e.code === 'KeyA') setLeft(false);
  if (e.code === 'ArrowRight' || e.code === 'KeyD') setRight(false);
});

function bindHold(btn, onDown, onUp) {
  const down = (e) => { e.preventDefault(); onDown(); };
  const up = (e) => { e.preventDefault(); onUp(); };
  btn.addEventListener('touchstart', down, { passive: false });
  btn.addEventListener('touchend', up, { passive: false });
  btn.addEventListener('touchcancel', up, { passive: false });
  btn.addEventListener('mousedown', down);
  btn.addEventListener('mouseup', up);
  btn.addEventListener('mouseleave', up);
}

bindHold(leftBtn, () => setLeft(true), () => setLeft(false));
bindHold(rightBtn, () => setRight(true), () => setRight(false));

function startByUserAction(e) {
  if (e) e.preventDefault();
  startGame();
}

startBtn.addEventListener('click', startByUserAction);
startBtn.addEventListener('touchstart', startByUserAction, { passive: false });

// Mobile users often tap the game area itself first.
canvas.addEventListener('touchstart', (e) => {
  e.preventDefault();
  if (!gameOn) startGame();
}, { passive: false });
canvas.addEventListener('mousedown', () => {
  if (!gameOn) startGame();
});

updateHud();
loop();
