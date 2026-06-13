// utils.js — little helper functions used all over the place

// just a short pause so the browser can repaint before a heavy operation
function tick() {
  return new Promise(r => setTimeout(r, 30));
}

// basic html escaping so user text can't break the dom
function escapeHtml(str) {
  return String(str)
    .replace(/&/g,  '&amp;')
    .replace(/"/g,  '&quot;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;');
}

// shrinks a base64 image so its longest side is maxPx, returns a jpeg
function resizeImage(dataUrl, maxPx) {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      let w = img.width;
      let h = img.height;

      if (w > maxPx || h > maxPx) {
        if (w > h) {
          h = Math.round(h * maxPx / w);
          w = maxPx;
        } else {
          w = Math.round(w * maxPx / h);
          h = maxPx;
        }
      }

      const c = document.createElement('canvas');
      c.width  = w;
      c.height = h;
      c.getContext('2d').drawImage(img, 0, 0, w, h);
      resolve(c.toDataURL('image/jpeg', 0.80));
    };

    img.onerror = reject;
    img.src = dataUrl;
  });
}

// copies text to clipboard, briefly flashes the button label
function copyTextToClipboard(text, btn) {
  const original = btn.textContent;

  function flash() {
    btn.textContent = '✓  Copied!';
    setTimeout(() => { btn.textContent = original; }, 2200);
  }

  navigator.clipboard.writeText(text)
    .then(flash)
    .catch(() => {
      // older browser fallback
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.cssText = 'position:fixed;opacity:0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      flash();
    });
}

// shortest distance from a point to a line segment A→B
function distancePointToSegment(pt, a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;

  if (!dx && !dy) return Math.hypot(pt.x - a.x, pt.y - a.y);

  const t = Math.max(0, Math.min(1,
    ((pt.x - a.x) * dx + (pt.y - a.y) * dy) / (dx * dx + dy * dy)
  ));

  return Math.hypot(pt.x - (a.x + t * dx), pt.y - (a.y + t * dy));
}

// gets pointer coords in canvas-pixel space for both mouse and touch
function getPointerPosition(e, canvas) {
  const rect = canvas.getBoundingClientRect();
  const src  = e.touches ? e.touches[0] : e;
  return {
    x: (src.clientX - rect.left) * (canvas.width  / rect.width),
    y: (src.clientY - rect.top)  * (canvas.height / rect.height),
  };
}

// draws a rounded rect because canvas doesn't have one in older browsers
function drawRoundedRect(ctx, x, y, w, h, r, fill) {
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

// draws a line through an array of points, with optional glow behind it
function drawPolyline(ctx, pts, lw, color, glow) {
  if (pts.length < 2) return;

  if (glow) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.strokeStyle = 'rgba(160, 126, 232, 0.18)';
    ctx.lineWidth   = lw + 12;
    ctx.lineCap     = 'round';
    ctx.lineJoin    = 'round';
    ctx.stroke();
    ctx.restore();
  }

  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.strokeStyle = color;
  ctx.lineWidth   = lw;
  ctx.lineCap     = 'round';
  ctx.lineJoin    = 'round';
  ctx.stroke();
}
