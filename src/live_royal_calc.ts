/*!
 * THE IDOLM@STER CINDERELLA GIRLS Exertion Value Calculator for Idol Live Royal
 * Copyright (c) 2013 Mutsuki Kimuraya (http://www4018uf.sakura.ne.jp/)
 * Released under the MIT license
 * http://opensource.org/licenses/mit-license.php
 */
/// <reference path="live_tour_calc.base.ts" />

class ViewModel extends BaseLiveTourCalcViewModel {
	// 定数
	// バトルポイント係数
	BATTLE_POINT_RATE_LIST: number[] = [0.8, 1, 1.5, 2, 2.5];			// ロワイヤルLIVE時
	GUEST_BATTLE_POINT_RATE_LIST: number[] = [0.5, 1, 1.6, 2.25, 3];	// ゲストLIVE時
	// セーブデータ関係
	SAVE_DATA_KEY: string = "imas_cg_live_royal_calc";

	// 入力項目
	battle_point: KnockoutObservable<any>;
	training_room_level: KnockoutObservable<any>;

	constructor() {
		super();

		var self = this;

		this.front_num(10);
		this.voltage_bonus(1);
		this.calc_type(CALCULATION_TYPE.ROYAL);
		// 入力項目
		this.battle_point = ko.observable(2);
		// 最大メンバー数
		this.max_member_num = 20;
		// 発揮値
		this.actual_status = ko.computed(function () { return self.calculation(); });

		this.init_list();
	}

	is_guest_live(): boolean { return (parseInt(this.calc_type()) == CALCULATION_TYPE.ROYAL_GUEST); }

	// アイドルリスト初期化
	init_idol_list(): void {
		var idols: UserIdol[] = [];
		for(var i: number = 0; i < this.max_member_num; i++) {
			idols.push(new UserIdol(false));
		}
		this.idol_list(idols);
	}

	// 発揮値計算
	calculation(): number[] {
		// スキル効果反映
		this.calc_skill_value();

		var battle_point: number = parseInt(this.battle_point());
		var battle_point_rate: number = this.BATTLE_POINT_RATE_LIST[battle_point - 1];
		if(this.is_guest_live()) {
			battle_point_rate = this.GUEST_BATTLE_POINT_RATE_LIST[battle_point - 1];
		}
		var front_num: number = parseInt(this.front_num());
		var producer_type: number = parseInt(this.producer_type());
		var voltage_bonus: number = parseFloat(this.voltage_bonus());
		var training_room_level = parseInt(this.training_room_level());
		var is_guest_live: boolean = this.is_guest_live();

		// 総発揮値計算
		var total_offense: number = 0;
		var total_defense: number = 0;
		var front_offense: number = 0;
		var front_defense: number = 0;
		var back_offense: number = 0;
		var back_defense: number = 0;
		var total_damage: { [index: string]: number; } = { min : 0, max : 0, avg : 0 };
		for(var i: number = 0; i < this.idol_list().length; i++) {
			var idol: UserIdol = this.idol_list()[i];
			var member_type: boolean = (i < front_num);

			// 発揮値計算
			idol.calculation_live_royal(member_type, is_guest_live, producer_type, this.appeal_bonus(), voltage_bonus, battle_point_rate, training_room_level);
			var offense: number = idol.actual_offense();
			var defense: number = idol.actual_defense();
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
			idol.style("numeric " + (member_type ? "front" : "back"));
		}
		this.front_offense(front_offense);
		this.front_defense(front_defense);
		this.back_offense(back_offense);
		this.back_defense(back_defense);

		// 与ダメージ計算
		this.total_damage_min(Math.ceil(total_damage["min"]));
		this.total_damage_max(Math.ceil(total_damage["max"]));
		this.total_damage_avg(Math.ceil(total_damage["avg"]));
		this.battle_damage_min(this.total_damage_min() * this.TOTAL_DAMAGE_COEFFICIENT);
		this.battle_damage_max(this.total_damage_max() * this.TOTAL_DAMAGE_COEFFICIENT);
		this.battle_damage_avg(this.total_damage_avg() * this.TOTAL_DAMAGE_COEFFICIENT);

		return [total_offense, total_defense];
	}

	// 発動可能なスキルかチェック
	check_skill_enable(idol: UserIdol, skill_data_list: { [index: string]: { [index: string]: any; } }, skill_count: number, member_num: number[][], rival_member_num: number[][]): { [index: string]: any; } {
		var enable_skill_type: number = parseInt(this.enable_skill_type());

		// 発動スキルを取得
		var enable: boolean = false;
		var skill: { [index: string]: any; } = jQuery.extend(true, {}, skill_data_list[idol.skill_id()]);
		skill["skill_level"] = parseInt(idol.skill_level());
		if(skill["skill_value_list"].length > 0) {
			var target_param: number = parseInt(skill["target_param"]);
			var target_unit: number = parseInt(skill["target_unit"]);
			var target_member: number = parseInt(skill["target_member"]);
			var target_type: number = parseInt(skill["target_type"]);
			if(target_unit == SKILL_TARGET_UNIT.OWN) {
				// 自分
				// 有効スキルかチェック
				if(enable_skill_type == ENABLE_SKILL_TYPE.ALL || target_param == SKILL_TARGET_PARAM.ALL ||
					enable_skill_type == target_param) {
					if(target_member == SKILL_TARGET_MEMBER.SELF) {
						// 自分スキルの適用
						enable = true;
						this.apply_skill_effect(idol, skill, skill_count);
					} else {
						// 対象範囲チェック
						enable = this.check_skill_target(target_member, target_type, member_num);
					}
				}
			} else {
				// 相手
				// 有効スキルかチェック
				if(enable_skill_type == ENABLE_SKILL_TYPE.ALL || (enable_skill_type ^ target_param) > 0) {
					if(target_member == SKILL_TARGET_MEMBER.FRONT || target_member == SKILL_TARGET_MEMBER.ALL) {
						enable = true;
						if(this.is_guest_live()) {
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
						}
					}
				}
			}
		}

		if(!enable) {
			skill = null;
		}

		return skill;
	}

	// スキル効果適用可能チェック
	check_apply_skill(idol: UserIdol, invoke_skill: { [index: string]: string; }): boolean {
		var result: boolean = false;

		var type: number = parseInt(idol.type());
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

	// スキル効果適用
	apply_skill_effect(idol: UserIdol, invoke_skill: { [index: string]: string; }, index: number): boolean {
		// スキルが効果適用可能かチェック
		if(!this.check_apply_skill(idol, invoke_skill)) {
			return false;
		}

		var result: boolean = false;

		var target_param: number = parseInt(invoke_skill["target_param"]);
		var skill_level: number = parseInt(invoke_skill["skill_level"]);
		var skill_value: number = 0;
		if(skill_level > 0) {
			skill_value = parseInt(invoke_skill["skill_value_list"][skill_level - 1]);
		}
		if(parseInt(this.skill_input_type()) == SKILL_INPUT_MODE.AUTO_MEAN) {
			var rate = this.SKILL_INVOCATION_RATE_LIST[index];
			if(rate != undefined) {
				skill_value = skill_value * (rate / 100);
			}
		}
		var offense_skill: number = parseFloat(idol.offense_skill());
		var defense_skill: number = parseFloat(idol.defense_skill());
		switch(target_param) {
			case SKILL_TARGET_PARAM.ALL:
				offense_skill += skill_value;
				defense_skill += skill_value;
				result = true;
				break;
			case SKILL_TARGET_PARAM.OFFENSE:
				offense_skill += skill_value;
				result = true;
				break;
			case SKILL_TARGET_PARAM.DEFENSE:
				defense_skill += skill_value;
				result = true;
				break
		}
		idol.offense_skill(offense_skill);
		idol.defense_skill(defense_skill);

		return result;
	}

	// 設定取得
	get_setting(): { [index: string]: any; } {
		var setting: { [index: string]: any; } = {};

		// 共通部分のパラメータ取得
		setting["battle_point"] = this.battle_point();
		setting["producer_type"] = this.producer_type();
		setting["appeal_bonus"] = this.get_appeal_bonus_setting();
		setting["training_room_level"] = this.training_room_level();
		setting["voltage_bonus"] = this.voltage_bonus();
		setting["calc_type"] = this.calc_type();
		setting["skill_input_type"] = this.skill_input_type();
		setting["enable_skill_type"] = this.enable_skill_type();
		setting["rival_member"] = this.get_rival_member_setting();

		// アイドル個別のパラメータ取得
		setting["idol"] = this.get_idol_setting();

		return setting;
	}

	// 設定反映
	set_setting(setting: { [index: string]: any; }): void {
		// 共通部分のパラメータ設定
		this.battle_point(setting["battle_point"]);
		this.producer_type(setting["producer_type"]);
		this.set_appeal_bonus_setting(setting["appeal_bonus"]);
		this.training_room_level(setting["training_room_level"]);
		this.voltage_bonus(setting["voltage_bonus"]);
		this.calc_type(setting["calc_type"]);
		this.skill_input_type(setting["skill_input_type"]);
		this.enable_skill_type(setting["enable_skill_type"]);
		this.set_rival_member_setting(setting["rival_member"]);

		// アイドル個別のパラメータ設定
		this.set_idol_setting(setting["idol"], this.max_member_num, false);
	}
}

jQuery(function() {
	ko.applyBindings(new ViewModel());
});