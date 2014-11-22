/*!
 * THE IDOLM@STER CINDERELLA GIRLS Exertion Value Calculator for Idol Live Royal
 * Copyright (c) 2013 Mutsuki Kimuraya (http://www4018uf.sakura.ne.jp/)
 * Released under the MIT license
 * http://opensource.org/licenses/mit-license.php
 */
/// <reference path="live_tour_calc.base.ts" />
/// <reference path="petit_idol.ts" />

class ViewModel extends BaseLiveTourCalcViewModel {
	// 定数
	// バトルポイント係数
	static BATTLE_POINT_RATE_LIST: number[] = [0.8, 1, 1.5, 2, 2.5];		// ロワイヤルLIVE時
	static GUEST_BATTLE_POINT_RATE_LIST: number[] = [0.5, 1, 1.6, 2.25, 3];	// ゲストLIVE時
	// セーブデータ関係
	SAVE_DATA_KEY: string = "imas_cg_live_royal_calc";
	// ぷちアイドル最大数
	static PETIT_IDOL_NUM: number = 3;

	// 入力項目
	battle_point: string;
	petit_idol_list: UserPetitIdol[];

	constructor() {
		super();

		this.calc_type = CALCULATION_TYPE.ROYAL.toString();
		this.battle_point = "2";
		this.petit_idol_list = [];

		this.init_list();

		ko.track(this);
	}
	// 発揮値
	actual_status(): number[] { return this.calculation(); }

	is_guest_live(): boolean { return (parseInt(this.calc_type) == CALCULATION_TYPE.ROYAL_GUEST); }

	// アイドルリスト初期化
	init_petit_idol_list(): void {
		var petit_idols: UserPetitIdol[] = [];
		for(var i: number = 0; i < ViewModel.PETIT_IDOL_NUM; i++) {
			var petit_idol: UserPetitIdol = new UserPetitIdol();
			petit_idols.push(petit_idol);
		}
		this.petit_idol_list = petit_idols;
	}
	init_list(): void {
		this.init_petit_idol_list();
		super.init_list();
	}

	// 発揮値計算
	calculation(): number[] {
		// スキル効果反映
		this.calc_skill_value();

		var battle_point: number = parseInt(this.battle_point);
		var battle_point_rate: number = ViewModel.BATTLE_POINT_RATE_LIST[battle_point - 1];
		if(this.is_guest_live()) {
			battle_point_rate = ViewModel.GUEST_BATTLE_POINT_RATE_LIST[battle_point - 1];
		}
		var front_num: number = parseInt(this.front_num);
		var producer_type: number = parseInt(this.producer_type);
		var voltage_bonus: number = parseFloat(this.voltage_bonus);
		var training_room_level = parseInt(this.training_room_level);
		var is_guest_live: boolean = this.is_guest_live();

		// 総発揮値計算
		var total_offense: number = 0;
		var total_defense: number = 0;
		var front_offense: number = 0;
		var front_defense: number = 0;
		var back_offense: number = 0;
		var back_defense: number = 0;
		var total_damage: { [index: string]: number; } = { min : 0, max : 0, avg : 0 };
		for(var i: number = 0; i < this.idol_list.length; i++) {
			var idol: UserIdol = this.idol_list[i];
			var member_type: boolean = (i < front_num);

			// 発揮値計算
			idol.calculation_live_royal(member_type, is_guest_live, producer_type, this.appeal_bonus, voltage_bonus, battle_point_rate, training_room_level);
			var offense: number = idol.actual_offense;
			var defense: number = idol.actual_defense;
			if(member_type) {
				front_offense += offense;
				front_defense += defense;
			} else {
				back_offense += offense;
				back_defense += defense;
			}
			total_offense += offense;
			total_defense += defense;

			// 与ダメージ計算
			if(is_guest_live) {
				var damage: number = idol.calc_live_royal_damage();
				total_damage["min"] += Math.ceil(damage  * this.DAMAGE_COEFFICIENT["MIN"] * 10) / 10;
				total_damage["max"] += Math.ceil(damage  * this.DAMAGE_COEFFICIENT["MAX"] * 10) / 10;
				total_damage["avg"] += Math.ceil(damage  * this.DAMAGE_COEFFICIENT["AVG"] * 10) / 10;
			}

			// 色設定
			idol.style = "numeric " + (member_type ? "front" : "back");
		}
		this.front_offense = front_offense;
		this.front_defense = front_defense;
		this.back_offense = back_offense;
		this.back_defense = back_defense;

		// ぷちデレラボーナス計算
		var petit_idol_bonus: number = 0;
		for(var i: number = 0; i < this.petit_idol_list.length; i++) {
			var petit_idol: UserPetitIdol = this.petit_idol_list[i];
			petit_idol_bonus += petit_idol.status();
		}
		petit_idol_bonus = Math.ceil(petit_idol_bonus * battle_point_rate * voltage_bonus);
		var petit_idol_damage: number = Math.floor(petit_idol_bonus * 0.2);
		total_offense += petit_idol_bonus;
		total_defense += petit_idol_bonus;
		total_damage["min"] += petit_idol_damage;
		total_damage["max"] += petit_idol_damage;
		total_damage["avg"] += petit_idol_damage;

		// 与ダメージ計算
		this.total_damage_min = Math.ceil(total_damage["min"]);
		this.total_damage_max = Math.ceil(total_damage["max"]);
		this.total_damage_avg = Math.ceil(total_damage["avg"]);
		this.battle_damage_min = this.total_damage_min * this.TOTAL_DAMAGE_COEFFICIENT;
		this.battle_damage_max = this.total_damage_max * this.TOTAL_DAMAGE_COEFFICIENT;
		this.battle_damage_avg = this.total_damage_avg * this.TOTAL_DAMAGE_COEFFICIENT;

		return [total_offense, total_defense];
	}

	/******************************************************************************/
	// 設定関連
	/******************************************************************************/
	// ぷちアイドル設定取得
	get_petit_idol_setting(): { [index: string]: string; }[] {
		var setting: { [index: string]: string; }[] = [];
		for(var i: number = 0; i < this.petit_idol_list.length; i++) {
			setting.push(this.petit_idol_list[i].get_setting());
		}

		return	setting;
	}

	// ぷちアイドル設定反映
	set_petit_idol_setting(settings: { [index: string]: string; }[], max_num: number): void{
		if(settings == null) {
			return;
		}
		var petit_idols: UserPetitIdol[] = [];
		for(var i: number = 0; i < settings.length && i != max_num; i++) {
			var petit_idol: UserPetitIdol = new UserPetitIdol();
			petit_idol.set_setting(settings[i]);
			petit_idols.push(petit_idol);
		}

		this.petit_idol_list = petit_idols;
	}

	// 設定取得
	get_setting(): { [index: string]: any; } {
		var setting: { [index: string]: any; } = super.get_setting();

		setting["battle_point"] = this.battle_point;
		setting["voltage_bonus"] = this.voltage_bonus;

		// ぷちアイドル個別のパラメータ取得
		setting["petit_idol"] = this.get_petit_idol_setting();

		return setting;
	}

	// 設定反映
	set_setting(setting: { [index: string]: any; }): void {
		super.set_setting(setting);

		this.battle_point = setting["battle_point"];
		this.voltage_bonus = setting["voltage_bonus"];

		// ぷちアイドル個別のパラメータ取得
		this.set_petit_idol_setting(setting["petit_idol"], ViewModel.PETIT_IDOL_NUM);
	}

	/******************************************************************************/
	// スキル関連
	/******************************************************************************/
	check_target_rival_unit_skill_enable(skill: { [index: string]: any; }, rival_member_num: number[][]): { [index: string]: any; } {
		var enable_skill_type: number = parseInt(this.enable_skill_type);
		var target_param: number = parseInt(skill["target_param"]);
		var target_member: number = parseInt(skill["target_member"]);
		var target_type: number = parseInt(skill["target_type"]);

		// 有効スキルかチェック
		if(enable_skill_type != ENABLE_SKILL_TYPE.ALL && (enable_skill_type ^ target_param) == 0) {
			return null;
		}
		if(target_member != SKILL_TARGET_MEMBER.FRONT && target_member != SKILL_TARGET_MEMBER.ALL) {
			return null;
		}

		if(!this.is_guest_live()) {
			return skill;
		}

		if(this.check_skill_target(target_member, target_type, rival_member_num)) {
			switch (target_param) {
				case SKILL_TARGET_PARAM.OFFENSE:
					target_param = SKILL_TARGET_PARAM.DEFENSE;
					break;
				case SKILL_TARGET_PARAM.DEFENSE:
					target_param = SKILL_TARGET_PARAM.OFFENSE;
					break;
			}
			skill["target_member"] = SKILL_TARGET_MEMBER.FRONT;
			skill["target_param"] = target_param;
		} else {
			skill["skill_level"] = 0;
		}

		return skill;
	}

	// スキル効果適用可能チェック
	check_apply_skill(idol: UserIdol, invoke_skill: { [index: string]: string; }): boolean {
		var result: boolean = false;

		var type: number = parseInt(idol.type);
		var target_unit: number = parseInt(invoke_skill["target_unit"]);
		var target_member: number = parseInt(invoke_skill["target_member"]);
		var target_type: number = parseInt(invoke_skill["target_type"]);

		// スキルが効果適用可能かチェック
		if(target_unit == SKILL_TARGET_UNIT.OWN) {
			if(target_member == SKILL_TARGET_MEMBER.SELF || (target_type & (1 << type)) > 0) {
				result = true;
			}
		} else if(target_unit == SKILL_TARGET_UNIT.RIVAL) {
			if(this.is_guest_live()) {
				result = true;
			}
		}

		return result;
	}

}

jQuery(function() {
	ko.applyBindings(new ViewModel());
});