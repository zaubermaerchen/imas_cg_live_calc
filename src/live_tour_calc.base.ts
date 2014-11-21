/*!
 * THE IDOLM@STER CINDERELLA GIRLS Exertion Value Calculator Base Class for Live Tour
 * Copyright (c) 2013 Mutsuki Kimuraya (http://www4018uf.sakura.ne.jp/)
 * Released under the MIT license
 * http://opensource.org/licenses/mit-license.php
 */
/// <reference path="live_calc.base.ts" />

class BaseLiveTourCalcViewModel extends BaseLiveCalcViewModel {
	// 定数
	// 最大スキル発動個数
	MAX_INVOKE_SKILL_NUM: number = 5;
	// スキル発動率
	SKILL_INVOCATION_RATE_LIST: number[] = [
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
	// ダメージ係数
	DAMAGE_COEFFICIENT: { [index: string]: number; } = {
		MIN: 0.97,
		MAX: 1.02,
		AVG: 0.995
	};
	TOTAL_DAMAGE_COEFFICIENT: number = 5;

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

		this.max_member_num = 0;
		this.voltage_bonus = "0";

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
}