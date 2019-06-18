import { Event } from "@akashic/playlog";
import { ApplicationIdentifier } from "./application";
import { SessionId, SessionParameters } from "./session";

/**
 * メッセージの種別
 */
export const COEMessages = {
	/**
	 * セッションの開始
	 */
	SessionStarted: "start",

	/**
	 * セッションの終了
	 */
	SessionClosed: "end",

	/**
	 * 子セッションの開始
	 */
	ChildSessionStart: "child_start",

	/**
	 * 子セッションの終了
	 */
	ChildSessionEnd: "child_end"
};

/**
 * 共体験アプリケーションフレームワークで用いられる共通メッセージインターフェース
 */
export interface COEMessage {
	/**
	 * メッセージの種別
	 */
	type: "start" | "end" | "child_start" | "child_end";
}

/**
 * セッションの開始を要求するメッセージ
 */
export interface COESessionStartMessage<T extends SessionParameters> extends COEMessage {
	/**
	 * メッセージの種別。
	 * COESessionStartMessageにおいては"start"固定。
	 */
	type: "start";

	/**
	 * セッション開始時に渡すパラメータ
	 */
	parameters: T;
}

/**
 * 現在のセッションに対して終了を要求するメッセージ
 */
export interface COESessionCloseMessage extends COEMessage {
	/**
	 * メッセージの種別。
	 * COESessionCloseMessageにおいては"end"固定。
	 */
	type: "end";
}

/**
 * 子セッションの開始を要求するメッセージ
 */
export interface COEChildSessionStartMessage extends COEMessage {
	/**
	 * メッセージの種別。
	 * COEChildSessionStartMessageにおいては"child_start"固定。
	 */
	type: "child_start";

	/**
	 * このメッセージを送信したセッションID
	 */
	sessionId: SessionId;

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
	application?: ApplicationIdentifier;

	/**
	 * 子セッションを動作させるための追加アプリケーション情報。
	 * 期待される動作はapplicationと同様だが、カスケードすることが想定される。
	 */
	cascadeApplications?: ApplicationIdentifier[];

	/**
	 * ローカルセッションとして起動するかどうかのフラグ。
	 * このフラグが設定されている場合、その子セッションはローカルセッションとして起動することが期待される。
	 */
	local?: boolean;

	/**
	 * ローカルセッションとして起動する場合に引き渡されるイベント群。
	 * 生のplaylog形式で引き渡される。
	 */
	localEvents?: Event[];

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
	size?: COEContentSize;

	/**
	 * 子セッションに与えるplaylog情報。
	 * 対象のセッションはこの情報をもとにリプレイさせることが期待される。
	 * 本値は COEExitSessionParameters#needsPlaylog によって取得されるものと同一の形式でなければならない。
	 * (本値の具体的な型についてはサービス側に委ねられる。)
	 */
	playlog?: any;
}

/**
 * 子セッションの終了を要求するメッセージ
 */
export interface COEChildSessionEndMessage extends COEMessage {
	/**
	 * メッセージの種別。
	 * COEChildSessionEndMessageにおいては"child_end"固定。
	 */
	type: "child_end";

	/**
	 * このメッセージを送信したセッションID
	 */
	sessionId: SessionId;

	/**
	 * そのセッションに結果がある場合、結果を入れる
	 */
	result?: any;

	/**
	 * そのセッションにエラーがあった場合、エラー識別の情報を入れる。
	 * この値は if (error) として判定することで、エラーで終わったかどうかを検査することが期待されるので、エラーの場合にfalsy値を入れない事が保証される
	 */
	error?: any;
}

/**
 * 外部に送信するメッセージ。
 * COEMessageはcoe内部メッセージで、COEExternalMessageは外部送信用メッセージとなる。
 * COEMessageとは継承関係がなく、type等の値も互換性がない点に注意。
 */
export interface COEExternalMessage {
	/**
	 * メッセージの種別
	 */
	type: string;

	/**
	 * メッセージの送信先。
	 * 省略時は"parent"を想定し、親の共体験セッションへのメッセージであることを意図する。
	 */
	target?: string;

	/**
	 * このメッセージを一意に識別することが可能なID。
	 * アプリケーション側でメッセージの識別を必要とする場合、本値を利用する。
	 */
	id?: number;

	/**
	 * このメッセージを送信したセッションのID
	 */
	sessionId: SessionId;

	/**
	 * このメッセージの実データ。
	 * typeだけの可能性もあるため、本値はオプショナルである。
	 */
	data?: any;
}

/**
 * 共体験セッションの終了を通知するメッセージ
 */
export interface COEEndMessage extends COEExternalMessage {
	/**
	 * メッセージの種別。
	 * COEEndMessageにおいては"end"固定
	 */
	type: "end";

	/**
	 * その共体験セッションの最終結果があればここに値が入る
	 */
	result?: any;

	/**
	 * その共体験セッションのplaylog情報があればここに値が入る。
	 */
	playlog?: any;
}

/**
 * 共体験セッションの結果を通知するメッセージ。
 * 本メッセージが意図する結果は基本的に途中経過を意味し、最終結果はendで送ることを想定する。
 *
 * 最終結果を終了と異なるタイミングで送りたいケースも考えられるが、
 * 終了と共に最終結果を送るというモデルに統一した方がシンプルであろうという観点から、
 * 初期はこの仕様に固定するものとした。
 */
export interface COEResultMessage extends COEExternalMessage {
	/**
	 * メッセージの種別。
	 * COEResultMessageにおいては"result"固定
	 */
	type: "result";

	/**
	 * その共体験セッションの途中経過を意味する値
	 */
	result?: any;
}

/**
 * 共体験セッションの機能が終了した事を意味するメッセージ。
 * COEExternalMessage同様、外部に送信することを想定している。
 *
 * 共体験セッション自体の終了を意味するものではないため、
 * 自発的に終了しない共体験セッションに対して、本メッセージを受け取ったクライアントが終了処理を促す等の用途で用いられる。
 *
 * 本メッセージの各種プロパティは共体験アプリケーションごとに固有である。
 */
export interface COEFunctionEndMessage extends COEExternalMessage {
	/**
	 * メッセージの種別。
	 * COEFunctionEndMessageにおいては"function_end"固定
	 */
	type: "function_end";
}

/**
 * コンテンツサイズ。
 */
export interface COEContentSize {
	width: number;
	height: number;
}
