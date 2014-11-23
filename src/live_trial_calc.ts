/*!
 * THE IDOLM@STER CINDERELLA GIRLS Exertion Value Calculator for Live Trial
 * Copyright (c) 2013 Mutsuki Kimuraya (http://www4018uf.sakura.ne.jp/)
 * Released under the MIT license
 * http://opensource.org/licenses/mit-license.php
 */
/// <reference path="live_calc.base.ts" />

class ViewModel extends BaseLiveCalcViewModel {
	// 入力項目
	total_cost: string;
	use_cost_percent: string;
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
		this.calc_type = CALCULATION_TYPE.SESSION.toString();
		this.total_cost = "0";
		this.use_cost_percent = "100";
		this.front_num = "5";
		this.auto_sort = false;
		this.sort_type = "0";
		this.add_idol = new UserIdol(false);
		this.add_idol_num = "1";

		// 発揮値
		this.front_offense = 0;
		this.front_defense = 0;
		this.back_offense  = 0;
		this.back_defense = 0;

		// セーブデータ関係
		this.save_data_key = "imas_cg_live_calc";

		var self = this;
		self.add = function() {
			var index:number = self.idol_list.indexOf(this);
			self.idol_list.splice(index + 1, 0, new UserIdol(false));
		};
		self.remove = function() {
			if(self.idol_list.length > 1) {
				self.idol_list.remove(this);
			}
		};

		this.init_list();

		ko.track(this);
	}

	actual_status(): number[] { return this.calculation(); }

	// アイドルリスト初期化
	init_idol_list(): void {
		var idols: UserIdol[] = [];
		idols.push(new UserIdol(false));
		this.idol_list = idols;
	}

	// 発揮値計算
	calculation(): number[] {
		// ソート
		this.sort_idol();

		// スキル効果反映
		this.calc_skill_value();

		var producer_type: number = parseInt(this.producer_type);
		var cost_cut: boolean = (parseInt(this.total_cost) > 0);

		// 使用コスト計算
		var ratio: number = parseInt(this.use_cost_percent) / 100;
		var rest_cost: number = Math.floor(parseInt(this.total_cost) * ratio);

		// 合計発揮値計算
		var total_offense: number = 0;
		var total_defense: number = 0;
		var front_offense: number = 0;
		var front_defense: number = 0;
		var back_offense: number = 0;
		var back_defense: number = 0;
		for(var i = 0; i < this.idol_list.length; i++) {
			var idol: UserIdol = this.idol_list[i];
			var member_type: boolean = (i < parseInt(this.front_num));

			// アイドルごとの発揮値計算
			idol.calculation_live_trial(cost_cut, rest_cost, member_type, producer_type);
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

		return [Math.ceil(total_offense), Math.ceil(total_defense)];
	}

	// ソート処理
	sort_idol(): void  {
		if(this.auto_sort) {
			var front_num: number = parseInt(this.front_num);
			var untarget_idol_list: UserIdol[] = this.idol_list.slice(0, front_num);
			var target_idol_list: UserIdol[] = this.idol_list.slice(front_num);
			target_idol_list.sort(function(a: UserIdol, b: UserIdol) {
				var result: number = 0;
				var a_ratio: number = a.offense_per_cost();
				var a_value: number = parseInt(a.offense);
				var b_ratio: number = b.offense_per_cost();
				var b_value: number = parseInt(b.offense);

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

	// アイドル一括追加
	add_idols(): void {
		var setting: { [index: string]: any; } = this.add_idol.get_setting();
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
		setting["user_cost"] = this.total_cost;
		setting["use_cost_percent"] = this.use_cost_percent;
		setting["front_num"] = this.front_num;
		setting["producer_type"] = this.producer_type;
		setting["skill_input_type"] = this.skill_input_type;
		setting["enable_skill_type"] = this.enable_skill_type;
		//setting["rival_member"] = this.get_rival_member_setting();

		// アイドル個別のパラメータ取得
		setting["idol"] = this.get_idol_setting();

		return setting;
	}

	// 設定反映
	set_setting(setting: { [index: string]: any; }): void {
		// 共通部分のパラメータ設定
		this.total_cost = setting["user_cost"];
		this.use_cost_percent = setting["use_cost_percent"];
		this.front_num = setting["front_num"];
		this.producer_type = setting["producer_type"];
		this.calc_type = setting["calc_type"];
		this.skill_input_type = setting["skill_input_type"];
		this.enable_skill_type = setting["enable_skill_type"];
		//this.set_rival_member_setting(setting["rival_member"]);

		// アイドル個別のパラメータ設定
		this.set_idol_setting(setting["idol"], -1, false);
	}
}

jQuery(function() {
	ko.applyBindings(new ViewModel());
});