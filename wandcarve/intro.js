// intro.js — reads the URL hash, decodes the payload, and renders the intro screen

// ------Helper------
function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// ------Read & Decode Payload------
var hash = location.hash.slice(1);

if (!hash.startsWith('data=')) {
  showBroken();
} else {
  var data = null;
  try {
    var json = LZString.decompressFromEncodedURIComponent(hash.slice(5));
    if (!json) throw new Error('empty result');
    data = JSON.parse(json);
    if (!data.img) throw new Error('no image in payload');
  } catch(e) {
    console.error('Payload decode failed:', e);
    showBroken();
    data = null;
  }
  if (data) renderIntro(data);
}

// ------Render Intro Screen------
function renderIntro(data) {
  var name      = data.name      || '';
  var msgBefore = data.msgBefore || '';

  // save to sessionStorage so game.html and reveal.html can read it
  sessionStorage.setItem('wandcarve', JSON.stringify(data));

  document.getElementById('intro-name').textContent = name;
  document.getElementById('intro-sent').textContent = 'sent you a surprise';

  if (msgBefore) {
    document.getElementById('intro-msg').textContent = '"' + msgBefore + '"';
    document.getElementById('intro-msg').style.display = 'block';
  }

  document.getElementById('intro-screen').style.display = 'flex';
  document.getElementById('broken-screen').style.display = 'none';

  document.getElementById('startBtn').onclick = function() {
    location.href = 'game.html';
  };

  document.getElementById('howBtn').onclick = function() {
    location.href = 'howtoplay.html';
  };
}

// ------Broken Link Screen------
function showBroken() {
  document.getElementById('intro-screen').style.display  = 'none';
  document.getElementById('broken-screen').style.display = 'flex';
}
