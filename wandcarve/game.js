// game.js — groove-tracing minigame logic

// ------Game Constants------
var COLORS = {
  wand:      '#5C3D1E',
  wandLight: '#8A5E30',
  groove:    '#A07EE8',
  grooveDim: 'rgba(160, 126, 232, 0.28)',
  accent:    '#E0B85A',
  success:   '#3AD98A',
  danger:    '#E85555'
};

var GROOVE_SEGMENTS = [
  [ { x: 170, y: 50  }, { x: 167, y: 137 } ],
  [ { x: 167, y: 137 }, { x: 163, y: 224 } ],
  [ { x: 163, y: 224 }, { x: 170, y: 311 } ],
  [ { x: 170, y: 311 }, { x: 167, y: 370 } ],
  [ { x: 167, y: 370 }, { x: 170, y: 410 } ]
];

var DIFFICULTY_CONFIG = {
  easy:   { tol: 20, endR: 20, startR: 20, col: '#3AD98A' },
  medium: { tol: 13, endR: 14, startR: 14, col: '#E0B85A' },
  hard:   { tol: 8,  endR: 10, startR: 10, col: '#E85555' }
};

var GAME_TIME = 60;
var CANVAS_W  = 340;
var CANVAS_H  = 440;

// ------Load Session Data------
var gameData = {};
try {
  gameData = JSON.parse(sessionStorage.getItem('wandcarve') || '{}');
} catch(e) {}

if (!gameData.img) {
  // nothing loaded — send them to the sender form
  location.href = 'sender.html';
}

var diff = gameData.diff || 'medium';
var cfg  = DIFFICULTY_CONFIG[diff] || DIFFICULTY_CONFIG.medium;

// ------Element References------
var canvas     = document.getElementById('gameCanvas');
var ctx        = canvas.getContext('2d');
var hint       = document.getElementById('hint');
var segCounter = document.getElementById('segCounter');
var timerFill  = document.getElementById('timer-fill');
var timerLabel = document.getElementById('timer-label');

// ------Initial UI------
timerFill.style.backgroundColor = COLORS.groove;
timerLabel.style.color          = COLORS.groove;
timerLabel.textContent          = GAME_TIME + 's remaining';
segCounter.style.color          = cfg.col;
segCounter.textContent          = 'SEGMENT 1 OF ' + GROOVE_SEGMENTS.length;

// ------Game State------
var segIndex  = 0;
var tracing   = false;
var started   = false;
var won       = false;
var failed    = false;
var tracePath = [];
var donePaths = [];
var timeLeft  = GAME_TIME;
var countdown = null;
var raf       = null;

// ------Helper Functions------
function distancePointToSegment(pt, a, b) {
  var dx = b.x - a.x;
  var dy = b.y - a.y;
  if (!dx && !dy) return Math.hypot(pt.x - a.x, pt.y - a.y);
  var t = Math.max(0, Math.min(1, ((pt.x - a.x) * dx + (pt.y - a.y) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(pt.x - (a.x + t * dx), pt.y - (a.y + t * dy));
}

function getPointerPosition(e) {
  var rect = canvas.getBoundingClientRect();
  var src  = e.touches ? e.touches[0] : e;
  return {
    x: (src.clientX - rect.left) * (canvas.width  / rect.width),
    y: (src.clientY - rect.top)  * (canvas.height / rect.height)
  };
}

function drawRoundedRect(x, y, w, h, r, fill) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y,     x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x,     y + h, x,     y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x,     y,     x + r, y);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}

function drawPolyline(pts, lw, color, glow) {
  if (pts.length < 2) return;
  if (glow) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (var i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.strokeStyle = 'rgba(160, 126, 232, 0.18)';
    ctx.lineWidth   = lw + 12;
    ctx.lineCap     = 'round';
    ctx.lineJoin    = 'round';
    ctx.stroke();
    ctx.restore();
  }
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (var j = 1; j < pts.length; j++) ctx.lineTo(pts[j].x, pts[j].y);
  ctx.strokeStyle = color;
  ctx.lineWidth   = lw;
  ctx.lineCap     = 'round';
  ctx.lineJoin    = 'round';
  ctx.stroke();
}

// ------Game Logic------
function updateSeg() {
  segCounter.textContent = 'SEGMENT ' + (segIndex + 1) + ' OF ' + GROOVE_SEGMENTS.length;
}

function startTimer() {
  if (countdown) return;
  countdown = setInterval(function() {
    timeLeft--;
    timerFill.style.width = (timeLeft / GAME_TIME * 100) + '%';

    var col = timeLeft <= 10 ? COLORS.danger
            : timeLeft <= 20 ? COLORS.accent
            : COLORS.groove;

    timerFill.style.backgroundColor = col;
    timerLabel.style.color          = col;
    timerLabel.textContent          = timeLeft + 's remaining';

    if (timeLeft <= 0) {
      clearInterval(countdown);
      triggerFail();
    }
  }, 1000);
}

function triggerFail() {
  if (won || failed) return;
  failed  = true;
  tracing = false;
  clearInterval(countdown);
  cancelAnimationFrame(raf);
  setTimeout(function() { location.href = 'fail.html'; }, 650);
}

function completeSegment() {
  donePaths.push(tracePath.slice());
  tracePath = [];
  tracing   = false;

  if (segIndex >= GROOVE_SEGMENTS.length - 1) {
    won = true;
    clearInterval(countdown);
    cancelAnimationFrame(raf);
    setTimeout(function() { location.href = 'reveal.html'; }, 800);
  } else {
    segIndex++;
    updateSeg();
    hint.textContent = 'Segment ' + (segIndex + 1) + ' unlocked — tap the green dot';
  }
}

// ------Draw Loop------
function draw() {
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

  // wand shaft
  var shaft = ctx.createLinearGradient(156, 0, 184, 0);
  shaft.addColorStop(0,   COLORS.wandLight);
  shaft.addColorStop(0.5, COLORS.wand);
  shaft.addColorStop(1,   COLORS.wandLight);
  drawRoundedRect(156, 36, 28, 380, 14, shaft);

  // handle
  var handle = ctx.createLinearGradient(146, 0, 194, 0);
  handle.addColorStop(0,   '#B38010');
  handle.addColorStop(0.5, COLORS.accent);
  handle.addColorStop(1,   '#B38010');
  drawRoundedRect(146, 410, 48, 18, 9, handle);

  // tip orb
  ctx.beginPath();
  ctx.arc(170, 32, 17, 0, Math.PI * 2);
  ctx.fillStyle = won ? COLORS.success : COLORS.accent;
  ctx.fill();

  ctx.beginPath();
  ctx.arc(163, 26, 5, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.fill();

  // completed segment traces
  for (var d = 0; d < donePaths.length; d++) {
    drawPolyline(donePaths[d], 7, COLORS.groove, false);
  }

  // faint guide for current segment
  if (!won) {
    var seg = GROOVE_SEGMENTS[segIndex];
    drawPolyline([seg[0], seg[1]], 7, COLORS.grooveDim, false);
  }

  // live trace
  if (tracePath.length > 1) {
    drawPolyline(tracePath, 7, failed ? COLORS.danger : COLORS.groove, !failed);
  }

  // finger cursor dot
  if (tracing && tracePath.length > 0) {
    var last = tracePath[tracePath.length - 1];
    ctx.beginPath();
    ctx.arc(last.x, last.y, 20, 0, Math.PI * 2);
    ctx.fillStyle = failed ? 'rgba(232, 85, 85, 0.18)' : 'rgba(160, 126, 232, 0.18)';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(last.x, last.y, 9, 0, Math.PI * 2);
    ctx.fillStyle = failed ? COLORS.danger : COLORS.groove;
    ctx.fill();
  }

  // start and end dots
  if (!won && !failed) {
    var s  = GROOVE_SEGMENTS[segIndex];
    var st = s[0];
    var en = s[1];
    var sp = 0.5 + 0.5 * Math.sin(Date.now() / 350);
    var ep = 0.5 + 0.5 * Math.sin(Date.now() / 400 + 1);

    if (!tracing) {
      ctx.beginPath();
      ctx.arc(st.x, st.y, 18 + sp * 6, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(58, 217, 138, ' + (0.07 + sp * 0.10) + ')';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(st.x, st.y, 12, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(58, 217, 138, 0.20)';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(st.x, st.y, 7, 0, Math.PI * 2);
      ctx.fillStyle = COLORS.success;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(st.x - 2, st.y - 2, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.fill();

      ctx.fillStyle = COLORS.success;
      ctx.font      = 'bold 10px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(segIndex === 0 ? 'START HERE' : 'CONTINUE', st.x, st.y + 28);
    }

    ctx.beginPath();
    ctx.arc(en.x, en.y, cfg.endR, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(58, 217, 138, ' + (0.30 + ep * 0.25) + ')';
    ctx.lineWidth   = 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(en.x, en.y, 6, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(58, 217, 138, 0.75)';
    ctx.fill();

    ctx.fillStyle = 'rgba(58, 217, 138, 0.85)';
    ctx.font      = 'bold 10px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(
      segIndex === GROOVE_SEGMENTS.length - 1 ? 'FINISH' : 'NEXT',
      en.x + 20, en.y + 4
    );
  }

  raf = requestAnimationFrame(draw);
}

raf = requestAnimationFrame(draw);

// ------Input Handlers------
function onDown(e) {
  e.preventDefault();
  if (won || failed || tracing) return;
  var pos   = getPointerPosition(e);
  var start = GROOVE_SEGMENTS[segIndex][0];
  if (Math.hypot(pos.x - start.x, pos.y - start.y) > cfg.startR) return;
  tracing = true;
  if (!started) { started = true; startTimer(); }
  tracePath = [pos];
  hint.textContent = 'Trace to the green endpoint';
}

function onMove(e) {
  e.preventDefault();
  if (!tracing || won || failed) return;
  var pos = getPointerPosition(e);
  var seg = GROOVE_SEGMENTS[segIndex];
  if (distancePointToSegment(pos, seg[0], seg[1]) > cfg.tol) {
    tracePath.push(pos);
    triggerFail();
    return;
  }
  tracePath.push(pos);
  if (Math.hypot(pos.x - seg[1].x, pos.y - seg[1].y) <= cfg.endR) completeSegment();
}

function onUp(e) {
  e.preventDefault();
  tracing = false;
}

canvas.addEventListener('mousedown',  onDown, { passive: false });
canvas.addEventListener('mousemove',  onMove, { passive: false });
canvas.addEventListener('mouseup',    onUp);
canvas.addEventListener('mouseleave', onUp);
canvas.addEventListener('touchstart', onDown, { passive: false });
canvas.addEventListener('touchmove',  onMove, { passive: false });
canvas.addEventListener('touchend',   onUp);
