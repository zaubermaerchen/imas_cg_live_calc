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

class Skill {
	target_unit: number;
	target_member: number;
	target_type: number;
	target_num: number;
	target_param: number;
	value: number;

	constructor(skill_data:{ [index: string]: any; }, level: number) {
		this.target_unit = parseInt(skill_data["target_unit"]);
		this.target_member = parseInt(skill_data["target_member"]);
		this.target_type = parseInt(skill_data["target_type"]);
		this.target_num = parseInt(skill_data["target_num"]);
		this.target_param = parseInt(skill_data["target_param"]);

		this.value = 0;
		if (level > 0) {
			this.value = parseInt(skill_data["skill_value_list"][level - 1]);
		}
	}

	// スキルの対象範囲をチェック
	check_skill_target(member_num: number[][]): boolean {
		var enable_skill: boolean = false;

		switch(this.target_member) {
			case SKILL_TARGET_MEMBER.FRONT:
				// フロントメンバー
				// 対象が存在するかチェック
				for(var i: number = 0; i < member_num[0].length; i++) {
					if((this.target_type & (1 << i)) > 0 && member_num[0][i] > 0) {
						enable_skill = true;
						break;
					}
				}
				break;
			case SKILL_TARGET_MEMBER.BACK:
				// バックメンバー
				// 対象が存在するかチェック
				for(var i: number = 0; i < member_num[1].length; i++) {
					if((this.target_type & (1 << i)) > 0 && member_num[1][i] > 0) {
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
						if((this.target_type & (1 << j)) > 0 && member_num[i][j] > 0) {
							enable_skill = true;
							break;
						}
					}
				}
				break;
		}

		return enable_skill;
	}
}