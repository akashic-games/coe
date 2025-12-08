import { COEChildSessionEndMessage, COEChildSessionStartMessage, COEEndMessage } from "@akashic-extension/coe-messages";
import { exit, exitSession, startSession } from "../global";
import { SceneWatcher } from "../SceneWatcher";

/**
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

	protected handleMessageEvent(event: g.MessageEvent): void {
		const message = event.data as COEMessage;
		if (message.type === "child_start") {
			startSession({
				sessionId: message.sessionId,
				delayRange: message.delayRange,
				application: message.application,
				cascadeApplications: message.cascadeApplications,
				local: message.local,
				localEvents: message.localEvents,
				eventSendablePlayers: message.eventSendablePlayers,
				additionalData: message.additionalData,
				size: message.size,
				playlog: message.playlog
			});
		} else if (message.type === "child_end") {
			exitSession(message.sessionId, {
				needsResult: !!message.needsResult,
				needsPlaylog: !!message.needsPlaylog
			});
		} else if (message.type === "end") {
			exit(message.result);
		}
	}
}
