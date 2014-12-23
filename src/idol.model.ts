/*!
 * Copyright (c) 2012 Mutsuki Kimuraya (http://www4018uf.sakura.ne.jp/)
 * Released under the MIT license
 * http://opensource.org/licenses/mit-license.php
 */
/// <reference path="typings/knockout/knockout.d.ts" />
/// <reference path="typings/knockout.es5/knockout.es5.d.ts" />
/// <reference path="common.ts" />

class UserIdol {
	// 定数
	static TRAINER_COST: number = 999;
	// 属性一致ボーナス係数
	static PRODUCER_TYPE_COEFFICIENT: number = 0.05;
	// 施設ボーナス係数
	static INSTITUTION_COEFFICIENT: number =  0.05;
	// バックメンバー係数
	static BACK_MEMBER_COEFFICIENT: number = 0.8;
	// ハイテンションボーナス係数
	static HIGH_TENSION_BONUS_COEFFICIENT: number = 0.1;
	// 相性ボーナス係数
	static COMPATIBILITY_BONUS_COEFFICIENT: number = 0.2;
	// グルーヴボーナス係数
	static GROOVE_BONUS_COEFFICIENT: number = 0.2;
	// LIVEツアー係数
	static LIVE_TOUR_NORMAL_LIVE_COEFFICIENT: number = 0.5;	// 通常LIVE時
	static LIVE_TOUR_FULL_POWER_LIVE_COEFFICIENT: number = 2;	// 全力LIVE時
	// LIVEロワイヤル係数
	static LIVE_ROYAL_DAMAGE_COEFFICIENT: number = 0.2; // ダメージ係数
	// ドリームLIVEフェス
	static DREAM_LIVE_FESTIVAL_NORMAL_LIVE_COEFFICIENT: number = 0.5;		// 通常LIVE時
	static DREAM_LIVE_FESTIVAL_FULL_POWER_LIVE_COEFFICIENT: number = 2.5;	// 全力LIVE時
	static DREAM_LIVE_FESTIVAL_COMBO_LEVEL_COEFFICIENT: number = 125;		// コンボLV係数
	// トークバトル
	static TALK_BATTLE_FULL_POWER_LIVE_COEFFICIENT: number = 5;		// 全力LIVE時
	static TALK_BATTLE_COMBO_LEVEL_COEFFICIENT: number = 50;			// コンボLV係数

	// ステータス
	id: string;
	type: string;
	rarity: string;
	cost: string;
	offense: string;
	defense: string;
	event_power: string;

	// スキル
	offense_skill: string;
	defense_skill: string;
	skill_id: string;
	skill_level: string;
	skill_name: string;
	is_festival: boolean;
	is_survival: boolean;
	enable_skill: boolean;

	// 発揮値
	actual_offense: number;
	actual_defense: number;
	style: string;

	// アイドル・スキル選択リスト
	idol_data_list: { [index: string]: string; }[];
	skill_data_list: { [index: string]: string; }[];

	constructor() {
		// ステータス
		this.id = "0";
		this.type = "0";
		this.rarity = "0";
		this.cost = "0";
		this.offense = "0";
		this.defense = "0";
		this.event_power = "1";

		// スキル
		this.offense_skill = "0";
		this.defense_skill = "0";
		this.skill_id = "0";
		this.skill_level = "10";
		this.skill_name = "無し";
		this.is_festival = false;
		this.is_survival = false;
		this.enable_skill = false;

		// 発揮値
		this.actual_offense = 0;
		this.actual_defense = 0;
		this.style = "numeric";

		// アイドル・スキル選択リスト
		this.idol_data_list = [];
		this.skill_data_list = [];

		this.set_idol_list();
		this.set_skill_list();

		ko.track(this);
	}

	// 総ステータス取得
	display_offense() : number { return Math.ceil(this.actual_offense); }
	display_defense() : number { return Math.ceil(this.actual_defense); }
	status(): number { return parseInt(this.offense) + parseInt(this.defense); }

	// コスト比
	offense_per_cost() : number { return this.calc_cost_ratio(parseInt(this.offense)); }
	defense_per_cost() : number { return this.calc_cost_ratio(parseInt(this.defense)); }
	status_per_cost() : number { return this.calc_cost_ratio(this.status()); }

	// アイドル・スキル選択リスト
	select_idol_list() : { [index: string]: string; }[] { return this.idol_data_list; }
	select_skill_list() : { [index: string]: string; }[] { return this.skill_data_list; }


	// 実コスト取得
	get_cost(): number {
		var cost: number = parseInt(this.cost);
		if(this.is_festival && cost == UserIdol.TRAINER_COST) {
			cost = 5;
		}

		return cost;
	}

	// コスト比計算
	calc_cost_ratio(status: number): number {
		// コスト取得
		var cost: number = parseInt(this.cost);
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
			if(this.is_survival) {
				status = Math.ceil(status * ratio);
			} else {
				ratio = Math.ceil(ratio * 10) / 10;
				//status = Math.round(status * ratio);
				status = Math.ceil(status * ratio);
			}
		}

		return status;
	}

	// アイドルリスト設定
	set_idol_list(): JQueryPromise<any> {
		var deferred: JQueryDeferred<any> = jQuery.Deferred();
		var type: number = parseInt(this.type);
		var rarity: number = parseInt(this.rarity);
		jQuery.when(this.load_idol_list(type, rarity)).done((list: { [index: string]: { [index: string]: string; } }) => {
			this.set_select_idol_list(list);

			this.id = "0";
			this.cost = "0";
			this.offense = "0";
			this.defense = "0";
			this.offense_skill = "0";
			this.defense_skill = "0";
			this.skill_level = "10";
			this.set_skill_info(null);

			deferred.resolve();
		});

		return deferred.promise();
	}

	set_select_idol_list(list: { [index: string]: { [index: string]: string; } }): void {
		var idol_list: { [index: string]: string; }[] = [];

		idol_list.push({ "id": "0", "name": "-"});

		for(var key in list) {
			if (list.hasOwnProperty(key)) {
				var data: { [index: string]: string; } = list[key];

				idol_list.push({ "id": data["idol_id"], "name": data["name"]});
			}
		}

		this.idol_data_list = idol_list;
	}

	// スキルリスト設定
	set_skill_list(): JQueryPromise<any> {
		var deferred: JQueryDeferred<any> = jQuery.Deferred();
		jQuery.when(Common.load_skill_list()).done((list: { [index: string]: { [index: string]: any; } }) => {
			var skill_list: { [index: string]: string; }[] = [];

			skill_list.push({ "id": "0", "name": "-"});

			for(var key in list) {
				if (list.hasOwnProperty(key)) {
					var data: { [index: string]: any; } = list[key];

					skill_list.push({ "id": data["skill_id"], "name": data["comment"] });
				}
			}

			this.skill_data_list = skill_list;

			deferred.resolve();
		});

		return deferred.promise();
	}

	// アイドル選択時
	change_idol(): void {
		var type: number = parseInt(this.type);
		var rarity: number = parseInt(this.rarity);
		var id: number = parseInt(this.id);
		this.offense_skill = "0";
		this.defense_skill = "0";
		if(!isNaN(id) && id != 0) {
			jQuery.when(this.load_idol_list(type, rarity)).done((idol_list: { [index: string]: { [index: string]: string; } }) => {
				var idol_data: { [index: string]: string; } = idol_list[this.id];
				// ステータス設定
				this.cost = idol_data["cost"];
				this.offense = idol_data["max_offense"];
				this.defense = idol_data["max_defense"];
				this.set_skill_info(idol_data);
			});
		} else {
			this.cost = "0";
			this.offense = "0";
			this.defense = "0";
			this.set_skill_info(null);
		}
	}

	// スキル情報設定
	set_skill_info(data: { [index: string]: string; }): void {
		var skill_id: string = "0";
		var skill_name: string = "無し";

		if(data != null) {
			skill_id = data["skill_id"];
			if(data["skill_name"] != undefined && data["skill_name"] != "") {
				skill_name = data["skill_name"];
			}
		}
		this.skill_name = skill_name;
		this.skill_id = skill_id;
	}

	// 設定取得
	get_setting(): { [index: string]: string; } {
		var setting: { [index: string]: string; } = {};
		setting["type"] = this.type;
		setting["rarity"] = this.rarity;
		setting["id"] = this.id;
		setting["cost"] = this.cost;
		setting["offense"] = this.offense;
		setting["defense"] = this.defense;
		setting["event_power"] = this.event_power;
		setting["offense_skill"] = this.offense_skill;
		setting["defense_skill"] = this.defense_skill;
		setting["skill_id"] = this.skill_id;
		setting["skill_level"] = this.skill_level;

		return setting;
	}

	// 設定反映
	set_setting(setting: { [index: string]: string; }): void {
		this.type = setting["type"];
		this.rarity = setting["rarity"];
		jQuery.when(this.load_idol_list(parseInt(setting["type"]), parseInt(setting["rarity"]))).done((idol_list: { [index: string]: { [index: string]: string; } }) => {
			this.set_select_idol_list(idol_list);

			this.id = setting["id"];
			if(setting["cost"] != null) {
				this.cost = setting["cost"];
			}
			this.offense = setting["offense"];
			this.defense = setting["defense"];
			this.event_power = setting["event_power"];
			this.offense_skill = setting["offense_skill"];
			this.defense_skill = setting["defense_skill"];
			this.set_skill_setting(idol_list[setting["id"]], setting["skill_id"], setting["skill_level"]);
		});
	}

	set_skill_setting(idol_data: { [index: string]: any; }, skill_id: any, skill_level: any): void {
		this.set_skill_info(idol_data);
		this.skill_level = skill_level;

		jQuery.when(Common.load_skill_list()).done((skill_list: { [index: string]: { [index: string]: any; } }) => {
			if (skill_list.hasOwnProperty(skill_id)) {
				this.skill_id = skill_id;
			}
		});
	}

	// プロデューサー+アピールボーナスの補正値取得
	get_type_ratio(producer_type: number, appeal_bonus_list: string[]): number {
		var type: number = parseInt(this.type);
		var ratio: number = 0;
		if(type == producer_type) {
			ratio += UserIdol.PRODUCER_TYPE_COEFFICIENT;
		} else {
			// プロデューサーとタイプが不一致の場合のみアピールボーナス補正値取得
			ratio += (parseInt(appeal_bonus_list[type]) / 100);
		}

		return ratio;
	}

	load_idol_list(type: number, rarity: number): JQueryPromise<{ [index: string]: { [index: string]: string; } }> {
		var fields: string[] = ["type", "rarity", "name", "cost", "max_offense", "max_defense", "skill_name", "skill_id"];
		var deferred: JQueryDeferred<{ [index: string]: { [index: string]: string; } }> = jQuery.Deferred();
		jQuery.when(Common.load_idol_list(type, rarity, fields)).done(function(response: { [index: string]: { [index: string]: string; } }) {
			deferred.resolve(response);
		});

		return deferred.promise();
	}

	/******************************************************************************/
	// 通常・フェスティバル
	/******************************************************************************/
	// 攻発揮値計算
	calculation(cost_cut: boolean, rest_cost: number, member_type: boolean, producer_type: number, appeal_bonus_list: string[], institution_list: string[], status_up: number, training_room_level: number, high_tension: boolean): void {
		var actual_offense: number = 0;
		var actual_defense: number = 0;
		if(!cost_cut || rest_cost >= 1) {
			var offense: number = parseInt(this.offense);
			var defense: number = parseInt(this.defense);
			var offense_skill: number = parseFloat(this.offense_skill);
			var defense_skill: number = parseFloat(this.defense_skill);
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
		this.actual_offense = actual_offense;
		this.actual_defense = actual_defense;
	}

	calculation_festivalS(cost_cut: boolean, rest_cost: number, member_type: boolean, producer_type: number, appeal_bonus_list: string[], institution_list: string[], status_up: number, training_room_level: number, high_tension: boolean, groove_type: number): void {
		var offense: number = parseInt(this.offense);
		var defense: number = parseInt(this.defense);
		var offense_skill: number = parseFloat(this.offense_skill);
		var defense_skill: number = parseFloat(this.defense_skill);
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
		this.actual_offense = actual_offense;
		this.actual_defense = actual_defense;
	}

	// フロントメンバー発揮値計算
	calc_front_status(status: number, skill: number, cost_cut: boolean, rest_cost: number, producer_type: number, appeal_bonus_list: string[], institution_list: string[], status_up: number, training_room_level: number, high_tension: boolean): number {
		// コスト補正
		if(cost_cut) {
			status = this.get_cost_corrected_status(status, this.get_cost(), rest_cost);
		}

		// 施設補正
		var type = parseInt(this.type);
		for(var i = 0; i < institution_list.length; i++) {
			if(type == parseInt(institution_list[i])) {
				status = Math.ceil(status * (1 + UserIdol.INSTITUTION_COEFFICIENT));
				break;
			}
		}

		// ボーナス補正計算
		var ratio = 1 + this.get_type_ratio(producer_type, appeal_bonus_list) + (status_up + skill) / 100;
		if(this.is_festival) {
			ratio += training_room_level / 100;
			if(high_tension) {
				ratio += UserIdol.HIGH_TENSION_BONUS_COEFFICIENT;
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
		var base_status: number = Math.ceil(status * UserIdol.BACK_MEMBER_COEFFICIENT);
		var actual_status: number = base_status;

		// コスト補正
		if(cost_cut) {
			actual_status = this.get_cost_corrected_status(actual_status, cost, rest_cost);
		}

		// スキル補正計算
		if(!this.is_festival || (!cost_cut || rest_cost >= cost)) {
			var ratio: number = (skill) / 100;
			actual_status = Math.floor(actual_status) + Math.ceil(base_status * ratio * 10) / 10;
			//actual_status = Math.floor(actual_status) + Math.round(base_status * ratio);
		}

		return actual_status;
	}

	// フェスフロントメンバー発揮値計算
	calc_festivalS_front_status(status: number, skill: number, cost_cut: boolean, rest_cost: number, producer_type: number, appeal_bonus_list: string[], institution_list: string[], status_up: number, training_room_level: number, high_tension: boolean , groove_type: number): number {
		// コスト補正
		if(cost_cut) {
			status = this.get_cost_corrected_status(status, this.get_cost(), rest_cost);
		}

		// 施設補正
		var type = parseInt(this.type);
		for(var i = 0; i < institution_list.length; i++) {
			if(type == parseInt(institution_list[i])) {
				status = Math.ceil(status * (1 +UserIdol.INSTITUTION_COEFFICIENT));
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
			ratio += UserIdol.GROOVE_BONUS_COEFFICIENT;
		}
		status = Math.round(status * ratio);

		// ハイテンションボーナス
		ratio = 1;
		if(high_tension) {
			ratio += UserIdol.HIGH_TENSION_BONUS_COEFFICIENT;
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
		this.is_survival = true;

		// サバイバルパワー補正
		var status: number = Math.floor(parseInt(this.offense) * parseFloat(this.event_power));

		// コスト補正
		if(cost_cut) {
			status = this.get_cost_corrected_status(status, this.get_cost(), rest_cost);
		}

		this.actual_offense = status;
	}

	/******************************************************************************/
	// LIVEツアー
	/******************************************************************************/
	calculation_live_tour(member_type: boolean, producer_type: number, appeal_bonus_list: string[], voltage_bonus: number, status_up: number, compatibility_type: number, training_room_level: number): void {
		var offense: number = parseInt(this.offense);
		var defense: number = parseInt(this.defense);
		var offense_skill: number = parseFloat(this.offense_skill);
		var defense_skill: number = parseFloat(this.defense_skill);
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
		this.actual_offense = actual_offense;
		this.actual_defense = actual_defense;
	}

	// 発揮値計算
	calc_live_tour_status(status: number, skill: number, producer_type: number, appeal_bonus_list: string[], status_up: number, compatibility_type: number): number {
		// スターダムパワー補正
		var actual_status: number = Math.floor(status * parseFloat(this.event_power));

		// プロデューサー+アピールボーナス+スキル補正計算
		var ratio: number = 1 + this.get_type_ratio(producer_type, appeal_bonus_list) + skill / 100;
		actual_status = Math.ceil(actual_status * ratio);

		// コンボボーナス
		ratio = 1;
		ratio += (status_up) / 100;
		actual_status = Math.ceil(actual_status * ratio);

		// 相性ボーナス
		ratio = 1;
		if(parseInt(this.type) == compatibility_type) {
			ratio += UserIdol.COMPATIBILITY_BONUS_COEFFICIENT;
		}
		actual_status = actual_status * ratio;

		return actual_status;
	}

	calc_live_tour_front_status(status: number, skill: number, producer_type: number, appeal_bonus_list: string[], voltage_bonus: number, status_up: number, compatibility_type: number, training_room_level: number): number {
		// スターダムパワー補正
		var actual_status: number = Math.floor(status * parseFloat(this.event_power));

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
		if(parseInt(this.type) == compatibility_type) {
			ratio += UserIdol.COMPATIBILITY_BONUS_COEFFICIENT;
		}
		actual_status = actual_status * ratio;

		return actual_status;
	}

	calc_live_tour_back_status(status: number, skill: number, voltage_bonus: number): number {
		// スターダムパワー補正
		var actual_status: number = Math.floor(status * parseFloat(this.event_power));

		// バックメンバー補正
		actual_status = Math.ceil(actual_status * UserIdol.BACK_MEMBER_COEFFICIENT);

		// スキル・ボルテージボーナス補正計算
		var ratio = 1 + (skill + voltage_bonus) / 100;
		actual_status = Math.ceil(actual_status * ratio);

		return actual_status;
	}

	// ダメージ計算
	calc_live_tour_damage(full_power: boolean): number {
		var damage: number = Math.floor(this.actual_offense);

		if(full_power) {
			// フルパワー
			damage = damage * UserIdol.LIVE_TOUR_FULL_POWER_LIVE_COEFFICIENT;
		} else {
			// LP1
			damage = damage * UserIdol.LIVE_TOUR_NORMAL_LIVE_COEFFICIENT;
		}

		damage = damage/ 5;

		return damage;
	}

	/******************************************************************************/
	// ドリームLIVEフェス
	/******************************************************************************/
	calculation_dream_live_festival(member_type: boolean, producer_type: number, appeal_bonus_list: string[], combo_level: number, fever_bonus: number, training_room_level: number): void {
		var offense: number = parseInt(this.offense);
		var defense: number = parseInt(this.defense);
		var offense_skill: number = parseFloat(this.offense_skill);
		var defense_skill: number = parseFloat(this.defense_skill);
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
		this.actual_offense = actual_offense;
		this.actual_defense = actual_defense;
	}

	calc_dream_live_festival_front_status(status: number, skill: number, producer_type: number, appeal_bonus_list: string[], combo_level: number, fever_bonus: number, training_room_level: number): number {
		// スターダムパワー補正
		var actual_status: number = Math.floor(status * parseFloat(this.event_power));

		// フィーバー補正
		var ratio: number = 1 + fever_bonus / 100;
		actual_status = Math.floor(actual_status * ratio);

		// ボーナス補正計算
		ratio = 1 + this.get_type_ratio(producer_type, appeal_bonus_list) + (skill + training_room_level) / 100;
		actual_status = Math.ceil(actual_status * ratio);

		// コンボボーナス
		ratio = 1;
		ratio += (Math.sqrt(UserIdol.DREAM_LIVE_FESTIVAL_COMBO_LEVEL_COEFFICIENT * combo_level)) / 100;
		actual_status = Math.ceil(actual_status * ratio);

		return actual_status;
	}

	calc_dream_live_festival_back_status(status: number, skill: number, fever_bonus: number): number {
		// スターダムパワー補正
		var actual_status: number = Math.floor(status * parseFloat(this.event_power));

		// バックメンバー補正
		actual_status = Math.ceil(actual_status * UserIdol.BACK_MEMBER_COEFFICIENT);

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
		var damage: number = Math.floor(this.actual_offense);

		if(full_power) {
			// フルパワー
			damage = damage * UserIdol.DREAM_LIVE_FESTIVAL_FULL_POWER_LIVE_COEFFICIENT;
		} else {
			// LP1
			damage = damage * UserIdol.DREAM_LIVE_FESTIVAL_NORMAL_LIVE_COEFFICIENT;
		}

		damage = damage / 5;

		return damage;
	}

	/******************************************************************************/
	// LIVEロワイヤル
	/******************************************************************************/
	calculation_live_royal(member_type: boolean, enable_royal_power: boolean, producer_type: number, appeal_bonus_list: string[], voltage_bonus: number, battle_point_rate: number, training_room_level: number): void {
		// 位置補正
		var offense: number = parseInt(this.offense);
		var defense: number = parseInt(this.defense);
		var offense_skill: number = parseFloat(this.offense_skill);
		var defense_skill: number = parseFloat(this.defense_skill);
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

		this.actual_offense = actual_offense;
		this.actual_defense = actual_defense;
	}

	// フロントメンバー発揮値計算
	calc_live_royal_front_status(status: number, skill: number, enable_royal_power: boolean, producer_type: number, appeal_bonus_list: string[], voltage_bonus: number, battle_point_rate: number, training_room_level: number): number {
		// ロワイヤルパワー補正
		var event_power: number = 1;
		if(enable_royal_power) {
			event_power = parseFloat(this.event_power);
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
			event_power = parseFloat(this.event_power);
		}
		var actual_status: number = Math.ceil(status * event_power);

		// バックメンバー補正
		actual_status = Math.ceil(actual_status * UserIdol.BACK_MEMBER_COEFFICIENT);

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
		return Math.floor(this.actual_offense) * UserIdol.LIVE_ROYAL_DAMAGE_COEFFICIENT;
	}

	/******************************************************************************/
	// LIVEトライアル
	/******************************************************************************/
	calculation_live_trial(cost_cut: boolean, rest_cost: number, member_type: boolean, producer_type: number): void {
		// 位置補正
		var offense: number = parseInt(this.offense);
		var defense: number = parseInt(this.defense);
		var offense_skill: number = parseFloat(this.offense_skill);
		var defense_skill: number = parseFloat(this.defense_skill);
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

		this.actual_offense = actual_offense;
		this.actual_defense = actual_defense;
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
		if(parseInt(this.type) == producer_type) {
			ratio += UserIdol.PRODUCER_TYPE_COEFFICIENT;
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
		var base_status: number = Math.floor(status * UserIdol.BACK_MEMBER_COEFFICIENT);
		var calc_status: number = base_status;

		// コスト補正
		if(cost_cut) {
			calc_status = this.get_cost_corrected_status(calc_status, cost, rest_cost);
			if(cost > rest_cost) {
				calc_status = calc_status * UserIdol.BACK_MEMBER_COEFFICIENT;
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
	calculation_talk_battle(member_type: boolean, producer_type: number, appeal_bonus_list: string[], combo_level: number, cheer_bonus: number, training_room_level: number): void {
		var offense: number = parseInt(this.offense);
		var defense: number = parseInt(this.defense);
		var offense_skill: number = parseFloat(this.offense_skill);
		var defense_skill: number = parseFloat(this.defense_skill);
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
		this.actual_offense = actual_offense;
		this.actual_defense = actual_defense;
	}

	calc_talk_battle_front_status(status: number, skill: number, producer_type: number, appeal_bonus_list: string[], combo_level: number, cheer_bonus: number, training_room_level: number): number {
		// トークパワー補正
		var actual_status: number = Math.floor(status * parseFloat(this.event_power));

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
		ratio = 1 + (Math.sqrt(UserIdol.TALK_BATTLE_COMBO_LEVEL_COEFFICIENT * combo_level)) / 100;
		actual_status = Math.round(actual_status * ratio);

		// 応援ボーナス
		ratio = 1 + cheer_bonus / 100;
		actual_status = Math.ceil(actual_status * ratio);

		return actual_status;
	}

	calc_talk_battle_back_status(status: number, skill: number, combo_level: number, cheer_bonus: number): number {
		// トークパワー補正
		var actual_status: number = Math.floor(status * parseFloat(this.event_power));

		// バックメンバー補正
		actual_status = Math.ceil(actual_status * UserIdol.BACK_MEMBER_COEFFICIENT);

		// スキル補正計算
		var ratio = 1 + skill / 100;
		actual_status = Math.round(actual_status * ratio);

		// コンボボーナス
		ratio = 1 + (Math.sqrt(UserIdol.TALK_BATTLE_COMBO_LEVEL_COEFFICIENT * combo_level)) / 100;
		actual_status = Math.round(actual_status * ratio);

		// 応援ボーナス
		ratio = 1 + cheer_bonus / 100;
		actual_status = Math.ceil(actual_status * ratio);

		return actual_status;
	}

	// ダメージ計算
	calc_talk_battle_damage(full_power: boolean): number {
		var damage: number = Math.floor(this.actual_offense);

		if(full_power) {
			// 全力トーク
			damage = damage * UserIdol.TALK_BATTLE_FULL_POWER_LIVE_COEFFICIENT;
		}

		damage = damage / 5;

		return damage;
	}

	/******************************************************************************/
	// アイドルチャレンジ
	/******************************************************************************/
	calculation_challenge(member_type: boolean, producer_type: number, appeal_bonus_list: string[], unit_type: number, fever_bonus: number, training_room_level: number): void {
		var offense: number = parseInt(this.offense);
		var defense: number = parseInt(this.defense);
		var offense_skill: number = parseFloat(this.offense_skill);
		var defense_skill: number = parseFloat(this.defense_skill);
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
		this.actual_offense = actual_offense;
		this.actual_defense = actual_defense;
	}

	calc_challenge_front_status(status: number, skill: number, producer_type: number, appeal_bonus_list: string[], unit_type: number, fever_bonus: number, training_room_level: number): number {
		// チャレンジパワー・ユニットタイプ補正
		var ratio: number = parseFloat(this.event_power);
		if(parseInt(this.type) == unit_type) {
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
		var ratio: number = parseFloat(this.event_power);
		if(parseInt(this.type) == unit_type) {
			ratio *= 2
		}
		var actual_status: number = Math.floor(status * ratio);

		// バックメンバー補正
		actual_status = Math.ceil(actual_status * UserIdol.BACK_MEMBER_COEFFICIENT);

		// スキル補正計算
		ratio = 1 + skill / 100;
		actual_status = Math.round(actual_status * ratio);

		return actual_status;
	}

	// ダメージ計算
	calc_challenge_damage(): number {
		return Math.floor(this.actual_offense) / 5;
	}
}
