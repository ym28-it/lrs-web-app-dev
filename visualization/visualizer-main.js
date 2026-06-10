// visualizer-main.js
// 可視化セクションの UI 結線（lrs-common.html から ES module として読み込む）

import { parseLrsText } from './polytope-data.js';
import { PolytopeViewer } from './polytope-viewer.js';

document.addEventListener('DOMContentLoaded', () => {
    const inputArea = document.getElementById('inputArea');
    const outputArea = document.getElementById('outputArea');
    const button = document.getElementById('visualizeButton');
    const message = document.getElementById('vizMessage');
    const container = document.getElementById('vizContainer');
    if (!button || !container) return;

    let viewer = null;

    function setMessage(text, isError = false) {
        message.textContent = text;
        message.classList.toggle('viz-error', isError);
    }

    // 出力を優先して V表現を探す（lrs が H→V 変換した結果を使う）
    function pickVRepresentation() {
        const fromOutput = parseLrsText(outputArea.value);
        if (fromOutput && fromOutput.type === 'V') return fromOutput;

        const fromInput = parseLrsText(inputArea.value);
        if (fromInput && fromInput.type === 'V') return fromInput;

        if (fromOutput?.type === 'H' || fromInput?.type === 'H') {
            return { error: 'H表現のみ検出しました。Submit で lrs を実行すると' +
                            'V表現（頂点）が得られ、可視化できます。' };
        }
        return { error: '解析できる表現が見つかりません。' +
                        'begin/end ブロックを含む lrs 形式を入力してください。' };
    }

    function visualize() {
        const model = pickVRepresentation();
        if (model.error) {
            setMessage(model.error, true);
            return;
        }
        if (model.dim > 3) {
            setMessage(`${model.dim}次元のポリトープは可視化できません（3次元まで対応）。`, true);
            return;
        }
        if (model.vertices.length === 0) {
            setMessage('頂点がありません（レイのみ）。', true);
            return;
        }

        if (!viewer) {
            try {
                viewer = new PolytopeViewer(container);
            } catch (err) {
                setMessage('WebGL の初期化に失敗しました: ' + err.message, true);
                return;
            }
        }
        viewer.render(model);

        const notes = [...model.warnings];
        if (model.rays.length > 0) {
            notes.push(`非有界です（レイ ${model.rays.length} 本を矢印で表示）。`);
        }
        setMessage(`${model.dim}次元 / 頂点 ${model.vertices.length} 個を表示中。` +
                   (notes.length ? ' ' + notes.join(' ') : ''));
    }

    button.addEventListener('click', visualize);

    // lrs の実行完了時に自動で更新（lrs-common.js が発火）
    document.addEventListener('lrs:result', visualize);
});
