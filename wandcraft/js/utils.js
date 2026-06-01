// utils.js — shared helper functions

// Waits 30ms so the browser can repaint before the next heavy operation
function tick() {
  return new Promise(resolve => setTimeout(resolve, 30));
}

// Escapes HTML special characters to prevent XSS
function escapeHtml(string) {
  return String(string)
    .replace(/&/g,  '&amp;')
    .replace(/"/g,  '&quot;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;');
}

// Shrinks a base64 image so its longest side is at most maxDimension px, returns JPEG
function resizeImage(dataUrl, maxDimension) {
  return new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = () => {
      let width  = image.width;
      let height = image.height;

      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round(height * maxDimension / width);
          width  = maxDimension;
        } else {
          width  = Math.round(width * maxDimension / height);
          height = maxDimension;
        }
      }

      const canvas  = document.createElement('canvas');
      canvas.width  = width;
      canvas.height = height;
      canvas.getContext('2d').drawImage(image, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.80));
    };

    image.onerror = reject;
    image.src = dataUrl;
  });
}

// Copies text to clipboard; briefly shows "Copied!" on the button
function copyTextToClipboard(text, button) {
  const originalLabel = button.textContent;

  function showConfirmation() {
    button.textContent = '✓  Copied!';
    setTimeout(() => { button.textContent = originalLabel; }, 2200);
  }

  navigator.clipboard.writeText(text)
    .then(showConfirmation)
    .catch(() => {
      // Fallback for browsers without clipboard API
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.cssText = 'position:fixed;opacity:0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      showConfirmation();
    });
}

// Shortest distance from point P to line segment A→B (used for groove detection)
function distancePointToSegment(point, segmentStart, segmentEnd) {
  const dx = segmentEnd.x - segmentStart.x;
  const dy = segmentEnd.y - segmentStart.y;

  if (!dx && !dy) {
    return Math.hypot(point.x - segmentStart.x, point.y - segmentStart.y);
  }

  const t = Math.max(0, Math.min(1,
    ((point.x - segmentStart.x) * dx + (point.y - segmentStart.y) * dy) /
    (dx * dx + dy * dy)
  ));

  return Math.hypot(point.x - (segmentStart.x + t * dx), point.y - (segmentStart.y + t * dy));
}

// Returns {x, y} in canvas pixel space for both mouse and touch events.
// Divides by the CSS/canvas size ratio so coordinates are correct when the
// canvas is displayed larger than its 340×440 drawing buffer.
function getPointerPosition(event, canvasElement) {
  const rect   = canvasElement.getBoundingClientRect();
  const source = event.touches ? event.touches[0] : event;
  return {
    x: (source.clientX - rect.left) * (canvasElement.width  / rect.width),
    y: (source.clientY - rect.top)  * (canvasElement.height / rect.height),
  };
}

// Draws a rounded rectangle (canvas has no built-in rounded rect in older browsers)
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

// Draws a path through an array of points; glow adds a soft halo behind the line
function drawPolyline(ctx, points, lineWidth, color, glow) {
  if (points.length < 2) return;

  if (glow) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
    ctx.strokeStyle = 'rgba(160, 126, 232, 0.18)';
    ctx.lineWidth   = lineWidth + 12;
    ctx.lineCap     = 'round';
    ctx.lineJoin    = 'round';
    ctx.stroke();
    ctx.restore();
  }

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
  ctx.strokeStyle = color;
  ctx.lineWidth   = lineWidth;
  ctx.lineCap     = 'round';
  ctx.lineJoin    = 'round';
  ctx.stroke();
}
