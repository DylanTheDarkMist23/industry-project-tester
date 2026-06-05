// app.js — routing and all screens
// Depends on config.js and utils.js (loaded first)

const phoneElement = document.getElementById('phone');


// ── Routing ───────────────────────────────────────────────────────────────────
// #play=... → receiver flow; anything else → sender form

function route() {
  const hash = location.hash.slice(1);

  if (hash.startsWith('play=')) {
    try {
      const json = LZString.decompressFromEncodedURIComponent(hash.slice(5));
      if (!json) throw new Error('Empty decompression');

      const data = JSON.parse(json);
      if (!data.img) throw new Error('No image in payload');

      showIntro(data);

    } catch (error) {
      showError(
        'Broken link',
        'This WandCarve link appears to be corrupted or incomplete. Ask the sender to generate a new one.'
      );
    }

  } else {
    showSender();
  }
}

window.addEventListener('hashchange', route);
window.showSender = showSender;


// ── Sender screen ─────────────────────────────────────────────────────────────

function showSender() {
  let base64Image   = null;
  let selectedDiff  = 'medium';
  let keyIsVerified = false;

  phoneElement.innerHTML = `
    <div class="screen">
      <div class="sbar"><span>9:41</span><span>● ● ●</span></div>

      <div class="wrap">

        <div>
          <div class="logo-title">WANDCARVE</div>
          <div class="logo-sub">Lock a surprise behind a spell</div>
        </div>

        <!-- API key -->
        <div>
          <div class="lbl">
            IMGBB API KEY &nbsp;
            <a href="https://api.imgbb.com" target="_blank"
               style="font-size:10px;color:#8A67CC;text-decoration:none;">
              Get free key ↗
            </a>
          </div>
          <div class="key-row">
            <input class="field" id="apiKey" type="password"
                   placeholder="Paste your API key here…" autocomplete="off"/>
            <button class="key-test-btn" id="testBtn">Test</button>
          </div>
          <div class="key-status key-hint" id="keyStatus">
            Paste your key then tap Test to verify it works
          </div>
        </div>

        <!-- Sender name -->
        <div>
          <div class="lbl">YOUR NAME</div>
          <input class="field" id="senderName" type="text"
                 placeholder="Enter a name the receiver will know" maxlength="40"/>
        </div>

        <!-- Beginning message -->
        <div>
          <div class="lbl">
            BEGINNING MESSAGE
            <span style="opacity:.5;font-size:9px">(shown before the game)</span>
          </div>
          <textarea class="field" id="msgBefore" rows="2" maxlength="200"
                    placeholder="e.g. I have a little something for you…"></textarea>
        </div>

        <!-- Image upload -->
        <div>
          <div class="lbl">YOUR IMAGE</div>
          <div class="upload-zone" id="uploadZone">
            <div style="font-size:24px;color:#8A67CC;margin-bottom:5px">⬆</div>
            <div style="font-size:13px;color:rgba(255,255,255,.46)">Tap to choose a photo</div>
          </div>
          <img class="preview" id="imagePreview" alt="Your chosen photo"/>
          <input type="file" id="fileInput" accept="image/*"/>
        </div>

        <!-- Ending message -->
        <div>
          <div class="lbl">
            ENDING MESSAGE
            <span style="opacity:.5;font-size:9px">(shown after winning)</span>
          </div>
          <textarea class="field" id="msgAfter" rows="2" maxlength="200"
                    placeholder="e.g. Hope you liked it! 🎉"></textarea>
        </div>

        <!-- Difficulty picker -->
        <div>
          <div class="lbl">DIFFICULTY FOR RECEIVER</div>
          <div class="diff-row">
            <button class="diff-btn de" id="de">EASY</button>
            <button class="diff-btn dm dsel" id="dm">MEDIUM</button>
            <button class="diff-btn dh" id="dh">HARD</button>
          </div>
        </div>

        <div class="status"     id="statusMsg"></div>
        <div class="err-inline" id="errorMsg"></div>

        <button class="main-btn" id="generateBtn" disabled>Generate link</button>

        <div id="linkCard" style="display:none" class="link-card">
          <div class="link-url" id="linkDisplay"></div>
          <button class="copy-btn" id="copyBtn">⎘ &nbsp;Copy link</button>
        </div>

      </div>
    </div>`;

  const apiKeyInput     = phoneElement.querySelector('#apiKey');
  const senderNameInput = phoneElement.querySelector('#senderName');
  const msgBeforeInput  = phoneElement.querySelector('#msgBefore');
  const msgAfterInput   = phoneElement.querySelector('#msgAfter');
  const uploadZone      = phoneElement.querySelector('#uploadZone');
  const imagePreview    = phoneElement.querySelector('#imagePreview');
  const fileInput       = phoneElement.querySelector('#fileInput');
  const generateBtn     = phoneElement.querySelector('#generateBtn');
  const statusMsg       = phoneElement.querySelector('#statusMsg');
  const errorMsg        = phoneElement.querySelector('#errorMsg');
  const linkCard        = phoneElement.querySelector('#linkCard');
  const linkDisplay     = phoneElement.querySelector('#linkDisplay');
  const copyBtn         = phoneElement.querySelector('#copyBtn');
  const testBtn         = phoneElement.querySelector('#testBtn');
  const keyStatus       = phoneElement.querySelector('#keyStatus');

  function updateGenerateButton() {
    generateBtn.disabled = !(keyIsVerified && senderNameInput.value.trim() && base64Image);
  }

  senderNameInput.addEventListener('input', updateGenerateButton);

  apiKeyInput.addEventListener('input', () => {
    keyIsVerified = false;
    keyStatus.className   = 'key-status key-hint';
    keyStatus.textContent = 'Paste your key then tap Test to verify it works';
    updateGenerateButton();
  });

  // Uploads a 1×1 PNG to imgbb to confirm the key is valid
  testBtn.onclick = async () => {
    const key = apiKeyInput.value.trim();
    if (!key) {
      keyStatus.className   = 'key-status key-err';
      keyStatus.textContent = 'Please paste your API key first';
      return;
    }

    testBtn.textContent   = '…';
    testBtn.disabled      = true;
    keyStatus.className   = 'key-status key-hint';
    keyStatus.textContent = 'Testing…';

    const tinyPng = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

    try {
      const formData = new FormData();
      formData.append('key',   key);
      formData.append('image', tinyPng);
      // No Content-Type header — FormData sets it automatically with the correct boundary
      const response = await fetch(IMGBB_UPLOAD_URL, { method: 'POST', body: formData });
      const result   = await response.json();

      if (result.success) {
        keyIsVerified         = true;
        keyStatus.className   = 'key-status key-ok';
        keyStatus.textContent = '✓ Key works! You\'re good to go.';
      } else {
        keyIsVerified         = false;
        keyStatus.className   = 'key-status key-err';
        keyStatus.textContent = '✕ Key rejected: ' + (result.error?.message || 'invalid key');
      }

    } catch {
      keyIsVerified         = false;
      keyStatus.className   = 'key-status key-err';
      keyStatus.textContent = '✕ Could not reach imgbb — check your internet connection';
    }

    testBtn.textContent = 'Test';
    testBtn.disabled    = false;
    updateGenerateButton();
  };

  uploadZone.onclick = () => fileInput.click();

  fileInput.onchange = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      base64Image = loadEvent.target.result;
      imagePreview.src           = base64Image;
      imagePreview.style.display = 'block';
      uploadZone.style.display   = 'none';
      updateGenerateButton();
    };
    reader.readAsDataURL(file);
  };

  ['de', 'dm', 'dh'].forEach(buttonId => {
    phoneElement.querySelector('#' + buttonId).onclick = () => {
      selectedDiff = { de: 'easy', dm: 'medium', dh: 'hard' }[buttonId];
      ['de', 'dm', 'dh'].forEach(id => {
        phoneElement.querySelector('#' + id).classList.toggle('dsel', id === buttonId);
      });
    };
  });

  generateBtn.onclick = async () => {
    const key  = apiKeyInput.value.trim();
    const name = senderNameInput.value.trim();
    if (!key || !name || !base64Image) return;

    generateBtn.disabled = true;
    errorMsg.textContent = '';

    statusMsg.textContent = 'Resizing image…';
    await tick();

    let resizedImage;
    try {
      resizedImage = await resizeImage(base64Image, 800);
    } catch {
      showInlineError('Could not process the image. Try a different file.');
      return;
    }

    statusMsg.textContent = 'Uploading image…';
    await tick();

    const formData = new FormData();
    formData.append('key',   key);
    formData.append('image', resizedImage.split(',')[1]);

    let hostedImageUrl;
    try {
      const response = await fetch(IMGBB_UPLOAD_URL, { method: 'POST', body: formData });
      if (!response.ok) throw new Error('HTTP ' + response.status);

      const result = await response.json();
      if (!result.success) throw new Error(result.error?.message || 'Upload rejected by imgbb');

      hostedImageUrl = result.data.url;

    } catch (uploadError) {
      showInlineError('Upload failed: ' + uploadError.message + '. Use the Test button to check your key.');
      return;
    }

    statusMsg.textContent = 'Building link…';
    await tick();

    const payload = JSON.stringify({
      img:       hostedImageUrl,
      name:      name,
      msgBefore: msgBeforeInput.value.trim(),
      msgAfter:  msgAfterInput.value.trim(),
      diff:      selectedDiff,
    });

    const encodedPayload = LZString.compressToEncodedURIComponent(payload);
    const shareableUrl   = location.href.split('#')[0] + '#play=' + encodedPayload;

    statusMsg.textContent        = '';
    linkCard.style.display       = 'flex';
    linkCard.style.flexDirection = 'column';
    linkDisplay.textContent      = shareableUrl;

    generateBtn.textContent = '✓ Link ready!';
    generateBtn.classList.add('green');
    generateBtn.disabled = false;

    copyBtn.onclick = () => copyTextToClipboard(shareableUrl, copyBtn);
  };

  function showInlineError(message) {
    errorMsg.textContent  = message;
    statusMsg.textContent = '';
    generateBtn.disabled  = false;
  }
}


// ── Intro screen ──────────────────────────────────────────────────────────────

function showIntro(data) {
  const { name, msgBefore, msgAfter, img, diff } = data;

  phoneElement.innerHTML = `
    <div class="screen">
      <div class="sbar"><span>9:41</span><span>● ● ●</span></div>

      <div class="intro-wrap">

        <div style="margin-bottom:18px">
          <svg width="44" height="130" viewBox="0 0 44 130">
            <defs>
              <linearGradient id="wandGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%"   stop-color="#8A5E30"/>
                <stop offset="50%"  stop-color="#5C3D1E"/>
                <stop offset="100%" stop-color="#8A5E30"/>
              </linearGradient>
            </defs>
            <rect x="13" y="16" width="18" height="100" rx="9" fill="url(#wandGradient)"/>
            <circle cx="22" cy="12" r="12" fill="#E0B85A"/>
            <circle cx="17" cy="7"  r="4"  fill="white" opacity=".45"/>
            <rect x="9" y="110" width="26" height="11" rx="5.5" fill="#E0B85A"/>
            <rect x="20" y="28" width="4" height="72" rx="2" fill="#A07EE8" opacity=".45"/>
            <circle cx="22" cy="28" r="5" fill="#3AD98A"/>
            <circle cx="22" cy="96" r="4" fill="#3AD98A" opacity=".6"/>
          </svg>
        </div>

        <div class="intro-from">A WANDCARVE FROM</div>
        <div class="intro-name">${escapeHtml(name)}</div>
        <div class="intro-sent">sent you a surprise</div>

        <div class="intro-divider"></div>

        ${msgBefore
          ? `<div class="intro-msg">"${escapeHtml(msgBefore)}"</div>`
          : '<div style="height:8px"></div>'
        }

        <div class="intro-btns">
          <button class="main-btn" id="startBtn">✦ &nbsp;Start the spell</button>
          <button class="main-btn purple" id="howBtn">How to play</button>
        </div>

      </div>
    </div>`;

  phoneElement.querySelector('#startBtn').onclick = () => showGame(diff, img, msgAfter, name);
  phoneElement.querySelector('#howBtn').onclick   = () => showHowToPlay(data);
}


// ── How to play screen ────────────────────────────────────────────────────────

function showHowToPlay(data) {
  const steps = [
    {
      colour: '#A07EE8', number: '01', icon: '👁',
      title: 'One segment at a time',
      desc: 'Only the current piece of the groove is shown. Complete it to reveal the next.',
    },
    {
      colour: '#3AD98A', number: '02', icon: '☝',
      title: 'Start on the green dot',
      desc: 'Tap the pulsing green circle to begin each segment — you must tap it to start.',
    },
    {
      colour: '#A07EE8', number: '03', icon: '↓',
      title: 'Drag to the endpoint',
      desc: 'Slide your finger along the groove all the way to the green endpoint.',
    },
    {
      colour: '#E85555', number: '04', icon: '⚡',
      title: 'Don\'t leave the path',
      desc: 'Straying off the groove breaks the spell instantly. No shortcuts!',
    },
    {
      colour: '#3AD98A', number: '05', icon: '✓',
      title: 'Complete all segments',
      desc: 'Finish every segment in order and the surprise unlocks. You win!',
    },
  ];

  const stepsHtml = steps.map(step => `
    <div class="step-card" style="border-left:3px solid ${step.colour}">
      <div style="display:flex;flex-direction:column;align-items:center;min-width:28px;gap:3px">
        <div style="font-size:9px;font-weight:700;letter-spacing:1px;color:${step.colour}">${step.number}</div>
        <div style="font-size:17px">${step.icon}</div>
      </div>
      <div>
        <div class="step-title">${step.title}</div>
        <div class="step-desc">${step.desc}</div>
      </div>
    </div>
  `).join('');

  phoneElement.innerHTML = `
    <div class="screen howto-wrap">
      <div class="sbar"><span>9:41</span><span>● ● ●</span></div>

      <div style="display:flex;align-items:center;padding:6px 16px;">
        <button id="backBtn"
                style="background:rgba(255,255,255,0.08);border:none;color:rgba(255,255,255,0.65);
                       border-radius:16px;padding:5px 12px;font-size:12px;cursor:pointer;">
          ← Back
        </button>
        <div style="flex:1;text-align:center;font-size:14px;font-weight:700;letter-spacing:1px;">
          HOW TO PLAY
        </div>
        <div style="width:60px"></div>
      </div>

      <div style="width:36px;height:2px;background:#8A67CC;border-radius:1px;margin:0 auto 10px;"></div>

      <div class="howto-body">
        ${stepsHtml}
        <div class="tip-card">⏱ &nbsp;You have ${GAME_TIME_SECONDS} seconds — slow and steady wins the spell</div>
        <div style="height:4px"></div>
      </div>

      <div style="padding:12px 20px 20px;">
        <button class="main-btn" id="startFromHow">✦ &nbsp;Start the spell</button>
      </div>
    </div>`;

  phoneElement.querySelector('#backBtn').onclick      = () => showIntro(data);
  phoneElement.querySelector('#startFromHow').onclick = () => showGame(data.diff, data.img, data.msgAfter, data.name);
}


// ── Game screen ───────────────────────────────────────────────────────────────
// Canvas minigame — requestAnimationFrame loop, touch + mouse input

function showGame(difficulty, imageSrc, msgAfter, senderName) {

  const cfg = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG.medium;

  phoneElement.innerHTML = `
    <div class="screen">
      <div class="sbar"><span>9:41</span><span>● ● ●</span></div>
      <div class="g-hint" id="hint">Tap the green dot to begin</div>
      <div class="g-seg" id="segCounter" style="color:${cfg.col}">
        SEGMENT 1 OF ${GROOVE_SEGMENTS.length}
      </div>
      <canvas id="gameCanvas" width="${CANVAS_WIDTH}" height="${CANVAS_HEIGHT}"></canvas>
      <div class="timer-wrap">
        <div class="timer-bar">
          <div class="timer-fill" id="timerFill"
               style="width:100%;background:${COLORS.groove}"></div>
        </div>
        <div class="timer-lbl" id="timerLabel" style="color:${COLORS.groove}">
          ${GAME_TIME_SECONDS}s remaining
        </div>
      </div>
    </div>`;

  const canvas     = phoneElement.querySelector('#gameCanvas');
  const ctx        = canvas.getContext('2d');
  const hintText   = phoneElement.querySelector('#hint');
  const segCounter = phoneElement.querySelector('#segCounter');
  const timerFill  = phoneElement.querySelector('#timerFill');
  const timerLabel = phoneElement.querySelector('#timerLabel');

  let currentSegmentIndex = 0;
  let isTracing           = false;
  let gameHasStarted      = false;
  let gameWon             = false;
  let gameFailed          = false;

  let currentTracePath = [];
  let completedPaths   = [];

  let timeRemaining  = GAME_TIME_SECONDS;
  let countdownTimer = null;
  let animationFrame = null;

  function updateSegmentCounter() {
    segCounter.textContent = `SEGMENT ${currentSegmentIndex + 1} OF ${GROOVE_SEGMENTS.length}`;
  }

  function startCountdown() {
    if (countdownTimer) return;

    countdownTimer = setInterval(() => {
      timeRemaining--;

      timerFill.style.width = (timeRemaining / GAME_TIME_SECONDS * 100) + '%';

      const colour = timeRemaining <= 10 ? COLORS.danger
                   : timeRemaining <= 20 ? COLORS.accent
                   : COLORS.groove;

      timerFill.style.background = colour;
      timerLabel.style.color     = colour;
      timerLabel.textContent     = timeRemaining + 's remaining';

      if (timeRemaining <= 0) {
        clearInterval(countdownTimer);
        triggerFail();
      }
    }, 1000);
  }

  function triggerFail() {
    if (gameWon || gameFailed) return;
    gameFailed = true;
    isTracing  = false;
    clearInterval(countdownTimer);
    cancelAnimationFrame(animationFrame);
    setTimeout(() => showFail(difficulty, imageSrc, msgAfter, senderName), 650);
  }

  function completeSegment() {
    completedPaths.push([...currentTracePath]);
    currentTracePath = [];
    isTracing        = false;

    if (currentSegmentIndex >= GROOVE_SEGMENTS.length - 1) {
      gameWon = true;
      clearInterval(countdownTimer);
      cancelAnimationFrame(animationFrame);
      setTimeout(() => showReveal(imageSrc, msgAfter, senderName), 800);
    } else {
      currentSegmentIndex++;
      updateSegmentCounter();
      hintText.textContent = `Segment ${currentSegmentIndex + 1} unlocked — tap the green dot`;
    }
  }

  // Canvas draw loop (~60fps)
  function drawFrame() {
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Wand shaft
    const wandGradient = ctx.createLinearGradient(156, 0, 184, 0);
    wandGradient.addColorStop(0,   COLORS.wandLight);
    wandGradient.addColorStop(0.5, COLORS.wand);
    wandGradient.addColorStop(1,   COLORS.wandLight);
    drawRoundedRect(ctx, 156, 36, 28, 380, 14, wandGradient);

    // Handle
    const handleGradient = ctx.createLinearGradient(146, 0, 194, 0);
    handleGradient.addColorStop(0,   '#B38010');
    handleGradient.addColorStop(0.5, COLORS.accent);
    handleGradient.addColorStop(1,   '#B38010');
    drawRoundedRect(ctx, 146, 410, 48, 18, 9, handleGradient);

    // Tip orb
    ctx.beginPath();
    ctx.arc(170, 32, 17, 0, Math.PI * 2);
    ctx.fillStyle = gameWon ? COLORS.success : COLORS.accent;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(163, 26, 5, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.fill();

    // Completed segment traces
    completedPaths.forEach(path => drawPolyline(ctx, path, 7, COLORS.groove, false));

    // Current segment guide (faint)
    if (!gameWon) {
      const segment = GROOVE_SEGMENTS[currentSegmentIndex];
      drawPolyline(ctx, [segment[0], segment[1]], 7, COLORS.grooveDim, false);
    }

    // Player's active trace
    if (currentTracePath.length > 1) {
      drawPolyline(ctx, currentTracePath, 7, gameFailed ? COLORS.danger : COLORS.groove, !gameFailed);
    }

    // Finger cursor
    if (isTracing && currentTracePath.length > 0) {
      const last = currentTracePath[currentTracePath.length - 1];
      ctx.beginPath();
      ctx.arc(last.x, last.y, 20, 0, Math.PI * 2);
      ctx.fillStyle = gameFailed ? 'rgba(232,85,85,0.18)' : 'rgba(160,126,232,0.18)';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(last.x, last.y, 9, 0, Math.PI * 2);
      ctx.fillStyle = gameFailed ? COLORS.danger : COLORS.groove;
      ctx.fill();
    }

    // Start and end dots for the current segment
    if (!gameWon && !gameFailed) {
      const segment    = GROOVE_SEGMENTS[currentSegmentIndex];
      const startPoint = segment[0];
      const endPoint   = segment[1];

      const startPulse = 0.5 + 0.5 * Math.sin(Date.now() / 350);
      const endPulse   = 0.5 + 0.5 * Math.sin(Date.now() / 400 + 1);

      if (!isTracing) {
        ctx.beginPath();
        ctx.arc(startPoint.x, startPoint.y, 18 + startPulse * 6, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(58, 217, 138, ${0.07 + startPulse * 0.10})`;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(startPoint.x, startPoint.y, 12, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(58, 217, 138, 0.20)';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(startPoint.x, startPoint.y, 7, 0, Math.PI * 2);
        ctx.fillStyle = COLORS.success;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(startPoint.x - 2, startPoint.y - 2, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.fill();

        ctx.fillStyle = COLORS.success;
        ctx.font      = 'bold 10px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText(
          currentSegmentIndex === 0 ? 'START HERE' : 'CONTINUE',
          startPoint.x,
          startPoint.y + 28
        );
      }

      ctx.beginPath();
      ctx.arc(endPoint.x, endPoint.y, cfg.endR, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(58, 217, 138, ${0.30 + endPulse * 0.25})`;
      ctx.lineWidth   = 2;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(endPoint.x, endPoint.y, 6, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(58, 217, 138, 0.75)';
      ctx.fill();

      ctx.fillStyle = 'rgba(58, 217, 138, 0.85)';
      ctx.font      = 'bold 10px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(
        currentSegmentIndex === GROOVE_SEGMENTS.length - 1 ? 'FINISH' : 'NEXT',
        endPoint.x + 20,
        endPoint.y + 4
      );
    }

    animationFrame = requestAnimationFrame(drawFrame);
  }

  animationFrame = requestAnimationFrame(drawFrame);

  // Input handlers
  function handlePointerDown(event) {
    event.preventDefault();
    if (gameWon || gameFailed || isTracing) return;

    const pointer    = getPointerPosition(event, canvas);
    const startPoint = GROOVE_SEGMENTS[currentSegmentIndex][0];

    if (Math.hypot(pointer.x - startPoint.x, pointer.y - startPoint.y) > cfg.startR) return;

    isTracing = true;

    if (!gameHasStarted) {
      gameHasStarted = true;
      startCountdown();
    }

    currentTracePath = [pointer];
    hintText.textContent = 'Trace to the green endpoint';
  }

  function handlePointerMove(event) {
    event.preventDefault();
    if (!isTracing || gameWon || gameFailed) return;

    const pointer = getPointerPosition(event, canvas);
    const segment = GROOVE_SEGMENTS[currentSegmentIndex];

    if (distancePointToSegment(pointer, segment[0], segment[1]) > cfg.tol) {
      currentTracePath.push(pointer);
      triggerFail();
      return;
    }

    currentTracePath.push(pointer);

    if (Math.hypot(pointer.x - segment[1].x, pointer.y - segment[1].y) <= cfg.endR) {
      completeSegment();
    }
  }

  function handlePointerUp(event) {
    event.preventDefault();
    isTracing = false;
  }

  canvas.addEventListener('mousedown',  handlePointerDown, { passive: false });
  canvas.addEventListener('mousemove',  handlePointerMove, { passive: false });
  canvas.addEventListener('mouseup',    handlePointerUp);
  canvas.addEventListener('mouseleave', handlePointerUp);
  canvas.addEventListener('touchstart', handlePointerDown, { passive: false });
  canvas.addEventListener('touchmove',  handlePointerMove, { passive: false });
  canvas.addEventListener('touchend',   handlePointerUp);
}


// ── Reveal screen ─────────────────────────────────────────────────────────────

function showReveal(imageSrc, msgAfter, senderName) {
  phoneElement.innerHTML = `
    <div class="screen">
      <div class="reveal-wrap">
        <div class="sbar" style="width:100%"><span>9:41</span><span>● ● ●</span></div>

        <div style="width:54px;height:54px;border-radius:50%;
                    border:2px solid #3AD98A;background:rgba(58,217,138,0.12);
                    display:flex;align-items:center;justify-content:center;
                    font-size:24px;color:#3AD98A;">✓</div>

        <div style="font-size:20px;font-weight:700;letter-spacing:2px;">RUNE CARVED!</div>

        <img src="${escapeHtml(imageSrc)}"
             class="reveal-img"
             alt="Surprise from ${escapeHtml(senderName)}"
             crossorigin="anonymous"/>

        ${msgAfter ? `<div class="reveal-end-msg">"${escapeHtml(msgAfter)}"</div>` : ''}

        <div class="reveal-ty">— Thank you for playing 🪄 —</div>

        <button class="dl-btn" id="downloadBtn">⬇ &nbsp;Save image</button>
        <button class="ghost" onclick="showSender()">← Send your own WandCarve</button>
      </div>
    </div>`;

  phoneElement.querySelector('#downloadBtn').onclick = async () => {
    try {
      const blob      = await fetch(imageSrc).then(r => r.blob());
      const objectUrl = URL.createObjectURL(blob);
      const link      = document.createElement('a');
      link.href       = objectUrl;
      link.download   = `wandcarve-from-${senderName.replace(/\s+/g, '-')}.jpg`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(objectUrl), 2000);
    } catch {
      window.open(imageSrc, '_blank');
    }
  };
}


// ── Fail screen ───────────────────────────────────────────────────────────────

function showFail(difficulty, imageSrc, msgAfter, senderName) {
  phoneElement.innerHTML = `
    <div class="screen">
      <div class="center-screen">
        <div class="sbar" style="width:100%"><span>9:41</span><span>● ● ●</span></div>

        <div style="font-size:44px;color:#E85555">✕</div>
        <div style="font-size:20px;font-weight:700">OFF THE PATH</div>
        <div style="font-size:13px;color:rgba(255,255,255,.5);line-height:1.6;max-width:260px">
          The spell broke — the surprise stays locked. Give it another go!
        </div>

        <div style="background:rgba(232,85,85,.08);border-radius:12px;padding:10px 14px;
                    font-size:11px;color:rgba(255,255,255,.6);text-align:center;
                    max-width:240px;line-height:1.6">
          <strong style="color:#E0B85A">Tip:</strong>
          Tap the green dot, drag slowly along the violet line to each checkpoint.
        </div>

        <button class="main-btn" style="max-width:210px" id="retryBtn">Try again</button>
      </div>
    </div>`;

  phoneElement.querySelector('#retryBtn').onclick = () => showGame(difficulty, imageSrc, msgAfter, senderName);
}


// ── Error screen ──────────────────────────────────────────────────────────────

function showError(title, subtitle) {
  phoneElement.innerHTML = `
    <div class="screen">
      <div class="center-screen">
        <div style="font-size:44px">🪄</div>
        <div style="font-size:20px;font-weight:700">${title}</div>
        <div style="font-size:13px;color:rgba(255,255,255,.45);line-height:1.55;max-width:260px">
          ${subtitle}
        </div>
        <button class="main-btn" style="max-width:210px" onclick="showSender()">
          Create your own
        </button>
      </div>
    </div>`;
}


// ── Boot ──────────────────────────────────────────────────────────────────────
route();
