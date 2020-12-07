import { COEExitSessionParameters, COEPlugin, COEStartSessionParameters } from "@akashic-environment/coe-plugin";
import { COEExternalMessage, SessionId } from "@akashic-extension/coe-messages";
import { COEMessageEventHandler } from "./impl/COEMessageEventHandler";
import { Action, InitializeArguments, InitializeParameters, Permission, StartLocalSessionParameters } from "./parameters";

declare var window: any;

/**
 * Akashic の Sandbox 環境で実行されているかどうかを判別する。
 */
export function isSandbox() {
	return typeof window !== "undefined" && "gScriptContainer" in window;
}

let roles: string[] = [];
let debugMode: boolean = false;
const permission: Permission = {
	advance: false,
	aggregation: false,
	advanceRequest: false
};

/**
 * 共体験セッションを実行している端末の権限を取得する。
 */
export function getPermission(): Permission {
	return permission;
}

/**
 * 自身のセッションIDを取得する。
 */
export function getSessionId(): SessionId {
	// @ts-ignore
	return g.game.playId;
}

/**
 * 本フレームワークを初期化する。
 *
 * @param params Akashic Engineのmain関数に渡される引数。
 */
export function initialize(params: InitializeParameters): void {
	const args: InitializeArguments | undefined = params.args && params.args.args ? params.args.args : undefined;
	const game = params.game;
	if (args && args.coe) {
		if (args.coe.permission) {
			permission.advance = !!args.coe.permission.advance;
			permission.advanceRequest = !!args.coe.permission.advanceRequest;
			permission.aggregation = !!args.coe.permission.aggregation;
		}
		if (args.coe.roles != null) {
			roles = args.coe.roles;
		}
		if (args.coe.debugMode != null) {
			debugMode = !!args.coe.debugMode;
		}
	} else {
		if (game.isActiveInstance()) {
			permission.advance = true;
			permission.aggregation = true;
			permission.advanceRequest = true;
			roles = ["broadcaster"];
		} else {
			permission.advance = game.selfId == null;
			permission.aggregation = game.selfId == null;
			permission.advanceRequest = game.selfId == null;
		}
	}

	if (params.coeMessageEventHandler) {
		params.coeMessageEventHandler.initialize(game);
	} else {
		// TODO: 相互参照の解消
		const messageEventHandler = new COEMessageEventHandler();
		messageEventHandler.initialize(game);
	}

	game.onJoin.add(handleJoinEvent);
	game.onLeave.add(handleLeaveEvent);
}

function handleJoinEvent(e?: g.JoinEvent): void {
	if (e && e.player && e.player.id) addJoinedPlayer(e.player.id);
}

function handleLeaveEvent(e?: g.LeaveEvent): void {
	if (e && e.player && e.player.id) removeJoinedPlayer(e.player.id);
}

/**
 * Join しているユーザであるかを返す。
 */
export function isJoinedPlayer(playerId: string): boolean {
	return joinedPlayerIds.indexOf(playerId) !== -1;
}

/**
 * 信頼されているシステムからの action であるかを返す。
 * @param action アクション
 */
export function isTrustedAction(action: Action<any>): boolean {
	return isSandbox() || (action.player != null && action.player.id === TrustedPlayerId);
}

/**
 * 指定のロールに属しているかどうかを取得する
 */
export function hasRole(roll: string): boolean {
	return roles && roles.length > 0 ? roles.indexOf(roll) !== -1 : false;
}

// ":akashic" は事前に本番環境と取り決められた値で、現状はハードコーディングとする
export const TrustedPlayerId = ":akashic";

const joinedPlayerIds: string[] = [];

/**
 * JoinされたPlayer IDをリストに追加する。
 * @param playerId 追加するPlayer ID
 */
export function addJoinedPlayer(playerId: string): void {
	// Note: すでにJoinされていても警告はしない。
	if (joinedPlayerIds.indexOf(playerId) === -1) {
		joinedPlayerIds.push(playerId);
	}
}

/**
 * JoinされたPlayer IDをリストから削除する。
 * @param playerId 削除するPlayer ID
 */
export function removeJoinedPlayer(playerId: string): void {
	// Note: すでにLeaveされていても警告はしない。
	if (joinedPlayerIds.indexOf(playerId) !== -1) {
		joinedPlayerIds.splice(joinedPlayerIds.indexOf(playerId), 1);
	}
}

/**
 * デバッグモードであるかを返す。
 */
export function getDebugMode(): boolean {
	return debugMode;
}

let localSessionCount: number = 0;

/**
 * ローカルセッションを起動する。
 *
 * @param params ローカルセッションの起動パラメータ
 */
export function startLocalSession(params: StartLocalSessionParameters): SessionId {
	// ローカルセッションの起動
	const localSessionId = `${getSessionId()}-${localSessionCount++}`;
	const coeParams: COEStartSessionParameters = {
		sessionId: localSessionId,
		local: true,
		application: params.application,
		cascadeApplications: params.cascadeApplications,
		delayRange: params.delayRange,
		additionalData: params.additionalData,
		size: params.size,
		playlog: params.playlog,
		messageHandler: params.messageHandler as (m: COEExternalMessage) => void
	};

	if (params.message) {
		coeParams.localEvents = [[32, 0, TrustedPlayerId, params.message]];
	}

	startSession(coeParams);

	return localSessionId;
}

/**
 * coe-plugin 経由で共体験セッションを開始する。
 * @param parameters 開始する共体験セッションの起動情報
 */
export function startSession(parameters: COEStartSessionParameters): void {
	if (g.game.external.coe && g.game.external.coe.startSession) {
		(g.game.external.coe as COEPlugin).startSession(parameters);
	}
}

/**
 * coe-plugin 経由で共体験セッションのUI表示を終了する。
 * @param sessionId その共体験セッションを一意に識別するためのID
 * @param parameters UI表示を終了に伴う追加処理を格納する情報
 */
export function exitSession(sessionId: SessionId, parameters?: COEExitSessionParameters): void {
	if (g.game.external.coe && g.game.external.coe.exitSession) {
		(g.game.external.coe as COEPlugin).exitSession(sessionId, parameters);
	}
}

/**
 * 本共体験セッションを終了する。
 *
 * @param result 本共体験セッションの結果。
 *   このメソッド呼び出し後、 send プラグイン経由で本値を含めた終了メッセージがシステム側に通知される。
 *   本値が null または undefined である場合、結果はなかったものとして取り扱われる。
 */
export function exit(result?: any): void {
	const sessionId = getSessionId();
	if (g.game.external.send) {
		if (result != null) {
			g.game.external.send({
				type: "end",
				sessionId,
				data: {
					result
				}
			} as COEExternalMessage);
		} else {
			g.game.external.send({
				type: "end",
				sessionId
			} as COEExternalMessage);
		}
	}
}
