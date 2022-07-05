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
	onStartSessionRequeste: g.Trigger<COESessionStartMessage<any>> = new g.Trigger();

	/**
	 * @deprecated 非推奨である。将来的に削除される。代わりに `onStartSessionRequeste` を利用すること。
	 */
	startSessionRequested: g.Trigger<COESessionStartMessage<any>> = this.onStartSessionRequeste;

	constructor() {
		super();
		this.onActionReceive.add(this.onCOEMessageEventReceived, this);
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
		this.onActionReceive.remove(this.onCOEMessageEventReceived, this);
		this.onStartSessionRequeste.destroy();
		this.onStartSessionRequeste = null!;
		this.startSessionRequested = null!;
		super.destroy();
	}

	private onCOEMessageEventReceived(action?: Action<any>) {
		if (action && action.data && isTrustedAction(action)) {
			if (action.data.type === "start") {
				this.onStartSessionRequeste.fire(action.data);
				this.lockingProcessingMessageEvent = true;
				this.onUpdate.addOnce(() => {
					this.lockingProcessingMessageEvent = false;
				});
			} else if (action.data.type === "child_start" || action.data.type === "child_end") {
				this.broadcast(action.data);
			} else if (action.data.type === "end") {
				this.broadcastEnd(action.data.sessionId);
			}
		}
	}
}
