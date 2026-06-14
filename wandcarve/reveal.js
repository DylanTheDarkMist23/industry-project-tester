// reveal.js — populates the win screen with the sender's image and message

// ------Helper------
function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// ------Load Session Data------
var data = {};
try {
  data = JSON.parse(sessionStorage.getItem('wandcarve') || '{}');
} catch(e) {}

if (!data.img) {
  location.href = 'sender.html';
} else {
  renderReveal(data);
}

// ------Render------
function renderReveal(d) {
  var img      = d.img      || '';
  var msgAfter = d.msgAfter || '';
  var name     = d.name     || 'sender';

  var revealImg = document.getElementById('reveal-img');
  revealImg.src = img;
  revealImg.alt = 'Surprise from ' + escapeHtml(name);

  if (msgAfter) {
    var msgEl = document.getElementById('reveal-end-msg');
    msgEl.textContent   = '"' + msgAfter + '"';
    msgEl.style.display = 'block';
  }

  document.getElementById('dl-btn').onclick = async function() {
    try {
      var blob = await fetch(img).then(function(r) { return r.blob(); });
      var url  = URL.createObjectURL(blob);
      var a    = document.createElement('a');
      a.href     = url;
      a.download = 'wandcarve-from-' + name.replace(/\s+/g, '-') + '.jpg';
      a.click();
      setTimeout(function() { URL.revokeObjectURL(url); }, 2000);
    } catch(e) {
      window.open(img, '_blank');
    }
  };
}
