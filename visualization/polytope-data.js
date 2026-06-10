// polytope-data.js
// lrs の入出力テキストの解析と、描画用の幾何計算（three.js 非依存）

// 整数 / 有理数 (p/q) / 小数 を受け付ける
const NUM_RE = /^[+-]?(?:\d+(?:\/\d+)?|\d*\.\d+)$/;

function tokenToNumber(tok) {
    if (tok.includes('/')) {
        const [p, q] = tok.split('/');
        return Number(p) / Number(q);
    }
    return Number(tok);
}

/**
 * lrs の入力または出力テキストを解析する。
 * @param {string} text
 * @returns {null | {type: 'V'|'H', dim: number, vertices: number[][], rays: number[][],
 *                   rows: number[][], warnings: string[]}}
 *   begin/end ブロックが見つからない場合は null。
 *   dim はポリトープの次元 (列数 - 1)。vertices / rays は V表現のときのみ意味を持つ。
 */
export function parseLrsText(text) {
    if (!text) return null;

    let type = null;
    let inBlock = false;
    let headerSkipped = false;
    let ended = false;
    let hasLinearity = false;
    const rows = [];
    const warnings = [];

    for (const raw of text.split(/\r?\n/)) {
        const line = raw.trim();
        if (!line) continue;
        if (inBlock && !headerSkipped) {
            // begin 直後の行はヘッダ "m d rational"。出力では "***** d rational" になり
            // '*' 始まりのため、コメント除去より先に消費する
            headerSkipped = true;
            continue;
        }
        if (line.startsWith('*')) continue;
        const lower = line.toLowerCase();

        if (!inBlock) {
            if (lower === 'v-representation') { type = 'V'; continue; }
            if (lower === 'h-representation') { type = 'H'; continue; }
            if (lower.startsWith('linearity')) { hasLinearity = true; continue; }
            if (lower === 'begin') { inBlock = true; continue; }
            continue; // 名前行やオプション行
        }

        if (lower === 'end') { ended = true; break; }

        const toks = line.split(/\s+/);
        // コバシス行などの非数値行は読み飛ばす
        if (!toks.every(t => NUM_RE.test(t))) continue;
        rows.push(toks.map(tokenToNumber));
    }

    if (!inBlock || !ended || rows.length === 0) return null;

    if (type === null) type = 'H'; // lrs ではマーカー省略時 H表現

    const cols = rows[0].length;
    const dim = cols - 1;
    if (rows.some(r => r.length !== cols)) {
        warnings.push('行ごとに列数が異なります。解析結果が不正確な可能性があります。');
    }

    const vertices = [];
    const rays = [];
    if (type === 'V') {
        for (const r of rows) {
            const coords = r.slice(1, cols);
            if (r[0] === 0) rays.push(coords);
            else vertices.push(coords);
        }
        if (hasLinearity) {
            warnings.push('linearity（直線成分）を含むため、可視化は頂点とレイのみです。');
        }
    }

    return { type, dim, vertices, rays, rows, warnings };
}

/**
 * 点集合のアフィン次元（ランク）と正規直交基底を Gram–Schmidt で求める。
 * @param {number[][]} points - 同じ長さの座標ベクトルの配列
 * @returns {{rank: number, origin: number[], basis: number[][]}}
 */
export function affineRankBasis(points, eps = 1e-9) {
    if (points.length === 0) return { rank: -1, origin: [], basis: [] };
    const origin = points[0];
    const n = origin.length;
    const basis = [];

    let scale = 1;
    for (const p of points) {
        for (const x of p) scale = Math.max(scale, Math.abs(x));
    }
    const tol = eps * scale;

    for (const p of points) {
        const v = p.map((x, i) => x - origin[i]);
        for (const b of basis) {
            let dot = 0;
            for (let i = 0; i < n; i++) dot += v[i] * b[i];
            for (let i = 0; i < n; i++) v[i] -= dot * b[i];
        }
        let norm = 0;
        for (let i = 0; i < n; i++) norm += v[i] * v[i];
        norm = Math.sqrt(norm);
        if (norm > tol) {
            basis.push(v.map(x => x / norm));
            if (basis.length === n) break;
        }
    }
    return { rank: basis.length, origin, basis };
}

/**
 * 2次元点集合の凸包（Andrew's monotone chain）。
 * @param {number[][]} points2 - [x, y] の配列
 * @returns {number[]} 凸包をなす点のインデックス（反時計回り）
 */
export function convexHull2D(points2) {
    const idx = points2.map((_, i) => i);
    idx.sort((a, b) =>
        points2[a][0] - points2[b][0] || points2[a][1] - points2[b][1]);

    const cross = (o, a, b) =>
        (points2[a][0] - points2[o][0]) * (points2[b][1] - points2[o][1]) -
        (points2[a][1] - points2[o][1]) * (points2[b][0] - points2[o][0]);

    const lower = [];
    for (const i of idx) {
        while (lower.length >= 2 &&
               cross(lower[lower.length - 2], lower[lower.length - 1], i) <= 0) {
            lower.pop();
        }
        lower.push(i);
    }
    const upper = [];
    for (let k = idx.length - 1; k >= 0; k--) {
        const i = idx[k];
        while (upper.length >= 2 &&
               cross(upper[upper.length - 2], upper[upper.length - 1], i) <= 0) {
            upper.pop();
        }
        upper.push(i);
    }
    lower.pop();
    upper.pop();
    return lower.concat(upper);
}

/**
 * 座標を 3 次元に揃える（不足分は 0 埋め、超過分は切り捨てない前提で呼ぶ）。
 */
export function padTo3D(coords) {
    return [coords[0] ?? 0, coords[1] ?? 0, coords[2] ?? 0];
}
