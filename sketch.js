//------------------------------------------------------
// Intro（开场动画）：全黑 + 白字 + 音乐淡入 + 点击渐隐
//------------------------------------------------------
let introAlpha = 255;      
let introDone = false;     
let introTextAlpha = 0;    
let introText = "STAR DUST ATLAS";   
let introSound;            // ⭐ BGM 变量
let allowClickToFade = false;

let introFadingOut = false;
let saveButton; // 保存按钮


function drawIntro() {
  if (introDone) return;

  // 黑色背景
  fill(0, introAlpha);
  noStroke();
  rect(0, 0, width, height);

  // 渐显 Title 小字
  fill(255, introTextAlpha);
  textAlign(CENTER, CENTER);
  textSize(28);
  textFont("monospace");
  text(introText, width / 2, height / 2);

  // 文字缓慢出现
  if (introTextAlpha < 255) {
    introTextAlpha += 2;
  } else {
    allowClickToFade = true;
  }

  // 淡出动画
  if (introFadingOut) {
    introAlpha -= 4;
    if (introAlpha <= 0) {
      introDone = true;
      introAlpha = 0;
    }
  }
}

function mousePressed() {
  if (introDone) return;

  if (allowClickToFade) {
    introFadingOut = true;

    //------------------------------------------------------
    // ⭐ BGM 淡入设置（点击后开始播放）
    //------------------------------------------------------
    if (introSound && !introSound.isPlaying()) {
      introSound.setVolume(0);
      introSound.loop();

      // 音量慢慢升到 0.6
      let v = 0;
      let fadeIn = setInterval(() => {
        v += 0.02;
        introSound.setVolume(v);
        if (v >= 0.6) clearInterval(fadeIn);
      }, 80);
    }
  }
}


//------------------------------------------------------
// 背景字母动态系统
//------------------------------------------------------
const BG_CHAR_SET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const BG_DENSITY = 0.0009;
const BG_MIN_FONT = 8;
const BG_MAX_FONT = 14;

const BG_RADIUS = 120;
const BG_PUSH = 8;

let lastMouseMovedTime = 0;
let bgLetters = [];
let bgTrail = [];
let bgMemoryDots = [];
let bgStationaryStart = null;

function initBackgroundLetters() {
  bgLetters = [];
  const area = width * height;
  const count = floor(area * BG_DENSITY);

  for (let i = 0; i < count; i++) {
    let ch = BG_CHAR_SET.charAt(floor(random(BG_CHAR_SET.length)));
    let x0 = random(width);
    let y0 = random(height);

    bgLetters.push({
      ch,
      x0, y0,
      x: x0,
      y: y0,
      fontSize: random(BG_MIN_FONT, BG_MAX_FONT),
      disp: createVector(0, 0),
      mass: random(0.6, 1.3)
    });
  }
}

function drawBackground() {

  // 鼠标轨迹
  bgTrail.push({ x: mouseX, y: mouseY });
  if (bgTrail.length > 80) bgTrail.shift();

  noStroke();
  for (let i = 0; i < bgTrail.length; i++) {
    let p = bgTrail[i];
    let alpha = map(i, 0, bgTrail.length - 1, 10, 90);
    fill(255, alpha * 0.6);
    circle(p.x, p.y, map(i, 0, bgTrail.length - 1, 2, 10));
  }

  // 蓝点
  fill(80, 150, 255);
  for (let d of bgMemoryDots) circle(d.x, d.y, 12);

  // 蓝点连线
  if (bgMemoryDots.length > 1) {
    stroke(80, 150, 255);
    strokeWeight(2);
    for (let i = 0; i < bgMemoryDots.length - 1; i++) {
      line(bgMemoryDots[i].x, bgMemoryDots[i].y,
           bgMemoryDots[i + 1].x, bgMemoryDots[i + 1].y);
    }
  }

  // 背景字母
  fill(255);
  noStroke();

  for (let L of bgLetters) {
    let toOrigin = createVector(L.x0 - L.x, L.y0 - L.y);
    L.disp.add(toOrigin.mult(0.01 / L.mass));

    let jitter = p5.Vector.random2D().mult(0.05);
    L.disp.add(jitter);

    L.disp.mult(0.92);
    L.x += L.disp.x;
    L.y += L.disp.y;

    textSize(L.fontSize);
    text(L.ch, L.x, L.y);
  }

  // 自定义光标
  push();
  noFill();
  stroke(255, 200);
  strokeWeight(1.5);
  ellipse(mouseX, mouseY, 36);
  pop();
}

function backgroundPush(px, py) {
  for (let L of bgLetters) {
    let dx = L.x - px;
    let dy = L.y - py;
    let d = sqrt(dx*dx + dy*dy);

    if (d < BG_RADIUS) {
      let dir = createVector(dx, dy).normalize();
      let fall = (1 - d / BG_RADIUS);
      let impulse = dir.mult(BG_PUSH * fall * fall / L.mass);
      impulse.add(p5.Vector.random2D().mult(1.0));
      L.disp.add(impulse);
    }
  }
}

function updateStillness() {
  let now = millis();

  if (mouseX !== pmouseX || mouseY !== pmouseY) {
    lastMouseMovedTime = now;
  } else {
    if (now - lastMouseMovedTime > 1000) {
      addBluePoint(mouseX, mouseY);
      lastMouseMovedTime = now;
    }
  }
}


//------------------------------------------------------
// STAR MAP 系统
//------------------------------------------------------
let font;
let titleLetters = [];
let word = "STAR MAP";
let basePositions = [];
let scatterStrength = 120;

let bluePoints = [];
let blueLimit = 10;

let constellations = {};
let constellationResult = "";

let searchButton;

//------------------------------------------------------
// ⭐ 在 preload() 中加载你的 BGM
//------------------------------------------------------
function preload() {
  font = loadFont("https://cdnjs.cloudflare.com/ajax/libs/topcoat/0.8.0/font/SourceCodePro-Regular.otf");

  constellations = loadJSON("constellations.json");

  // ⭐⭐⭐⭐⭐ 这里加载你的背景音乐 ⭐⭐⭐⭐⭐
  introSound = loadSound("bgm.m4a");
}


function setup() {
  createCanvas(windowWidth, windowHeight);
  pixelDensity(1);

  initBackgroundLetters();

  textFont(font);
  textSize(120);

  let x = width / 2 - textWidth(word) / 2;
  let y = height / 2;

  for (let c of word) {
    titleLetters.push({ char: c, offsetX: 0, offsetY: 0 });
    basePositions.push({ x: x, y: y });
    x += textWidth(c);
  }
// Search 按钮
searchButton = createButton("Search");
searchButton.addClass("art-button");  
searchButton.position(windowWidth - 160, 20);
searchButton.mousePressed(openSearch);

// 保存按钮
saveButton = createButton("Save / Print");
saveButton.addClass("art-button");  
saveButton.position(windowWidth - 160, 90);
saveButton.mousePressed(saveBluePoints);
saveButton.hide(); // 初始隐藏
}

function draw() {

  //------------------------------------------------------
  // ⭐ Intro 逻辑：Intro 没结束 → 不画主界面
  //------------------------------------------------------
  if (!introDone) {
    background(0);
    drawIntro();
    return;
  }

  background(0);

  drawBackground();
  updateStillness();

  // 标题文字动画
  for (let i = 0; i < titleLetters.length; i++) {
    let L = titleLetters[i];
    let base = basePositions[i];

    let d = dist(mouseX, mouseY, base.x, base.y);

    if (d < 200) {
      let angle = atan2(base.y - mouseY, base.x - mouseX);
      L.offsetX = cos(angle) * map(d, 0, 200, scatterStrength, 0);
      L.offsetY = sin(angle) * map(d, 0, 200, scatterStrength, 0);
    } else {
      L.offsetX = lerp(L.offsetX, 0, 0.1);
      L.offsetY = lerp(L.offsetY, 0, 0.1);
    }

    fill(255);
    noStroke();
    text(L.char, base.x + L.offsetX, base.y + L.offsetY);
  }

  // 蓝点
  stroke(0, 150, 255);
  fill(0, 150, 255);
  strokeWeight(3);

  for (let p of bluePoints) circle(p.x, p.y, 10);

  if (bluePoints.length > 1) {
    noFill();
    beginShape();
    for (let p of bluePoints) vertex(p.x, p.y);
    endShape();
  }

  // 星座识别
  constellationResult = detectConstellation();
  fill(0, 150, 255);
  textSize(24);
  text("Closest Constellation: " + constellationResult, 300, 60);
  
  // 显示保存按钮逻辑
if (bluePoints.length >= 3) {
  saveButton.show();
} else {
  saveButton.hide();
}

  
}


//------------------------------------------------------
function mouseMoved() { backgroundPush(mouseX, mouseY); }
function mouseDragged() { backgroundPush(mouseX, mouseY); }


//------------------------------------------------------
// 星座识别
//------------------------------------------------------
function addBluePoint(x, y) {
  bluePoints.push({ x, y });
  if (bluePoints.length > blueLimit) bluePoints.shift();
}

function detectConstellation() {
  if (bluePoints.length < 3) return "Not enough points";

  let input = normalizePoints(bluePoints);
  let bestScore = Infinity;
  let bestName = "Unknown";

  for (let name in constellations) {
    let c = constellations[name];

    if (!c.stars || c.stars.length < 3) continue;

    let target = normalizePoints(c.stars);

    let compareLen = min(input.length, target.length);
    let A = input.slice(0, compareLen);
    let B = target.slice(0, compareLen);

    let score = comparePointSets(A, B);

    if (score < bestScore) {
      bestScore = score;
      bestName = name;
    }
  }

  return bestName;
}

function normalizePoints(pts) {
  let xs = pts.map(p => p.x);
  let ys = pts.map(p => p.y);

  let minX = min(xs);
  let minY = min(ys);
  let maxX = max(xs);
  let maxY = max(ys);

  let scale = max(maxX - minX, maxY - minY) || 1;

  return pts.map(p => ({
    x: (p.x - minX) / scale,
    y: (p.y - minY) / scale
  }));
}

function comparePointSets(a, b) {
  let n = min(a.length, b.length);
  let sum = 0;

  for (let i = 0; i < n; i++) {
    sum += dist(a[i].x, a[i].y, b[i].x, b[i].y);
  }
  return sum / n;
}


//------------------------------------------------------
// Search 按钮
//------------------------------------------------------
function openSearch() {
  if (constellationResult !== "Unknown" &&
      constellationResult !== "Not enough points") {

    let query = encodeURIComponent(constellationResult + " constellation");
    window.open("https://www.bing.com/search?q=" + query, "_blank");
  }
}
function saveBluePoints() {
  if (bluePoints.length < 3) return;

  let printWin = window.open("", "_blank");
  printWin.document.write("<html><head><title>Blue Points</title></head><body></body></html>");

  let canvas = printWin.document.createElement("canvas");
  canvas.width = 800;
  canvas.height = 600;
  printWin.document.body.appendChild(canvas);

  let ctx = canvas.getContext("2d");

  // 填充背景黑色
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 绘制蓝点
  ctx.fillStyle = "rgb(0,150,255)";
  for (let p of bluePoints) {
    // 缩放到新 canvas 大小
    let x = p.x / windowWidth * canvas.width;
    let y = p.y / windowHeight * canvas.height;
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  // 绘制连线
  if (bluePoints.length > 1) {
    ctx.strokeStyle = "rgb(0,150,255)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < bluePoints.length; i++) {
      let p = bluePoints[i];
      let x = p.x / windowWidth * canvas.width;
      let y = p.y / windowHeight * canvas.height;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  // 自动打印
  printWin.document.close();
  printWin.focus();
  printWin.print();
}

