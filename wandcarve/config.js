// config.js — constants used across the whole app

const IMGBB_UPLOAD_URL = 'https://api.imgbb.com/1/upload';

const COLORS = {
  wand:      '#5C3D1E',
  wandLight: '#8A5E30',
  groove:    '#A07EE8',
  grooveDim: 'rgba(160, 126, 232, 0.28)',
  accent:    '#E0B85A',
  success:   '#3AD98A',
  danger:    '#E85555',
};

// these are the 5 groove segments drawn along the wand shaft
// canvas is 340x440, wand runs down the centre around x=170
const GROOVE_SEGMENTS = [
  [ { x: 170, y: 50  }, { x: 167, y: 137 } ],
  [ { x: 167, y: 137 }, { x: 163, y: 224 } ],
  [ { x: 163, y: 224 }, { x: 170, y: 311 } ],
  [ { x: 170, y: 311 }, { x: 167, y: 370 } ],
  [ { x: 167, y: 370 }, { x: 170, y: 410 } ],
];

// tol = how many pixels off the groove before we call it a fail
const DIFFICULTY_CONFIG = {
  easy:   { tol: 20, endR: 20, startR: 20, col: COLORS.success },
  medium: { tol: 13, endR: 14, startR: 14, col: COLORS.accent  },
  hard:   { tol: 8,  endR: 10, startR: 10, col: COLORS.danger  },
};

const GAME_TIME_SECONDS = 60;

const CANVAS_WIDTH  = 340;
const CANVAS_HEIGHT = 440;
