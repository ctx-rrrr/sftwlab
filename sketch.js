
const CHAR_SET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const TARGET_DENSITY = 0.0009; // 字母密度，可调整
const MIN_FONT_PX = 8;
const MAX_FONT_PX = 14;
const INFLUENCE_RADIUS = 80; // 鼠标影响范围
const PUSH_STRENGTH = 3.5;   // 推力强度

let letters = [];
const trail = [];

function setup() {
  createCanvas(windowWidth, windowHeight);
  pixelDensity(1);
  initLetters();
  noCursor(); // 隐藏鼠标
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  initLetters();
}

function initLetters() {
  letters = [];
  const area = width * height;
  const targetCount = Math.floor(area * TARGET_DENSITY);
  for (let i = 0; i < targetCount; i++) {
    const ch = CHAR_SET.charAt(floor(random(CHAR_SET.length)));
    const x0 = random(0, width);
    const y0 = random(0, height);
    const fontSize = random(MIN_FONT_PX, MAX_FONT_PX);
    letters.push({
      ch,
      x0,
      y0,
      x: x0,
      y: y0,
      fontSize,
      disp: createVector(0, 0),
      mass: random(0.8, 1.6)
    });
  }
}

function draw() {
  background(0);
  drawCursorTrail();

  noStroke();
  fill(255);
  textAlign(LEFT, TOP);

  for (let L of letters) {
    // 回弹到原始位置
    const spring = createVector(L.x0 - L.x, L.y0 - L.y).mult(0.02 * (1 / L.mass));
    L.disp.add(spring);
    L.disp.mult(0.92); // 衰减
    L.x = L.x0 + L.disp.x;
    L.y = L.y0 + L.disp.y;

    textSize(L.fontSize);
    text(L.ch, L.x, L.y);
  }

  drawCursor();
}

function mouseMoved() {
  applyPush(mouseX, mouseY);
}
function mouseDragged() {
  applyPush(mouseX, mouseY);
}

function applyPush(px, py) {
  for (let L of letters) {
    const dx = L.x - px;
    const dy = L.y - py;
    const d = sqrt(dx * dx + dy * dy);
    if (d < INFLUENCE_RADIUS && d > 0.0001) {
      const dir = createVector(dx / d, dy / d);
      const fall = (1 - (d / INFLUENCE_RADIUS)) ** 1.5;
      const jitter = p5.Vector.random2D().mult(0.3);
      const impulse = dir.mult(PUSH_STRENGTH * fall / L.mass).add(jitter);
      L.disp.add(impulse);
    }
  }
}

// 鼠标淡痕
function drawCursorTrail() {
  trail.push({ x: mouseX, y: mouseY, t: millis() });
  while (trail.length > 60) trail.shift();

  noStroke();
  for (let i = 0; i < trail.length; i++) {
    const p = trail[i];
    const alpha = map(i, 0, trail.length - 1, 12, 80);
    fill(255, alpha * 0.6);
    const s = map(i, 0, trail.length - 1, 2, 8);
    circle(p.x, p.y, s);
  }
}

// 自定义鼠标圈
function drawCursor() {
  push();
  noFill();
  stroke(255, 200);
  strokeWeight(1.5);
  ellipse(mouseX, mouseY, 36, 36);
  pop();
}

// 点击时更强的“身振”
function mousePressed() {
  for (let L of letters) {
    const d = dist(L.x, L.y, mouseX, mouseY);
    if (d < INFLUENCE_RADIUS * 1.4) {
      const dir = createVector(L.x - mouseX, L.y - mouseY).normalize();
      const fall = (1 - constrain(d / (INFLUENCE_RADIUS * 1.4), 0, 1)) ** 1.8;
      L.disp.add(dir.mult(12 * fall / L.mass));
    }
  }
}

function keyPressed() {
  if (key === 'r' || key === 'R') {
    initLetters();
  }
}