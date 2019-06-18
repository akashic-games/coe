/**
 * アプリケーション識別情報
 */
export interface ApplicationIdentifier {
	/**
	 * アプリケーションの種別を表す文字列
	 */
	type: string;

	/**
	 * アプリケーションのバージョン情報を表す文字列
	 */
	version: string;

	/**
	 * そのアプリケーションがダウンロード出来る事が期待できるリソースの場所を示すURL
	 */
	url?: string;
}
