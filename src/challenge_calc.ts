/// <reference path="live_tour_calc.base.ts" />

class ViewModel extends BaseLiveTourCalcViewModel {
	// 定数
	static USE_POINT_COEFFICIENT: number[] = [1, 2.5, 5];
	static SCORE_OFFSET: number = 2000;

	// 入力項目
	status_up: string;
	unit_type: string;
	fever_bonus: string;

	constructor() {
		super();

		// 入力値
		this.calc_type = CALCULATION_TYPE.CHALLENGE.toString();
		this.status_up = "0";
		this.unit_type = "-1";
		this.fever_bonus = "1";

		// セーブデータ関係
		this.save_data_key = "imas_cg_challenge_calc";

		this.init_list();

		ko.track(this);
	}

	// 発揮値
	actual_status(): number[] { return this.calculation(); }

	// 発揮値計算
	calculation(): number[] {
		// スキル効果反映
		this.calc_skill_value();

		var producer_type: number = parseInt(this.producer_type);
		var unit_type: number = parseInt(this.unit_type);
		var training_room_level: number = parseInt(this.training_room_level);
		var fever_bonus: number = parseInt(this.fever_bonus);
		var front_num: number = parseInt(this.front_num);

		// 総発揮値計算
		var total_offense: number = 0;
		var total_defense: number = 0;
		var front_offense: number = 0;
		var front_defense: number = 0;
		var back_offense: number = 0;
		var back_defense: number = 0;
		var damage_list: Damage[] = [];
		for(var i: number = 0; i < ViewModel.USE_POINT_COEFFICIENT.length; i++) {
			damage_list.push(new Damage("CP" + (i + 1), ViewModel.SCORE_OFFSET));
		}
		for(var i: number = 0; i < this.idol_list.length; i++) {
			var idol: UserIdol = this.idol_list[i];
			var member_type: boolean = (i < front_num);

			// アイドルごとの発揮値・スコア計算
			idol.calculation_challenge(member_type, producer_type, this.appeal_bonus, unit_type, fever_bonus, training_room_level);
			var offense: number = idol.actual_offense;
			var defense: number = idol.actual_defense;
			var score: number = idol.calc_challenge_damage();
			if(member_type) {
				front_offense += offense;
				front_defense += defense;
			} else {
				back_offense += offense;
				back_defense += defense;
			}
			total_offense += offense;
			total_defense += defense;

			for(var j: number = 0; j < damage_list.length; j++) {
				damage_list[j].add_damage(score * ViewModel.USE_POINT_COEFFICIENT[j]);
			}

			// 色設定
			idol.style = "numeric " + (member_type ? "front" : "back");
		}
		this.front_offense = Math.ceil(front_offense);
		this.front_defense = Math.ceil(front_defense);
		this.back_offense = Math.ceil(back_offense);
		this.back_defense = Math.ceil(back_defense);

		// ぷちデレラボーナス計算
		var petit_idol_bonus_type: number = parseInt(this.petit_idol_bonus_type);
		var petit_idol_total_status: number = this.calculation_petit_idol(fever_bonus, petit_idol_bonus_type);
		for(var i: number = 0; i < damage_list.length; i++) {
			damage_list[i].add_bonus(Math.ceil(petit_idol_total_status * ViewModel.USE_POINT_COEFFICIENT[i] / 5));
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

		setting["unit_type"] = this.unit_type;
		setting["fever_bonus"] = this.fever_bonus;
		setting["petit_idol_bonus_type"] = this.petit_idol_bonus_type;

		return setting;
	}

	// 設定反映
	set_setting(setting: { [index: string]: any; }) {
		super.set_setting(setting);

		this.unit_type = setting["unit_type"];
		this.fever_bonus = setting["fever_bonus"];
		this.petit_idol_bonus_type = setting["petit_idol_bonus_type"];
	}

	/******************************************************************************/
	// スキル関連
	/******************************************************************************/
	apply_skill_value(idol: UserIdol, skill: Skill): void {
		var offense_skill: number = parseFloat(idol.offense_skill);
		var defense_skill: number = parseFloat(idol.defense_skill);

		skill.value = 1 + (skill.value / 100);
		offense_skill = 1 + (offense_skill / 100);
		defense_skill = 1 + (defense_skill / 100);
		switch(skill.target_param) {
			case SKILL_TARGET_PARAM.ALL:
				offense_skill *= skill.value;
				defense_skill *= skill.value;
				break;
			case SKILL_TARGET_PARAM.OFFENSE:
				offense_skill *= skill.value;
				break;
			case SKILL_TARGET_PARAM.DEFENSE:
				defense_skill *= skill.value;
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