// sender.js — handles the sender form, image upload, and link generation

// ------Constants------
var IMGBB_UPLOAD_URL = 'https://api.imgbb.com/1/upload';

// ------State------
var base64Image  = null;
var selectedDiff = 'medium';
var keyVerified  = false;

// ------Element References------
var apiKeyInput = document.getElementById('apiKey');
var senderName  = document.getElementById('senderName');
var msgBefore   = document.getElementById('msgBefore');
var msgAfter    = document.getElementById('msgAfter');
var uploadZone  = document.getElementById('uploadZone');
var imgPreview  = document.getElementById('imgPreview');
var fileInput   = document.getElementById('fileInput');
var generateBtn = document.getElementById('generateBtn');
var statusMsg   = document.getElementById('statusMsg');
var errorMsg    = document.getElementById('errorMsg');
var linkCard    = document.getElementById('linkCard');
var linkDisplay = document.getElementById('linkDisplay');
var copyBtn     = document.getElementById('copyBtn');
var testBtn     = document.getElementById('testBtn');
var keyStatus   = document.getElementById('keyStatus');

// ------Helper Functions------
function tick() {
  return new Promise(function(r) { setTimeout(r, 30); });
}

function resizeImage(dataUrl, maxPx) {
  return new Promise(function(resolve, reject) {
    var img = new Image();
    img.onload = function() {
      var w = img.width;
      var h = img.height;
      if (w > maxPx || h > maxPx) {
        if (w > h) { h = Math.round(h * maxPx / w); w = maxPx; }
        else       { w = Math.round(w * maxPx / h); h = maxPx; }
      }
      var c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      c.getContext('2d').drawImage(img, 0, 0, w, h);
      resolve(c.toDataURL('image/jpeg', 0.80));
    };
    img.onerror = reject;
    img.src = dataUrl;
  });
}

function copyToClipboard(text, btn) {
  var original = btn.textContent;
  function flash() {
    btn.textContent = '✓  Copied!';
    setTimeout(function() { btn.textContent = original; }, 2200);
  }
  navigator.clipboard.writeText(text).then(flash).catch(function() {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;opacity:0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    flash();
  });
}

function showErr(msg) {
  errorMsg.textContent  = msg;
  statusMsg.textContent = '';
  generateBtn.disabled  = false;
}

function checkReady() {
  generateBtn.disabled = !(keyVerified && senderName.value.trim() && base64Image);
}

// ------API Key Test------
testBtn.onclick = async function() {
  var key = apiKeyInput.value.trim();
  if (!key) {
    keyStatus.className   = 'key-status key-err';
    keyStatus.textContent = 'Please paste your API key first';
    return;
  }

  testBtn.textContent   = '…';
  testBtn.disabled      = true;
  keyStatus.className   = 'key-status key-hint';
  keyStatus.textContent = 'Testing…';

  // a tiny 1x1 transparent png to check the key is valid
  var tiny = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

  try {
    var fd = new FormData();
    fd.append('key',   key);
    fd.append('image', tiny);

    var res = await fetch(IMGBB_UPLOAD_URL, { method: 'POST', body: fd });

    var result;
    try {
      result = await res.json();
    } catch(e) {
      throw new Error('HTTP ' + res.status + ' — unexpected response from imgbb');
    }

    if (result.success) {
      keyVerified           = true;
      keyStatus.className   = 'key-status key-ok';
      keyStatus.textContent = '✓ Key works! You\'re good to go.';
    } else {
      keyVerified           = false;
      keyStatus.className   = 'key-status key-err';
      var reason = (result.error && (result.error.message || result.error.code)) || 'unknown';
      keyStatus.textContent = '✕ Key rejected: ' + reason;
    }
  } catch(err) {
    keyVerified           = false;
    keyStatus.className   = 'key-status key-err';
    keyStatus.textContent = '✕ Error: ' + err.message;
    console.error('imgbb test error:', err);
  }

  testBtn.textContent = 'Test';
  testBtn.disabled    = false;
  checkReady();
};

// ------Input Listeners------
apiKeyInput.addEventListener('input', function() {
  keyVerified           = false;
  keyStatus.className   = 'key-status key-hint';
  keyStatus.textContent = 'Paste your key then tap Test to verify it works';
  checkReady();
});

senderName.addEventListener('input', checkReady);

// ------Image Upload------
uploadZone.onclick = function() { fileInput.click(); };

fileInput.onchange = function(e) {
  var file = e.target.files[0];
  if (!file) return;
  var reader = new FileReader();
  reader.onload = function(ev) {
    base64Image              = ev.target.result;
    imgPreview.src           = base64Image;
    imgPreview.style.display = 'block';
    uploadZone.style.display = 'none';
    checkReady();
  };
  reader.readAsDataURL(file);
};

// ------Difficulty Selection------
['de', 'dm', 'dh'].forEach(function(id) {
  document.getElementById(id).onclick = function() {
    selectedDiff = { de: 'easy', dm: 'medium', dh: 'hard' }[id];
    ['de', 'dm', 'dh'].forEach(function(x) {
      document.getElementById(x).classList.toggle('dsel', x === id);
    });
  };
});

// ------Generate Link------
generateBtn.onclick = async function() {
  var key  = apiKeyInput.value.trim();
  var name = senderName.value.trim();
  if (!key || !name || !base64Image) return;

  generateBtn.disabled = true;
  errorMsg.textContent = '';

  statusMsg.textContent = 'Resizing image…';
  await tick();

  var resized;
  try {
    resized = await resizeImage(base64Image, 800);
  } catch(e) {
    showErr('Could not process the image. Try a different file.');
    return;
  }

  statusMsg.textContent = 'Uploading image…';
  await tick();

  var fd = new FormData();
  fd.append('key',   key);
  fd.append('image', resized.split(',')[1]);

  var imgUrl;
  try {
    var res = await fetch(IMGBB_UPLOAD_URL, { method: 'POST', body: fd });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    var result = await res.json();
    if (!result.success) throw new Error((result.error && result.error.message) || 'Upload rejected');
    imgUrl = result.data.url;
  } catch(err) {
    showErr('Upload failed: ' + err.message);
    return;
  }

  statusMsg.textContent = 'Building link…';
  await tick();

  var payload = JSON.stringify({
    img:       imgUrl,
    name:      name,
    msgBefore: msgBefore.value.trim(),
    msgAfter:  msgAfter.value.trim(),
    diff:      selectedDiff
  });

  var encoded = LZString.compressToEncodedURIComponent(payload);
  var base    = location.href.replace(/sender\.html.*$/, '');
  var url     = base + 'intro.html#data=' + encoded;

  statusMsg.textContent   = '';
  linkCard.style.display  = 'flex';
  linkDisplay.textContent = url;

  generateBtn.textContent = '✓ Link ready!';
  generateBtn.classList.add('green');
  generateBtn.disabled = false;

  copyBtn.onclick = function() { copyToClipboard(url, copyBtn); };
};
