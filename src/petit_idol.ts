/*!
 * Copyright (c) 2014 Mutsuki Kimuraya (http://www4018uf.sakura.ne.jp/)
 * Released under the MIT license
 * http://opensource.org/licenses/mit-license.php
 */
/// <reference path="typings/knockout/knockout.d.ts" />

class UserPetitIdol {
	// ステータス
	vocal: KnockoutObservable<any>;
	dance: KnockoutObservable<any>;
	visual: KnockoutObservable<any>;

	constructor() {
		// ステータス
		this.vocal = ko.observable(0);
		this.dance = ko.observable(0);
		this.visual = ko.observable(0);
	}

	// 総ステータス取得
	status(): number {
		var status: number = 0;
		var vocal: number = parseInt(this.vocal());
		if(!isNaN(vocal)) {
			status += vocal;
		}
		var dance: number = parseInt(this.dance());
		if(!isNaN(dance)) {
			status += dance;
		}
		var visual: number = parseInt(this.visual());
		if(!isNaN(visual)) {
			status += visual;
		}
		return status;
	}

	// 設定取得
	get_setting(): { [index: string]: any; } {
		var setting: { [index: string]: any; } = {};
		setting["vocal"] = this.vocal();
		setting["dance"] = this.dance();
		setting["visual"] = this.visual();

		return setting;
	}

	// 設定反映
	set_setting(setting: { [index: string]: any; }): void {
		this.vocal(setting["vocal"]);
		this.dance(setting["dance"]);
		this.visual(setting["visual"]);
	}
}