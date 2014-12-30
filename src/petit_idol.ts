/*!
 * Copyright (c) 2014 Mutsuki Kimuraya (http://www4018uf.sakura.ne.jp/)
 * Released under the MIT license
 * http://opensource.org/licenses/mit-license.php
 */
/// <reference path="typings/knockout/knockout.d.ts" />
/// <reference path="typings/knockout.es5/knockout.es5.d.ts" />

class UserPetitIdol {
	// 属性一致ボーナス係数
	static TYPE_BONUS_COEFFICIENT: number = 0.2;
	// パラメーターボーナス係数
	static PARAMETER_BONUS_COEFFICIENT: number = 0.5;

	// ステータス
	type: string;
	vocal: string;
	dance: string;
	visual: string;
	status: number;

	constructor() {
		// ステータス
		this.type = "0";
		this.vocal = "0";
		this.dance = "0";
		this.visual = "0";
		this.status = 0;

		ko.track(this);
	}

	display_status() : number { return Math.ceil(this.status); }

	// 総ステータス取得
	calculation(): void {
		var parameters = this.get_parameters();

		var status: number = 0;
		for(var i: number = 0; i < parameters.length; i++) {
			status += parameters[i];
		}

		this.status = status;
	}

	calculation_live_tour(bonus_parameter: number, voltage_bonus: number): void {
		var parameters = this.get_parameters();

		var status: number = 0;
		for(var i: number = 0; i < parameters.length; i++) {
			// パラメーターボーナス
			if(i == bonus_parameter) {
				parameters[i] += parameters[i] * UserPetitIdol.PARAMETER_BONUS_COEFFICIENT;
			}

			// ボルテージボーナス
			parameters[i] += parameters[i] * voltage_bonus / 100;

			status += parameters[i];
		}

		this.status = status;
	}

	calculation_dream_live_festival(fever_bonus: number): void {
		var parameters = this.get_parameters();

		var status: number = 0;
		for(var i: number = 0; i < parameters.length; i++) {
			// フィーバーボーナス
			parameters[i] += parameters[i] * fever_bonus / 100;

			status += parameters[i];
		}

		this.status = status;
	}

	calculation_talk_battle(bonus_type: number, cheer_bonus: number): void {
		var type: number = parseInt(this.type);
		var parameters = this.get_parameters();

		// ステータス計算
		var status: number = 0;
		for(var i: number = 0; i < parameters.length; i++) {
			// 属性ボーナス
			if(type == bonus_type) {
				parameters[i] += Math.ceil(parameters[i] * UserPetitIdol.TYPE_BONUS_COEFFICIENT);
			}

			// 応援ボーナス
			parameters[i] += parameters[i] * cheer_bonus / 100;

			status += parameters[i];
		}

		this.status = status;
	}

	calculation_live_royal(battle_point_rate: number, voltage_bonus: number): void {
		var parameters = this.get_parameters();

		var status: number = 0;
		for(var i: number = 0; i < parameters.length; i++) {
			// ボルテージボーナス
			parameters[i] = parameters[i] * voltage_bonus;

			status += parameters[i];
		}

		// BP補正
		status = status * battle_point_rate;

		this.status = status;
	}

	calculation_challenge(bonus_type: number, fever_bonus: number): void {
		var type: number = parseInt(this.type);
		var parameters = this.get_parameters();

		// ステータス計算
		var status: number = 0;
		for(var i: number = 0; i < parameters.length; i++) {
			// 属性ボーナス
			if(type == bonus_type) {
				parameters[i] += Math.ceil(parameters[i] * UserPetitIdol.TYPE_BONUS_COEFFICIENT);
			}

			// フィーバーボーナス
			parameters[i] += parameters[i] * fever_bonus / 100;

			status += parameters[i];
		}

		this.status = status;
	}

	get_parameters(): number[] {
		var parameters: number[] = [];
		parameters.push(parseInt(this.vocal));
		parameters.push(parseInt(this.dance));
		parameters.push(parseInt(this.visual));

		for(var i: number = 0; i < parameters.length; i++) {
			if(isNaN(parameters[i])) {
				parameters[i] = 0;
			}
		}

		return parameters;
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