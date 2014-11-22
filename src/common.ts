/*!
 * Copyright (c) 2012 Mutsuki Kimuraya (http://www4018uf.sakura.ne.jp/)
 * Released under the MIT license
 * http://opensource.org/licenses/mit-license.php
 */
/// <reference path="typings/jquery/jquery.d.ts" />
declare var Zlib: any;

class Common {
	// 各種定義
	// アイドルデータAPI関係
	static IDOL_DATA_API_URL :string	= "http://www4018uf.sakura.ne.jp/imas_cg/api/idol/list/";
	static IDOL_LIST_KEY_BASE :string	= "imas_cg_idol_list";
	// スキルデータAPI関係
	static SKILL_DATA_API_URL :string	= "http://www4018uf.sakura.ne.jp/imas_cg/api/skill/list/";
	static SKILL_LIST_KEY :string		= "imas_cg_skill_list";
	// QRコード関連
	static GOOGLE_CHART_API_URL: string = "http://chart.apis.google.com/chart";

	static cache_data: { [index: string]: any; } = {};

	// アイドルリスト読込
	static load_idol_list(type: number, rarity: number, fields: string[] = []): JQueryPromise<{ [index: string]: { [index: string]: string; } }> {
		var key:string = this.IDOL_LIST_KEY_BASE;
		if(type == -1 && rarity == -1) {
			key += "_all";
		} else {
			if(type != -1) {
				key += "_t" + type;
			}
			if(rarity != -1) {
				key += "_r" + rarity;
			}
		}
		var data:string = this.cache_data[key];

		var deferred: JQueryDeferred<{ [index: string]: { [index: string]: string; } }> = jQuery.Deferred();
		if(data != null) {
			deferred.resolve(JSON.parse(data));
		} else {
			var post_data: { [index: string]: any; } = {};
			if(type != -1) {
				post_data["type"] = type;
			}
			if(rarity != -1) {
				post_data["rarity"] = rarity;
			}
			if(fields.length > 0) {
				post_data["fields"] = fields.join(" ");
			}
			jQuery.post(this.IDOL_DATA_API_URL, post_data, (response: { [index: string]: { [index: string]: string; } }) => {
				this.cache_data[key] = JSON.stringify(response);
				deferred.resolve(response);
			}, "json");
		}

		return deferred.promise();
	}
	// スキルリスト読込
	static load_skill_list(): JQueryPromise<{ [index: string]: any; }> {
		var key:string = this.SKILL_LIST_KEY;
		var data:string = this.cache_data[key];

		var deferred: JQueryDeferred<{ [index: string]: any; }> = jQuery.Deferred();
		if(data != null) {
			deferred.resolve(JSON.parse(data));
		} else {
			jQuery.post(this.SKILL_DATA_API_URL, (response: { [index: string]: any; }) => {
				this.cache_data[key] = JSON.stringify(response);
				deferred.resolve(response);
			}, "json");
		}

		return deferred.promise();
	}

	// 文字列圧縮
	static get_compress_data(str: string): string {
		// 文字列を文字コード配列に変換
		var data: number[] = [];
		for(var i: number = 0; i < str.length; i++) {
			var char_code = str.charCodeAt(i);
			var dec: number = parseInt(char_code.toString(), 10);
			data.push(dec);
		}

		//  データを圧縮
		var compress_data: number[] = new Zlib.Deflate(data).compress();

		// バイナリ文字列に変換
		var binary: string = "";
		for(var i: number = 0; i < compress_data.length; i++) {
			binary += ("0" + compress_data[i].toString(16)).slice(-2);
		}

		return binary;
	}

	// 文字列伸長
	static get_decompress_data(binary: string): string {
		// バイナリ文字列を文字コード配列に変換
		var data: number[] = [];
		for(var i: number = 0; i < binary.length; i = i + 2) {
			data.push(parseInt(binary.substr(i, 2), 16));
		}

		// データを伸張
		var decompress_data: number[] = new Zlib.Inflate(data).decompress();

		// 文字列に変換
		var str: string = "";
		for (var i: number = 0; i < decompress_data.length; i++) {
			str += String.fromCharCode(decompress_data[i])
		}

		return str;
	}

	// URLからパラメータ取得
	static get_param_list(): { [index: string]: string; } {
		var param_list: { [index: string]: string; } = {};

		var index: number = location.href.indexOf("?");
		if(index > -1) {
			var query_string:string = location.href.slice(index + 1);
			var parameters:string[] = query_string.split("&");
			for(var i = 0; i < parameters.length; i++) {
				var parameter:string[] = parameters[i].split("=");
				if(parameter[1]) {
					param_list[parameter[0]] = parameter[1];
				}
			}
		}

		return param_list;
	}

	// 表示しているページのURL取得
	static get_page_url(): string {
		var url: string = location.href;
		var index: number = url.indexOf("?");
		if(index > -1) {
			url = url.slice(0, index -1);
		}
		return url;
	}

	static get_qrcode_url(url: string, size: number = 150): string {
		var param_list: string[] = [];
		param_list.push("chs=" + size + "x" + size);
		param_list.push("cht=qr");
		param_list.push("chl=" + url);


		return this.GOOGLE_CHART_API_URL + "?" + param_list.join("&");
	}

	// 文字列を数値に変換
	static to_int(value: string): number {
		// 整数文字列以外の場合は0に
		if(!value.match(/^[-+]?[0-9]+$/)) {
			value = "0";
		}

		return parseInt(value, 10);
	}

	static is_smartphone(): boolean { return (navigator.userAgent.match(/(Android|iPhone|iPad|Mobile)/g) != null); }
}