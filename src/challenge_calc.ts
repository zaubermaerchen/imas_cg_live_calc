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
	SAVE_DATA_KEY: string = "imas_cg_challenge_calc";
	USE_CP_COEFFICIENT: { [index: string]: number; } = {
		"CP1": 1,
		"CP2": 2.5,
		"CP3": 5
	};
	SCORE_OFFSET: number = 2000;

	// 入力項目
	status_up: KnockoutObservable<any>;
	unit_type: KnockoutObservable<any>;
	fever_bonus: KnockoutObservable<any>;
	// スコア
	turn_score: KnockoutObservableArray<Object>;
	lesson_score: KnockoutObservableArray<Object>;

	constructor() {
		super();

		var self = this;

		// 最大メンバー数
		this.max_member_num = 20;

		this.front_num(10);
		this.voltage_bonus(0);
		this.calc_type(CALCULATION_TYPE.CHALLENGE);
		// 入力値
		this.status_up = ko.observable(0);
		this.unit_type = ko.observable(-1);
		this.fever_bonus = ko.observable(1);
		// スコア
		this.turn_score = ko.observableArray([
			{ min : 0, max : 0, avg : 0 },
			{ min : 0, max : 0, avg : 0 },
			{ min : 0, max : 0, avg : 0 }
		]);
		this.lesson_score = ko.observableArray([
			{ min : 0, max : 0, avg : 0 },
			{ min : 0, max : 0, avg : 0 },
			{ min : 0, max : 0, avg : 0 }
		]);
		// 発揮値
		this.actual_status = ko.computed(function () { return self.calculation(); });

		this.init_list();
	}

	// アイドルリスト初期化
	init_idol_list(): void {
		var member_num: number = this.max_member_num;

		var settings: { [index: string]: string; }[] = [];
		var old_idols = this.idol_list();
		for(var i = 0; i < old_idols.length; i++) {
			settings.push(old_idols[i].get_setting());
		}

		var idols: UserIdol[] = [];
		for(var i: number = 0; i < member_num; i++) {
			var idol: UserIdol = new UserIdol(false);
			if(settings[i] != null) {
				idol.set_setting(settings[i]);
			}
			idols.push(idol);
		}
		this.idol_list(idols);
	}

	// 発揮値計算
	calculation(): number[] {
		// スキル効果反映
		this.calc_skill_value();

		var producer_type: number = parseInt(this.producer_type());
		var unit_type: number = parseInt(this.unit_type());
		var training_room_level: number = parseInt(this.training_room_level());
		var fever_bonus: number = parseInt(this.fever_bonus());
		var front_num: number = parseInt(this.front_num());

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
		for(var i: number = 0; i < this.idol_list().length; i++) {
			var idol: UserIdol = this.idol_list()[i];
			var member_type: boolean = (i < front_num);

			// アイドルごとの発揮値・スコア計算
			idol.calculation_challenge(member_type, producer_type, this.appeal_bonus(), unit_type, fever_bonus, training_room_level);
			var offense: number = idol.actual_offense();
			var defense: number = idol.actual_defense();
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

			for(var key in this.USE_CP_COEFFICIENT) {
				var _score: number = score * this.USE_CP_COEFFICIENT[key];
				total_score[key]["min"] += Math.ceil(_score * this.DAMAGE_COEFFICIENT["MIN"] * 10) / 10;
				total_score[key]["max"] += Math.ceil(_score * this.DAMAGE_COEFFICIENT["MAX"] * 10) / 10;
				total_score[key]["avg"] += Math.ceil(_score * this.DAMAGE_COEFFICIENT["AVG"] * 10) / 10;
			}

			// 色設定
			idol.style("numeric " + (member_type ? "front" : "back"));
		}
		this.front_offense(Math.ceil(front_offense));
		this.front_defense(Math.ceil(front_defense));
		this.back_offense(Math.ceil(back_offense));
		this.back_defense(Math.ceil(back_defense));

		// スコア計算
		var turn_score: { [index: string]: number; }[] = [];
		var lesson_score: { [index: string]: number; }[] = [];
		for(var key in this.USE_CP_COEFFICIENT) {
			var _turn_score: { [index: string]: number; } = {};
			var _lesson_score: { [index: string]: number; } = {};
			for(var key2 in total_score[key]) {
				var _score: number = Math.ceil(total_score[key][key2]);
				if(_score > 0) {
					_score += this.SCORE_OFFSET;
				}
				_turn_score[key2] = _score;
				_lesson_score[key2] = _score * this.TOTAL_DAMAGE_COEFFICIENT;
			}
			turn_score.push(_turn_score);
			lesson_score.push(_lesson_score);
		}
		this.turn_score(turn_score);
		this.lesson_score(lesson_score);

		return [Math.ceil(total_offense), Math.ceil(total_defense)];
	}

	// 設定取得
	get_setting(): { [index: string]: any; } {
		var setting: { [index: string]: any; } = {};

		// 共通部分のパラメータ取得
		setting["producer_type"] = this.producer_type();
		setting["appeal_bonus"] = this.get_appeal_bonus_setting();
		setting["unit_type"] = this.unit_type();
		setting["training_room_level"] = this.training_room_level();
		setting["fever_bonus"] = this.fever_bonus();
		setting["calc_type"] = this.calc_type();
		setting["skill_input_type"] = this.skill_input_type();
		setting["enable_skill_type"] = this.enable_skill_type();
		setting["rival_member"] = this.get_rival_member_setting();

		// アイドル個別のパラメータ取得
		setting["idol"] = this.get_idol_setting();

		return setting;
	}

	// 設定反映
	set_setting(setting: { [index: string]: any; }) {
		// 共通部分のパラメータ設定
		this.producer_type(setting["producer_type"]);
		this.set_appeal_bonus_setting(setting["appeal_bonus"]);
		this.unit_type(setting["compatibility_type"]);
		this.training_room_level(setting["training_room_level"]);
		this.fever_bonus(setting["fever_bonus"]);
		this.calc_type(setting["calc_type"]);
		this.skill_input_type(setting["skill_input_type"]);
		this.enable_skill_type(setting["enable_skill_type"]);
		this.set_rival_member_setting(setting["rival_member"]);

		// アイドル個別のパラメータ設定
		this.set_idol_setting(setting["idol"], this.max_member_num, false);
	}

	set_idol_setting(settings: { [index: string]: string; }[], max_num: number, use_tour_skill: boolean): JQueryPromise<any> {
		var deferred: JQueryDeferred<any> = jQuery.Deferred();
		var objects: { [key: string]: { [key: string]: string; }; } = {};
		for(var i: number = 0; i < settings.length; i++) {
			var key = "t" + settings[i]["type"] + "_r" + settings[i]["rarity"];
			if (!(key in objects)) {
				objects[key] = { type: settings[i]["type"], rarity: settings[i]["rarity"] };
			}
		}

		var keys: string[] = Object.keys(objects);
		var method_list: any[] = [];
		for(var i: number = 0; i < keys.length; i++) {
			var object: { [key: string]: string; } = objects[keys[i]];
			method_list.push(Common.load_idol_list(parseInt(object["type"]), parseInt(object["rarity"])));
		}

		var self = this;
		jQuery.when.apply(null, method_list).done(function() {
			var idol_list: UserIdol[] = [];
			for(var i: number = 0; i < settings.length && i != max_num; i++) {
				var idol: UserIdol = new UserIdol(use_tour_skill);
				idol.set_setting(settings[i]);
				idol_list.push(idol);
			}
			for(var i: number = idol_list.length; i < max_num; i++) {
				var idol: UserIdol = new UserIdol(use_tour_skill);
				idol_list.push(idol);
			}

			self.idol_list(idol_list);
			deferred.resolve();
		});

		return deferred.promise();
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
			result = true;
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

		idol.offense_skill(offense_skill);
		idol.defense_skill(defense_skill);

		return result;
	}
}

jQuery(function() {
	ko.applyBindings(new ViewModel());
});