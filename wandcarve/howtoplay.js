// howtoplay.js — back button and start button navigation

document.getElementById('back-btn').onclick = function() {
  history.back();
};

document.getElementById('startBtn').onclick = function() {
  location.href = 'game.html';
};
