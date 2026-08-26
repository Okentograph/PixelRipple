// 9×9マス。クリックで色の点を置き、近くのマスに色が広がる
// 白は「透明（色なし）」として扱う

const SIZE = 9;      // マスの数
const REACH = 5;     // 色が届く距離
const NOISE = 10;    // 混ざった色のゆらぎ

const COLORS = [
  [0, 0, 0],         // 黒
  [255, 0, 0],       // 赤
  [251, 140, 0],     // オレンジ
  [253, 216, 53],    // 黄
  [156, 204, 101],   // 黄緑
  [0, 255, 0],       // 緑
  [41, 182, 246],    // 水色
  [0, 0, 255],       // 青
  [142, 36, 170],    // 紫
  [109, 76, 65],     // 茶
  [255, 255, 255],   // 白（＝透明として扱う）
];
const WHITE = COLORS.length - 1; // 白の番号

const canvas = document.getElementById("grid");
const ctx = canvas.getContext("2d");
const cell = canvas.width / SIZE;

// 各マスの色番号（点がないマスは -1）
let points = [];
for (let r = 0; r < SIZE; r++) {
  points[r] = [];
  for (let c = 0; c < SIZE; c++) {
    points[r][c] = -1;
  }
}

let lastRow = -1;
let lastCol = -1;

// クリック
canvas.addEventListener("click", function (e) {
  const box = canvas.getBoundingClientRect();
  const col = Math.floor((e.clientX - box.left) / cell);
  const row = Math.floor((e.clientY - box.top) / cell);

  if (row < 0 || row >= SIZE || col < 0 || col >= SIZE) {
    return;
  }

  points[row][col] = points[row][col] + 1;
  if (points[row][col] >= COLORS.length) {
    points[row][col] = 0;
  }

  lastRow = row;
  lastCol = col;
  draw();
});

// 書き直し
document.getElementById("clearBtn").addEventListener("click", function () {
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      points[r][c] = -1;
    }
  }
  lastRow = -1;
  lastCol = -1;
  draw();
});

// 全部のマスを描き、あわせてRGBの占有率も集計する
function draw() {
  let totalR = 0;
  let totalG = 0;
  let totalB = 0;
  const maxTotal = SIZE * SIZE * 255; // 全マスが最大値で埋まったときの合計

  for (let row = 0; row < SIZE; row++) {
    for (let col = 0; col < SIZE; col++) {
      const result = getColor(row, col); // { color: [r,g,b], alpha }
      const x = col * cell;
      const y = row * cell;

      ctx.clearRect(x, y, cell, cell); // 一度透明に戻す

      if (result.alpha > 0) {
        const c2 = result.color;
        ctx.fillStyle = "rgba(" + c2[0] + "," + c2[1] + "," + c2[2] + "," + result.alpha + ")";
        ctx.fillRect(x, y, cell, cell);

        totalR += c2[0] * result.alpha;
        totalG += c2[1] * result.alpha;
        totalB += c2[2] * result.alpha;
      }

      ctx.strokeStyle = "#ddd";
      ctx.strokeRect(x, y, cell, cell);
    }
  }

  updateStats(totalR / maxTotal, totalG / maxTotal, totalB / maxTotal);
}

// 1マスの色と不透明度を決める
function getColor(row, col) {
  // 最後にクリックしたマスは、その色そのまま（白なら透明）
  if (row === lastRow && col === lastCol) {
    const n = points[row][col];
    if (n === WHITE) {
      return { color: [0, 0, 0], alpha: 0 };
    }
    return { color: COLORS[n], alpha: 1 };
  }

  let sumR = 0;
  let sumG = 0;
  let sumB = 0;
  let colorAlpha = 0; // 色を持つ点が、このマスを不透明にする力
  let whiteAlpha = 0; // 白（透明）の点が、このマスを透明にする力

  // すべての点を調べる
  for (let pr = 0; pr < SIZE; pr++) {
    for (let pc = 0; pc < SIZE; pc++) {
      const n = points[pr][pc];
      if (n === -1) {
        continue; // 点が無いマスは無視する
      }

      const dx = col - pc;
      const dy = row - pr;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const strength = 1 - dist / REACH; // 距離による影響力。色も白も同じ式

      if (strength <= 0) {
        continue;
      }

      if (n === WHITE) {
        whiteAlpha += strength; // 白は色を持たず、まわりを透明に近づける
        continue;
      }

      const p = COLORS[n];
      sumR += p[0] * strength;
      sumG += p[1] * strength;
      sumB += p[2] * strength;
      colorAlpha += strength;
    }
  }

  if (colorAlpha === 0) {
    return { color: [0, 0, 0], alpha: 0 }; // 色を持つ点が届かないマスは透明
  }

  let r = sumR / colorAlpha;
  let g = sumG / colorAlpha;
  let b = sumB / colorAlpha;

  // 混ざった色を少しランダムにゆらす
  r = clamp(r + (Math.random() * 2 - 1) * NOISE);
  g = clamp(g + (Math.random() * 2 - 1) * NOISE);
  b = clamp(b + (Math.random() * 2 - 1) * NOISE);

  // 白の力の分だけ、不透明度を下げる（透明に近づける）
  let alpha = colorAlpha - whiteAlpha;
  if (alpha < 0) alpha = 0;
  if (alpha > 1) alpha = 1;

  return {
    color: [Math.round(r), Math.round(g), Math.round(b)],
    alpha: alpha,
  };
}

function clamp(value) {
  if (value < 0) return 0;
  if (value > 255) return 255;
  return value;
}

// RGBそれぞれが画面全体でどれだけを占めているかを、バーで表示する
function updateStats(rRatio, gRatio, bRatio) {
  setBar("barR", "valR", rRatio);
  setBar("barG", "valG", gRatio);
  setBar("barB", "valB", bRatio);
}

function setBar(barId, valueId, ratio) {
  const percent = Math.round(ratio * 100);
  document.getElementById(barId).style.width = percent + "%";
  document.getElementById(valueId).textContent = percent + "%";
}

draw();
