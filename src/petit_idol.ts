/// <reference path="typings/knockout/knockout.d.ts" />
/// <reference path="typings/knockout.es5/knockout.es5.d.ts" />

class UserPetitIdol {
	// 属性一致ボーナス係数
	static TYPE_BONUS_COEFFICIENT: number = 0.2;
	// パラメーターボーナス係数
	static PARAMETER_BONUS_COEFFICIENT: number = 0.5;
	// ハイテンションボーナス係数
	static HIGH_TENSION_BONUS_COEFFICIENT: number = 0.1;

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
	calculation(event_bonus = 0, bonus_type: number = -1, bonus_parameter: number = -1): void {
		var type: number = parseInt(this.type);
		var parameters = this.get_parameters();

		var status: number = 0;
		for(var i: number = 0; i < parameters.length; i++) {
			// パラメーターボーナス
			if(i == bonus_parameter) {
				parameters[i] += Math.ceil(parameters[i] * UserPetitIdol.PARAMETER_BONUS_COEFFICIENT);
			}
			status += parameters[i];
		}

		// 属性ボーナス
		if(type == bonus_type) {
			status += Math.ceil(status * UserPetitIdol.TYPE_BONUS_COEFFICIENT);
		}
		
		// ボルテージボーナス
		status += status * event_bonus / 100;

		this.status = status;
	}

	calculation_festival(high_tension: boolean): void {
		var high_tension_bonus: number = 0;
		if(high_tension) {
			high_tension_bonus = UserPetitIdol.HIGH_TENSION_BONUS_COEFFICIENT * 100;
		}
		
		this.calculation(high_tension_bonus);
	}

	calculation_live_royal(bonus_type: number, bonus_parameter: number, battle_point_rate: number, voltage_bonus: number): void {
		this.calculation(0, bonus_type, bonus_parameter);

		var status: number = this.status;

		// ボルテージボーナス
		status = Math.ceil(status * voltage_bonus);

		// BP補正
		status = status * battle_point_rate;

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