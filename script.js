// =============================================================
//  コンピュータ基礎II 課題1 — 色の波紋
//
//  9×9マスをクリックすると、そこに色の点が置かれる。
//  点の色は白い紙の上に不透明度100%で置いた色。
//  1マス離れるごとに不透明度が20%ずつ下がっていき、
//  5マス先で不透明度0%（＝白）になる。
//  複数の点があるときは、届いた色どうしが混ざる。
//  最後にクリックした点だけは、常に完全にその色のまま。
//
//  ── 課題の4条件 ──────────────────────────────
//   1. 図形（面）を描画       : fillRect() で正方形を描画
//   2. 色を数値で指定          : RGBの数値と不透明度(0〜1)で色を決める
//   3. 繰り返し + 条件分岐      : for文（全マス・全点）+ if文
//   4. 乱数(ランダム)を利用    : 混ざった色に少しだけ乱数を加える
// =============================================================

const GRID = 9; // マスの数（9×9）
const RADIUS = 5; // 色が届く範囲。5マス離れると見えなくなる
const NOISE = 10; // 混ざった色に足す乱数の強さ

// クリックするたびに切り替わる色（黒→赤→…→白）
const COLORS = [
  [0, 0, 0], // 黒
  [255, 0, 0], // 赤
  [251, 140, 0], // オレンジ
  [253, 216, 53], // 黄色
  [156, 204, 101], // 黄緑
  [0, 255, 0], // 緑
  [41, 182, 246], // 水色
  [0, 0, 255], // 青
  [142, 36, 170], // 紫
  [109, 76, 65], // 茶
  [255, 255, 255], // 白
];

const canvas = document.getElementById("grid");
const ctx = canvas.getContext("2d");
const cellSize = canvas.width / GRID; // 等間隔・マージンなしで並べる

// 各マスに点があるかどうかを覚えておく表。点が無ければ -1 を入れておく
let pointColor = [];
for (let row = 0; row < GRID; row++) {
  pointColor[row] = [];
  for (let col = 0; col < GRID; col++) {
    pointColor[row][col] = -1;
  }
}

let lastRow = -1; // 最後にクリックした場所（行）
let lastCol = -1; // 最後にクリックした場所（列）

// ---- クリックしたときの処理 ----
canvas.addEventListener("click", function (event) {
  const rect = canvas.getBoundingClientRect();
  const col = Math.floor((event.clientX - rect.left) / cellSize);
  const row = Math.floor((event.clientY - rect.top) / cellSize);

  if (row < 0 || row >= GRID || col < 0 || col >= GRID) {
    return; // マスの外側は無視する
  }

  // 点が無ければ -1 なので、1を足すとちょうど 0（黒）から始まる
  pointColor[row][col] = pointColor[row][col] + 1;
  if (pointColor[row][col] >= COLORS.length) {
    pointColor[row][col] = 0; // 白の次は黒に戻る
  }

  lastRow = row;
  lastCol = col;

  draw();
});

// ---- 書き直しボタン ----
document.getElementById("clearBtn").addEventListener("click", function () {
  for (let row = 0; row < GRID; row++) {
    for (let col = 0; col < GRID; col++) {
      pointColor[row][col] = -1;
    }
  }
  lastRow = -1;
  lastCol = -1;
  draw();
});

// ---- 全部のマスの色を計算しながら描く ----
function draw() {
  for (let row = 0; row < GRID; row++) {
    for (let col = 0; col < GRID; col++) {
      const color = colorAt(row, col);
      const x = col * cellSize;
      const y = row * cellSize;

      ctx.fillStyle = "rgb(" + color[0] + "," + color[1] + "," + color[2] + ")";
      ctx.fillRect(x, y, cellSize, cellSize);

      ctx.strokeStyle = "#dddddd"; // 薄いグレーの枠
      ctx.strokeRect(x, y, cellSize, cellSize);
    }
  }
}

// (row, col) のマスの色を計算する
function colorAt(row, col) {
  // 最後にクリックしたマスは、必ず完全にその色にする
  if (row === lastRow && col === lastCol) {
    return COLORS[pointColor[row][col]];
  }

  // 白い紙から始めて、まわりの点の色を少しずつ重ねていく
  let red = 255;
  let green = 255;
  let blue = 255;
  let touched = false; // どれかの点の色が届いたかどうか

  for (let pointRow = 0; pointRow < GRID; pointRow++) {
    for (let pointCol = 0; pointCol < GRID; pointCol++) {
      const index = pointColor[pointRow][pointCol];
      if (index === -1) {
        continue; // 点が無いマスは無視する
      }

      const dx = col - pointCol;
      const dy = row - pointRow;
      const distance = Math.sqrt(dx * dx + dy * dy);

      const opacity = 1 - distance / RADIUS; // 近いほど濃く、5マスで0になる
      if (opacity <= 0) {
        continue; // 範囲の外は無視する
      }

      const pointRGB = COLORS[index];
      red = red + (pointRGB[0] - red) * opacity;
      green = green + (pointRGB[1] - green) * opacity;
      blue = blue + (pointRGB[2] - blue) * opacity;
      touched = true;
    }
  }

  if (touched) {
    red = clamp(red + (Math.random() * 2 - 1) * NOISE);
    green = clamp(green + (Math.random() * 2 - 1) * NOISE);
    blue = clamp(blue + (Math.random() * 2 - 1) * NOISE);
  }

  return [Math.round(red), Math.round(green), Math.round(blue)];
}

// 数値を 0〜255 の範囲におさめる
function clamp(value) {
  if (value < 0) return 0;
  if (value > 255) return 255;
  return value;
}

draw();
