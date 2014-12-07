/*!
 * THE IDOLM@STER CINDERELLA GIRLS Exertion Value Calculator
 * Copyright (c) 2012 Mutsuki Kimuraya (http://www4018uf.sakura.ne.jp/)
 * Released under the MIT license
 * http://opensource.org/licenses/mit-license.php
 */
/// <reference path="live_calc.base.ts" />

class ViewModel extends BaseLiveCalcViewModel {
	// 入力項目
	rest_cost: string;
	total_cost: string;
	use_cost_percent: string;
	institution: string[];
	status_up: string;
	high_tension: string;
	groove_type: string;
	auto_sort: boolean;
	sort_type: string;
	add_idol: UserIdol;
	add_idol_num: string;

	// 発揮値
	front_offense: number;
	front_defense: number;
	back_offense: number;
	back_defense: number;

	add: Function;
	remove: Function;

	constructor() {
		super();

		// 入力項目
		this.calc_type = CALCULATION_TYPE.NORMAL.toString();
		this.rest_cost = "0";
		this.total_cost = "0";
		this.use_cost_percent = "100";
		this.front_num = "5";
		this.institution = [];
		this.status_up = "0";
		this.high_tension = "0";
		this.groove_type = "-1";
		this.auto_sort = false;
		this.sort_type = "0";
		this.add_idol = new UserIdol(false);
		this.add_idol_num = "1";

		// 特技関係
		this.max_skill_invoke = 3;
		this.skill_invocation_rate_list = [100, 50, 37.5, 28.125, 21.09375];

		// 発揮値
		this.front_offense = 0;
		this.front_defense = 0;
		this.back_offense  = 0;
		this.back_defense = 0;

		// セーブデータ関係
		this.save_data_key = "imas_cg_live_calc";

		var self = this;
		this.add = function() {
			var index:number = self.idol_list.indexOf(this);
			self.idol_list.splice(index + 1, 0, new UserIdol(false));
		};
		this.remove = function() {
			if(self.idol_list.length > 1) {
				self.idol_list.remove(this);
			}
		};

		this.init_list();

		ko.track(this);
	}

	actual_status() : number[] { return this.calculation(); }

	// アイドルリスト初期化
	init_idol_list(): void {
		var idols: UserIdol[] = [];
		idols.push(new UserIdol(false));
		this.idol_list = idols;
	}

	is_festival(): boolean { return (parseInt(this.calc_type) == CALCULATION_TYPE.FESTIVAL); }
	is_festivalS(): boolean { return (parseInt(this.calc_type) == CALCULATION_TYPE.FESTIVAL_S); }

	change_calc_type(): void {
		var is_festival: boolean = (this.is_festival() || this.is_festivalS());

		for(var i = 0; i < this.idol_list.length; i++) {
			this.idol_list[i].is_festival = is_festival;
		}
		ko.valueHasMutated(this, "idol_list");
	}

	// 発揮値計算
	calculation(): number[] {
		// ソート
		this.sort_idol();

		// スキル効果反映
		this.calc_skill_value();

		var total_cost: number = parseInt(this.total_cost);
		if(isNaN(total_cost)) {
			total_cost = 0;
		}
		var calc_type: number = parseInt(this.calc_type);
		var producer_type: number = parseInt(this.producer_type);
		var status_up: number = parseInt(this.status_up);
		if(isNaN(status_up)) {
			status_up = 0;
		}
		var high_tension: boolean = (parseInt(this.high_tension) == 1);
		var groove_type: number = parseInt(this.groove_type);
		var training_room_level: number = parseInt(this.training_room_level);
		var cost_cut: boolean = (total_cost > 0);

		// 使用コスト計算
		var use_cost: number = total_cost;
		if(this.is_festival() || this.is_festivalS()) {
			var ratio: number = parseInt(this.use_cost_percent) / 100;
			use_cost = total_cost * ratio;
		} else {
			use_cost = parseInt(this.rest_cost);
			if(isNaN(use_cost) || use_cost < 1) {
				use_cost = total_cost;
			}
		}
		var rest_cost: number = Math.floor(use_cost);

		// アイドルの発揮値計算
		var front_offense: number = 0;
		var front_defense: number = 0;
		var back_offense: number = 0;
		var back_defense: number = 0;
		var total_offense: number = 0;
		var total_defense: number = 0;
		for(var i: number = 0; i < this.idol_list.length; i++) {
			var idol: UserIdol = this.idol_list[i];
			var member_type: boolean = (i < parseInt(this.front_num));

			// アイドルごとの発揮値計算
			switch(calc_type) {
				case CALCULATION_TYPE.FESTIVAL_S:
					// フェスS
					idol.calculation_festivalS(cost_cut, rest_cost, member_type, producer_type, this.appeal_bonus, this.institution, status_up, training_room_level, high_tension, groove_type);
					break;
				default:
					// 通常・フェス
					idol.calculation(cost_cut, rest_cost, member_type, producer_type, this.appeal_bonus, this.institution, status_up, training_room_level, high_tension);
					break;
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
			var class_name: string = "numeric " + (member_type ? "front" : "back");
			if(cost_cut && rest_cost < idol.get_cost()) {
				class_name += " cost_over";
			}
			idol.style = class_name;

			rest_cost -= idol.get_cost();
			if(rest_cost < 0) {
				rest_cost = 0;
			}
		}
		this.front_offense = Math.round(front_offense);
		this.front_defense = Math.round(front_defense);
		this.back_offense = Math.round(back_offense);
		this.back_defense = Math.round(back_defense);

		// ぷちデレラボーナス計算
		var petit_idol_bonus: number = 0;
		for(var i: number = 0; i < this.petit_idol_list.length; i++) {
			var petit_idol: UserPetitIdol = this.petit_idol_list[i];
			petit_idol_bonus += petit_idol.status();
		}
		if(total_cost > 0) {
			petit_idol_bonus = Math.floor(petit_idol_bonus * ((use_cost - rest_cost) / total_cost));
		}
		total_offense += petit_idol_bonus;
		total_defense += petit_idol_bonus;

		return [Math.round(total_offense), Math.round(total_defense)];
	}

	// ソート処理
	sort_idol(): void {
		if(this.auto_sort) {
			// ソート対象を設定
			var front_num: number = parseInt(this.front_num);
			var untarget_idol_list: UserIdol[] = this.idol_list.slice(0, front_num);
			var target_idol_list: UserIdol[] = this.idol_list.slice(front_num);

			target_idol_list.sort((a: UserIdol, b: UserIdol) => {
				var result: number = 0;

				// ソート条件ステータスを設定
				var a_ratio: number = a.offense_per_cost();
				var a_value: number = parseInt(a.offense);
				var b_ratio: number = b.offense_per_cost();
				var b_value: number = parseInt(b.offense);
				switch (parseInt(this.sort_type)) {
					case 0:
						// 攻コスト比
						a_ratio = a.offense_per_cost();
						a_value = parseInt(a.offense);
						b_ratio = b.offense_per_cost();
						b_value = parseInt(b.offense);
						break;
					case 1:
						// 守コスト比
						a_ratio = a.defense_per_cost();
						a_value = parseInt(a.defense);
						b_ratio = b.defense_per_cost();
						b_value = parseInt(b.defense);
						break;
				}

				if(a_ratio != b_ratio) {
					// コスト比大きさでソート
					result = (b_ratio > a_ratio) ? 1 : -1;
				} else if(a_value != b_value) {
					// コスト比が同じ場合、ステータスの大きさでソート
					result = (b_value > a_value) ? 1 : -1;
				}

				return result;
			});
			this.idol_list = untarget_idol_list.concat(target_idol_list);
		}
	}

	// 発動スキル取得
	get_invoke_skill_list(): JQueryPromise<{ [index: string]: string; }[]> {
		var front_num = parseInt(this.front_num);

		// 使用コスト計算
		var cost_cut: boolean = (parseInt(this.total_cost) > 0);
		var ratio: number = parseInt(this.use_cost_percent) / 100;
		var use_cost: number = Math.floor(parseInt(this.total_cost) * ratio);

		// 属性ごとのメンバー人数取得
		var rest_cost: number = use_cost;
		var member_num: number[][] = [[0, 0, 0], [0, 0, 0]];
		for(var i = 0; i < this.idol_list.length && (!cost_cut || rest_cost > 0); i++) {
			var idol: UserIdol = this.idol_list[i];
			var type: number = parseInt(idol.type);
			if(i < front_num) {
				member_num[0][type]++;
			} else {
				member_num[1][type]++;
			}
			rest_cost -= idol.get_cost();
		}

		// 属性ごとの相手メンバー人数取得
		var rival_member_num: number[][] = [[0, 0, 0], [0, 0, 0]];

		// 発動可能スキル
		var deferred: JQueryDeferred<{ [index: string]: string; }[]> = jQuery.Deferred();
		jQuery.when(Common.load_skill_list()).done((skill_data_list: { [index: string]: { [index: string]: any; } }) => {
			var invoke_skill_list: { [index: string]: string; }[] = [];
			var skill_input_type: number = parseInt(this.skill_input_type);
			var skill_count: number = 0;
			var rest_cost: number = use_cost;
			for(var i = 0; i < this.idol_list.length && i < front_num && (!cost_cut || rest_cost > 0); i++) {
				var idol: UserIdol = this.idol_list[i];
				if(parseInt(idol.skill_id) > 0 && parseInt(idol.skill_level) > 0) {
					// 発動スキルを取得
					var skill: { [index: string]: string; } = this.check_skill_enable(idol, skill_data_list, skill_count, member_num, rival_member_num);
					if(skill != null) {
						idol.enable_skill = true;
						invoke_skill_list.push(skill);
						skill_count++;
					}

					rest_cost -= idol.get_cost();

					if(skill_input_type != SKILL_INPUT_MODE.AUTO_MEAN && skill_count >= this.max_skill_invoke) {
						break;
					}
				}
			}
			deferred.resolve(invoke_skill_list);
		});

		return deferred.promise();
	}

	// アイドル一括追加
	add_idols(): void {
		var setting: { [index: string]: string; } = this.add_idol.get_setting();
		var num: number = parseInt(this.add_idol_num);

		var idol_list = this.idol_list;
		for(var i: number = 0 ; i < num; i++) {
			var idol: UserIdol = new UserIdol(false);
			idol.set_setting(setting);
			idol_list.push(idol);
		}

		ko.valueHasMutated(this, "idol_list");
	}

	// 設定取得
	get_setting(): { [index: string]: any; } {
		var setting: { [index: string]: any; } = {};

		// 共通部分のパラメータ取得
		setting["user_rest_cost"] = this.rest_cost;
		setting["user_cost"] = this.total_cost;
		setting["use_cost_percent"] = this.use_cost_percent;
		setting["front_num"] = this.front_num;
		setting["producer_type"] = this.producer_type;
		setting["status_up"] = this.status_up;
		setting["institution"] = this.institution;
		setting["appeal_bonus"] = this.get_appeal_bonus_setting();
		setting["training_room_level"] = this.training_room_level;
		setting["high_tension"] = this.high_tension;
		setting["groove_type"] = this.groove_type;
		setting["calc_type"] = this.calc_type;
		setting["skill_input_type"] = this.skill_input_type;
		setting["enable_skill_type"] = this.enable_skill_type;
		//setting["rival_member"] = get_rival_member_setting();

		// アイドル個別のパラメータ取得
		setting["idol"] = this.get_idol_setting();

		// ぷちアイドル個別のパラメータ取得
		setting["petit_idol"] = this.get_petit_idol_setting();

		return setting;
	}

	// 設定反映
	set_setting(setting: { [index: string]: any; }): void {
		// 共通部分のパラメータ設定
		this.rest_cost = setting["user_rest_cost"];
		this.total_cost = setting["user_cost"];
		this.use_cost_percent = setting["use_cost_percent"];
		this.front_num = setting["front_num"];
		this.producer_type = setting["producer_type"];
		this.status_up = setting["status_up"];
		this.institution = setting["institution"];
		this.set_appeal_bonus_setting(setting["appeal_bonus"]);
		this.training_room_level = setting["training_room_level"];
		this.high_tension = setting["high_tension"];
		this.groove_type = setting["groove_type"];
		this.calc_type = setting["calc_type"];
		this.skill_input_type = setting["skill_input_type"];
		this.enable_skill_type = setting["enable_skill_type"];
		//set_rival_member_setting(setting["rival_member"]);

		// アイドル個別のパラメータ設定
		jQuery.when(this.set_idol_setting(setting["idol"], -1, false)).done(() => {
			this.change_calc_type();
		});

		// ぷちアイドル個別のパラメータ取得
		this.set_petit_idol_setting(setting["petit_idol"], ViewModel.PETIT_IDOL_NUM);
	}
}

jQuery(function() {
	ko.applyBindings(new ViewModel());
});