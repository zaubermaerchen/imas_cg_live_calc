/*!
 * THE IDOLM@STER CINDERELLA GIRLS Exertion Value Calculator for Idol Challenge
 * Copyright (c) 2014 Mutsuki Kimuraya (http://www4018uf.sakura.ne.jp/)
 * Released under the MIT license
 * http://opensource.org/licenses/mit-license.php
 */
/// <reference path="live_tour_calc.base.ts" />

class ViewModel extends BaseLiveTourCalcViewModel {
	// 定数
	// セーブデータ関係
	static USE_CP_COEFFICIENT: { [index: string]: number; } = {
		"CP1": 1,
		"CP2": 2.5,
		"CP3": 5
	};
	static SCORE_OFFSET: number = 2000;

	// 入力項目
	status_up: string;
	unit_type: string;
	fever_bonus: string;

	// スコア
	turn_score: { [index: string]: number; }[];
	lesson_score: { [index: string]: number; }[];

	constructor() {
		super();

		// 入力値
		this.calc_type = CALCULATION_TYPE.CHALLENGE.toString();
		this.status_up = "0";
		this.unit_type = "-1";
		this.fever_bonus = "1";

		// スコア
		this.turn_score = [
			{ min : 0, max : 0, avg : 0 },
			{ min : 0, max : 0, avg : 0 },
			{ min : 0, max : 0, avg : 0 }
		];
		this.lesson_score = [
			{ min : 0, max : 0, avg : 0 },
			{ min : 0, max : 0, avg : 0 },
			{ min : 0, max : 0, avg : 0 }
		];

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
		var total_score: { [index: string]: { [index: string]: number; } }= {
			"CP1": { min : 0, max : 0, avg : 0 },
			"CP2": { min : 0, max : 0, avg : 0 },
			"CP3": { min : 0, max : 0, avg : 0 }
		};
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

			for(var key in ViewModel.USE_CP_COEFFICIENT) {
				var _score: number = score * ViewModel.USE_CP_COEFFICIENT[key];
				total_score[key]["min"] += Math.ceil(_score * ViewModel.DAMAGE_COEFFICIENT["MIN"] * 10) / 10;
				total_score[key]["max"] += Math.ceil(_score * ViewModel.DAMAGE_COEFFICIENT["MAX"] * 10) / 10;
				total_score[key]["avg"] += Math.ceil(_score * ViewModel.DAMAGE_COEFFICIENT["AVG"] * 10) / 10;
			}

			// 色設定
			idol.style = "numeric " + (member_type ? "front" : "back");
		}
		this.front_offense = Math.ceil(front_offense);
		this.front_defense = Math.ceil(front_defense);
		this.back_offense = Math.ceil(back_offense);
		this.back_defense = Math.ceil(back_defense);

		// スコア計算
		var turn_score: { [index: string]: number; }[] = [];
		var lesson_score: { [index: string]: number; }[] = [];
		for(var key in ViewModel.USE_CP_COEFFICIENT) {
			var _turn_score: { [index: string]: number; } = {};
			var _lesson_score: { [index: string]: number; } = {};
			for(var key2 in total_score[key]) {
				var _score: number = Math.ceil(total_score[key][key2]);
				if(_score > 0) {
					_score += ViewModel.SCORE_OFFSET;
				}
				_turn_score[key2] = _score;
				_lesson_score[key2] = _score * ViewModel.TOTAL_DAMAGE_COEFFICIENT;
			}
			turn_score.push(_turn_score);
			lesson_score.push(_lesson_score);
		}
		this.turn_score = turn_score;
		this.lesson_score = lesson_score;

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

		return setting;
	}

	// 設定反映
	set_setting(setting: { [index: string]: any; }) {
		super.set_setting(setting);

		this.unit_type = setting["unit_type"];
		this.fever_bonus = setting["fever_bonus"];
	}

	/******************************************************************************/
	// スキル関連
	/******************************************************************************/
	apply_skill_value(idol: UserIdol, target_param: number, skill_value: number): boolean {
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