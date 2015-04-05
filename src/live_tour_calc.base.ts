/// <reference path="live_calc.base.ts" />
class DamageValue {
	static BATTLE_DAMAGE_COEFFICIENT: number = 5;

	value: number;

	constructor(value: number = 0) {
		this.value =  value;
	}

	get_turn_damage(): number {
		return Math.ceil(this.value);
	}

	get_battle_damage(): number {
		return this.get_turn_damage() * DamageValue.BATTLE_DAMAGE_COEFFICIENT;
	}
}

class Damage {
	// 定数
	// ダメージ係数
	static COEFFICIENT_MIN: number = 0.97;
	static COEFFICIENT_MAX: number = 1.02;
	static COEFFICIENT_AVG: number = 0.995;

	name: string;
	min: DamageValue;
	max: DamageValue;
	avg: DamageValue;

	constructor(name: string = "", value: number = 0) {
		this.name = name;
		this.min = new DamageValue(value);
		this.max = new DamageValue(value);
		this.avg = new DamageValue(value);
	}

	add_damage(base: number): void {
		this.min.value += Math.ceil(base * Damage.COEFFICIENT_MIN * 10) / 10;
		this.max.value += Math.ceil(base * Damage.COEFFICIENT_MAX * 10) / 10;
		this.avg.value += Math.ceil(base * Damage.COEFFICIENT_AVG * 10) / 10;
	}

	add_bonus(bonus: number): void {
		this.min.value += bonus;
		this.max.value += bonus;
		this.avg.value += bonus;
	}
}


class BaseLiveTourCalcViewModel extends BaseLiveCalcViewModel {
	// 最大メンバー数
	max_member_num: number;

	// 入力項目
	voltage_bonus: string;
	petit_idol_bonus_type: string;
	petit_idol_bonus_parameter: string;

	// 発揮値
	front_offense: number;
	front_defense: number;
	back_offense: number;
	back_defense: number;
	// LIVE時の与ダメージ
	damage_list: Damage[];


	constructor() {
		super();

		// 最大メンバー数
		this.max_member_num = 20;

		// 入力値
		this.front_num = "10";
		this.voltage_bonus = "0";
		this.petit_idol_bonus_type = "-1";
		this.petit_idol_bonus_parameter = "-1";

		// 特技関係
		this.max_skill_invoke = 5;
		this.skill_invocation_rate_list = [
			100,
			50,
			37.5,
			29.6875,
			24.51171875,
			20.880126953125,
			18.195724487304688,
			16.121602058410645,
			14.460162818431854,
			13.09043737128377
		];


		// 発揮値
		this.front_offense = 0;
		this.front_defense = 0;
		this.back_offense = 0;
		this.back_defense = 0;

		// LIVE時の与ダメージ
		this.damage_list = [];
	}

	// アイドルリスト初期化
	init_idol_list(): void {
		var member_num: number = this.max_member_num;

		var settings: { [index: string]: string; }[] = [];
		var old_idols = this.idol_list;
		for(var i = 0; i < old_idols.length; i++) {
			settings.push(old_idols[i].get_setting());
		}

		var idols: UserIdol[] = [];
		for(var i: number = 0; i < member_num; i++) {
			var idol: UserIdol = new UserIdol();
			if(settings[i] != null) {
				idol.set_setting(settings[i]);
			}
			idols.push(idol);
		}
		this.idol_list = idols;
	}

	/******************************************************************************/
	// 設定関連
	/******************************************************************************/
	// 設定取得
	get_setting(): { [index: string]: any; } {
		var setting: { [index: string]: any; } = {};

		// 共通部分のパラメータ取得
		setting["producer_type"] = this.producer_type;
		setting["appeal_bonus"] = this.get_appeal_bonus_setting();
		setting["training_room_level"] = this.training_room_level;
		setting["petit_idol_bonus_type"] = this.petit_idol_bonus_type;
		setting["petit_idol_bonus_parameter"] = this.petit_idol_bonus_parameter;
		setting["calc_type"] = this.calc_type;
		setting["skill_input_type"] = this.skill_input_type;
		setting["enable_skill_type"] = this.enable_skill_type;
		setting["rival_member"] = this.get_rival_member_setting();

		// アイドル個別のパラメータ取得
		setting["idol"] = this.get_idol_setting();

		// ぷちアイドル個別のパラメータ取得
		setting["petit_idol"] = this.get_petit_idol_setting();

		return setting;
	}

	// 設定反映
	set_setting(setting: { [index: string]: any; }): void {
		// 共通部分のパラメータ設定
		this.producer_type = setting["producer_type"];
		this.set_appeal_bonus_setting(setting["appeal_bonus"]);
		this.training_room_level = setting["training_room_level"];
		this.petit_idol_bonus_type = setting["petit_idol_bonus_type"];
		this.petit_idol_bonus_parameter = setting["petit_idol_bonus_parameter"];
		this.calc_type = setting["calc_type"];
		this.skill_input_type = setting["skill_input_type"];
		this.enable_skill_type = setting["enable_skill_type"];
		this.set_rival_member_setting(setting["rival_member"]);

		// アイドル個別のパラメータ設定
		this.set_idol_setting(setting["idol"], this.max_member_num);

		// ぷちアイドル個別のパラメータ設定
		this.set_petit_idol_setting(setting["petit_idol"], BaseLiveCalcViewModel.PETIT_IDOL_NUM);
	}

	/******************************************************************************/
	// スキル関連
	/******************************************************************************/
	check_target_rival_unit_skill_enable(skill: Skill, rival_member_num: number[][]): boolean {
		var enable_skill_type: number = parseInt(this.enable_skill_type);

		// 有効スキルかチェック
		if(enable_skill_type != ENABLE_SKILL_TYPE.ALL && (enable_skill_type ^ skill.target_param) == 0) {
			return false;
		}
		if(skill.target_member != SKILL_TARGET_MEMBER.FRONT && skill.target_member != SKILL_TARGET_MEMBER.ALL) {
			return false;
		}

		if(skill.check_skill_target(rival_member_num)) {
			switch (skill.target_param) {
				case SKILL_TARGET_PARAM.OFFENSE:
					skill.target_param = SKILL_TARGET_PARAM.DEFENSE;
					break;
				case SKILL_TARGET_PARAM.DEFENSE:
					skill.target_param = SKILL_TARGET_PARAM.OFFENSE;
					break;
			}
			skill.target_member = SKILL_TARGET_MEMBER.FRONT;
		} else {
			skill.value = 0;
		}

		return true;
	}

	// スキル効果適用可能チェック
	check_apply_skill(idol: UserIdol, skill: Skill): boolean {
		var result: boolean = false;

		var type: number = parseInt(idol.type);

		// スキルが効果適用可能かチェック
		if(skill.target_unit == SKILL_TARGET_UNIT.OWN) {
			if(skill.target_member == SKILL_TARGET_MEMBER.SELF || (skill.target_type & (1 << type)) > 0) {
				result = true;
			}
		} else if(skill.target_unit == SKILL_TARGET_UNIT.RIVAL) {
			result = true;
		}

		return result;
	}
}