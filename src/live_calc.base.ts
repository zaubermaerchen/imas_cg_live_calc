/*!
 * THE IDOLM@STER CINDERELLA GIRLS Exertion Value Calculator Base Class
 * Copyright (c) 2012 Mutsuki Kimuraya (http://www4018uf.sakura.ne.jp/)
 * Released under the MIT license
 * http://opensource.org/licenses/mit-license.php
 */
/// <reference path="typings/knockout/knockout.d.ts" />
/// <reference path="typings/knockout.es5/knockout.es5.d.ts" />
/// <reference path="common.ts" />
/// <reference path="idol.model.ts" />

// 計算モード
enum CALCULATION_TYPE {
	NORMAL = 0,					// 通常
	SURVIVAL = 1,				// サバイバル
	FESTIVAL = 2,				// フェス
	LIVE_TOUR = 3,				// LIVEツアー
	SESSION = 4,				// セッション
	DREAM_LIVE_FESTIVAL = 5,	// ドリームLIVEフェス
	ROYAL = 6,					// LIVEロワイヤル(ロワイヤルLIVE)
	ROYAL_GUEST = 7,			// LIVEロワイヤル(ゲストLIVE)
	TALK_BATTLE = 8,			// トークバトル
	CHALLENGE = 9,				// アイドルチャレンジ
	FESTIVAL_S = 10             // フェスS
}
// スキル効果対象ユニット
enum SKILL_TARGET_UNIT {
	OWN = 0,	// 自ユニット
	RIVAL = 1	// 相手ユニット
}
// スキル効果対象メンバー
enum SKILL_TARGET_MEMBER {
	SELF = 0,	// 発動者
	FRONT = 1,	// フロントメンバー
	BACK = 2,	// バックメンバー
	ALL = 3		// 全メンバー
}
// スキル効果対象属性
enum SKILL_TARGET_TYPE {
	CUTE = 1,		// キュート属性
	COOL = 2,		// クール属性
	PASSION	 = 4,	// パッション属性
	ALL = 7			// 全属性
}
// スキル効果対象ステータス
enum SKILL_TARGET_PARAM {
	ALL = 0,		// 攻守
	OFFENSE = 1,	// 攻
	DEFENSE = 2 	// 守
}
// スキル入力モード
enum SKILL_INPUT_MODE {
	MANUAL = 0,		// 手動入力モード
	AUTO = 1,		// 自動入力モード
	AUTO_MEAN = 2,	// 自動入力モード(期待値)
}
// 有効発動スキル
enum ENABLE_SKILL_TYPE {
	ALL = 0,		// 全スキル
	OFFENSE = 1,	// 攻撃時発動スキル
	DEFENSE = 2	// 守備時発動スキル
}

class BaseLiveCalcViewModel {
	// 定数
	// セーブデータ関係
	SAVE_DATA_KEY: string = "";
	// 最大スキル発動個数
	MAX_INVOKE_SKILL_NUM: number = 0;
	// スキル発動率
	SKILL_INVOCATION_RATE_LIST: number[] = [];

	// 入力項目
	calc_type: string;
	front_num: string;
	producer_type: string;
	appeal_bonus: number[];
	training_room_level: string;
	idol_list: UserIdol[];
	skill_input_type: string;
	enable_skill_type: string;
	rival_front_num: string[];
	rival_back_num: string[];

	// セーブデータ関係
	save_data_id: string;
	save_data_title: string;

	// コード関係
	code: string;
	apply_code_url: string;

	move_up: Function;
	move_down: Function;

	constructor() {
		var self = this;

		// 入力項目
		this.calc_type = CALCULATION_TYPE.NORMAL.toString();
		this.front_num = "0";
		this.producer_type = "-1";
		this.appeal_bonus = [0, 0, 0];
		this.training_room_level = "0";
		this.idol_list = [];
		this.skill_input_type = "0";
		this.enable_skill_type = "0";
		this.rival_front_num = ["0", "0", "0"];
		this.rival_back_num = ["0", "0", "0"];

		// セーブデータ関係
		this.save_data_id = "1";
		this.save_data_title = "";

		// コード関係
		this.code = "";
		this.apply_code_url = "";

		this.move_up = function() {
			var index: number = self.idol_list.indexOf(this);
			if(index > 0) {
				self.idol_list.splice(index - 1, 2, self.idol_list[index], self.idol_list[index - 1]);
			}
		};

		this.move_down = function() {
			var index: number = self.idol_list.indexOf(this);
			if(index < self.idol_list.length - 1) {
				self.idol_list.splice(index, 2, self.idol_list[index + 1], self.idol_list[index]);
			}
		};
	}

	// 発揮値
	actual_status(): number[] { return [0, 0]; }

	change_appeal_bonus(): void { ko.valueHasMutated(this, "appeal_bonus"); }
	change_rival_front_num(): void { ko.valueHasMutated(this, "rival_front_num"); }
	change_rival_back_num(): void { ko.valueHasMutated(this, "rival_back_num"); }

	// アイドルリスト初期化
	init_list(): void {
		this.init_idol_list();

		// コードがあったら適用
		var param_list: { [index: string]: string; } = Common.get_param_list();
		if(param_list["code"]) {
			this.code = param_list["code"];
			this.apply_code();
		}
	}

	// アイドルリスト初期化
	init_idol_list(): void {}

	// 設定
	get_setting(): { [index: string]: any; } { return {}; }
	set_setting(setting: { [index: string]: any; }): void {}

	// アイドル設定取得
	get_idol_setting(): { [index: string]: string; }[] {
		var setting: { [index: string]: string; }[] = [];
		for(var i: number = 0; i < this.idol_list.length; i++) {
			setting.push(this.idol_list[i].get_setting());
		}

		return	setting;
	}

	// アイドル設定反映
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

			this.idol_list = idol_list;
			deferred.resolve();
		});

		return deferred.promise();
	}

	// アピールボーナス設定取得
	get_appeal_bonus_setting(): { [index: number]: string; }[] {
		var settings: { [index: number]: string; }[] = [];

		for(var i: number = 0; i < this.appeal_bonus.length; i++) {
			var setting: { [index: number]: string; } = {};
			setting["type"] = i.toString();
			setting["value"] = this.appeal_bonus[i];
			settings.push(setting);
		}

		return settings;
	}

	// アピールボーナス設定反映
	set_appeal_bonus_setting(settings: { [index: number]: string; }[]): void {
		if(settings != undefined) {
			for(var i: number = 0; i < settings.length; i++) {
				if(settings[i] != undefined) {
					var setting = settings[i];
					this.appeal_bonus[setting["type"]] = setting["value"];
				}
			}
		}
	}

	// ライバルユニット設定取得
	get_rival_member_setting(): { [index: string]: { [index: number]: string; }[]} {
		var settings: { [index: string]: { [index: number]: string; }[]} = {};

		settings["front"] = [];
		for(var i: number = 0; i < this.rival_front_num.length; i++) {
			var setting: { [index: number]: string; } = {};
			setting["type"] = i.toString();
			setting["value"] = this.rival_front_num[i];
			settings["front"].push(setting);
		}

		settings["back"] = [];
		for(var i: number = 0; i < this.rival_back_num.length; i++) {
			var setting: { [index: number]: string; } = {};
			setting["type"] = i.toString();
			setting["value"] = this.rival_back_num[i];
			settings["back"].push(setting);
		}

		return settings;
	}

	// ライバルユニット設定反映
	set_rival_member_setting(settings: { [index: string]: { [index: number]: string; }[]}): void {
		if(settings == undefined) {
			return;
		}
		if(settings["front"] != undefined) {
			for(var i: number = 0; i < settings["front"].length; i++) {
				if(settings["front"][i] != undefined) {
					var setting = settings["front"][i];
					this.rival_front_num[setting["type"]] = setting["value"];
				}
			}
		}
		if(settings["back"] != undefined) {
			for(var i: number = 0; i < settings["back"].length; i++) {
				if(settings["back"][i] != undefined) {
					var setting = settings["back"][i];
					this.rival_back_num[setting["type"]] = setting["value"];
				}
			}
		}
	}

	// 設定保存
	save_setting(): void {
		try {
			// タイトルをlocalStorageに保存
			var key: string = this.SAVE_DATA_KEY + "_title_" + this.save_data_id;
			localStorage.setItem(key, this.save_data_title);

			// 設定をlocalStorageに保存
			key = this.SAVE_DATA_KEY + "_" + this.save_data_id;
			localStorage.setItem(key, JSON.stringify(this.get_setting()));
		} catch(e) {
			console.log(e.message);
			alert("データ保存時にエラーが発生しました。");
		}
	}

	// 設定読込
	load_setting(): void {
		try {
			// localStorageからタイトル読み込み
			var key: string = this.SAVE_DATA_KEY + "_title_" + this.save_data_id;
			var title: string = localStorage.getItem(key);

			// localStorageから設定読み込み
			key = this.SAVE_DATA_KEY + "_" + this.save_data_id;
			var value: string = localStorage.getItem(key);

			if(value != null) {
				if(title == null) {
					title = "";
				}
				var setting: { [index: string]: any; } = JSON.parse(value);
				this.save_data_title = title;
				this.set_setting(setting);
			} else {
				alert("データが保存されていません。");
			}
		} catch(e) {
			console.log(e.message);
			alert("データ読み込み時にエラーが発生しました。");
		}
	}

	// コード生成
	generate_code(): void {
		// 設定取得
		var setting: { [index: string]: any; } = this.get_setting();

		// 設定データをJSON形式に変換
		var json: string = JSON.stringify(setting);

		try {
			// コード化
			var code: string = Common.get_compress_data(json);

			var url: string = Common.get_page_url() + "?code=" + code;

			this.code = code;
			this.apply_code_url = url;
		} catch(e) {
			console.log(e.message);
			alert("コードの生成に失敗しました。");
		}
	}

	// コード適用
	apply_code(): void {
		try {
			// コードからJSONデータ復元
			var json: string = Common.get_decompress_data(this.code);

			// JSONデータから設定データ復元
			var setting: { [index: string]: any; } = JSON.parse(json);

			var url: string = Common.get_page_url() + "?code=" + this.code;

			// 設定
			this.set_setting(setting);
			this.apply_code_url = url;
		} catch(e) {
			console.log(e.message);
			alert("コードの適用に失敗しました。");
		}
	}

	is_smartphone(): boolean { return Common.is_smartphone(); }

	/******************************************************************************/
	// スキル関連
	/******************************************************************************/
	// スキル入力モードがマニュアルか
	is_skill_input_type_manual(): boolean { return (parseInt(this.skill_input_type) == SKILL_INPUT_MODE.MANUAL); }

	// スキル自動計算
	calc_skill_value(): void {
		if(!this.is_skill_input_type_manual()) {
			// 初期化
			for(var i: number = 0; i < this.idol_list.length; i++) {
				var idol: UserIdol = this.idol_list[i];
				idol.offense_skill = "0";
				idol.defense_skill = "0";
				idol.enable_skill = false;
			}

			// 発動スキル取得
			jQuery.when(this.get_invoke_skill_list()).done((invoke_skill_list: { [index: string]: string; }[]) => {
				// スキル効果適用
				for(var i: number = 0; i < invoke_skill_list.length; i++) {
					var invoke_skill: { [index: string]: string; } = invoke_skill_list[i];
					var target_member: number = parseInt(invoke_skill["target_member"]);
					switch (target_member) {
						case SKILL_TARGET_MEMBER.SELF:
							// 発動者
							// 何もしない
							break;
						case SKILL_TARGET_MEMBER.FRONT:
							// フロントメンバー
							this.apply_skill_effect_front_member(invoke_skill, i);
							break;
						case SKILL_TARGET_MEMBER.BACK:
							// バックメンバー
							this.apply_skill_effect_back_member(invoke_skill, i);
							break;
						case SKILL_TARGET_MEMBER.ALL:
							// 全メンバー
							this.apply_skill_effect_front_member(invoke_skill, i);
							this.apply_skill_effect_back_member(invoke_skill, i);
							break;
						default:
							break;
					}
				}
			});
		}
	}

	// 発動スキル取得
	get_invoke_skill_list(): JQueryPromise<any> {
		var front_num: number = parseInt(this.front_num);

		// 属性ごとのメンバー人数取得
		var member_num: number[][] = [[0, 0, 0], [0, 0, 0]];
		for(var i: number = 0; i < this.idol_list.length; i++) {
			var type: number = parseInt(this.idol_list[i].type);
			if(i < front_num) {
				member_num[0][type]++;
			} else {
				member_num[1][type]++;
			}
		}

		// 属性ごとの相手メンバー人数取得
		var rival_member_num: number[][] = [[0, 0, 0], [0, 0, 0]];
		for(var i: number = 0; i < this.rival_front_num.length; i++) {
			rival_member_num[0][i] = parseInt(this.rival_front_num[i]);
		}
		for(var i: number = 0; i < this.rival_back_num.length; i++) {
			rival_member_num[1][i] = parseInt(this.rival_back_num[i]);
		}

		// 発動可能スキル
		var deferred: JQueryDeferred<any> = jQuery.Deferred();
		jQuery.when(Common.load_skill_list()).done((skill_data_list: { [index: string]: { [index: string]: any; } }) => {
			var invoke_skill_list: { [index: string]: string; }[] = [];
			var skill_count: number = 0;
			var skill_input_type: number = parseInt(this.skill_input_type);
			for(var i: number = 0; i < this.idol_list.length && i < front_num; i++) {
				var idol: UserIdol = this.idol_list[i];
				if(parseInt(idol.skill_id) > 0 && parseInt(idol.skill_level) > 0) {
					// 発動スキルを取得
					var skill: { [index: string]: string; } = this.check_skill_enable(idol, skill_data_list, skill_count, member_num, rival_member_num);
					if(skill != null) {
						idol.enable_skill = true;
						invoke_skill_list.push(skill);
						skill_count++;
					}

					if(skill_input_type != SKILL_INPUT_MODE.AUTO_MEAN && skill_count >= this.MAX_INVOKE_SKILL_NUM) {
						break;
					}
				}
			}
			deferred.resolve(invoke_skill_list);
		});

		return deferred.promise();
	}

	// 発動可能なスキルかチェック
	check_skill_enable(idol: UserIdol, skill_data_list: { [index: string]: { [index: string]: any; } }, skill_count: number, member_num: number[][], rival_member_num: number[][]): { [index: string]: string; } {
		var enable_skill_type = parseInt(this.enable_skill_type);

		// 発動スキルを取得
		var enable: boolean = false;
		var skill: { [index: string]: string; } = jQuery.extend(true, {}, skill_data_list[idol.skill_id]);
		skill["skill_level"] = idol.skill_level;
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
					//enable = this.check_skill_target(target_member, target_type, rival_member_num);
					enable = true;
				}
			}
		}

		if(!enable) {
			skill = null;
		}

		return skill;
	}

	// スキルの対象範囲をチェック
	check_skill_target(target_member: number, target_type: number, member_num: number[][]): boolean {
		var enable_skill: boolean = false;

		switch(target_member) {
			case SKILL_TARGET_MEMBER.FRONT:
				// フロントメンバー
				// 対象が存在するかチェック
				for(var i: number = 0; i < member_num[0].length; i++) {
					if((target_type & (1 << i)) > 0 && member_num[0][i] > 0) {
						enable_skill = true;
						break;
					}
				}
				break;
			case SKILL_TARGET_MEMBER.BACK:
				// バックメンバー
				// 対象が存在するかチェック
				for(var i: number = 0; i < member_num[1].length; i++) {
					if((target_type & (1 << i)) > 0 && member_num[1][i] > 0) {
						enable_skill = true;
						break;
					}
				}
				break;
			case SKILL_TARGET_MEMBER.ALL:
				// 全メンバー
				// 対象が存在するかチェック
				for(var i: number = 0; i < member_num.length; i++) {
					for(var j: number = 0; j < member_num[i].length; j++) {
						if((target_type & (1 << j)) > 0 && member_num[i][j] > 0) {
							enable_skill = true;
							break;
						}
					}
				}
				break;
		}

		return enable_skill;
	}

	// フロントメンバーにスキル効果適用
	apply_skill_effect_front_member(invoke_skill: { [index: string]: string; }, index: number): void {
		var front_num: number = parseInt(this.front_num);
		for(var i: number = 0; i < this.idol_list.length && i < front_num; i++) {
			this.apply_skill_effect(this.idol_list[i], invoke_skill, index);
		}
	}

	// バックメンバーにスキル効果適用
	apply_skill_effect_back_member(invoke_skill: { [index: string]: string; }, index: number): void {
		var target_num: number = parseInt(invoke_skill["target_num"]);
		var front_num: number = parseInt(this.front_num);

		if(target_num == -1) {
			target_num = this.idol_list.length - front_num;
		}
		var count: number = 0;
		for(var i: number = front_num; i < this.idol_list.length && count < target_num; i++) {
			if(this.apply_skill_effect(this.idol_list[i], invoke_skill, index)) {
				count++;
			}
		}
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
		if(parseInt(this.skill_input_type) == SKILL_INPUT_MODE.AUTO_MEAN) {
			var rate = this.SKILL_INVOCATION_RATE_LIST[index];
			if(rate != undefined) {
				skill_value = skill_value * (rate / 100);
			}
		}
		var offense_skill: number = parseFloat(idol.offense_skill);
		var defense_skill: number = parseFloat(idol.defense_skill);
		switch(target_param) {
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
		idol.offense_skill = offense_skill.toString();
		idol.defense_skill = defense_skill.toString();

		return result;
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
		}

		return result;
	}
}
