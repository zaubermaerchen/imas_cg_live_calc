/*!
 * Copyright (c) 2012 Mutsuki Kimuraya (http://www4018uf.sakura.ne.jp/)
 * Released under the MIT license
 * http://opensource.org/licenses/mit-license.php
 */
/// <reference path="typings/knockout/knockout.d.ts" />
/// <reference path="common.ts" />

class UserIdol {
	// 定数
	TRAINER_COST: number = 999;
	// 属性一致ボーナス係数
	PRODUCER_TYPE_COEFFICIENT: number = 0.05;
	// 施設ボーナス係数
	INSTITUTION_COEFFICIENT: number =  0.05;
	// バックメンバー係数
	BACK_MEMBER_COEFFICIENT: number = 0.8;
	// 相性ボーナス係数
	COMPATIBILITY_BONUS_COEFFICIENT: number = 0.2;
	// LIVEツアー係数
	LIVE_TOUR_NORMAL_LIVE_COEFFICIENT: number = 0.5;	// 通常LIVE時
	LIVE_TOUR_FULL_POWER_LIVE_COEFFICIENT: number = 2;	// 全力LIVE時
	// ドリームLIVEフェス
	DREAM_LIVE_FESTIVAL_NORMAL_LIVE_COEFFICIENT: number = 0.5;		// 通常LIVE時
	DREAM_LIVE_FESTIVAL_FULL_POWER_LIVE_COEFFICIENT: number = 2.5;	// 全力LIVE時
	DREAM_LIVE_FESTIVAL_COMBO_LEVEL_COEFFICIENT: number = 125;		// コンボLV係数
	// トークバトル
	TALK_BATTLE_FULL_POWER_LIVE_COEFFICIENT: number = 5;		// 全力LIVE時
	TALK_BATTLE_COMBO_LEVEL_COEFFICIENT: number = 50;           // コンボLV係数

	// ステータス
	id: KnockoutObservable<any>;
	type: KnockoutObservable<any>;
	rarity: KnockoutObservable<any>;
	cost: KnockoutObservable<any>;
	offense: KnockoutObservable<any>;
	defense: KnockoutObservable<any>;
	event_power: KnockoutObservable<any>;

	// スキル
	offense_skill: KnockoutObservable<any>;
	defense_skill: KnockoutObservable<any>;
	skill_id: KnockoutObservable<any>;
	skill_level: KnockoutObservable<any>;
	skill_name: KnockoutObservable<string>;
	is_festival: KnockoutObservable<boolean>;
	is_survival: KnockoutObservable<boolean>;
	use_tour_skill: KnockoutObservable<boolean>;
	enable_skill: KnockoutObservable<boolean>;

	// 発揮値
	actual_offense: KnockoutObservable<number>;
	actual_defense: KnockoutObservable<number>;
	display_offense: KnockoutComputed<number>;
	display_defense: KnockoutComputed<number>;
	style: KnockoutObservable<string>;

	// コスト比
	offense_per_cost: KnockoutComputed<any>;
	defense_per_cost: KnockoutComputed<any>;
	status_per_cost: KnockoutComputed<any>;

	// アイドル選択リスト
	idol_data_list: KnockoutObservableArray<any>;
	select_idol_list: KnockoutComputed<any>;

	// スキル選択リスト
	skill_data_list: KnockoutObservableArray<any>;
	select_skill_list: KnockoutComputed<any>;

	constructor(use_tour_skill: boolean) {
		var self = this;

		// ステータス
		this.id = ko.observable(0);
		this.type = ko.observable(0);
		this.rarity = ko.observable(0);
		this.cost = ko.observable(0);
		this.offense = ko.observable(0);
		this.defense = ko.observable(0);
		this.event_power = ko.observable(1);

		// スキル
		this.offense_skill = ko.observable(0);
		this.defense_skill = ko.observable(0);
		this.skill_id = ko.observable(0);
		this.skill_level = ko.observable(10);
		this.skill_name = ko.observable("無し");
		this.is_festival = ko.observable(false);
		this.is_survival = ko.observable(false);
		this.use_tour_skill = ko.observable(use_tour_skill);
		this.enable_skill = ko.observable(false);

		// 発揮値
		this.actual_offense = ko.observable(0);
		this.actual_defense = ko.observable(0);
		this.display_offense = ko.computed(function () { return Math.ceil(self.actual_offense()); });
		this.display_defense = ko.computed(function () { return Math.ceil(self.actual_defense()); });
		this.style = ko.observable("numeric");

		// コスト比
		this.offense_per_cost = ko.computed(function () { return self.calc_cost_ratio(self.offense()); });
		this.defense_per_cost = ko.computed(function () { return self.calc_cost_ratio(self.defense()); });
		this.status_per_cost = ko.computed(function () { return self.calc_cost_ratio(self.status()); });

		// アイドル選択リスト
		this.idol_data_list = ko.observableArray();
		this.select_idol_list = ko.computed(function () { return self.idol_data_list(); });

		// スキル選択リスト
		this.skill_data_list = ko.observableArray();
		this.select_skill_list = ko.computed(function () { return self.skill_data_list(); });

		this.set_idol_list();
		this.set_skill_list();
	}

	// 総ステータス取得
	status(): number { return parseInt(this.offense()) + parseInt(this.defense()); }

	// 実コスト取得
	get_cost(): number {
		var cost: number = parseInt(this.cost());
		if(this.is_festival() && cost == this.TRAINER_COST) {
			cost = 5;
		}

		return cost;
	}

	// コスト比計算
	calc_cost_ratio(status: number): number {
		// コスト取得
		var cost: number = parseInt(this.cost());
		var ratio: number = 0;
		if(cost > 0) {
			ratio = Math.round(status / cost * 100) / 100;
		}
		return ratio;
	}

	// コストオーバー時のステータス補正
	get_cost_corrected_status(status: number, cost: number, rest_cost: number): number {
		if(cost > rest_cost) {
			var ratio: number = rest_cost / cost;
			/*
			if(this.is_festival() || this.is_survival()) {
				status = Math.ceil(status * ratio);
			} else {
				ratio = Math.ceil(ratio * 10) / 10;
				//status = Math.round(status * ratio);
				status = Math.ceil(status * ratio);
			}
			*/
			ratio = Math.ceil(ratio * 10) / 10;
			status = Math.ceil(status * ratio);
		}

		return status;
	}

	// アイドルリスト設定
	set_idol_list(): JQueryPromise<any> {
		var self = this;
		var deferred: JQueryDeferred<any> = jQuery.Deferred();
		var type: number = self.type();
		var rarity: number = self.rarity();
		jQuery.when(self.load_idol_list(type, rarity)).done(function(list: { [index: string]: { [index: string]: any; } }) {
			self.set_select_idol_list(list);

			self.id(0);
			self.cost(0);
			self.offense(0);
			self.defense(0);
			self.offense_skill(0);
			self.defense_skill(0);
			self.skill_level(10);
			self.set_skill_info(null);

			deferred.resolve();
		});

		return deferred.promise();
	}

	set_select_idol_list(list: { [index: string]: { [index: string]: any; } }): void {
		var idol_list: { [index: string]: any; }[] = [];

		idol_list.push({ "id": 0, "name": "-"});

		for(var key in list) {
			if (list.hasOwnProperty(key)) {
				var data: { [index: string]: any; } = list[key];

				idol_list.push({ "id": data["idol_id"], "name": data["name"]});
			}
		}

		this.idol_data_list(idol_list);
	}

	// スキルリスト設定
	set_skill_list(): JQueryPromise<any> {
		var self = this;
		var deferred: JQueryDeferred<any> = jQuery.Deferred();
		jQuery.when(Common.load_skill_list()).done(function(list: { [index: string]: { [index: string]: any; } }) {
			var skill_list: { [index: string]: any; }[] = [];

			skill_list.push({ "id": 0, "name": "-"});

			for(var key in list) {
				if (list.hasOwnProperty(key)) {
					var data: { [index: string]: any; } = list[key];

					skill_list.push({ "id": data["skill_id"], "name": data["comment"] });
				}
			}

			self.skill_data_list(skill_list);

			deferred.resolve();
		});

		return deferred.promise();
	}

	// アイドル選択時
	change_idol(): void {
		var self = this;
		var type: number = parseInt(self.type());
		var rarity: number = parseInt(self.rarity());
		var id: number = parseInt(self.id());
		self.offense_skill(0);
		self.defense_skill(0);
		if(id != 0) {
			jQuery.when(self.load_idol_list(type, rarity)).done(function(idol_list: { [index: string]: { [index: string]: any; } }) {
				var idol_data: { [index: string]: any; } = idol_list[id];

				// ステータス設定
				self.cost(idol_data["cost"]);
				self.offense(idol_data["max_offense"]);
				self.defense(idol_data["max_defense"]);
				self.set_skill_info(idol_data);
			});
		} else {
			self.cost(0);
			self.offense(0);
			self.defense(0);
			self.set_skill_info(null);
		}
	}

	// スキル情報設定
	set_skill_info(data: { [index: string]: any; }): void {
		var skill_id: number = 0;
		var skill_name: string = "無し";

		if(data != null) {
			skill_id = parseInt(data["skill_id"]);
			if(this.use_tour_skill()) {
				skill_id = parseInt(data["live_tour_skill_id"]);
			}
			if(data["skill_name"] != undefined && data["skill_name"] != "") {
				skill_name = data["skill_name"];
			}
		}
		this.skill_name(skill_name);
		this.skill_id(skill_id);
	}

	// 設定取得
	get_setting(): { [index: string]: any; } {
		var setting: { [index: string]: any; } = {};
		setting["type"] = this.type();
		setting["rarity"] = this.rarity();
		setting["id"] = this.id();
		setting["cost"] = this.cost();
		setting["offense"] = this.offense();
		setting["defense"] = this.defense();
		setting["event_power"] = this.event_power();
		setting["offense_skill"] = this.offense_skill();
		setting["defense_skill"] = this.defense_skill();
		setting["skill_id"] = this.skill_id();
		setting["skill_level"] = this.skill_level();

		return setting;
	}

	// 設定反映
	set_setting(setting: { [index: string]: any; }): void {
		var self = this;

		self.type(setting["type"]);
		self.rarity(setting["rarity"]);
		jQuery.when(self.load_idol_list(parseInt(setting["type"]), parseInt(setting["rarity"]))).done(function(idol_list: { [index: string]: { [index: string]: any; } }) {
			self.set_select_idol_list(idol_list);

			self.id(setting["id"]);
			if(setting["cost"] != null) {
				self.cost(setting["cost"]);
			}
			self.offense(setting["offense"]);
			self.defense(setting["defense"]);
			self.event_power(setting["event_power"]);
			self.offense_skill(setting["offense_skill"]);
			self.defense_skill(setting["defense_skill"]);
			self.set_skill_setting(idol_list[setting["id"]], setting["skill_id"], setting["skill_level"]);
		});
	}

	set_skill_setting(idol_data: { [index: string]: any; }, skill_id: any, skill_level: any): void {
		this.set_skill_info(idol_data);
		this.skill_level(skill_level);

		var self = this;
		jQuery.when(Common.load_skill_list()).done(function(skill_list: { [index: string]: { [index: string]: any; } }) {
			if (skill_list.hasOwnProperty(skill_id)) {
				self.skill_id(skill_id);
			}
		});
	}

	// プロデューサー+アピールボーナスの補正値取得
	get_type_ratio(producer_type: number, appeal_bonus_list: any[]): number {
		var type: number = parseInt(this.type());
		var ratio: number = 0;
		if(type == producer_type) {
			ratio += this.PRODUCER_TYPE_COEFFICIENT;
		} else {
			// プロデューサーとタイプが不一致の場合のみアピールボーナス補正値取得
			ratio += (parseInt(appeal_bonus_list[type]) / 100);
		}

		return ratio;
	}

	load_idol_list(type: number, rarity: number): JQueryPromise<any> {
		var fields: string[] = ["type", "rarity", "name", "cost", "max_offense", "max_defense", "skill_name", "skill_id", "live_tour_skill_id"];
		var deferred: JQueryDeferred<any> = jQuery.Deferred();
		jQuery.when(Common.load_idol_list(type, rarity, fields)).done(function(response: { [index: string]: { [index: string]: any; } }) {
			deferred.resolve(response);
		});

		return deferred.promise();
	}

	/******************************************************************************/
	// 通常・フェスティバル
	/******************************************************************************/
	// 攻発揮値計算
	calculation(cost_cut: boolean, rest_cost: number, member_type: boolean, producer_type: number, appeal_bonus_list: any[], institution_list: any[], status_up: number, training_room_level: number, high_tension: boolean): void {
		var actual_offense: number = 0;
		var actual_defense: number = 0;
		if(!cost_cut || rest_cost >= 1) {
			var offense: number = parseInt(this.offense());
			var defense: number = parseInt(this.defense());
			var offense_skill: number = parseFloat(this.offense_skill());
			var defense_skill: number = parseFloat(this.defense_skill());
			if(member_type) {
				// フロント
				actual_offense = this.calc_front_status(offense, offense_skill, cost_cut, rest_cost, producer_type, appeal_bonus_list, institution_list, status_up, training_room_level, high_tension);
				actual_defense = this.calc_front_status(defense, defense_skill, cost_cut, rest_cost, producer_type, appeal_bonus_list, institution_list, status_up, training_room_level, high_tension);
			} else {
				// バック
				actual_offense = this.calc_back_status(offense, offense_skill, cost_cut, rest_cost);
				actual_defense = this.calc_back_status(defense, defense_skill, cost_cut, rest_cost);
			}
		}
		this.actual_offense(actual_offense);
		this.actual_defense(actual_defense);
	}

	calculation_festivalS(cost_cut: boolean, rest_cost: number, member_type: boolean, producer_type: number, appeal_bonus_list: any[], institution_list: any[], status_up: number, training_room_level: number, high_tension: boolean, groove_type: number): void {
		var offense: number = parseInt(this.offense());
		var defense: number = parseInt(this.defense());
		var offense_skill: number = parseFloat(this.offense_skill());
		var defense_skill: number = parseFloat(this.defense_skill());
		var actual_offense: number = 0;
		var actual_defense: number = 0;
		if(member_type) {
			// フロント
			actual_offense = this.calc_festivalS_front_status(offense, offense_skill, cost_cut, rest_cost, producer_type, appeal_bonus_list, institution_list, status_up, training_room_level, high_tension, groove_type);
			actual_defense = this.calc_festivalS_front_status(defense, defense_skill, cost_cut, rest_cost, producer_type, appeal_bonus_list, institution_list, status_up, training_room_level, high_tension, -1);
		} else {
			// バック
			actual_offense = this.calc_back_status(offense, offense_skill, cost_cut, rest_cost);
			actual_defense = this.calc_back_status(defense, defense_skill, cost_cut, rest_cost);
		}
		this.actual_offense(actual_offense);
		this.actual_defense(actual_defense);
	}

	// フロントメンバー発揮値計算
	calc_front_status(status: number, skill: number, cost_cut: boolean, rest_cost: number, producer_type: number, appeal_bonus_list: any[], institution_list: any[], status_up: number, training_room_level: number, high_tension: boolean): number {
		// コスト補正
		if(cost_cut) {
			status = this.get_cost_corrected_status(status, this.get_cost(), rest_cost);
		}

		// 施設補正
		var type = parseInt(this.type());
		for(var i = 0; i < institution_list.length; i++) {
			if(type == institution_list[i]) {
				status = Math.ceil(status * (1 + this.INSTITUTION_COEFFICIENT));
				break;
			}
		}

		// ボーナス補正計算
		var ratio = 1 + this.get_type_ratio(producer_type, appeal_bonus_list) + (status_up + skill) / 100;
		if(this.is_festival()) {
			ratio += training_room_level / 100;
			if(high_tension) {
				ratio += 0.1;
			}
		}
		status = Math.ceil(status * ratio);

		return status;
	}

	// バックメンバー発揮値計算
	calc_back_status(status: number, skill: number, cost_cut: boolean, rest_cost: number): number {
		// コスト値修正
		var cost: number = this.get_cost();

		// バックメンバー補正
		var base_status: number = Math.ceil(status * this.BACK_MEMBER_COEFFICIENT);
		var actual_status: number = base_status;

		// コスト補正
		if(cost_cut) {
			actual_status = this.get_cost_corrected_status(actual_status, cost, rest_cost);
		}

		// スキル補正計算
		if(!this.is_festival() || (!cost_cut || rest_cost >= cost)) {
			var ratio: number = (skill) / 100;
			actual_status = Math.floor(actual_status) + Math.ceil(base_status * ratio * 10) / 10;
			//actual_status = Math.floor(actual_status) + Math.round(base_status * ratio);
		}

		return actual_status;
	}

	// フェスフロントメンバー発揮値計算
	calc_festivalS_front_status(status: number, skill: number, cost_cut: boolean, rest_cost: number, producer_type: number, appeal_bonus_list: any[], institution_list: any[], status_up: number, training_room_level: number, high_tension: boolean , groove_type: number): number {
		// コスト補正
		if(cost_cut) {
			status = this.get_cost_corrected_status(status, this.get_cost(), rest_cost);
		}

		// 施設補正
		var type = parseInt(this.type());
		for(var i = 0; i < institution_list.length; i++) {
			if(type == institution_list[i]) {
				status = Math.ceil(status * (1 + this.INSTITUTION_COEFFICIENT));
				break;
			}
		}

		// ボーナス補正計算
		var ratio = 1 + this.get_type_ratio(producer_type, appeal_bonus_list) + (skill + training_room_level) / 100;
		status = Math.ceil(status * ratio);

		// コンボボーナス・
		ratio = 1 + status_up /100;
		status = status * ratio;

		// グルーヴボーナス
		ratio = 1;
		if(type == groove_type) {
			ratio += 0.2;
		}
		status = Math.round(status * ratio);

		// ハイテンションボーナス
		ratio = 1;
		if(high_tension) {
			ratio += 0.1;
		}
		//status = Math.floor(status * ratio);
		status = Math.round(status * ratio);


		return status;
	}

	/******************************************************************************/
	// アイドルサバイバル
	/******************************************************************************/
	// 発揮値計算
	calculation_survival(cost_cut: boolean, rest_cost: number): void {
		this.is_survival(true);

		// サバイバルパワー補正
		var status: number = Math.floor(parseInt(this.offense()) * parseFloat(this.event_power()));

		// コスト補正
		if(cost_cut) {
			status = this.get_cost_corrected_status(status, this.get_cost(), rest_cost);
		}

		this.actual_offense(status);
	}

	/******************************************************************************/
	// LIVEツアー
	/******************************************************************************/
	calculation_live_tour(member_type: boolean, producer_type: number, appeal_bonus_list: any[], voltage_bonus: number, status_up: number, compatibility_type: number, training_room_level: number): void {
		var offense: number = parseInt(this.offense());
		var defense: number = parseInt(this.defense());
		var offense_skill: number = parseFloat(this.offense_skill());
		var defense_skill: number = parseFloat(this.defense_skill());
		var actual_offense: number = 0;
		var actual_defense: number = 0;
		if(member_type) {
			// フロント
			actual_offense = this.calc_live_tour_front_status(offense, offense_skill, producer_type, appeal_bonus_list, voltage_bonus, status_up, compatibility_type, training_room_level);
			actual_defense = this.calc_live_tour_front_status(defense , defense_skill, producer_type, appeal_bonus_list, voltage_bonus, status_up, compatibility_type, training_room_level);
		} else {
			// バック
			actual_offense = this.calc_live_tour_back_status(offense, offense_skill, voltage_bonus);
			actual_defense = this.calc_live_tour_back_status(defense , defense_skill, voltage_bonus);
		}
		this.actual_offense(actual_offense);
		this.actual_defense(actual_defense);
	}

	// 発揮値計算
	calc_live_tour_status(status: number, skill: number, producer_type: number, appeal_bonus_list: any[], status_up: number, compatibility_type: number): number {
		// スターダムパワー補正
		var actual_status: number = Math.floor(status * parseFloat(this.event_power()));

		// プロデューサー+アピールボーナス+スキル補正計算
		var ratio: number = 1 + this.get_type_ratio(producer_type, appeal_bonus_list) + skill / 100;
		actual_status = Math.ceil(actual_status * ratio);

		// コンボボーナス
		ratio = 1;
		ratio += (status_up) / 100;
		actual_status = Math.ceil(actual_status * ratio);

		// 相性ボーナス
		ratio = 1;
		if(parseInt(this.type()) == compatibility_type) {
			ratio += this.COMPATIBILITY_BONUS_COEFFICIENT;
		}
		actual_status = actual_status * ratio;

		return actual_status;
	}

	calc_live_tour_front_status(status: number, skill: number, producer_type: number, appeal_bonus_list: any[], voltage_bonus: number, status_up: number, compatibility_type: number, training_room_level: number): number {
		// スターダムパワー補正
		var actual_status: number = Math.floor(status * parseFloat(this.event_power()));

		// ボーナス補正計算
		var ratio = 1 + this.get_type_ratio(producer_type, appeal_bonus_list) + (skill + training_room_level) / 100;
		actual_status = Math.ceil(actual_status * ratio);

		// ボルテージボーナス
		ratio = 1 + voltage_bonus / 100;
		actual_status = Math.ceil(actual_status * ratio);

		// コンボボーナス
		ratio = 1 + status_up / 100;
		actual_status = Math.ceil(actual_status * ratio);

		// 相性ボーナス
		ratio = 1;
		if(parseInt(this.type()) == compatibility_type) {
			ratio += this.COMPATIBILITY_BONUS_COEFFICIENT;
		}
		actual_status = actual_status * ratio;

		return actual_status;
	}

	calc_live_tour_back_status(status: number, skill: number, voltage_bonus: number): number {
		// スターダムパワー補正
		var actual_status: number = Math.floor(status * parseFloat(this.event_power()));

		// バックメンバー補正
		actual_status = Math.ceil(actual_status * this.BACK_MEMBER_COEFFICIENT);

		// スキル・ボルテージボーナス補正計算
		var ratio = 1 + (skill + voltage_bonus) / 100;
		actual_status = Math.ceil(actual_status * ratio);

		return actual_status;
	}

	// ダメージ計算
	calc_live_tour_damage(full_power: boolean): number {
		var damage: number = Math.floor(this.actual_offense());

		if(full_power) {
			// フルパワー
			damage = damage * this.LIVE_TOUR_FULL_POWER_LIVE_COEFFICIENT;
		} else {
			// LP1
			damage = damage * this.LIVE_TOUR_NORMAL_LIVE_COEFFICIENT;
		}

		damage = damage/ 5;

		return damage;
	}

	/******************************************************************************/
	// ドリームLIVEフェス
	/******************************************************************************/
	calculation_dream_live_festival(member_type: boolean, producer_type: number, appeal_bonus_list: any[], combo_level: number, fever_bonus: number, training_room_level: number): void {
		var offense: number = parseInt(this.offense());
		var defense: number = parseInt(this.defense());
		var offense_skill: number = parseFloat(this.offense_skill());
		var defense_skill: number = parseFloat(this.defense_skill());
		var actual_offense: number = 0;
		var actual_defense: number = 0;
		if(member_type) {
			// フロント
			actual_offense = this.calc_dream_live_festival_front_status(offense, offense_skill, producer_type, appeal_bonus_list, combo_level, fever_bonus, training_room_level);
			actual_defense = this.calc_dream_live_festival_front_status(defense , defense_skill, producer_type, appeal_bonus_list, combo_level, fever_bonus, training_room_level);
		} else {
			// バック
			actual_offense = this.calc_dream_live_festival_back_status(offense, offense_skill, fever_bonus);
			actual_defense = this.calc_dream_live_festival_back_status(defense , defense_skill, fever_bonus);
		}
		this.actual_offense(actual_offense);
		this.actual_defense(actual_defense);
	}

	calc_dream_live_festival_front_status(status: number, skill: number, producer_type: number, appeal_bonus_list: any[], combo_level: number, fever_bonus: number, training_room_level: number): number {
		// スターダムパワー補正
		var actual_status: number = Math.floor(status * parseFloat(this.event_power()));

		// フィーバー補正
		var ratio: number = 1 + fever_bonus / 100;
		actual_status = Math.floor(actual_status * ratio);

		// ボーナス補正計算
		ratio = 1 + this.get_type_ratio(producer_type, appeal_bonus_list) + (skill + training_room_level) / 100;
		actual_status = Math.ceil(actual_status * ratio);

		// コンボボーナス
		ratio = 1;
		ratio += (Math.sqrt(this.DREAM_LIVE_FESTIVAL_COMBO_LEVEL_COEFFICIENT * combo_level)) / 100;
		actual_status = Math.ceil(actual_status * ratio);

		return actual_status;
	}

	calc_dream_live_festival_back_status(status: number, skill: number, fever_bonus: number): number {
		// スターダムパワー補正
		var actual_status: number = Math.floor(status * parseFloat(this.event_power()));

		// バックメンバー補正
		actual_status = Math.ceil(actual_status * this.BACK_MEMBER_COEFFICIENT);

		// フィーバー補正
		var ratio: number = 1 + fever_bonus / 100;
		actual_status = Math.floor(actual_status * ratio);

		// スキルボーナス補正計算
		ratio = 1 + (skill) / 100;
		actual_status = Math.ceil(actual_status * ratio);

		return actual_status;
	}

	// 与ダメージ計算
	calc_dream_live_festival_damage(full_power: boolean): number {
		var damage: number = Math.floor(this.actual_offense());

		if(full_power) {
			// フルパワー
			damage = damage * this.DREAM_LIVE_FESTIVAL_FULL_POWER_LIVE_COEFFICIENT;
		} else {
			// LP1
			damage = damage * this.DREAM_LIVE_FESTIVAL_NORMAL_LIVE_COEFFICIENT;
		}

		damage = damage / 5;

		return damage;
	}

	/******************************************************************************/
	// LIVEロワイヤル
	/******************************************************************************/
	calculation_live_royal(member_type: boolean, enable_royal_power: boolean, producer_type: number, appeal_bonus_list: any[], voltage_bonus: number, battle_point_rate: number, training_room_level: number): void {
		// 位置補正
		var offense: number = parseInt(this.offense());
		var defense: number = parseInt(this.defense());
		var offense_skill: number = parseFloat(this.offense_skill());
		var defense_skill: number = parseFloat(this.defense_skill());
		var actual_offense: number = 0;
		var actual_defense: number = 0;
		if(member_type) {
			// フロント
			actual_offense = this.calc_live_royal_front_status(offense, offense_skill, enable_royal_power, producer_type, appeal_bonus_list, voltage_bonus, battle_point_rate, training_room_level);
			actual_defense = this.calc_live_royal_front_status(defense, defense_skill, enable_royal_power, producer_type, appeal_bonus_list, voltage_bonus, battle_point_rate, training_room_level);
		} else {
			// バック
			actual_offense = this.calc_live_royal_back_status(offense, offense_skill, enable_royal_power, voltage_bonus, battle_point_rate);
			actual_defense = this.calc_live_royal_back_status(defense, defense_skill, enable_royal_power, voltage_bonus, battle_point_rate);
		}

		this.actual_offense(actual_offense);
		this.actual_defense(actual_defense);
	}

	// フロントメンバー発揮値計算
	calc_live_royal_front_status(status: number, skill: number, enable_royal_power: boolean, producer_type: number, appeal_bonus_list: any[], voltage_bonus: number, battle_point_rate: number, training_room_level: number): number {
		// ロワイヤルパワー補正
		var event_power: number = 1;
		if(enable_royal_power) {
			event_power = parseFloat(this.event_power());
		}
		var actual_status: number = Math.ceil(status * event_power);

		// ボルテージボーナス
		actual_status = actual_status * voltage_bonus;

		// BP補正
		actual_status = actual_status * battle_point_rate;

		// ボーナス補正計算
		var ratio: number = 1 + this.get_type_ratio(producer_type, appeal_bonus_list) + (skill + training_room_level)  / 100;
		actual_status = actual_status * ratio;

		actual_status = Math.round(actual_status * 10) / 10;
		return Math.ceil(actual_status);
	}

	// バックメンバー発揮値計算
	calc_live_royal_back_status(status: number, skill: number, enable_royal_power: boolean, voltage_bonus: number, battle_point_rate: number): number {
		// ロワイヤルパワー補正
		var event_power: number = 1;
		if(enable_royal_power) {
			event_power = parseFloat(this.event_power());
		}
		var actual_status: number = Math.ceil(status * event_power);

		// バックメンバー補正
		actual_status = Math.ceil(actual_status * this.BACK_MEMBER_COEFFICIENT);

		// ボルテージボーナス
		actual_status = actual_status * voltage_bonus;

		// BP補正
		actual_status = actual_status * battle_point_rate;

		// スキル補正
		var ratio: number = 1 + skill / 100;
		actual_status = actual_status * ratio;

		actual_status = Math.round(actual_status * 10) / 10;
		return Math.ceil(actual_status);
	}

	// ダメージ計算
	calc_live_royal_damage(): number {
		return Math.floor(this.actual_offense()) / 5;
	}

	/******************************************************************************/
	// LIVEトライアル
	/******************************************************************************/
	calculation_live_trial(cost_cut: boolean, rest_cost: number, member_type: boolean, producer_type: number): void {
		// 位置補正
		var offense: number = parseInt(this.offense());
		var defense: number = parseInt(this.defense());
		var offense_skill: number = parseFloat(this.offense_skill());
		var defense_skill: number = parseFloat(this.defense_skill());
		var actual_offense: number = 0;
		var actual_defense: number = 0;
		if(member_type) {
			// フロント
			actual_offense = this.calc_live_trial_front_status(offense, offense_skill, cost_cut, rest_cost, producer_type);
			actual_defense = this.calc_live_trial_front_status(defense, defense_skill, cost_cut, rest_cost, producer_type);
		} else {
			// バック
			actual_offense = this.calc_live_trial_back_status(offense, offense_skill, cost_cut, rest_cost);
			actual_defense = this.calc_live_trial_back_status(defense, defense_skill, cost_cut, rest_cost);
		}

		this.actual_offense(actual_offense);
		this.actual_defense(actual_defense);
	}

	// フロントメンバー発揮値計算
	calc_live_trial_front_status(status: number, skill: number, cost_cut: boolean, rest_cost: number, producer_type: number): number {
		// コスト値修正
		var cost = this.get_cost();

		// コスト補正
		if(cost_cut) {
			status = this.get_cost_corrected_status(status, cost, rest_cost);
		}

		// プロデューサー+スキル補正計算
		var ratio: number = 1;
		if(parseInt(this.type()) == producer_type) {
			ratio += this.PRODUCER_TYPE_COEFFICIENT;
		}
		ratio += (skill) / 100;
		status = Math.ceil(status * ratio);

		return status;
	}

	// バックメンバー発揮値計算
	calc_live_trial_back_status(status: number, skill: number, cost_cut: boolean, rest_cost: number): number {
		// コスト値修正
		var cost: number = this.get_cost();

		// バックメンバー補正
		var base_status: number = Math.floor(status * this.BACK_MEMBER_COEFFICIENT);
		var calc_status: number = base_status;

		// コスト補正
		if(cost_cut) {
			calc_status = this.get_cost_corrected_status(calc_status, cost, rest_cost);
			if(cost > rest_cost) {
				calc_status = calc_status * this.BACK_MEMBER_COEFFICIENT;
			}
		}

		// スキル補正計算
		if(!cost_cut || rest_cost >= cost) {
			var ratio: number = (skill) / 100;
			calc_status = Math.floor(calc_status) + Math.ceil(base_status * ratio * 10) / 10;
		}

		return Math.floor(calc_status);
	}

	/******************************************************************************/
	// トークバトル
	/******************************************************************************/
	calculation_talk_battle(member_type: boolean, producer_type: number, appeal_bonus_list: any[], combo_level: number, cheer_bonus: number, training_room_level: number): void {
		var offense: number = parseInt(this.offense());
		var defense: number = parseInt(this.defense());
		var offense_skill: number = parseFloat(this.offense_skill());
		var defense_skill: number = parseFloat(this.defense_skill());
		var actual_offense: number = 0;
		var actual_defense: number = 0;
		if(member_type) {
			// フロント
			actual_offense = this.calc_talk_battle_front_status(offense, offense_skill, producer_type, appeal_bonus_list, combo_level, cheer_bonus, training_room_level);
			actual_defense = this.calc_talk_battle_front_status(defense , defense_skill, producer_type, appeal_bonus_list, combo_level, cheer_bonus, training_room_level);
		} else {
			// バック
			actual_offense = this.calc_talk_battle_back_status(offense, offense_skill, combo_level, cheer_bonus);
			actual_defense = this.calc_talk_battle_back_status(defense , defense_skill, combo_level, cheer_bonus);
		}
		this.actual_offense(actual_offense);
		this.actual_defense(actual_defense);
	}

	calc_talk_battle_front_status(status: number, skill: number, producer_type: number, appeal_bonus_list: any[], combo_level: number, cheer_bonus: number, training_room_level: number): number {
		// トークパワー補正
		var actual_status: number = Math.floor(status * parseFloat(this.event_power()));

		// プロデューサー+アピールボーナス計算
		var ratio: number = 1 + this.get_type_ratio(producer_type, appeal_bonus_list);
		actual_status = Math.ceil(actual_status * ratio);

		// スキル補正計算
		ratio = 1 + skill / 100;
		actual_status = Math.round(actual_status * ratio);

		// トレーニングルーム
		ratio = 1 + training_room_level / 100;
		actual_status = Math.round(actual_status * ratio);

		// コンボボーナス
		ratio = 1 + (Math.sqrt(this.TALK_BATTLE_COMBO_LEVEL_COEFFICIENT * combo_level)) / 100;
		actual_status = Math.round(actual_status * ratio);

		// 応援ボーナス
		ratio = 1 + cheer_bonus / 100;
		actual_status = Math.ceil(actual_status * ratio);

		return actual_status;
	}

	calc_talk_battle_back_status(status: number, skill: number, combo_level: number, cheer_bonus: number): number {
		// トークパワー補正
		var actual_status: number = Math.floor(status * parseFloat(this.event_power()));

		// バックメンバー補正
		actual_status = Math.ceil(actual_status * this.BACK_MEMBER_COEFFICIENT);

		// スキル補正計算
		var ratio = 1 + skill / 100;
		actual_status = Math.round(actual_status * ratio);

		// コンボボーナス
		ratio = 1 + (Math.sqrt(this.TALK_BATTLE_COMBO_LEVEL_COEFFICIENT * combo_level)) / 100;
		actual_status = Math.round(actual_status * ratio);

		// 応援ボーナス
		ratio = 1 + cheer_bonus / 100;
		actual_status = Math.ceil(actual_status * ratio);

		return actual_status;
	}

	// ダメージ計算
	calc_talk_battle_damage(full_power: boolean): number {
		var damage: number = Math.floor(this.actual_offense());

		if(full_power) {
			// 全力トーク
			damage = damage * this.TALK_BATTLE_FULL_POWER_LIVE_COEFFICIENT;
		}

		damage = damage / 5;

		return damage;
	}

	/******************************************************************************/
	// アイドルチャレンジ
	/******************************************************************************/
	calculation_challenge(member_type: boolean, producer_type: number, appeal_bonus_list: any[], unit_type: number, fever_bonus: number, training_room_level: number): void {
		var offense: number = parseInt(this.offense());
		var defense: number = parseInt(this.defense());
		var offense_skill: number = parseFloat(this.offense_skill());
		var defense_skill: number = parseFloat(this.defense_skill());
		var actual_offense: number = 0;
		var actual_defense: number = 0;
		if(member_type) {
			// フロント
			actual_offense = this.calc_challenge_front_status(offense, offense_skill, producer_type, appeal_bonus_list, unit_type, fever_bonus, training_room_level);
			actual_defense = this.calc_challenge_front_status(defense , defense_skill, producer_type, appeal_bonus_list, unit_type, fever_bonus, training_room_level);
		} else {
			// バック
			actual_offense = this.calc_challenge_back_status(offense, offense_skill, unit_type);
			actual_defense = this.calc_challenge_back_status(defense , defense_skill, unit_type);
		}
		this.actual_offense(actual_offense);
		this.actual_defense(actual_defense);
	}

	calc_challenge_front_status(status: number, skill: number, producer_type: number, appeal_bonus_list: any[], unit_type: number, fever_bonus: number, training_room_level: number): number {
		// チャレンジパワー・ユニットタイプ補正
		var ratio: number = parseFloat(this.event_power());
		if(parseInt(this.type()) == unit_type) {
			ratio *= 2
		}
		var actual_status: number = Math.floor(status * ratio);

		// 本気モードボーナス
		ratio = 1 + fever_bonus / 100;
		actual_status = Math.floor(actual_status * ratio);

		// プロデューサー+アピールボーナス計算
		ratio = 1 + this.get_type_ratio(producer_type, appeal_bonus_list);
		actual_status = Math.ceil(actual_status * ratio);

		// スキル補正計算
		ratio = 1 + skill / 100;
		actual_status = Math.round(actual_status * ratio);

		// トレーニングルーム
		ratio = 1 + training_room_level / 100;
		actual_status = Math.round(actual_status * ratio);

		return actual_status;
	}

	calc_challenge_back_status(status: number, skill: number, unit_type: number): number {
		// チャレンジパワー・ユニットタイプ補正
		var ratio: number = parseFloat(this.event_power());
		if(parseInt(this.type()) == unit_type) {
			ratio *= 2
		}
		var actual_status: number = Math.floor(status * ratio);

		// バックメンバー補正
		actual_status = Math.ceil(actual_status * this.BACK_MEMBER_COEFFICIENT);

		// スキル補正計算
		ratio = 1 + skill / 100;
		actual_status = Math.round(actual_status * ratio);

		return actual_status;
	}

	// ダメージ計算
	calc_challenge_damage(): number {
		return Math.floor(this.actual_offense()) / 5;
	}
}
