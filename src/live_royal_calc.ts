/// <reference path="live_tour_calc.base.ts" />

class ViewModel extends BaseLiveTourCalcViewModel {
	// 定数
	// バトルポイント係数
	static BATTLE_POINT_RATE_LIST: number[] = [0.8, 1, 1.5, 2, 2.5];		// ロワイヤルLIVE時
	static GUEST_BATTLE_POINT_RATE_LIST: number[] = [0.5, 1, 1.6, 2.25, 3];	// ゲストLIVE時

	// 入力項目
	battle_point: string;

	constructor() {
		super();

		// 入力値
		this.calc_type = CALCULATION_TYPE.ROYAL.toString();
		this.battle_point = "2";

		// セーブデータ関係
		this.save_data_key = "imas_cg_live_royal_calc";

		this.init_list();

		ko.track(this);
	}
	// 発揮値
	actual_status(): number[] { return this.calculation(); }

	is_guest_live(): boolean { return (parseInt(this.calc_type) == CALCULATION_TYPE.ROYAL_GUEST); }


	// 発揮値計算
	calculation(): number[] {
		// スキル効果反映
		this.calc_skill_value();

		var battle_point_rate: number = this.get_battle_point_rate();
		var front_num: number = parseInt(this.front_num);
		var producer_type: number = parseInt(this.producer_type);
		var voltage_bonus: number = parseFloat(this.voltage_bonus);
		var training_room_level = parseInt(this.training_room_level);
		var is_guest_live: boolean = this.is_guest_live();

		// 総発揮値計算
		var total_offense: number = 0;
		var total_defense: number = 0;
		var damage: Damage = new Damage();

		var front_offense: number = 0;
		var front_defense: number = 0;
		var back_offense: number = 0;
		var back_defense: number = 0;
		for(var i: number = 0; i < this.idol_list.length; i++) {
			var idol: UserIdol = this.idol_list[i];
			var member_type: boolean = (i < front_num);

			// 発揮値計算
			idol.calculation_live_royal(member_type, is_guest_live, producer_type, this.appeal_bonus, voltage_bonus, battle_point_rate, training_room_level);
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

			// 与ダメージ計算
			if(is_guest_live) {
				damage.add_damage(idol.calc_live_royal_damage());
			}

			// 色設定
			idol.style = "numeric " + (member_type ? "front" : "back");
		}
		this.front_offense = front_offense;
		this.front_defense = front_defense;
		this.back_offense = back_offense;
		this.back_defense = back_defense;

		// ぷちデレラボーナス計算
		var petit_idol_total_status: number = this.calculation_petit_idol();
		damage.add_bonus(Math.floor(petit_idol_total_status * UserIdol.LIVE_ROYAL_DAMAGE_COEFFICIENT));
		total_offense += petit_idol_total_status;
		total_defense += petit_idol_total_status;
		this.petit_idol_total_status = petit_idol_total_status;

		this.damage_list = [damage];

		return [total_offense, total_defense];
	}

	calculation_petit_idol(): number {
		var bonus_type: number = parseInt(this.petit_idol_bonus_type);
		var bonus_parameter: number = parseInt(this.petit_idol_bonus_parameter);
		var battle_point_rate: number = this.get_battle_point_rate();
		var voltage_bonus: number = parseFloat(this.voltage_bonus);

		var status: number = 0;
		for(var i: number = 0; i < this.petit_idol_list.length; i++) {
			var petit_idol: UserPetitIdol = this.petit_idol_list[i];
			petit_idol.calculation_live_royal(bonus_type, bonus_parameter, battle_point_rate, voltage_bonus);
			status += petit_idol.status;
		}

		return Math.ceil(status);
	}

	get_battle_point_rate(): number {
		var battle_point: number = parseInt(this.battle_point);
		var battle_point_rate: number = ViewModel.BATTLE_POINT_RATE_LIST[battle_point - 1];
		if(this.is_guest_live()) {
			battle_point_rate = ViewModel.GUEST_BATTLE_POINT_RATE_LIST[battle_point - 1];
		}
		return battle_point_rate;
	}

	/******************************************************************************/
	// 設定関連
	/******************************************************************************/
	// 設定取得
	get_setting(): { [index: string]: any; } {
		var setting: { [index: string]: any; } = super.get_setting();

		setting["battle_point"] = this.battle_point;
		setting["voltage_bonus"] = this.voltage_bonus;

		return setting;
	}

	// 設定反映
	set_setting(setting: { [index: string]: any; }): void {
		super.set_setting(setting);

		this.battle_point = setting["battle_point"];
		this.voltage_bonus = setting["voltage_bonus"];
	}

	/******************************************************************************/
	// スキル関連
	/******************************************************************************/
	check_target_rival_unit_skill_enable(skill: { [index: string]: any; }, rival_member_num: number[][]): { [index: string]: any; } {
		if(this.is_guest_live()) {
			return super.check_target_rival_unit_skill_enable(skill, rival_member_num);
		}

		var enable_skill_type: number = parseInt(this.enable_skill_type);
		var target_param: number = parseInt(skill["target_param"]);

		// 有効スキルかチェック
		if(enable_skill_type != ENABLE_SKILL_TYPE.ALL && (enable_skill_type ^ target_param) == 0) {
			return null;
		}

		return skill;
	}

	// スキル効果適用可能チェック
	check_apply_skill(idol: UserIdol, invoke_skill: { [index: string]: string; }): boolean {
		if(this.is_guest_live()) {
			return super.check_apply_skill(idol, invoke_skill);
		}

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

jQuery(function() {
	ko.applyBindings(new ViewModel());
});