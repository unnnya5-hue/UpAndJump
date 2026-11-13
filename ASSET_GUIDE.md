# 「無限昇進」実装用イラストガイド

## 1. 概要

モックおよび将来のネイティブ実装で使用するビジュアルアセットの初版。全画像はAI画像生成によるオリジナルの透過PNGで、濃紺の輪郭、セル調の陰影、ライム・シアン・コーラルを中心とした共通スタイルで制作している。

保存場所：`mock/assets/`

## 2. アセット一覧

| ファイル | 内容 | 原寸（px） | 推奨表示サイズ | 用途 |
| --- | --- | ---: | ---: | --- |
| `character-noboru.png` | アゲ田ノボル上昇ポーズ | 1155×1362 | 60×80〜170×268 | プレイヤー、タイトル |
| `item-energy-coffee.png` | エナジーコーヒー | 1230×1278 | 40×40〜80×80 | 取得物、効果表示 |
| `item-noise-cancel.png` | ノイズキャンセリング | 1287×1222 | 40×40〜80×80 | 取得物、効果表示 |
| `item-paid-leave.png` | 有給休暇申請書 | 1206×1305 | 40×40〜80×80 | 取得物、効果表示 |
| `item-self-help-book.png` | 自己啓発本 | 1254×1254 | 40×40〜80×80 | 取得物、効果表示 |
| `obstacle-meeting.png` | 定例会議 | 1774×887 | 幅80〜180 | 横長障害物 |
| `obstacle-notification.png` | 鬼通知 | 1303×1207 | 36×36〜72×72 | 小型障害物 |
| `obstacle-fire-project.png` | 炎上案件 | 1312×1199 | 36×36〜72×72 | 移動障害物 |
| `obstacle-revision.png` | 上司の差し戻し | 1243×1265 | 幅50〜110 | 縦長障害物 |

## 3. 実装ルール

- 透明部分を維持し、アスペクト比を固定して表示する。
- ゲーム中の当たり判定は透過PNGから生成したアルファマスクを使用する。半透明の縁を除外し、輪郭を約1マスクピクセル内側へ縮める。
- アイテムは背景との混同を避けるため、白いパルスまたは円形グローを背面に追加する。
- 障害物には赤・オレンジ系、アイテムにはライム・シアン系の演出を用い、色だけでなくシルエットでも区別する。
- iOS実装時は端末別テクスチャを用意するか、ビルド工程で適切な解像度へ縮小する。原寸PNGをそのまま毎フレーム読み込まない。
- SpriteKitではTexture Atlas、UnityではSprite Atlasへ格納し、透過境界のにじみを避けるため2〜4pxのpaddingを設ける。
- 障害物の横長・縦長化は非等方拡大せず、画像の反復または複数配置で対応する。

## 4. アクセシビリティ用ラベル

| アセット | 読み上げ候補 |
| --- | --- |
| アゲ田ノボル | 上へ飛ぶ会社員、アゲ田ノボル |
| エナジーコーヒー | 5秒間無敵になるコーヒー |
| ノイズキャンセリング | 障害物を1回防ぐヘッドホン |
| 有給休暇 | 5秒間スローになる有給休暇 |
| 自己啓発本 | 高度が250メートル増える本 |
| 定例会議 | 横長の会議テーブル |
| 鬼通知 | 通知に追われるスマートフォン |
| 炎上案件 | 燃えている案件フォルダ |
| 上司の差し戻し | 差し戻された書類の山 |

## 5. 生成プロンプト

生成方式：組み込み画像生成。全アセット共通で「実装用の透過PNG」「濃紺の太い輪郭」「クリーンなセル調陰影」「小さく表示しても判別可能」「文字・ロゴ・透かしなし」を指定した。

### 主人公

> Full-body mascot character “Ageta Noboru”, an overly ambitious Japanese office worker flying upward in a confident ascent pose. Navy business suit, white shirt, coral necktie, swept-back black hair, wireless earbuds, smartwatch, lime-green takeaway coffee. Polished 2D mobile-game illustration, bold dark-navy outlines, flat cel shading, transparent background, complete silhouette.

### アイテム共通指定

> Mobile game collectible item icon, implementation-ready transparent PNG. Polished 2D mobile game illustration, bold dark navy outlines, clean flat cel shading, rounded geometric shapes, humorous Japanese casual-game style. One single centered object, front three-quarter view, generous transparent padding, complete silhouette visible. Dark navy outlines with sky blue, coral red, lime green, warm cream accents. Genuinely transparent background; no text; no letters; no logo; no watermark; no drop shadow; crisp clean edges; readable at 48px; no background scenery.

上記共通指定へ、各画像ごとに以下を追加した。

- エナジーコーヒー：`An energetic lime-green takeaway coffee cup with a securely fitted white lid, tiny stylized upward energy streaks around the cup; visual meaning is temporary invincibility and speed boost.`
- ノイズキャンセリング：`Sleek dark navy over-ear noise-cancelling headphones with cyan inner ear pads, subtle protective circular pulse around the headphones; visual meaning is a one-hit shield.`
- 有給休暇：`A clean cream paper vacation request form with a coral approval stamp symbol and a tiny sky-blue palm tree pictogram; visual meaning is slowing time; do not render readable writing or letters.`
- 自己啓発本：`A compact lime-and-coral self-improvement hardcover book with a bold abstract upward arrow symbol on the cover and small golden sparkles; visual meaning is instant bonus height; no writing or letters.`

### 障害物共通指定

> Mobile game obstacle illustration, implementation-ready transparent PNG. Polished 2D mobile game illustration, bold dark navy outlines, clean flat cel shading, rounded geometric shapes, humorous Japanese casual-game style. Single centered object, generous transparent padding, complete silhouette visible. Genuinely transparent background; no text; no letters; no logo; no watermark; no drop shadow; crisp clean edges; readable at small size; no background scenery.

上記共通指定へ、各画像ごとに以下を追加した。

- 定例会議：`A wide red office conference table with three empty black swivel chairs and a tiny alarm clock, designed as a horizontal barrier; visual meaning is an unavoidable recurring meeting.`
- 鬼通知：`A smartphone overwhelmed by several bright red notification bubbles containing only simple exclamation marks, compact obstacle silhouette; visual meaning is notification overload.`
- 炎上案件：`A thick office project folder engulfed in stylized orange and coral flames, compact moving hazard; visual meaning is a project on fire.`
- 上司の差し戻し：`A tall messy stack of cream office documents thrown back with a large coral circular rejection mark made only of an X symbol, designed as a vertical wall; visual meaning is boss revision request.`

## 6. 今後必要な差分

- ノボルの左右移動、被弾、無敵、ゲームオーバー用ポーズ
- ノボルの意識高い系表情差分（下表）
- アイテムの取得アニメーション用2〜4フレーム
- 障害物の警告表示、炎上案件のループアニメーション
- App Store用アイコン、起動画面、ランキング用の小型アバター
- 最終実装時の圧縮形式（PNG / WebP / ASTC）とメモリ計測

### 6.1 ノボル表情・ポーズ差分（意識高い系）

意識の高さを見た目でも伝えるための追加差分。`character-noboru.png` と同じ画風・衣装・頭身で制作し、セリフ表示（`REQUIREMENTS.md` 4.6）と組み合わせて使う。

| ファイル（予定） | 内容 | 使用場面 |
| --- | --- | --- |
| `character-noboru-smug.png` | 片眉を上げたドヤ顔、腕組み、スマートウォッチをちらりと見る | タイトル、自己ベスト更新 |
| `character-noboru-thumbsup.png` | 歯を見せた笑顔でサムズアップ、もう一方の手にライム色のコーヒー | 昇進演出、アイテム取得 |
| `character-noboru-vision.png` | 遠くの上方を指さし、目を輝かせて未来を語るポーズ | CGO以上の昇進演出 |
| `character-noboru-reframe.png` | 冷や汗をかきつつ、無理に前向きな笑顔で人さし指を立てる | ゲームオーバー（「学びのピボット」系セリフ） |

共通プロンプト（主人公プロンプトへ追加）：

> Same character design, outfit, proportions and art style as the base “Ageta Noboru” sprite. Overly self-confident, comically ambitious expression. Polished 2D mobile-game illustration, bold dark-navy outlines, flat cel shading, transparent background, complete silhouette, no text.

- ドヤ顔：`One eyebrow raised in a smug grin, arms crossed, glancing at his smartwatch as if every second is an investment.`
- サムズアップ：`Big confident toothy smile, giving a strong thumbs-up, lime-green takeaway coffee in the other hand, tiny sparkles.`
- ビジョン：`Pointing dramatically up toward the distant sky, eyes sparkling, hair blowing, visionary-leader pose.`
- リフレーミング：`Sweating nervously but forcing an upbeat smile, raising one index finger as if explaining that failure is a learning opportunity.`
