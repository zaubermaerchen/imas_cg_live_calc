/// <reference path="typings/knockout/knockout.d.ts" />
/// <reference path="typings/knockout.es5/knockout.es5.d.ts" />
/// <reference path="common.ts" />
/// <reference path="idol.model.ts" />
/// <reference path="petit_idol.ts" />
/// <reference path="skill.ts" />

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
	DEFENSE = 2	    // 守備時発動スキル
}

class BaseLiveCalcViewModel {
	// ぷちアイドル最大数
	static PETIT_IDOL_NUM: number = 3;

	// 入力項目
	calc_type: string;
	front_num: string;
	producer_type: string;
	appeal_bonus: string[];
	training_room_level: string;
	idol_list: UserIdol[];
	petit_idol_list: UserPetitIdol[];
	skill_input_type: string;
	enable_skill_type: string;
	rival_front_num: string[];
	rival_back_num: string[];

	petit_idol_total_status: number;

	// 特技関係
	max_skill_invoke: number;
	skill_invocation_rate_list: number[];

	// セーブデータ関係
	save_data_key: string;
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
		this.appeal_bonus = ["0", "0", "0"];
		this.training_room_level = "0";
		this.idol_list = [];
		this.petit_idol_list = [];
		this.skill_input_type = "0";
		this.enable_skill_type = "0";
		this.rival_front_num = ["0", "0", "0"];
		this.rival_back_num = ["0", "0", "0"];

		this.petit_idol_total_status = 0;

		// 特技関係
		this.max_skill_invoke = 0;
		this.skill_invocation_rate_list = [];

		// セーブデータ関係
		this.save_data_key = "";
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
		this.init_petit_idol_list();

		// コードがあったら適用
		var param_list: { [index: string]: string; } = Common.get_param_list();
		if(param_list["code"]) {
			this.code = param_list["code"];
			this.apply_code();
		}
	}
	init_idol_list(): void {}
	init_petit_idol_list(): void {
		var petit_idols: UserPetitIdol[] = [];
		for(var i: number = 0; i < BaseLiveCalcViewModel.PETIT_IDOL_NUM; i++) {
			var petit_idol: UserPetitIdol = new UserPetitIdol();
			petit_idols.push(petit_idol);
		}
		this.petit_idol_list = petit_idols;
	}

	calculation_petit_idol(event_bonus: number = 0, bonus_type: number = -1, bonus_parameter: number = -1): number {
		var petit_idol_bonus: number = 0;
		for(var i: number = 0; i < this.petit_idol_list.length; i++) {
			var petit_idol: UserPetitIdol = this.petit_idol_list[i];
			petit_idol.calculation(event_bonus, bonus_type, bonus_parameter);
			petit_idol_bonus += petit_idol.status;
		}

		return petit_idol_bonus;
	}

	is_smartphone(): boolean { return Common.is_smartphone(); }

	/******************************************************************************/
	// 設定関連
	/******************************************************************************/
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
	set_idol_setting(settings: { [index: string]: string; }[], max_num: number = -1): JQueryPromise<any> {
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

		if(max_num == -1) {
			max_num = settings.length;
		}

		jQuery.when.apply(null, method_list).done(() => {
			var idol_list: UserIdol[] = [];
			for(var i: number = 0; i < settings.length && i < max_num; i++) {
				var idol: UserIdol = new UserIdol();
				idol.set_setting(settings[i]);
				idol_list.push(idol);
			}
			for(var i: number = idol_list.length; i < max_num; i++) {
				var idol: UserIdol = new UserIdol();
				idol_list.push(idol);
			}

			this.idol_list = idol_list;
			deferred.resolve();
		});

		return deferred.promise();
	}

	// アピールボーナス設定取得
	get_appeal_bonus_setting(): { [index: string]: string; }[] {
		var settings: { [index: string]: string; }[] = [];

		for(var i: number = 0; i < this.appeal_bonus.length; i++) {
			var setting: { [index: string]: string; } = {};
			setting["type"] = i.toString();
			setting["value"] = this.appeal_bonus[i];
			settings.push(setting);
		}

		return settings;
	}

	// アピールボーナス設定反映
	set_appeal_bonus_setting(settings: { [index: string]: number; }[]): void {
		if(settings == undefined) {
			return;
		}

		var appeal_bonus: string[] = this.appeal_bonus;
		for(var i: number = 0; i < settings.length; i++) {
			if(settings[i] != undefined) {
				var setting: { [index: string]: number; } = settings[i];
				appeal_bonus[setting["type"]] = setting["value"].toString();
			}
		}
		this.appeal_bonus = appeal_bonus;
		this.change_appeal_bonus();
	}

	// ライバルユニット設定取得
	get_rival_member_setting(): { [index: string]: { [index: number]: string; }[]} {
		var settings: { [index: string]: { [index: number]: string; }[]} = {};

		settings["front"] = [];
		for(var i: number = 0; i < this.rival_front_num.length; i++) {
			var setting: { [index: string]: string; } = {};
			setting["type"] = i.toString();
			setting["value"] = this.rival_front_num[i];
			settings["front"].push(setting);
		}

		settings["back"] = [];
		for(var i: number = 0; i < this.rival_back_num.length; i++) {
			var setting: { [index: string]: string; } = {};
			setting["type"] = i.toString();
			setting["value"] = this.rival_back_num[i];
			settings["back"].push(setting);
		}

		return settings;
	}

	// ライバルユニット設定反映
	set_rival_member_setting(settings: { [index: string]: { [index: string]: number; }[]}): void {
		if(settings == undefined) {
			return;
		}
		if(settings["front"] != undefined) {
			var rival_front_num: string[] = this.rival_front_num;
			for(var i: number = 0; i < settings["front"].length; i++) {
				if(settings["front"][i] != undefined) {
					var setting: { [index: string]: number; } = settings["front"][i];
					rival_front_num[setting["type"]] = setting["value"].toString();
				}
			}
			this.rival_front_num = rival_front_num;
			this.change_rival_front_num();
		}
		if(settings["back"] != undefined) {
			var rival_back_num: string[] = this.rival_back_num;
			for(var i: number = 0; i < settings["back"].length; i++) {
				if(settings["back"][i] != undefined) {
					var setting: { [index: string]: number; } = settings["back"][i];
					rival_back_num[setting["type"]] = setting["value"].toString();
				}
			}
			this.rival_back_num = rival_back_num;
			this.change_rival_back_num();
		}
	}

	// ぷちアイドル設定取得
	get_petit_idol_setting(): { [index: string]: string; }[] {
		var setting: { [index: string]: string; }[] = [];
		for(var i: number = 0; i < this.petit_idol_list.length; i++) {
			setting.push(this.petit_idol_list[i].get_setting());
		}

		return	setting;
	}

	// ぷちアイドル設定反映
	set_petit_idol_setting(settings: { [index: string]: string; }[], max_num: number): void{
		if(settings == null) {
			return;
		}
		var petit_idols: UserPetitIdol[] = [];
		for(var i: number = 0; i < settings.length && i != max_num; i++) {
			var petit_idol: UserPetitIdol = new UserPetitIdol();
			petit_idol.set_setting(settings[i]);
			petit_idols.push(petit_idol);
		}

		this.petit_idol_list = petit_idols;
	}

	// 設定保存
	save_setting(): void {
		try {
			// タイトルをlocalStorageに保存
			var key: string = this.save_data_key + "_title_" + this.save_data_id;
			localStorage.setItem(key, this.save_data_title);

			// 設定をlocalStorageに保存
			key = this.save_data_key + "_" + this.save_data_id;
			localStorage.setItem(key, JSON.stringify(this.get_setting()));
		} catch(e) {
			console.log(e.message);
			alert("データ保存時にエラーが発生しました。");
		}
	}

	// 設定読込
	load_setting(): void {
		// localStorageからタイトル読み込み
		var key: string = this.save_data_key + "_title_" + this.save_data_id;
		var title: string = localStorage.getItem(key);

		// localStorageから設定読み込み
		key = this.save_data_key + "_" + this.save_data_id;
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

	/******************************************************************************/
	// スキル関連
	/******************************************************************************/
	// スキル入力モードがマニュアルか
	is_skill_input_type_manual(): boolean { return (parseInt(this.skill_input_type) == SKILL_INPUT_MODE.MANUAL); }

	// スキル自動計算
	calc_skill_value(): void {
		if(this.is_skill_input_type_manual()) {
			return;
		}

		// 初期化
		for(var i: number = 0; i < this.idol_list.length; i++) {
			var idol: UserIdol = this.idol_list[i];
			idol.offense_skill = "0";
			idol.defense_skill = "0";
			idol.enable_skill = false;
		}

		// 発動スキル取得
		this.get_invoke_skill_list().done((skills: Skill[]) => {
			// スキル効果適用
			var front_num: number = parseInt(this.front_num);
			for(var i: number = 0; i < this.idol_list.length; i++) {
				var front_member = (i < front_num);
				this.apply_skill_effect(this.idol_list[i], front_member, skills);
			}
		});
	}

	// 発動スキル取得
	get_invoke_skill_list(): JQueryPromise<Skill[]> {
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
		var deferred: JQueryDeferred<Skill[]> = jQuery.Deferred()
		Common.load_skill_list().done((skill_data_list: { [index: string]: { [index: string]: any; } }) => {
			var skills: Skill[] = [];
			var skill_input_type: number = parseInt(this.skill_input_type);
			for(var i: number = 0; i < this.idol_list.length && i < front_num; i++) {
				var idol: UserIdol = this.idol_list[i];
				
				var skill: Skill = this.get_invoke_skill(idol, skill_data_list, member_num, rival_member_num, skills.length);
				if(skill == null) {
					continue;
				}
				skills.push(skill);

				if(skill_input_type != SKILL_INPUT_MODE.AUTO_MEAN && skills.length >= this.max_skill_invoke) {
					break;
				}
			}
			deferred.resolve(skills);
		});

		return deferred.promise();
	}


	get_invoke_skill(idol: UserIdol, skill_data_list: { [index: string]: { [index: string]: any; } }, 
	                 member_num: number[][], rival_member_num: number[][], index: number): Skill {
		if(parseInt(idol.skill_id) == 0 || parseInt(idol.skill_level) == 0) {
			return null;
		}
		// 発動スキルを取得
		var skill: Skill = this.get_skill(idol, skill_data_list);
		if(skill == null) {
			return null
		}
		if(!this.check_skill_enable(skill, member_num, rival_member_num)) {
			return null;
		}

		idol.enable_skill = true;
		this.correct_skill_value(skill, index);
		if(skill.target_member == SKILL_TARGET_MEMBER.SELF) {
			// 自分スキルの適用
			this.apply_skill_value(idol, skill);
		}
		return skill;
	}

	// スキル取得
	get_skill(idol: UserIdol, skill_data_list: { [index: string]: { [index: string]: any; } }): Skill {
		// 発動スキルを取得
		var skill_data:{ [index: string]: any; } = jQuery.extend(true, {}, skill_data_list[idol.skill_id]);
		if (skill_data["skill_value_list"] == null || skill_data["skill_value_list"].length == 0) {
			return null;
		}
		var skill: Skill = new Skill(skill_data, parseInt(idol.skill_level));
		return skill;
	}
	
	check_skill_enable(skill: Skill, member_num: number[][], rival_member_num: number[][]): boolean {
		if(skill.target_unit == SKILL_TARGET_UNIT.OWN) {
			// 自分
			return this.check_target_own_unit_skill_enable(skill, member_num);
		}
		// 相手
		return this.check_target_rival_unit_skill_enable(skill, rival_member_num);
	}

	check_target_own_unit_skill_enable(skill: Skill, member_num: number[][]): boolean {
		var enable_skill_type: number = parseInt(this.enable_skill_type);

		// 有効スキルかチェック
		if(enable_skill_type != ENABLE_SKILL_TYPE.ALL &&
			skill.target_param != SKILL_TARGET_PARAM.ALL &&
			enable_skill_type != skill.target_param) {
			return false;
		}

		if(skill.target_member == SKILL_TARGET_MEMBER.SELF) {
			return true;
		}

		// 対象範囲チェック
		return skill.check_skill_target(member_num);
	}

	check_target_rival_unit_skill_enable(skill: Skill, rival_member_num: number[][]): boolean {
		var enable_skill_type: number = parseInt(this.enable_skill_type);

		// 有効スキルかチェック
		return (enable_skill_type == ENABLE_SKILL_TYPE.ALL || (enable_skill_type ^ skill.target_param) > 0);
	}
	
	//
	correct_skill_value(skill: Skill, index: number): void {
		if(parseInt(this.skill_input_type) != SKILL_INPUT_MODE.AUTO_MEAN) {
			return;
		}
		var rate = this.skill_invocation_rate_list[index];
		if(rate != undefined) {
			skill.value *= (rate / 100);
		}
	}


	apply_skill_effect(idol: UserIdol, front_member: boolean, skills: Skill[]): void {
		for(var i: number = 0; i < skills.length; i++) {
			var skill: Skill = skills[i];
			if(!this.check_apply_skill(idol, skill)) {
				continue;
			}
			switch (skill.target_member) {
				case SKILL_TARGET_MEMBER.SELF:
					// 発動者
					// 何もしない
					break;
				case SKILL_TARGET_MEMBER.FRONT:
					// フロントメンバー
					if(front_member) {
						this.apply_skill_value(idol, skill);
					}
					break;
				case SKILL_TARGET_MEMBER.BACK:
					// バックメンバー
					if(!front_member && (skill.target_num == -1 || skill.target_num > 0)) {
						this.apply_skill_value(idol, skill);
						skill.target_num--;
					}
					break;
				case SKILL_TARGET_MEMBER.ALL:
					// 全メンバー
					if(front_member) {
						this.apply_skill_value(idol, skill);
					} else if(skill.target_num == -1 || skill.target_num > 0) {
						this.apply_skill_value(idol, skill);
						skill.target_num--;
					}
					break;
				default:
					break;
			}
		}
	}

	apply_skill_value(idol: UserIdol, skill: Skill): void {
		var offense_skill: number = parseFloat(idol.offense_skill);
		var defense_skill: number = parseFloat(idol.defense_skill);
		switch(skill.target_param) {
			case SKILL_TARGET_PARAM.ALL:
				offense_skill += skill.value;
				defense_skill += skill.value;
				break;
			case SKILL_TARGET_PARAM.OFFENSE:
				offense_skill += skill.value;
				break;
			case SKILL_TARGET_PARAM.DEFENSE:
				defense_skill += skill.value;
				break
		}
		idol.offense_skill = offense_skill.toString();
		idol.defense_skill = defense_skill.toString();
	}

	// スキル効果適用可能チェック
	check_apply_skill(idol: UserIdol, skill: Skill): boolean {
		var result: boolean = false;

		var type: number = parseInt(idol.type);

		// スキルが効果適用可能かチェック
		if(skill.target_unit == SKILL_TARGET_UNIT.OWN) {
			if(skill.target_member == SKILL_TARGET_MEMBER.SELF || (skill.target_type & (1 << type)) > 0) {
				result = true;
			}
		}

		return result;
	}
}
