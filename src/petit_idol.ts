/*!
 * Copyright (c) 2014 Mutsuki Kimuraya (http://www4018uf.sakura.ne.jp/)
 * Released under the MIT license
 * http://opensource.org/licenses/mit-license.php
 */
/// <reference path="typings/knockout/knockout.d.ts" />
/// <reference path="typings/knockout.es5/knockout.es5.d.ts" />

class UserPetitIdol {
	// ステータス
	vocal: string;
	dance: string;
	visual: string;

	constructor() {
		// ステータス
		this.vocal = "0";
		this.dance = "0";
		this.visual = "0";

		ko.track(this);
	}

	// 総ステータス取得
	status(): number {
		var status: number = 0;
		var vocal: number = parseInt(this.vocal);
		if(!isNaN(vocal)) {
			status += vocal;
		}
		var dance: number = parseInt(this.dance);
		if(!isNaN(dance)) {
			status += dance;
		}
		var visual: number = parseInt(this.visual);
		if(!isNaN(visual)) {
			status += visual;
		}
		return status;
	}

	// 設定取得
	get_setting(): { [index: string]: string; } {
		var setting: { [index: string]: string; } = {};
		setting["vocal"] = this.vocal;
		setting["dance"] = this.dance;
		setting["visual"] = this.visual;

		return setting;
	}

	// 設定反映
	set_setting(setting: { [index: string]: string; }): void {
		this.vocal = setting["vocal"];
		this.dance = setting["dance"];
		this.visual = setting["visual"];
	}
}