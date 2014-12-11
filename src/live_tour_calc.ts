/*!
 * THE IDOLM@STER CINDERELLA GIRLS Exertion Value Calculator for Live Tour
 * Copyright (c) 2013 Mutsuki Kimuraya (http://www4018uf.sakura.ne.jp/)
 * Released under the MIT license
 * http://opensource.org/licenses/mit-license.php
 */
/// <reference path="live_tour_calc.base.ts" />

class ViewModel extends BaseLiveTourCalcViewModel {
	// 入力項目
	status_up: string;
	compatibility_type: string;
	combo_level: string;
	fever_bonus: string;
	cheer_bonus: string;

	// 全力LIVE時の与ダメージ
	total_full_power_damage_min: number;
	total_full_power_damage_max: number;
	total_full_power_damage_avg: number;
	battle_full_power_damage_min: number;
	battle_full_power_damage_max: number;
	battle_full_power_damage_avg: number;

	constructor() {
		super();

		// 入力値
		this.voltage_bonus = "0";
		this.calc_type = CALCULATION_TYPE.LIVE_TOUR.toString();
		this.status_up = "0";
		this.compatibility_type = "-1";
		this.combo_level = "0";
		this.fever_bonus = "1";
		this.cheer_bonus = "0";

		// 全力LIVE時の与ダメージ
		this.total_full_power_damage_min = 0;
		this.total_full_power_damage_max = 0;
		this.total_full_power_damage_avg = 0;
		this.battle_full_power_damage_min = 0;
		this.battle_full_power_damage_max = 0;
		this.battle_full_power_damage_avg = 0;

		// セーブデータ関係
		this.save_data_key = "imas_cg_live_tour_calc";

		this.init_list();

		ko.track(this);
	}

	is_live_tour(): boolean { return (parseInt(this.calc_type) == CALCULATION_TYPE.LIVE_TOUR); }
	is_dream_live_festival(): boolean { return (parseInt(this.calc_type) == CALCULATION_TYPE.DREAM_LIVE_FESTIVAL); }
	is_talk_battle(): boolean { return (parseInt(this.calc_type) == CALCULATION_TYPE.TALK_BATTLE); }

	// 発揮値
	actual_status(): number[] { return this.calculation(); }

	// 発揮値計算
	calculation(): number[] {
		// スキル効果反映
		this.calc_skill_value();

		var calc_type: number = parseInt(this.calc_type);
		var producer_type: number = parseInt(this.producer_type);
		var voltage_bonus: number = parseInt(this.voltage_bonus);
		var status_up: number = parseInt(this.status_up);
		var compatibility_type: number = parseInt(this.compatibility_type);
		var combo_level: number = parseInt(this.combo_level);
		var training_room_level: number = parseInt(this.training_room_level);
		var fever_bonus: number = parseInt(this.fever_bonus);
		var cheer_bonus: number = parseInt(this.cheer_bonus);
		var front_num: number = parseInt(this.front_num);

		// 総発揮値計算
		var total_offense: number = 0;
		var total_defense: number = 0;
		var front_offense: number = 0;
		var front_defense: number = 0;
		var back_offense: number = 0;
		var back_defense: number = 0;
		var total_damage: { [index: string]: number; } = { min : 0, max : 0, avg : 0 };
		var total_full_power_damage: { [index: string]: number; } = { min : 0, max : 0, avg : 0 };
		for(var i: number = 0; i < this.idol_list.length; i++) {
			var idol: UserIdol = this.idol_list[i];
			var member_type: boolean = (i < front_num);

			// アイドルごとの発揮値・与ダメージ計算
			var normal_damage: number = 0;
			var full_power_damage: number = 0;
			switch(calc_type) {
				case CALCULATION_TYPE.DREAM_LIVE_FESTIVAL:
					// ドリームLIVEフェス
					idol.calculation_dream_live_festival(member_type, producer_type, this.appeal_bonus, combo_level, fever_bonus, training_room_level);
					normal_damage  = idol.calc_dream_live_festival_damage(false);
					full_power_damage = idol.calc_dream_live_festival_damage(true);
					break;
				case CALCULATION_TYPE.TALK_BATTLE:
					// トークバトル
					idol.calculation_talk_battle(member_type, producer_type, this.appeal_bonus, combo_level, cheer_bonus, training_room_level);
					normal_damage  = idol.calc_talk_battle_damage(false);
					full_power_damage = idol.calc_talk_battle_damage(true);
					break;
				default:
					// LIVEツアー
					idol.calculation_live_tour(member_type, producer_type, this.appeal_bonus, voltage_bonus, status_up, compatibility_type, training_room_level);
					normal_damage  = idol.calc_live_tour_damage(false);
					full_power_damage = idol.calc_live_tour_damage(true);
					break;
			}
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

			total_damage["min"] += Math.ceil(normal_damage * ViewModel.DAMAGE_COEFFICIENT["MIN"] * 10) / 10;
			total_damage["max"] += Math.ceil(normal_damage * ViewModel.DAMAGE_COEFFICIENT["MAX"] * 10) / 10;
			total_damage["avg"] += Math.ceil(normal_damage * ViewModel.DAMAGE_COEFFICIENT["AVG"] * 10) / 10;
			total_full_power_damage["min"] += Math.ceil(full_power_damage * ViewModel.DAMAGE_COEFFICIENT["MIN"] * 10) / 10;
			total_full_power_damage["max"] += Math.ceil(full_power_damage * ViewModel.DAMAGE_COEFFICIENT["MAX"] * 10) / 10;
			total_full_power_damage["avg"] += Math.ceil(full_power_damage * ViewModel.DAMAGE_COEFFICIENT["AVG"] * 10) / 10;

			// 色設定
			idol.style = "numeric " + (member_type ? "front" : "back");
		}
		this.front_offense = Math.ceil(front_offense);
		this.front_defense = Math.ceil(front_defense);
		this.back_offense = Math.ceil(back_offense);
		this.back_defense = Math.ceil(back_defense);

		// ぷちデレラボーナス計算
		var petit_idol_bonus: number = this.calc_petit_idol_bonus();
		var petit_idol_damage: number = 0;
		var petit_idol_full_power_damage: number = 0;
		switch(calc_type) {
			case CALCULATION_TYPE.DREAM_LIVE_FESTIVAL:
				// ドリームLIVEフェス
				petit_idol_bonus = petit_idol_bonus + Math.ceil(petit_idol_bonus * fever_bonus / 100);
				petit_idol_damage = Math.floor(petit_idol_bonus * UserIdol.DREAM_LIVE_FESTIVAL_NORMAL_LIVE_COEFFICIENT * 0.2);
				petit_idol_full_power_damage = Math.floor(petit_idol_bonus * UserIdol.DREAM_LIVE_FESTIVAL_FULL_POWER_LIVE_COEFFICIENT * 0.2);
				break;
			case CALCULATION_TYPE.TALK_BATTLE:
				// トークバトル
			default:
				// LIVEツアー
		}
		total_offense += petit_idol_bonus;
		total_defense += petit_idol_bonus;

		// 通常LIVE時の与ダメージ計算
		this.total_damage_min = Math.ceil(total_damage["min"] + petit_idol_damage);
		this.total_damage_max = Math.ceil(total_damage["max"] + petit_idol_damage);
		this.total_damage_avg = Math.ceil(total_damage["avg"] + petit_idol_damage);
		this.battle_damage_min = this.total_damage_min * ViewModel.TOTAL_DAMAGE_COEFFICIENT;
		this.battle_damage_max = this.total_damage_max * ViewModel.TOTAL_DAMAGE_COEFFICIENT;
		this.battle_damage_avg = this.total_damage_avg* ViewModel.TOTAL_DAMAGE_COEFFICIENT;

		// 全力LIVE時の与ダメージ計算
		this.total_full_power_damage_min = Math.ceil(total_full_power_damage["min"] + petit_idol_full_power_damage);
		this.total_full_power_damage_max = Math.ceil(total_full_power_damage["max"] + petit_idol_full_power_damage);
		this.total_full_power_damage_avg = Math.ceil(total_full_power_damage["avg"] + petit_idol_full_power_damage);
		this.battle_full_power_damage_min = this.total_full_power_damage_min * ViewModel.TOTAL_DAMAGE_COEFFICIENT;
		this.battle_full_power_damage_max = this.total_full_power_damage_max * ViewModel.TOTAL_DAMAGE_COEFFICIENT;
		this.battle_full_power_damage_avg = this.total_full_power_damage_avg * ViewModel.TOTAL_DAMAGE_COEFFICIENT;

		return [Math.ceil(total_offense), Math.ceil(total_defense)];
	}

	/******************************************************************************/
	// 設定関連
	/******************************************************************************/
	// 設定取得
	get_setting(): { [index: string]: any; } {
		var setting: { [index: string]: any; } = super.get_setting();

		setting["voltage_bonus"] = this.voltage_bonus;
		setting["status_up"] = this.status_up;
		setting["compatibility_type"] = this.compatibility_type;
		setting["combo_level"] = this.combo_level;
		setting["fever_bonus"] = this.fever_bonus;
		setting["cheer_bonus"] = this.cheer_bonus;

		return setting;
	}

	// 設定反映
	set_setting(setting: { [index: string]: any; }) {
		super.set_setting(setting);

		// 共通部分のパラメータ設定
		if(setting["voltage_bonus"]) {
			this.voltage_bonus = setting["voltage_bonus"];
		}
		this.status_up = setting["status_up"];
		this.compatibility_type = setting["compatibility_type"];
		this.combo_level = setting["combo_level"];
		this.fever_bonus = setting["fever_bonus"];
		if(setting["cheer_bonus"]) {
			this.cheer_bonus = setting["cheer_bonus"];
		}
	}

	/******************************************************************************/
	// スキル関連
	/******************************************************************************/
	check_target_own_unit_skill_enable(skill: { [index: string]: any; }, member_num: number[][], idol: UserIdol, skill_count: number): { [index: string]: any; } {
		var enable_skill_type: number = parseInt(this.enable_skill_type);
		var target_param: number = parseInt(skill["target_param"]);
		var target_member: number = parseInt(skill["target_member"]);
		var target_type: number = parseInt(skill["target_type"]);

		// 有効スキルかチェック
		if(enable_skill_type != ENABLE_SKILL_TYPE.ALL &&
			target_param != SKILL_TARGET_PARAM.ALL &&
			enable_skill_type != target_param) {
			return null;
		}

		if(target_member == SKILL_TARGET_MEMBER.SELF) {
			// 自分スキルの適用
			if(!this.is_dream_live_festival()) {
				this.apply_skill_effect(idol, skill, skill_count);
			}
			return skill;
		}

		// 対象範囲チェック
		if(!this.check_skill_target(target_member, target_type, member_num)) {
			return null;
		}

		return skill;
	}

	apply_skill_value(idol: UserIdol, target_param: number, skill_value: number): boolean {
		if(!this.is_talk_battle()) {
			return super.apply_skill_value(idol, target_param, skill_value);
		}

		var result: boolean = false;
		var offense_skill: number = parseFloat(idol.offense_skill);
		var defense_skill: number = parseFloat(idol.defense_skill);

		skill_value = 1 + (skill_value / 100);
		offense_skill = 1 + (offense_skill / 100);
		defense_skill = 1 + (defense_skill / 100);
		switch(target_param) {
			case SKILL_TARGET_PARAM.ALL:
				offense_skill *= skill_value;
				defense_skill *= skill_value;
				result = true;
				break;
			case SKILL_TARGET_PARAM.OFFENSE:
				offense_skill *= skill_value;
				result = true;
				break;
			case SKILL_TARGET_PARAM.DEFENSE:
				defense_skill *= skill_value;
				result = true;
				break
		}
		offense_skill = (offense_skill - 1) * 100;
		defense_skill = (defense_skill - 1) * 100;

		idol.offense_skill = offense_skill.toString();
		idol.defense_skill = defense_skill.toString();

		return result;
	}
}

jQuery(function() {
	ko.applyBindings(new ViewModel());
});