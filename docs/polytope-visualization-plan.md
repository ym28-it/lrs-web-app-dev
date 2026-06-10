# ポリトープ可視化機能 実装方針

作成日: 2026-06-10

## 目的

lrs の入出力（H表現 / V表現）を解析し、3次元以下のポリトープを three.js で
インタラクティブに 3D 可視化する機能を `lrs-common.html` に追加する。

## 前提知識（lrs フォーマット）

- 入出力は `begin` 〜 `end` ブロックに `m d (rational|integer)` ヘッダ行と係数行を持つ。
- `V-representation`: 各行 `1 x1 ... xd` が頂点、`0 x1 ... xd` がレイ（無限方向）。
- `H-representation`(マーカー省略時のデフォルト): 各行 `b a1 ... ad` が不等式 `b + a·x >= 0`。
- 数値は整数・有理数（`1/2` 形式）・小数。
- lrs の出力には `*` で始まるコメント行や、`printcobasis` 指定時のコバシス行が混ざる。
  出力のヘッダ行は `***** d rational` の形式になることがある。
- ポリトープの次元 = `d - 1`（第1列は同次化座標）。

## 可視化の基本戦略

**描画には頂点集合（V表現）が必要。** lrs は H↔V の相互変換ツールなので、

1. まず **出力エリア** のテキストを解析し、V表現があればそれを使う。
2. なければ **入力エリア** を解析し、V表現があればそれを使う。
3. どちらも H表現のみの場合は「Submit で lrs を実行すると V表現が得られ可視化できます」
   と案内する（自前で頂点列挙は行わない。lrs 本体に任せる）。

次元 `d-1 > 3` の場合は可視化不可のメッセージを表示する。

## 描画方法（次元・退化への対応）

頂点集合のアフィン次元（ランク）を Gram–Schmidt で判定し、座標次元ではなく
**実効次元**に応じて描画を切り替える（例: 3次元座標でも全点が同一平面なら多角形として描く）。

| 実効次元 | 描画 |
|---|---|
| 0 | 点（球） |
| 1 | 線分 + 端点 |
| 2 | 凸多角形（2D凸包: monotone chain）+ 輪郭線 + 頂点 |
| 3 | three.js `ConvexGeometry`（QuickHull）による半透明メッシュ + `EdgesGeometry` の稜線 + 頂点 |

- 1次元入力は x 軸上、2次元入力は xy 平面上に配置し、3次元空間内で表示する。
- レイを含む場合（非有界）: 頂点部分の凸包を描き、レイは重心からの矢印
  （`ArrowHelper`）で方向を示し、「非有界」の警告を表示する。
- `linearity` 行は警告表示のみ（厳密な可視化は将来課題）。

## モジュール構成

```
visualization/
  polytope-data.js    ... 純粋ロジック（three.js 非依存・Node でテスト可能）
                          - parseLrsText(text): lrs テキスト → {type, dim, vertices, rays, warnings}
                          - affineRankBasis(points): アフィン次元と正規直交基底
                          - convexHull2D(points2): 2D凸包（monotone chain）
  polytope-viewer.js  ... three.js 描画クラス PolytopeViewer
                          - シーン / カメラ / OrbitControls / ライト / 軸表示
                          - render(model): 実効次元に応じたジオメトリ構築、カメラ自動フィット
  visualizer-main.js  ... UI 結線（ES module のエントリポイント）
                          - Visualize ボタン、lrs 実行完了イベントでの自動更新
                          - 入出力エリアからの V表現選択ロジック、メッセージ表示
```

## three.js の読み込み

CDN（jsdelivr）の ES Modules + import map を使用（ビルド工程を増やさない）。

```html
<script type="importmap">
{
  "imports": {
    "three": "https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js",
    "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/"
  }
}
</script>
```

`OrbitControls`（回転・ズーム操作）と `ConvexGeometry`（3D凸包）を addons から使う。
※ オフライン環境では CDN に届かないため表示不可。必要になったらローカル同梱に切り替える。

## 既存コードへの変更（最小限）

- `lrs-common.html`: 入出力エリアの下に可視化セクション（ボタン・メッセージ・描画コンテナ）
  と import map / module スクリプトを追加。
- `lrs-common.js`: 結果受信時に `document.dispatchEvent(new CustomEvent('lrs:result'))`
  を 1 行追加（可視化モジュールが自動更新するためのフック）。
- `css/style.css`: 可視化セクションのスタイルを追記。

Worker・Wasm まわりのロジックには手を入れない。

## テスト方針

- `polytope-data.js` は three.js 非依存なので Node で直接 import し、
  `tests/` 配下の実データ（cube.ine / cube.ext / pyr.ine など）でパース・凸包・ランク判定を確認。
- ブラウザでは `serve.py` で配信し、cube.ext（3D）、cube2.ine→実行結果（非有界）、
  2D/1D の例で目視確認。

## 将来課題（今回スコープ外）

- 頂点座標ラベルの表示（ホバー / スプライト）
- H表現の各不等式（切断面）の表示
- linearity（アフィン部分空間）の厳密な描画
- three.js のローカル同梱によるオフライン対応
