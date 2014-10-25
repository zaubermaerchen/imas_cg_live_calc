/*!
 * THE IDOLM@STER CINDERELLA GIRLS Exertion Value Calculator for Idol Survival
 * Copyright (c) 2014 Mutsuki Kimuraya (http://www4018uf.sakura.ne.jp/)
 * Released under the MIT license
 * http://opensource.org/licenses/mit-license.php
 */
/// <reference path="live_calc.base.ts" />

class ViewModel extends BaseLiveCalcViewModel {
	// 定数
	// セーブデータ関係
	SAVE_DATA_KEY: string = "imas_cg_survival_calc";

	// 入力項目
	total_cost: KnockoutObservable<any>;
	use_cost_percent: KnockoutObservable<any>;
	status_up: KnockoutObservable<any>;
	auto_sort: KnockoutObservable<boolean>;
	sort_type: KnockoutObservable<any>;
	add_idol: KnockoutObservable<UserIdol>;
	add_idol_num: KnockoutObservable<any>;

	// 発揮値
	total_offense: KnockoutObservable<number>;
	actual_offense: KnockoutComputed<number>;

	add: any;
	remove: any;

	constructor() {
		super();

		var self = this;

		this.calc_type(CALCULATION_TYPE.SURVIVAL);

		// 入力項目
		this.total_cost = ko.observable(0);
		this.use_cost_percent = ko.observable(100);
		this.status_up = ko.observable(0);
		this.auto_sort = ko.observable(false);
		this.sort_type = ko.observable(0);
		this.add_idol = ko.observable(new UserIdol(false));
		this.add_idol_num = ko.observable(1);

		// 発揮値
		this.total_offense = ko.observable(0);
		this.actual_offense = ko.computed(function () { return self.calculation(); });

		self.add = function() {
			var index:number = self.idol_list.indexOf(this);
			self.idol_list.splice(index + 1, 0, new UserIdol(false));
		};

		self.remove = function() {
			if(self.idol_list().length > 1) {
				self.idol_list.remove(this);
			}
		};

		this.init_list();
	}

	// アイドルリスト初期化
	init_idol_list(): void {
		var idols: UserIdol[] = [];
		idols.push(new UserIdol(false));
		this.idol_list(idols);
	}

	// 発揮値計算
	calculation(): number {
		// ソート
		this.sort_idol();

		var total_cost = parseInt(this.total_cost())
		var cost_cut: boolean = (total_cost > 0);
		var status_up = parseInt(this.status_up());
		var training_room_level = parseInt(this.training_room_level());

		// 使用コスト計算
		var use_cost_list: number[] = [];
		for(var i = 20; i <= 100; i = i + 20) {
			use_cost_list.push(Math.floor(total_cost * (i / 100)));
		}
		var rest_cost: number = parseInt(this.total_cost());
		var ratio = parseInt(this.use_cost_percent()) / 100;
		var use_cost = Math.floor(rest_cost * ratio);

		// 合計発揮値計算
		var total_offense: number = 0;
		for(var i = 0; i < this.idol_list().length; i++) {
			var idol: UserIdol = this.idol_list()[i];

			// アイドルごとの発揮値計算
			idol.calculation_survival(cost_cut, rest_cost);
			total_offense += idol.actual_offense();

			// 文字色変更
			var class_name: string = "";
			if(cost_cut && rest_cost > 0) {
				var _total_cost = total_cost - rest_cost;
				for(var j = 0; j < use_cost_list.length; j++) {
					if(_total_cost < use_cost_list[j]) {
						class_name = "survival" + ((j + 1) * 20);
						break;
					}
				}
			}
			if(cost_cut && rest_cost < idol.get_cost()) {
				class_name += " cost_over";
			}
			idol.style("numeric " + class_name);

			rest_cost -= parseInt(idol.cost());
			if(rest_cost < 0) {
				rest_cost = 0;
			}
		}
		this.total_offense(Math.ceil(total_offense * 100) / 100);

		// 実発揮値計算
		var actual_offense: number = Math.ceil(total_offense);
		// 消費コスト補正
		var total_cost: number = total_cost - rest_cost;
		if(total_cost > use_cost) {
			actual_offense = actual_offense * (use_cost / total_cost);
			actual_offense = Math.ceil(actual_offense);
		}

		// 能力値上昇値計算
		var ratio: number = status_up / 100;
		var status_up_bonus:number = actual_offense * ratio;

		// トレーニングルームボーナス値計算
		ratio = training_room_level / 100;
		var training_room_bonus: number = Math.ceil(actual_offense * ratio) + Math.ceil(status_up_bonus * ratio);

		// ボーナス補正
		actual_offense = Math.ceil(actual_offense + status_up_bonus) + training_room_bonus;

		return actual_offense;
	}

	// ソート処理
	sort_idol(): void {
		if(this.auto_sort()) {
			var idol_list: UserIdol[] = this.idol_list();
			idol_list.sort(function(a: UserIdol, b: UserIdol) {
				var result: number = 0;
				var a_ratio: number = parseFloat(a.offense_per_cost());
				var a_value: number = parseInt(a.offense());
				var b_ratio: number = parseFloat(b.offense_per_cost());
				var b_value: number = parseInt(b.offense());

				if(a_ratio != b_ratio) {
					// コスト比大きさでソート
					result = (b_ratio > a_ratio) ? 1 : -1;
				} else if(a_value != b_value) {
					// コスト比が同じ場合、ステータスの大きさでソート
					result = (b_value > a_value) ? 1 : -1;
				}

				return result;
			});
			this.idol_list(idol_list);
		}
	}
	// 設定取得
	get_setting(): { [index: string]: any; } {
		var setting: { [index: string]: any; } = {};

		// 共通部分のパラメータ取得
		setting["user_cost"] = this.total_cost();
		setting["use_cost_percent"] = this.use_cost_percent();
		setting["status_up"] = this.status_up();
		setting["training_room_level"] = this.training_room_level();

		// アイドル個別のパラメータ取得
		setting["idol"] = this.get_idol_setting();

		return setting;
	}

	// 設定反映
	set_setting(setting: { [index: string]: any; }): void {
		// 共通部分のパラメータ設定
		this.total_cost(setting["user_cost"]);
		this.use_cost_percent(setting["use_cost_percent"]);
		this.status_up(setting["status_up"]);
		this.training_room_level(setting["training_room_level"]);

		// アイドル個別のパラメータ設定
		this.set_idol_setting(setting["idol"], -1, false);
	}

	// アイドル一括追加
	add_idols(): void {
		var setting: { [index: string]: any; } = this.add_idol().get_setting();
		var num: number = parseInt(this.add_idol_num());

		var idol_list = this.idol_list();
		for(var i: number = 0 ; i < num; i++) {
			var idol: UserIdol = new UserIdol(false);
			idol.set_setting(setting);
			idol_list.push(idol);
		}

		this.idol_list.valueHasMutated();
	}
}

jQuery(function() {
	ko.applyBindings(new ViewModel());
});