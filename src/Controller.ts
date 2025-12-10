import type { Action } from "./parameters";

/**
 * 通信レイヤーにおける Action / Command の送受信時の処理を定義する抽象 Controller 。
 *
 * このクラスは以下の役割を持つ。
 * 1. Controller は View または信用された経路から send された action を Controller#onAction で受け取ることができる。
 * 2. Controller は View に対して Command を broadcast する。
 *
 * 本クラスのインスタンスはサーバ側にのみ仮想的に存在している。
 * View は View#send() によってのみ Controller に対して Action を送信することができる。
 * View が自身の保持する Controller#broadcast() を呼び出しても機能しないことに注意。
 */
export interface Controller<Command, ActionData> {
	/**
	 * この Controller に対して action が送信された際に発火する trigger 。
	 */
	onActionReceive: g.Trigger<Action<ActionData>>;

	/**
	 * @deprecated 非推奨である。将来的に削除される。代わりに `onActionReceive` を利用すること。
	 */
	actionReceived: g.Trigger<Action<ActionData>>;

	/**
	 * View に対してデータをブロードキャストする。
	 * @param data プロードキャストするデータ
	 * @param priority プライオリティ
	 */
	broadcast(data: Command, priority?: number): void;
}
