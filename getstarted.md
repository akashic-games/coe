# 開発の手引き

## はじめに

この文書は COE フレームワークを利用した Akashic コンテンツの開発について記しています。

Akashic Engine を用いたゲームコンテンツの制作経験がある方を対象にしています。
Akashic Engine のゲームコンテンツ作成に関する入門は以下ウェブサイトなどを参照してください。

* https://akashic-games.github.io/tutorial/v3/

以下に本ページのサンプルを公開しています。適宜参照してください。

* https://github.com/akashic-contents/coe-application-sample


## COE フレームワークとは

COE フレームワークは Akashic 上で共体験 (co-experience) を実現させるための拡張ライブラリです。
共体験は主に次の機能を提供します。

1. Akashic コンテンツの容易なマルチプレイ化
   * 各ユーザからのメッセージの集計
   * 各ユーザに対するメッセージのブロードキャスト
2. コンテンツ内で別のコンテンツを実行

通常の Akashic コンテンツとの違いなど、もう少し詳細な情報に関しては [開発者向け文書](https://github.com/akashic-games/coe/blob/master/developers.md) を参照してください。
このページでは COE を用いた簡単なゲームコンテンツの作成手順について記述しています。

## 開発準備

Akashic コンテンツを新規に作成します。

以下コマンドで `TypeScript` または `JavaScript` の Akashic コンテンツのテンプレートを作成してください。
既存のコンテンツに追加する場合、以下は不要です。

```sh
akashic init
```

TypeScript を利用する場合

```sh
akashic init --type typescript
```

Akashic コンテンツ側で COE フレームワークを install します。

```sh
akashic install @akashic-extension/coe
```

以上で COE フレームワークを利用するための準備が整いました。

## アンケートアプリケーションの作成

COE フレームワークアプリケーションを利用した簡単なサンプルとして、アンケートを作成してみましょう。

まずはアンケートの動作シーケンスを考えてみます。

1. Controller がアンケートの質問文・回答選択肢を View にブロードキャスト
2. View がアンケートの質問文・回答選択肢を描画
3. View の回答選択肢が click されたら Controller に対して投票の Action を送信
4. ある時間が経過したあと、Controller 側で投票結果を集計
5. Controller が回答結果をブロードキャストし、それを View が描画

以上を TypeScript のミニマムコードで再現してみます。

## 1. Controller の作成

### 1.1 Controller のクラス作成

最初にアンケートの Controller を作成します。
ここでは coe の COEController を継承させて、 `EnqueteController.ts` として `./src` 以下に実装してみます。

```typescript
import { COEController } from "@akashic-extension/coe";

export interface EnqueteCommand {}

export interface EnqueteActionData {}

export interface EnqueteControllerParameter {
	// 質問文
	topic: string;
	// 回答選択肢
	choices: string[];
}

export class EnqueteController extends COEController<EnqueteCommand, EnqueteActionData> {
	constructor(param: EnqueteControllerParameter) {
		super();
		// Controller の初期化処理
	}
}
```

### 1.2 アンケートの質問文・回答選択肢のブロードキャスト

先の実装に追加して、 `COEController#broadcast()` を利用して View にアンケートの質問文・回答選択肢をブロードキャストします。

```typescript
export class EnqueteController extends COEController<EnqueteCommand, EnqueteActionData> {
	constructor(param: EnqueteControllerParameter) {
		// パラメータをブロードキャスト
		this.broadcast({
			topic: param.topic,
			choices: param.choices
		});
	}
}
```

## 2. View の作成

### 2.1 ブロードキャストされた Command の受信

次にアンケートアプリケーションの View にあたる `EnqueteScene` クラスを `EnqueteScene.ts` として `./src` 以下に作成します。

Controller から送信された Command は `coe.Scene#onCommandReceive` トリガによって受信することができます。

```typescript
import { Scene, SceneParameters } from "@akashic-extension/coe";
import { EnqueteCommand, EnqueteActionData } from "./EnqueteController";

export interface EnqueteSceneParameter extends SceneParameters<EnqueteCommand, EnqueteActionData> {}

export class EnqueteScene extends Scene<EnqueteCommand, EnqueteActionData> {
	private font: g.DynamicFont;
	private currentTopic: string;

	constructor(param: EnqueteSceneParameter) {
		super(param);
		this.onLoad.addOnce(this.handleLoad, this);
		this.onCommandReceive.add(this.handleCommandReceive, this);
	}

	/**
	 * 本 Scene の読み込み時の処理
	 */
	private handleLoad() {
		const font = new g.DynamicFont({
			game: g.game,
			fontFamily: g.FontFamily.SansSerif,
			size: 40
		});
		this.font = font;
	}

	private handleCommandReceive(command: EnqueteCommand) {
		const font = this.font;
		const scene = this;

		// 質問文の描画
		const topic = new g.Label({
			scene,
			font,
			fontSize: 30,
			textColor: "#880000",
			text: command.topic
		});
		scene.append(topic);

		command.choices.forEach((choice, i) => {
			const label = new g.Label({
				scene,
				font,
				fontSize: 30,
				text: `・${choice}`,
				x: 100,
				y: 50 + 50 * i,
				width: scene.game.width,
				height: 30,
				touchable: true
			});
			scene.append(label);
		});
	}
}
```

`coe.Scene` は `g.Scene` を継承しているため、通常の Akashic コンテンツの `g.Scene` と同様に利用できます。

ただし以下の2点にご注意ください。

* `coe.Scene` のコンストラクタで Controller のインスタンスを渡す必要があります。
* `coe.Scene` は初期状態で **手動進行** および **ローカルティック補間モード** として生成されます。
詳細は [開発者向け文書](https://github.com/akashic-games/coe/blob/master/developers.md) または Akashic Engine の文書を参照してください。

以上で Controller から送信された Command を各クライアント側での View に描画 することができます。

### 2.2 Controller に対して投票の Action を送信

それぞれのユーザがアンケートに回答できるように、View から Action を送信します。
ここでは各回答選択肢をクリックしたら Action を送信することにしてみます。

Action の送信は `coe.Scene#send()` を利用します。

`EnqueteScene#handleCommandReceive()` に以下の処理を追加してみましょう。

```typescript
command.choices.forEach((choice, i) => {
	...

	label.onPointDown.addOnce(() => {
		label.textColor = "red";
		label.touchable = false;
		label.invalidate();
		scene.send({
			votedIndex: i
		});
	});

	...
});
```

回答選択肢をクリックすると `votedIndex: number` を送信します。

注意: 各クライアントからの Action は、場合によって (例えば一時的に大量の Action が送信されるなど) は Controller に到達するまでに **破棄されてしまう** 可能性があります。その際、 `coe.Scene#send()` の第2引数の priority を 0 以上の値にしておくと、その Action は 0 または省略時の他の Action よりも優先的に Controller へ到達されます。

**アンケートの終了用の Action** など重要な Action に対しては priority をつけることを推奨します。

## 3. Action の受信

View から送信された Action は `Controller#onActionReceive` トリガによって受け取れます。

先程の回答内容を受け取り、それを集計してみましょう。

`EnqueteController` に以下の処理を追加します。

```typescript
export interface EnqueteVoteAction {
	votedIndex: number;
}

...

export class EnqueteController extends COEController<EnqueteCommand, EnqueteActionData> {
	votedMap: number[] = [];

	constructor(param: EnqueteControllerParameter) {
		...

		// トリガの登録
		this.onActionReceive.add(this.handleActionReceive, this);
	}

	destroy(): void {
		// トリガの解除
		this.onActionReceive.remove(this.handleActionReceive, this);

		super.destroy();
	}

	handleActionReceive(action: Action<EnqueteVoteAction>): void {
		if (typeof action.data.votedIndex !== "number") {
			return;
		}
		if (!this.votedMap[action.data.votedIndex]) {
			this.votedMap[action.data.votedIndex] = 0;
		}
		this.votedMap[action.data.votedIndex] += 1;
	}
}
```

## 4. 集計結果のブロードキャスト

`Controller#setTimeout()` を利用して、集計された結果をある一定時間後に View に送信してみます。
(`window.setTimeout()` や `g.Scene#setTimeout()` とは異なることに注意してください。)

アンケート開始時の Command と区別するため、 Command に `type: "start" | "result"` を追加しています。

```typescript

...

export interface EnqueteControllerStartCommand {
	type: "start";
	// 質問文
	topic: string;
	// 回答選択肢
	choices: string[];
}

export interface EnqueteControllerResultCommand {
	type: "result";
	// 回答の投票数
	choices: number[];
}

export type EnqueteCommand = EnqueteControllerStartCommand | EnqueteControllerResultCommand;

...

export class EnqueteController extends COEController<EnqueteCommand, EnqueteActionData> {
	...

	constructor(param: EnqueteControllerParameter) {
		// パラメータをブロードキャスト
		this.broadcast({
			type: "start",
			topic: param.topic,
			choices: param.choices
		});

		// 30秒 (30 * 1000ms) 後に結果を送信
		// NOTE: window.setTimeout() や g.Scene#setTimeout() とは異なることに注意
		this.setTimeout(() => {
			this.broadcast({
				type: "result",
				choices: this.votedMap
			});
		}, 30000);
	}

	...
}
```

## 5. View で集計結果を表示

ブロードキャストされた集計結果を表示するため、View も追従させます。

Message に type: `"start" | "result"` が追加されたため、それも合わせて修正します。

```typescript
	...

	private handleCommandReceive(command: EnqueteCommand) {
		const font = this.font;
		const scene = this;

		if (command.type === "start") {
			this.currentTopic = command.topic;
			// 質問文の描画
			const topic = new g.Label({
				scene,
				font,
				fontSize: 30,
				textColor: "#880000",
				text: command.topic
			});
			scene.append(topic);

			command.choices.forEach((choice, i) => {
				const label = new g.Label({
					scene,
					font,
					fontSize: 30,
					text: `・${choice}`,
					y: 50 + 50 * i,
					width: scene.game.width,
					height: 30,
					touchable: true
				});
				label.pointDown.addOnce(() => {
					label.textColor = "red";
					label.touchable = false;
					label.invalidate();
					scene.send({
						votedIndex: i
					});
				});
				scene.append(label);
			});
		} else if (command.type === "result") {
			// 回答結果の描画
			const topic = new g.Label({
				scene,
				font,
				fontSize: 30,
				textColor: "#880000",
				text: this.currentTopic
			});
			scene.append(topic);

			command.choices.forEach((choice, i) => {
				const label = new g.Label({
					scene,
					font,
					fontSize: 30,
					text: choice.toString(),
					x: 170,
					y: 50 + 50 * i,
					width: scene.game.width,
					height: 30
				});
				scene.append(label);
			});
		}
	}

	...
```

### 6. エントリポイントの追加

最後にエントリポイントである `main.ts` を `./src` に作成します。

COE フレームワークの初期化には `coe.initialize()` 関数を利用します。
引数に `g.Game` のインスタンスである `game`, `g.GameMainParameterObject` を渡す必要があります。

```typescript
import { initialize } from "@akashic-extension/coe";
import { EnqueteController } from "./EnqueteController";
import { EnqueteScene } from "./EnqueteScene";

const game = g.game;

function main(args: g.GameMainParameterObject): void {
	initialize({ game, args });

	const controller = new EnqueteController({
		topic: "好きな色はなんですか？",
		choices: [
			"赤", "青", "緑", "黄色", "ピンク", "紫", "白", "黒"
		]
	});

	const scene = new EnqueteScene({
		game,
		controller
	});
	game.pushScene(scene);
}

export = main;
```

以上で簡単なアンケートアプリケーションのサンプルを作成することができました。

本文書のサンプルコードは以下にありますので、適宜参照してください。

* https://github.com/akashic-contents/coe-application-sample

また、開発者向けのより詳しい情報については以下の文書を参照してください。

* https://github.com/akashic-games/coe/blob/master/developers.md
