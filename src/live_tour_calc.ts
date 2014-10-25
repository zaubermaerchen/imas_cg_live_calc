/*!
 * THE IDOLM@STER CINDERELLA GIRLS Exertion Value Calculator for Live Tour
 * Copyright (c) 2013 Mutsuki Kimuraya (http://www4018uf.sakura.ne.jp/)
 * Released under the MIT license
 * http://opensource.org/licenses/mit-license.php
 */
/// <reference path="live_tour_calc.base.ts" />

class ViewModel extends BaseLiveTourCalcViewModel {
	// 定数
	// セーブデータ関係
	SAVE_DATA_KEY: string = "imas_cg_live_tour_calc";

	// 入力項目
	status_up: KnockoutObservable<any>;
	compatibility_type: KnockoutObservable<any>;
	combo_level: KnockoutObservable<any>;
	fever_bonus: KnockoutObservable<any>;
	cheer_bonus: KnockoutObservable<any>;

	// 全力LIVE時の与ダメージ
	total_full_power_damage_min: KnockoutObservable<number>;
	total_full_power_damage_max: KnockoutObservable<number>;
	total_full_power_damage_avg: KnockoutObservable<number>;
	battle_full_power_damage_min: KnockoutObservable<number>;
	battle_full_power_damage_max: KnockoutObservable<number>;
	battle_full_power_damage_avg: KnockoutObservable<number>;

	constructor() {
		super();

		var self = this;

		// 最大メンバー数
		this.max_member_num = 20;

		this.front_num(10);
		this.voltage_bonus(0);
		this.calc_type(CALCULATION_TYPE.LIVE_TOUR);
		// 入力値
		this.status_up = ko.observable(0);
		this.compatibility_type = ko.observable(-1);
		this.combo_level = ko.observable(0);
		this.fever_bonus = ko.observable(1);
		this.cheer_bonus = ko.observable(0);
		// 全力LIVE時の与ダメージ
		this.total_full_power_damage_min = ko.observable(0);
		this.total_full_power_damage_max = ko.observable(0);
		this.total_full_power_damage_avg = ko.observable(0);
		this.battle_full_power_damage_min = ko.observable(0);
		this.battle_full_power_damage_max = ko.observable(0);
		this.battle_full_power_damage_avg = ko.observable(0);
		// 発揮値
		this.actual_status = ko.computed(function () { return self.calculation(); });

		this.init_list();
	}

	is_live_tour(): boolean { return (parseInt(this.calc_type()) == CALCULATION_TYPE.LIVE_TOUR); }
	is_dream_live_festival(): boolean { return (parseInt(this.calc_type()) == CALCULATION_TYPE.DREAM_LIVE_FESTIVAL); }
	is_talk_battle(): boolean { return (parseInt(this.calc_type()) == CALCULATION_TYPE.TALK_BATTLE); }

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

		var calc_type: number = parseInt(this.calc_type());
		var producer_type: number = parseInt(this.producer_type());
		var voltage_bonus: number = parseInt(this.voltage_bonus());
		var status_up: number = parseInt(this.status_up());
		var compatibility_type: number = parseInt(this.compatibility_type());
		var combo_level: number = parseInt(this.combo_level());
		var training_room_level: number = parseInt(this.training_room_level());
		var fever_bonus: number = parseInt(this.fever_bonus());
		var cheer_bonus: number = parseInt(this.cheer_bonus());
		var front_num: number = parseInt(this.front_num());

		// 総発揮値計算
		var total_offense: number = 0;
		var total_defense: number = 0;
		var front_offense: number = 0;
		var front_defense: number = 0;
		var back_offense: number = 0;
		var back_defense: number = 0;
		var total_damage: { [index: string]: number; } = { min : 0, max : 0, avg : 0 };
		var total_full_power_damage: { [index: string]: number; } = { min : 0, max : 0, avg : 0 };
		for(var i: number = 0; i < this.idol_list().length; i++) {
			var idol: UserIdol = this.idol_list()[i];
			var member_type: boolean = (i < front_num);

			// アイドルごとの発揮値・与ダメージ計算
			var normal_damage: number = 0;
			var full_power_damage: number = 0;
			switch(calc_type) {
				case CALCULATION_TYPE.DREAM_LIVE_FESTIVAL:
					// ドリームLIVEフェス
					idol.calculation_dream_live_festival(member_type, producer_type, this.appeal_bonus(), combo_level, fever_bonus, training_room_level);
					normal_damage  = idol.calc_dream_live_festival_damage(false);
					full_power_damage = idol.calc_dream_live_festival_damage(true);
					break;
				case CALCULATION_TYPE.TALK_BATTLE:
					// トークバトル
					idol.calculation_talk_battle(member_type, producer_type, this.appeal_bonus(), combo_level, cheer_bonus, training_room_level);
					normal_damage  = idol.calc_talk_battle_damage(false);
					full_power_damage = idol.calc_talk_battle_damage(true);
					break;
				default:
					// LIVEツアー
					idol.calculation_live_tour(member_type, producer_type, this.appeal_bonus(), voltage_bonus, status_up, compatibility_type, training_room_level);
					normal_damage  = idol.calc_live_tour_damage(false);
					full_power_damage = idol.calc_live_tour_damage(true);
					break;
			}
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

			total_damage["min"] += Math.ceil(normal_damage * this.DAMAGE_COEFFICIENT["MIN"] * 10) / 10;
			total_damage["max"] += Math.ceil(normal_damage * this.DAMAGE_COEFFICIENT["MAX"] * 10) / 10;
			total_damage["avg"] += Math.ceil(normal_damage * this.DAMAGE_COEFFICIENT["AVG"] * 10) / 10;
			total_full_power_damage["min"] += Math.ceil(full_power_damage * this.DAMAGE_COEFFICIENT["MIN"] * 10) / 10;
			total_full_power_damage["max"] += Math.ceil(full_power_damage * this.DAMAGE_COEFFICIENT["MAX"] * 10) / 10;
			total_full_power_damage["avg"] += Math.ceil(full_power_damage * this.DAMAGE_COEFFICIENT["AVG"] * 10) / 10;

			// 色設定
			idol.style("numeric " + (member_type ? "front" : "back"));
		}
		this.front_offense(Math.ceil(front_offense));
		this.front_defense(Math.ceil(front_defense));
		this.back_offense(Math.ceil(back_offense));
		this.back_defense(Math.ceil(back_defense));

		// 通常LIVE時の与ダメージ計算
		this.total_damage_min(Math.ceil(total_damage["min"]));
		this.total_damage_max(Math.ceil(total_damage["max"]));
		this.total_damage_avg(Math.ceil(total_damage["avg"]));
		this.battle_damage_min(this.total_damage_min() * this.TOTAL_DAMAGE_COEFFICIENT);
		this.battle_damage_max(this.total_damage_max() * this.TOTAL_DAMAGE_COEFFICIENT);
		this.battle_damage_avg(this.total_damage_avg() * this.TOTAL_DAMAGE_COEFFICIENT);

		// 全力LIVE時の与ダメージ計算
		this.total_full_power_damage_min(Math.ceil(total_full_power_damage["min"]));
		this.total_full_power_damage_max(Math.ceil(total_full_power_damage["max"]));
		this.total_full_power_damage_avg(Math.ceil(total_full_power_damage["avg"]));
		this.battle_full_power_damage_min(this.total_full_power_damage_min() * this.TOTAL_DAMAGE_COEFFICIENT);
		this.battle_full_power_damage_max(this.total_full_power_damage_max() * this.TOTAL_DAMAGE_COEFFICIENT);
		this.battle_full_power_damage_avg(this.total_full_power_damage_avg() * this.TOTAL_DAMAGE_COEFFICIENT);

		return [Math.ceil(total_offense), Math.ceil(total_defense)];
	}

	// 設定取得
	get_setting(): { [index: string]: any; } {
		var setting: { [index: string]: any; } = {};

		// 共通部分のパラメータ取得
		setting["producer_type"] = this.producer_type();
		setting["voltage_bonus"] = this.voltage_bonus();
		setting["status_up"] = this.status_up();
		setting["appeal_bonus"] = this.get_appeal_bonus_setting();
		setting["compatibility_type"] = this.compatibility_type();
		setting["combo_level"] = this.combo_level();
		setting["training_room_level"] = this.training_room_level();
		setting["fever_bonus"] = this.fever_bonus();
		setting["cheer_bonus"] = this.cheer_bonus();
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
		if(setting["voltage_bonus"]) {
			this.voltage_bonus(setting["voltage_bonus"]);
		}
		this.status_up(setting["status_up"]);
		this.set_appeal_bonus_setting(setting["appeal_bonus"]);
		this.compatibility_type(setting["compatibility_type"]);
		this.combo_level(setting["combo_level"]);
		this.training_room_level(setting["training_room_level"]);
		this.fever_bonus(setting["fever_bonus"]);
		if(setting["cheer_bonus"]) {
			this.cheer_bonus(setting["cheer_bonus"]);
		}
		this.calc_type(setting["calc_type"]);
		this.skill_input_type(setting["skill_input_type"]);
		this.enable_skill_type(setting["enable_skill_type"]);
		this.set_rival_member_setting(setting["rival_member"]);

		// アイドル個別のパラメータ設定
		this.set_idol_setting(setting["idol"]);
	}

	set_idol_setting(settings: { [index: string]: string; }[]): JQueryPromise<any> {
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
			for(var i: number = 0; i < settings.length && i != this.max_member_num; i++) {
				var idol: UserIdol = new UserIdol(false);
				idol.set_setting(settings[i]);
				idol_list.push(idol);
			}
			for(var i: number = idol_list.length; i < this.max_member_num; i++) {
				var idol: UserIdol = new UserIdol(false);
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
		console.log("rerer" + rival_member_num[0][0]);
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
						if(!this.is_dream_live_festival()) {
							this.apply_skill_effect(idol, skill, skill_count);
						}
					} else {
						// 対象範囲チェック
						enable = this.check_skill_target(target_member, target_type, member_num);
					}
				}
			} else {
				// 相手
				// 有効スキルかチェック
				if(enable_skill_type == ENABLE_SKILL_TYPE.ALL || (enable_skill_type ^ target_param) > 0) {
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

		if(this.is_talk_battle()) {
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
		} else {
			switch (target_param) {
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
		}

		idol.offense_skill(offense_skill);
		idol.defense_skill(defense_skill);

		return result;
	}
}

jQuery(function() {
	ko.applyBindings(new ViewModel());
});