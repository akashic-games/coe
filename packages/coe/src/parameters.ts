import {
	ApplicationIdentifier,
	COEContentSize,
	COEEndMessage,
	COEExternalMessage,
	COESessionStartMessage
} from "@akashic-extension/coe-messages";
import { SceneWatcher } from "./SceneWatcher";

/**
 * g.GameMainParameterObject#args に渡されることを想定するインターフェース。
 * 共体験アプリケーションを実行している実行主体に対して期待される動作を表す各種パラメータを格納する
 */
export interface InitializeArguments {
	coe: {
		permission: Permission;
		roles: string[];
		debugMode?: boolean;
	};
}

/**
 * 共体験アプリケーションフレームワークのmain関数のパラメータ
 */
export interface InitializeParameters {
	/**
	 * ゲーム起動引数
	 */
	args: g.GameMainParameterObject;

	/**
	 * 属するAkashic EngineのGame
	 */
	game: g.Game;

	/**
	 * coe のメッセージイベントを coe-plugin へ橋渡しする MessageEventHandler 。
	 * 省略時は `COEMessageEventHandler` が利用される。
	 */
	coeMessageEventHandler?: SceneWatcher;
}

/**
 * インスタンスの権利を表すインターフェース。
 * @deprecated このインタフェースは後方互換性のために存在している。
 */
export interface Permission {
	/**
	 * 進行権
	 */
	advance: boolean;
	/**
	 * 集計権。通常は進行権を保有するインスタンスのみ保有する
	 */
	aggregation: boolean;
	/**
	 * 進行要求権。通常は起動者に対して付与される。
	 */
	advanceRequest: boolean;
}

export interface Action<ActionData> {
	player: g.Player;
	data?: ActionData;
}

/**
 * ローカルセッションを起動するために必要なパラメータの定義
 */
export interface StartLocalSessionParameters {
	/**
	 * セッションを動作させるためのアプリケーション情報。
	 * 本値は、それぞれ以下のような挙動を期待される。
	 * 1. 本値が入っていない場合、sessionIdからセッション情報を引いて、アプリケーション情報を特定することが期待される
	 * 2. 本値にURLが入っている場合、そのURLで指定されるアプリケーションの読み込みが期待される
	 * 3. 本値にtypeとversionが入っている場合、その情報を基にメッセージ受信側がURLを構築してアプリケーションを読み込む事が期待される
	 */
	application: ApplicationIdentifier;

	/**
	 * セッションを動作させるための追加アプリケーション情報。
	 * 期待される動作はapplicationと同様だが、カスケードすることが想定される。
	 */
	cascadeApplications?: ApplicationIdentifier[];

	/**
	 * 本メッセージを遅延させる範囲をミリ秒で指定する。
	 * 本値が設定されていた場合、 `Math.random() * delayRange` 分の処理遅延を起こした上で、本メッセージを処理することが期待される
	 */
	delayRange?: number;

	/**
	 * ローカルセッションに引き渡すスタートメッセージ。
	 * 指定されない場合、COESessionStartMessageを引き渡さずに起動する。
	 */
	message?: COESessionStartMessage<any>;

	/**
	 * ローカルセッションからのメッセージを処理するハンドラ。
	 * 本ハンドラを指定して起動した場合、子セッションが送信したCOEExternalMessageは、本ハンドラに届けられる。
	 */
	messageHandler?: (message: COEExternalMessage | COEEndMessage) => void;

	/**
	 * サービス・アプリケーションで利用するための任意の追加データ。
	 */
	additionalData?: any;

	/**
	 * application, cascadeApplications等の情報を総合し、コンテンツのどういったサイズで起動することを期待しているかという値。
	 * 省略された場合、そのプラットフォームにおけるデフォルト値として解釈される事を期待する。
	 */
	size?: COEContentSize;

	/**
	 * ローカルセッションに与えるplaylog情報。
	 * 対象のセッションはこの情報をもとにリプレイさせることが期待される。
	 * 本値は COEExitSessionParameters#needsPlaylog によって取得されるものと同一の形式でなければならない。
	 * (本値の具体的な型についてはサービス側に委ねられる。)
	 */
	playlog?: any;
}
