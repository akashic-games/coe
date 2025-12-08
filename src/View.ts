/**
 * Controller を制御する、または Controller によって制御される実体。
 */
export interface View<Command, ActionData> {
	/**
	 * ブロードキャストされた Command を受け取った際に発火する trigger 。
	 */
	commandReceived: g.Trigger<Command>;

	/**
	 * Controller に対して action データを送信する。
	 * @param data 送信する action データ
	 */
	send(data: ActionData): void;
}
