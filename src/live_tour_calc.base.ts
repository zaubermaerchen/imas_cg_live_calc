/*!
 * THE IDOLM@STER CINDERELLA GIRLS Exertion Value Calculator Base Class for Live Tour
 * Copyright (c) 2013 Mutsuki Kimuraya (http://www4018uf.sakura.ne.jp/)
 * Released under the MIT license
 * http://opensource.org/licenses/mit-license.php
 */
/// <reference path="live_calc.base.ts" />

class BaseLiveTourCalcViewModel extends BaseLiveCalcViewModel {
	// 定数
	// ダメージ係数
	static DAMAGE_COEFFICIENT: { [index: string]: number; } = {
		MIN: 0.97,
		MAX: 1.02,
		AVG: 0.995
	};
	static TOTAL_DAMAGE_COEFFICIENT: number = 5;

	// 最大メンバー数
	max_member_num: number;

	// 入力項目
	voltage_bonus: string;

	// 発揮値
	front_offense: number;
	front_defense: number;
	back_offense: number;
	back_defense: number;
	// LIVE時の与ダメージ
	total_damage_min: number;
	total_damage_max: number;
	total_damage_avg: number;
	battle_damage_min: number;
	battle_damage_max: number;
	battle_damage_avg: number;

	constructor() {
		super();

		// 最大メンバー数
		this.max_member_num = 20;

		// 入力値
		this.front_num = "10";
		this.voltage_bonus = "0";

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
		this.total_damage_min = 0;
		this.total_damage_max = 0;
		this.total_damage_avg = 0;
		this.battle_damage_min = 0;
		this.battle_damage_max = 0;
		this.battle_damage_avg = 0;
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
			var idol: UserIdol = new UserIdol(false);
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

		jQuery.when.apply(null, method_list).done(() => {
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

			this.idol_list = idol_list;
			deferred.resolve();
		});

		return deferred.promise();
	}


	// 設定取得
	get_setting(): { [index: string]: any; } {
		var setting: { [index: string]: any; } = {};

		// 共通部分のパラメータ取得
		setting["producer_type"] = this.producer_type;
		setting["appeal_bonus"] = this.get_appeal_bonus_setting();
		setting["training_room_level"] = this.training_room_level;
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
		this.calc_type = setting["calc_type"];
		this.skill_input_type = setting["skill_input_type"];
		this.enable_skill_type = setting["enable_skill_type"];
		this.set_rival_member_setting(setting["rival_member"]);

		// アイドル個別のパラメータ設定
		this.set_idol_setting(setting["idol"], this.max_member_num, false);

		// ぷちアイドル個別のパラメータ設定
		this.set_petit_idol_setting(setting["petit_idol"], ViewModel.PETIT_IDOL_NUM);
	}

	/******************************************************************************/
	// スキル関連
	/******************************************************************************/
	check_target_rival_unit_skill_enable(skill: { [index: string]: any; }, rival_member_num: number[][]): { [index: string]: any; } {
		var enable_skill_type: number = parseInt(this.enable_skill_type);
		var target_param: number = parseInt(skill["target_param"]);
		var target_member: number = parseInt(skill["target_member"]);
		var target_type: number = parseInt(skill["target_type"]);

		// 有効スキルかチェック
		if(enable_skill_type != ENABLE_SKILL_TYPE.ALL && (enable_skill_type ^ target_param) == 0) {
			return null;
		}
		if(target_member != SKILL_TARGET_MEMBER.FRONT && target_member != SKILL_TARGET_MEMBER.ALL) {
			return null;
		}

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

		return skill;
	}

	// スキル効果適用可能チェック
	check_apply_skill(idol: UserIdol, invoke_skill: { [index: string]: string; }): boolean {
		var result: boolean = false;

		var type: number = parseInt(idol.type);
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
}