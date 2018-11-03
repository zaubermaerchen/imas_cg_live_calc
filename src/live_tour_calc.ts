/// <reference path="live_tour_calc.base.ts" />
class ViewModel extends BaseLiveTourCalcViewModel {
	//
	static USE_POINT_COEFFICIENT: number[] = [1, 2.5, 5];

	// 入力項目
	combo_level: string;
	fever_bonus: string;
	cheer_bonus: string;

	constructor() {
		super();

		// 入力値
		this.calc_type = CALCULATION_TYPE.LIVE_TOUR.toString();
		this.combo_level = "0";
		this.fever_bonus = "1";
		this.cheer_bonus = "0";

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
		var combo_level: number = parseInt(this.combo_level);
		var training_room_level: number = parseInt(this.training_room_level);
		var fever_bonus: number = parseInt(this.fever_bonus);
		var cheer_bonus: number = parseInt(this.cheer_bonus);
		var front_num: number = parseInt(this.front_num);

		// 総発揮値計算
		var total_offense: number = 0;
		var total_defense: number = 0;
		var damage_list: Damage[];
		switch(calc_type) {
			case CALCULATION_TYPE.DREAM_LIVE_FESTIVAL:
				damage_list = [new Damage("AP1"), new Damage("AP2"), new Damage("AP3")];
				break;
			case CALCULATION_TYPE.TALK_BATTLE:
				damage_list = [new Damage("TP1"), new Damage("TP2"), new Damage("TP3")];
				break;
			default:
				damage_list = [new Damage("LP1"), new Damage("LP2"), new Damage("LP3")];
		}

		// アイドルごとの発揮値・与ダメージ計算
		var front_offense: number = 0;
		var front_defense: number = 0;
		var back_offense: number = 0;
		var back_defense: number = 0;
		for(var i: number = 0; i < this.idol_list.length; i++) {
			var idol: UserIdol = this.idol_list[i];
			var member_type: boolean = (i < front_num);

			switch(calc_type) {
				case CALCULATION_TYPE.DREAM_LIVE_FESTIVAL:
					// ドリームLIVEフェス
					idol.calculation_dream_live_festival(member_type, producer_type, this.appeal_bonus, combo_level, fever_bonus, training_room_level);
					break;
				case CALCULATION_TYPE.TALK_BATTLE:
					// トークバトル
					idol.calculation_talk_battle(member_type, producer_type, this.appeal_bonus, combo_level, cheer_bonus, training_room_level);
					break;
				default:
					// LIVEツアー
					idol.calculation_live_tour(member_type, producer_type, this.appeal_bonus, training_room_level);
					break;
			}
			var base_damage: number  = Math.floor(idol.actual_offense) / 5;
			for(var j: number = 0; j < damage_list.length; j++) {
				damage_list[j].add_damage(base_damage * ViewModel.USE_POINT_COEFFICIENT[j]);
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

			// 色設定
			idol.style = "numeric " + (member_type ? "front" : "back");
		}
		this.front_offense = Math.ceil(front_offense);
		this.front_defense = Math.ceil(front_defense);
		this.back_offense = Math.ceil(back_offense);
		this.back_defense = Math.ceil(back_defense);

		// ぷちデレラボーナス計算
		var petit_idol_bonus_type: number = parseInt(this.petit_idol_bonus_type);
		var petit_idol_bonus_parameter: number = parseInt(this.petit_idol_bonus_parameter);
		var petit_idol_total_status: number = 0;
		switch(calc_type) {
			case CALCULATION_TYPE.DREAM_LIVE_FESTIVAL:
				// ドリームLIVEフェス
				petit_idol_total_status = this.calculation_petit_idol(fever_bonus, petit_idol_bonus_type, petit_idol_bonus_parameter);
				for(var i: number = 0; i < damage_list.length; i++) {
					damage_list[i].add_bonus(Math.ceil(petit_idol_total_status / 5));
				}
				break;
			case CALCULATION_TYPE.TALK_BATTLE:
				// トークバトル
				petit_idol_total_status = this.calculation_petit_idol(cheer_bonus, petit_idol_bonus_type, petit_idol_bonus_parameter);
				for(var i: number = 0; i < damage_list.length; i++) {
					damage_list[i].add_bonus(Math.ceil(petit_idol_total_status * ViewModel.USE_POINT_COEFFICIENT[i] / 5));
				}
				break;
			default:
				// LIVEツアー
				petit_idol_total_status = this.calculation_petit_idol(0, petit_idol_bonus_type, petit_idol_bonus_parameter);
				for(var i: number = 0; i < damage_list.length; i++) {
					damage_list[i].add_bonus(Math.ceil(petit_idol_total_status * ViewModel.USE_POINT_COEFFICIENT[i] / 5));
				}
		}
		total_offense += petit_idol_total_status;
		total_defense += petit_idol_total_status;
		this.petit_idol_total_status = petit_idol_total_status;

		this.damage_list = damage_list;

		return [Math.ceil(total_offense), Math.ceil(total_defense)];
	}

	/******************************************************************************/
	// 設定関連
	/******************************************************************************/
	// 設定取得
	get_setting(): { [index: string]: any; } {
		var setting: { [index: string]: any; } = super.get_setting();

		setting["combo_level"] = this.combo_level;
		setting["fever_bonus"] = this.fever_bonus;
		setting["cheer_bonus"] = this.cheer_bonus;

		return setting;
	}

	// 設定反映
	set_setting(setting: { [index: string]: any; }) {
		super.set_setting(setting);

		// 共通部分のパラメータ設定
		this.combo_level = setting["combo_level"];
		this.fever_bonus = setting["fever_bonus"];
		if(setting["cheer_bonus"]) {
			this.cheer_bonus = setting["cheer_bonus"];
		}
	}

	/******************************************************************************/
	// スキル関連
	/******************************************************************************/
	check_target_own_unit_skill_enable(skill: Skill, member_num: number[][]): boolean {
		var enable_skill_type: number = parseInt(this.enable_skill_type);

		// 有効スキルかチェック
		if(enable_skill_type != ENABLE_SKILL_TYPE.ALL &&
			skill.target_param != SKILL_TARGET_PARAM.ALL &&
			enable_skill_type != skill.target_param) {
			return true;
		}

		if(skill.target_member == SKILL_TARGET_MEMBER.SELF) {
			if(this.is_dream_live_festival()) {
				skill.value = 0;
			}
			return true;
		}

		// 対象範囲チェック
		return skill.check_skill_target(member_num);
	}

	apply_skill_value(idol: UserIdol, skill: Skill): void {
		if(this.is_dream_live_festival()) {
			super.apply_skill_value(idol, skill);
			return;
		}

		var offense_skill: number = parseFloat(idol.offense_skill);
		var defense_skill: number = parseFloat(idol.defense_skill);

		var value: number = 1 + (skill.value / 100);
		offense_skill = 1 + (offense_skill / 100);
		defense_skill = 1 + (defense_skill / 100);
		switch(skill.target_param) {
			case SKILL_TARGET_PARAM.ALL:
				offense_skill *= value;
				defense_skill *= value;
				break;
			case SKILL_TARGET_PARAM.OFFENSE:
				offense_skill *= value;
				break;
			case SKILL_TARGET_PARAM.DEFENSE:
				defense_skill *= value;
				break
		}
		offense_skill = (offense_skill - 1) * 100;
		defense_skill = (defense_skill - 1) * 100;

		idol.offense_skill = offense_skill.toString();
		idol.defense_skill = defense_skill.toString();
	}
}

jQuery(function() {
	ko.applyBindings(new ViewModel());
});