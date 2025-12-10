import { COEChildSessionEndMessage, COEChildSessionStartMessage, COEEndMessage } from "@akashic-extension/coe-messages";
import { exit, exitSession, startSession } from "../global";
import { SceneWatcher } from "../SceneWatcher";

/**
 * @deprecated 後方互換
 * COEPlugin#COEExitSessionParameters を拡張したインタフェース。
 */
interface COEExtendChildSessionEndMessage extends COEChildSessionEndMessage {
	needsResult?: boolean;
	needsPlaylog?: boolean;
}

type COEMessage = COEChildSessionStartMessage | COEExtendChildSessionEndMessage | COEEndMessage;

/**
 * coe のメッセージイベントを coe-plugin へ橋渡しする EventHandler 。
 */
export class COEMessageEventHandler extends SceneWatcher {
	protected handleScene(scene: g.Scene): void {
		// 重複の防止および trigger の最後尾に handler を追加する
		scene.message.remove(this.handleMessageEvent, this);
		scene.message.add(this.handleMessageEvent, this);
	}

	protected handleMessageEvent(event?: g.MessageEvent): void {
		if (!event) return;
		const message = event.data as COEMessage;
		if (message.type === "child_start") {
			startSession({
				sessionId: message.parameters.sessionId,
				delayRange: message.parameters.delayRange,
				application: message.parameters.application,
				cascadeApplications: message.parameters.cascadeApplications,
				local: message.parameters.local,
				localEvents: message.parameters.localEvents,
				eventSendablePlayers: message.parameters.eventSendablePlayers,
				additionalData: message.parameters.additionalData,
				size: message.parameters.size,
				playlog: message.parameters.playlog
			});
		} else if (message.type === "child_end") {
			// NOTE: 後方互換のための処理。
			const coeParams = {
				needsResult: !!message.needsResult,
				needsPlaylog: !!message.needsPlaylog
			};
			exitSession(message.parameters.sessionId, coeParams);
		} else if (message.type === "end") {
			// NOTE: 後方互換のための処理。
			exit(message.result);
		}
	}
}
