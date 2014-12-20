/*!
 * Copyright (c) 2014 Mutsuki Kimuraya (http://www4018uf.sakura.ne.jp/)
 * Released under the MIT license
 * http://opensource.org/licenses/mit-license.php
 */
/// <reference path="typings/knockout/knockout.d.ts" />
/// <reference path="typings/knockout.es5/knockout.es5.d.ts" />

class UserPetitIdol {
	// 属性一致ボーナス係数
	static TYPE_BONSU_COEFFICIENT: number = 0.2;

	// ステータス
	type: string;
	vocal: string;
	dance: string;
	visual: string;
	status: number

	constructor() {
		// ステータス
		this.type = "0";
		this.vocal = "0";
		this.dance = "0";
		this.visual = "0";
		this.status = 0;

		ko.track(this);
	}

	// 総ステータス取得
	calc_status(bonus_type: number = -1): void {
		var status: number = 0;
		var type: number = parseInt(this.type);
		var rate: number = 1 + UserPetitIdol.TYPE_BONSU_COEFFICIENT;

		var vocal: number = parseInt(this.vocal);
		if(!isNaN(vocal)) {
			if(type == bonus_type) {
				vocal = Math.ceil(vocal * rate);
			}
			status += vocal;
		}
		var dance: number = parseInt(this.dance);
		if(!isNaN(dance)) {
			if(type == bonus_type) {
				dance = Math.ceil(dance * rate);
			}
			status += dance;
		}
		var visual: number = parseInt(this.visual);
		if(!isNaN(visual)) {
			if(type == bonus_type) {
				visual = Math.ceil(visual * rate);
			}
			status += visual;
		}

		this.status = status;
	}

	// 設定取得
	get_setting(): { [index: string]: string; } {
		var setting: { [index: string]: string; } = {};
		setting["type"] = this.type;
		setting["vocal"] = this.vocal;
		setting["dance"] = this.dance;
		setting["visual"] = this.visual;

		return setting;
	}

	// 設定反映
	set_setting(setting: { [index: string]: string; }): void {
		this.type = setting["type"];
		this.vocal = setting["vocal"];
		this.dance = setting["dance"];
		this.visual = setting["visual"];
	}
}