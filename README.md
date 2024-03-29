<p align="center">
<img src="https://raw.githubusercontent.com/akashic-games/coe/master/img/akashic.png"/>
</p>

# COE

COE (co-experience framework) は Akashic Engine で非対称・軽量なマルチプレイを実現するための拡張ライブラリです。

本ライブラリは主に次の機能を提供します。

1. Akashic コンテンツの容易なマルチプレイ化
2. コンテンツ内で子コンテンツを実行

## 利用方法

本フレームワークについては以下の文書を参照してください。
* [共体験アプリケーションの開発手引き](https://github.com/akashic-games/coe/blob/master/getstarted.md)
* [共体験アプリケーションの開発者向け文書](https://github.com/akashic-games/coe/blob/master/developers.md)
* [APIリファレンス](https://akashic-games.github.io/coe/api/)

### インストール

以下からモジュールをインストールします。

```sh
npm i @akashic-extension/coe --save
```

## 利用

1. 任意の script 内でインポートします。
2. Akashic のエントリポイントから `initialize()` 関数を呼び出します。
3. 任意の `Controller` のインスタンスを生成します。
4. `coe.Scene` のインスタンスを生成し、 `Controller` を渡します。

### サンプルコード (TypeScript)

```typescript
import * as coe from "@akashic-extension/coe";

module.exports = (args) => {
    coe.initialize({ game: g.game, args });

    const scene = new coe.Scene({
        // ...
        controller: new coe.COEController({
            // ...
        });
    });

    scene.onLoad.add(() => {
        // ...
    });
}
```

## 設計

本フレームワークは以下のモデルによって作られています。

1. Controller
   * View からの Action を受け取る。
   * View へ Command をブロードキャストする。
   * 一つのプレイに対し、必ず一つのみ存在する。
2. View
   * Controller に対して Action を送信する。
   * Controller からブロードキャストされた Command を受信した際の処理を持つ。
   * 一つのプレイに対し、複数存在しうる。
   * 一つの View は Akashic Engine の各インスタンスに相当する。

また、 Controller/View 間でのデータモデルは以下の2つがあります。

* Action
   * View から Controller に対して送信されるデータ。
* Command
   * Controller からブロードキャストされるデータ。

```
                                   Action
        Action    +------------+  (trusted)  +--------+
     +----------> | Controller | <---------- | system |
     |            +------------+             +--------+
     |                 |
     |   +-------------+   Command
     |   |             | (broadcast)
     |   v             v
  +--------+       +--------+
  |  View  |       |  View  |
  +--------+       +--------+
```

## ビルド
```sh
npm run build
```

## テスト
```sh
npm test
```

### テスト前に成果物の pack を無視する場合
```sh
npm run test-skip-install
```

## ライセンス
本リポジトリは MIT License の元で公開されています。
詳しくは [LICENSE](https://github.com/akashic-games/coe/blob/master/LICENSE) をご覧ください。

ただし、画像ファイルおよび音声ファイルは
[CC BY 2.1 JP](https://creativecommons.org/licenses/by/2.1/jp/) の元で公開されています。
