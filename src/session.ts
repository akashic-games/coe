import type { COEExitSessionParameters, COEPlugin, COEStartSessionParameters } from "@akashic-environment/coe-plugin";
import type { COEExternalMessage, SessionId } from "@akashic-extension/coe-messages";
import { getSessionId, TrustedPlayerId } from "./global";
import type { StartLocalSessionParameters } from "./parameters";

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
