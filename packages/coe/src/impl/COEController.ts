import { COESessionStartMessage } from "@akashic-extension/coe-messages";
import { getSessionId, isTrustedAction } from "../global";
import { Action } from "../parameters";
import { BaseController } from "./BaseController";

/**
 * coe に準拠した処理をラップしたコントローラ。
 */
export class COEController<Command, ActionData> extends BaseController<Command, ActionData> {
	/**
	 * COESessionStartMessage を信用された経路から送信された際に呼び出される trigger 。
	 */
	startSessionRequested: g.Trigger<COESessionStartMessage<any>> = new g.Trigger();

	constructor() {
		super();
		this.actionReceived.add(this.onCOEMessageEventReceived, this);
	}

	/**
	 * 全クライアントに終了をブロードキャストする。
	 * このメソッド呼び出し後、 send プラグイン経由で `result` の値を含めた終了メッセージがシステム側に通知される。
	 *
	 * @param result 結果の値。
	 */
	broadcastEnd(result?: any): void {
		if (result != null) {
			this.broadcast({
				type: "end",
				sessionId: getSessionId(),
				result
			} as any);
		} else {
			this.broadcast({
				type: "end",
				sessionId: getSessionId()
			} as any);
		}
	}

	// override
	destroy(): void {
		this.actionReceived.remove(this.onCOEMessageEventReceived, this);
		this.startSessionRequested.destroy();
		this.startSessionRequested = null!;
		super.destroy();
	}

	private onCOEMessageEventReceived(action?: Action<any>) {
		if (action && action.data && isTrustedAction(action)) {
			if (action.data.type === "start") {
				this.startSessionRequested.fire(action.data);
				this.processingMessageEvent = true;
				this.update.addOnce(() => {
					this.processingMessageEvent = false;
				});
			} else if (action.data.type === "child_start" || action.data.type === "child_end") {
				this.broadcast(action.data);
			} else if (action.data.type === "end") {
				this.broadcastEnd(action.data.sessionId);
			}
		}
	}
}
