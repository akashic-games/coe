import * as messages from "@akashic-extension/coe-messages";
import * as playlog from "@akashic/playlog";

/**
 * startSessionに引き渡すパラメータ
 */
export interface COEStartSessionParameters {
	/**
	 * ローカルセッションとして起動するかどうかのフラグ。
	 * このフラグが設定されている場合、その子セッションはローカルセッションとして起動することが期待される。
	 */
	local?: boolean;

	/**
	 * ローカルセッションとして起動する場合に引き渡されるイベント群。
	 * 生のplaylog形式で引き渡される。
	 */
	localEvents?: playlog.Event[];

	/**
	 * 子セッションのセッションID
	 */
	sessionId: messages.SessionId;

	/**
	 * 本メッセージを遅延させる範囲をミリ秒で指定する。
	 * 本値が設定されていた場合、 `Math.random() * delayRange` 分の処理遅延を起こした上で、本メッセージを処理することが期待される
	 */
	delayRange?: number;

	/**
	 * 子セッションを動作させるためのアプリケーション情報。
	 * 本値は、それぞれ以下のような挙動を期待される。
	 * 1. 本値が入っていない場合、sessionIdからセッション情報を引いて、アプリケーション情報を特定することが期待される
	 * 2. 本値にURLが入っている場合、そのURLで指定されるアプリケーションの読み込みが期待される
	 * 3. 本値にtypeとversionが入っている場合、その情報を基にメッセージ受信側がURLを構築してアプリケーションを読み込む事が期待される
	 */
	application?: messages.ApplicationIdentifier;

	/**
	 * 子セッションを動作させるための追加アプリケーション情報。
	 * 期待される動作はapplicationと同様だが、カスケードすることが想定される。
	 */
	cascadeApplications?: messages.ApplicationIdentifier[];

	/**
	 * 子セッションからのメッセージを処理するハンドラ。
	 * 本ハンドラを指定して起動した場合、子セッションが送信したCOEExternalMessageは、本ハンドラに届けられる。
	 *
	 * 通常、子セッションのメッセージはlocalフラグが立っている場合にのみ受信できる。
	 * 厳密な定義は、子セッションがActiveであれば受信できる、であるが、通常共体験アプリケーションの開発者の理解はlocalフラグで良い。
	 */
	messageHandler?: (message: messages.COEExternalMessage) => void;

	/**
	 * 本セッションに対してActionなどのメッセージイベントを送信できるPlayer IDのリスト。
	 * 省略された場合、すべてのPlayerが本セッションにメッセージイベントを送信できることが期待される。
	 */
	eventSendablePlayers?: string[];

	/**
	 * サービス・アプリケーションで利用するための任意の追加データ。
	 */
	additionalData?: any;

	/**
	 * application, cascadeApplications等の情報を総合し、コンテンツのどういったサイズで起動することを期待しているかという値。
	 * 省略された場合、そのプラットフォームにおけるデフォルト値として解釈される事を期待する。
	 */
	size?: messages.COEContentSize;

	/**
	 * 子セッションに与えるplaylog情報。
	 * 対象のセッションはこの情報をもとにリプレイさせることが期待される。
	 * 本値は COEExitSessionParameters#needsPlaylog によって取得されるものと同一の形式でなければならない。
	 * (本値の具体的な型についてはサービス側に委ねられる。)
	 */
	playlog?: any;
}

/**
 * exitSessionに引き渡す拡張パラメータ
 */
export interface COEExitSessionParameters {
	/**
	 * この値にtrueを指定すると、そのセッションの結果を送信してから終了することが期待される。
	 * 結果取得はstartSessionの引数で指定したmessageHandler経路で行われる点に注意。
	 * 一般的には、UI表示を隠す→結果取得→UI表示の終了、となる事が期待されるが、UIがいつ消えるかは実装側にゆだねられる。
	 * なお、通常本メソッド呼び出しで取得が期待されるのは、 `COEEndMessage` である。
	 *
	 * TODO: playlog送信のためのメッセージインターフェースは規定されていない。
	 */
	needsResult?: boolean;

	/**
	 * この値にtrueを指定すると、そのセッションのplaylogを送信してから終了することが期待される。
	 * playlog取得はstartSessionの引数で指定したmessageHandler経路で行われる点に注意。
	 * 一般的には、UI表示を隠す→playlog取得→UI表示の終了、となる事が期待されるが、UIがいつ消えるかは実装側にゆだねられる。
	 *
	 * TODO: playlog送信のためのメッセージインターフェースは規定されていない。
	 */
	needsPlaylog?: boolean;
}

export interface COEPlugin {
	/**
	 * 共体験セッションを開始する
	 * @param parameters 開始するセッションの起動情報
	 */
	startSession(parameters: COEStartSessionParameters): void;

	/**
	 * 共体験セッションのUI表示を終了する
	 * @param sessionId 対象の共体験セッションを一意に識別するためのID
	 * @param parameters UI表示を終了に伴う追加処理を格納する情報
	 */
	exitSession(sessionId: messages.SessionId, parameters?: COEExitSessionParameters): void;

	/**
	 * 共体験セッションにローカルイベントを送信する
	 * @param sessionId その共体験セッションを一意に識別するためのID
	 * @param localEvents 送信するイベント群。生のplaylog形式で引き渡される。
	 */
	sendLocalEvents(sessionId: messages.SessionId, localEvents: playlog.Event[]): void;
}
