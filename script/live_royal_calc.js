/// <reference path="typings/jquery/jquery.d.ts" />
var Common = (function () {
    function Common() {
    }
    // アイドルリスト読込
    Common.load_idol_list = function (type, rarity, fields) {
        var _this = this;
        if (fields === void 0) { fields = []; }
        var key = this.IDOL_LIST_KEY_BASE;
        if (type == -1 && rarity == -1) {
            key += "_all";
        }
        else {
            if (type != -1) {
                key += "_t" + type;
            }
            if (rarity != -1) {
                key += "_r" + rarity;
            }
        }
        var data = this.cache_data[key];
        var deferred = jQuery.Deferred();
        if (data != null) {
            deferred.resolve(JSON.parse(data));
        }
        else {
            var post_data = {};
            if (type != -1) {
                post_data["type"] = type;
            }
            if (rarity != -1) {
                post_data["rarity"] = rarity;
            }
            if (fields.length > 0) {
                post_data["fields"] = fields.join(" ");
            }
            jQuery.post(this.IDOL_DATA_API_URL, post_data, function (response) {
                _this.cache_data[key] = JSON.stringify(response);
                deferred.resolve(response);
            }, "json");
        }
        return deferred.promise();
    };
    // スキルリスト読込
    Common.load_skill_list = function () {
        var _this = this;
        var key = this.SKILL_LIST_KEY;
        var data = this.cache_data[key];
        var deferred = jQuery.Deferred();
        if (data != null) {
            deferred.resolve(JSON.parse(data));
        }
        else {
            jQuery.post(this.SKILL_DATA_API_URL, function (response) {
                _this.cache_data[key] = JSON.stringify(response);
                deferred.resolve(response);
            }, "json");
        }
        return deferred.promise();
    };
    // 文字列圧縮
    Common.get_compress_data = function (str) {
        // 文字列を文字コード配列に変換
        var data = [];
        for (var i = 0; i < str.length; i++) {
            var char_code = str.charCodeAt(i);
            var dec = parseInt(char_code.toString(), 10);
            data.push(dec);
        }
        //  データを圧縮
        var compress_data = new Zlib.Deflate(data).compress();
        // バイナリ文字列に変換
        var binary = "";
        for (var i = 0; i < compress_data.length; i++) {
            binary += ("0" + compress_data[i].toString(16)).slice(-2);
        }
        return binary;
    };
    // 文字列伸長
    Common.get_decompress_data = function (binary) {
        // バイナリ文字列を文字コード配列に変換
        var data = [];
        for (var i = 0; i < binary.length; i = i + 2) {
            data.push(parseInt(binary.substr(i, 2), 16));
        }
        // データを伸張
        var decompress_data = new Zlib.Inflate(data).decompress();
        // 文字列に変換
        var str = "";
        for (var i = 0; i < decompress_data.length; i++) {
            str += String.fromCharCode(decompress_data[i]);
        }
        return str;
    };
    // URLからパラメータ取得
    Common.get_param_list = function () {
        var param_list = {};
        var index = location.href.indexOf("?");
        if (index > -1) {
            var query_string = location.href.slice(index + 1);
            var parameters = query_string.split("&");
            for (var i = 0; i < parameters.length; i++) {
                var parameter = parameters[i].split("=");
                if (parameter[1]) {
                    param_list[parameter[0]] = parameter[1];
                }
            }
        }
        return param_list;
    };
    // 表示しているページのURL取得
    Common.get_page_url = function () {
        var url = location.href;
        var index = url.indexOf("?");
        if (index > -1) {
            url = url.slice(0, index);
        }
        return url;
    };
    Common.get_qrcode_url = function (url, size) {
        if (size === void 0) { size = 150; }
        var param_list = [];
        param_list.push("chs=" + size + "x" + size);
        param_list.push("cht=qr");
        param_list.push("chl=" + url);
        return this.GOOGLE_CHART_API_URL + "?" + param_list.join("&");
    };
    // 文字列を数値に変換
    Common.to_int = function (value) {
        // 整数文字列以外の場合は0に
        if (!value.match(/^[-+]?[0-9]+$/)) {
            value = "0";
        }
        return parseInt(value, 10);
    };
    Common.is_smartphone = function () {
        return (navigator.userAgent.match(/(Android|iPhone|iPad|Mobile)/g) != null);
    };
    // 各種定義
    // アイドルデータAPI関係
    Common.IDOL_DATA_API_URL = "http://www4018uf.sakura.ne.jp/imas_cg/api/idol/list/";
    Common.IDOL_LIST_KEY_BASE = "imas_cg_idol_list";
    // スキルデータAPI関係
    Common.SKILL_DATA_API_URL = "http://www4018uf.sakura.ne.jp/imas_cg/api/skill/list/";
    Common.SKILL_LIST_KEY = "imas_cg_skill_list";
    // QRコード関連
    Common.GOOGLE_CHART_API_URL = "http://chart.apis.google.com/chart";
    Common.cache_data = {};
    return Common;
})();
/// <reference path="typings/knockout/knockout.d.ts" />
/// <reference path="typings/knockout.es5/knockout.es5.d.ts" />
/// <reference path="common.ts" />
var UserIdol = (function () {
    function UserIdol() {
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
    UserIdol.prototype.display_offense = function () {
        return Math.ceil(this.actual_offense);
    };
    UserIdol.prototype.display_defense = function () {
        return Math.ceil(this.actual_defense);
    };
    UserIdol.prototype.status = function () {
        return parseInt(this.offense) + parseInt(this.defense);
    };
    // コスト比
    UserIdol.prototype.offense_per_cost = function () {
        return this.calc_cost_ratio(parseInt(this.offense));
    };
    UserIdol.prototype.defense_per_cost = function () {
        return this.calc_cost_ratio(parseInt(this.defense));
    };
    UserIdol.prototype.status_per_cost = function () {
        return this.calc_cost_ratio(this.status());
    };
    // アイドル・スキル選択リスト
    UserIdol.prototype.select_idol_list = function () {
        return this.idol_data_list;
    };
    UserIdol.prototype.select_skill_list = function () {
        return this.skill_data_list;
    };
    // 実コスト取得
    UserIdol.prototype.get_cost = function () {
        var cost = parseInt(this.cost);
        if (this.is_festival && cost == UserIdol.TRAINER_COST) {
            cost = 5;
        }
        return cost;
    };
    // コスト比計算
    UserIdol.prototype.calc_cost_ratio = function (status) {
        // コスト取得
        var cost = parseInt(this.cost);
        var ratio = 0;
        if (cost > 0) {
            ratio = Math.round(status / cost * 100) / 100;
        }
        return ratio;
    };
    // コストオーバー時のステータス補正
    UserIdol.prototype.get_cost_corrected_status = function (status, cost, rest_cost) {
        if (cost > rest_cost) {
            var ratio = rest_cost / cost;
            if (this.is_survival) {
                status = Math.ceil(status * ratio);
            }
            else {
                ratio = Math.ceil(ratio * 10) / 10;
                //status = Math.round(status * ratio);
                status = Math.ceil(status * ratio);
            }
        }
        return status;
    };
    // アイドルリスト設定
    UserIdol.prototype.set_idol_list = function () {
        var _this = this;
        var deferred = jQuery.Deferred();
        var type = parseInt(this.type);
        var rarity = parseInt(this.rarity);
        jQuery.when(this.load_idol_list(type, rarity)).done(function (list) {
            _this.set_select_idol_list(list);
            _this.id = "0";
            _this.cost = "0";
            _this.offense = "0";
            _this.defense = "0";
            _this.offense_skill = "0";
            _this.defense_skill = "0";
            _this.skill_level = "10";
            _this.set_skill_info(null);
            deferred.resolve();
        });
        return deferred.promise();
    };
    UserIdol.prototype.set_select_idol_list = function (list) {
        var idol_list = [];
        idol_list.push({ "id": "0", "name": "-" });
        for (var key in list) {
            if (list.hasOwnProperty(key)) {
                var data = list[key];
                idol_list.push({ "id": data["idol_id"], "name": data["name"] });
            }
        }
        this.idol_data_list = idol_list;
    };
    // スキルリスト設定
    UserIdol.prototype.set_skill_list = function () {
        var _this = this;
        var deferred = jQuery.Deferred();
        jQuery.when(Common.load_skill_list()).done(function (list) {
            var skill_list = [];
            skill_list.push({ "id": "0", "name": "-" });
            for (var key in list) {
                if (list.hasOwnProperty(key)) {
                    var data = list[key];
                    skill_list.push({ "id": data["skill_id"], "name": data["comment"] });
                }
            }
            _this.skill_data_list = skill_list;
            deferred.resolve();
        });
        return deferred.promise();
    };
    // アイドル選択時
    UserIdol.prototype.change_idol = function () {
        var _this = this;
        var type = parseInt(this.type);
        var rarity = parseInt(this.rarity);
        var id = parseInt(this.id);
        this.offense_skill = "0";
        this.defense_skill = "0";
        if (!isNaN(id) && id != 0) {
            jQuery.when(this.load_idol_list(type, rarity)).done(function (idol_list) {
                var idol_data = idol_list[_this.id];
                // ステータス設定
                _this.cost = idol_data["cost"];
                _this.offense = idol_data["max_offense"];
                _this.defense = idol_data["max_defense"];
                _this.set_skill_info(idol_data);
            });
        }
        else {
            this.cost = "0";
            this.offense = "0";
            this.defense = "0";
            this.set_skill_info(null);
        }
    };
    // スキル情報設定
    UserIdol.prototype.set_skill_info = function (data) {
        var skill_id = "0";
        var skill_name = "無し";
        if (data != null) {
            skill_id = data["skill_id"];
            if (data["skill_name"] != undefined && data["skill_name"] != "") {
                skill_name = data["skill_name"];
            }
        }
        this.skill_name = skill_name;
        this.skill_id = skill_id;
    };
    // 設定取得
    UserIdol.prototype.get_setting = function () {
        var setting = {};
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
    };
    // 設定反映
    UserIdol.prototype.set_setting = function (setting) {
        var _this = this;
        this.type = setting["type"];
        this.rarity = setting["rarity"];
        jQuery.when(this.load_idol_list(parseInt(setting["type"]), parseInt(setting["rarity"]))).done(function (idol_list) {
            _this.set_select_idol_list(idol_list);
            _this.id = setting["id"];
            if (setting["cost"] != null) {
                _this.cost = setting["cost"];
            }
            _this.offense = setting["offense"];
            _this.defense = setting["defense"];
            _this.event_power = setting["event_power"];
            _this.offense_skill = setting["offense_skill"];
            _this.defense_skill = setting["defense_skill"];
            _this.set_skill_setting(idol_list[setting["id"]], setting["skill_id"], setting["skill_level"]);
        });
    };
    UserIdol.prototype.set_skill_setting = function (idol_data, skill_id, skill_level) {
        var _this = this;
        this.set_skill_info(idol_data);
        this.skill_level = skill_level;
        jQuery.when(Common.load_skill_list()).done(function (skill_list) {
            if (skill_list.hasOwnProperty(skill_id)) {
                _this.skill_id = skill_id;
            }
        });
    };
    // プロデューサー+アピールボーナスの補正値取得
    UserIdol.prototype.get_type_ratio = function (producer_type, appeal_bonus_list) {
        var type = parseInt(this.type);
        var ratio = 0;
        if (type == producer_type) {
            ratio += UserIdol.PRODUCER_TYPE_COEFFICIENT;
        }
        else {
            // プロデューサーとタイプが不一致の場合のみアピールボーナス補正値取得
            ratio += (parseInt(appeal_bonus_list[type]) / 100);
        }
        return ratio;
    };
    UserIdol.prototype.load_idol_list = function (type, rarity) {
        var fields = ["type", "rarity", "name", "cost", "max_offense", "max_defense", "skill_name", "skill_id"];
        var deferred = jQuery.Deferred();
        jQuery.when(Common.load_idol_list(type, rarity, fields)).done(function (response) {
            deferred.resolve(response);
        });
        return deferred.promise();
    };
    /******************************************************************************/
    // 通常・フェスティバル
    /******************************************************************************/
    // 攻発揮値計算
    UserIdol.prototype.calculation = function (cost_cut, rest_cost, member_type, producer_type, appeal_bonus_list, institution_list, status_up, training_room_level, high_tension) {
        var actual_offense = 0;
        var actual_defense = 0;
        if (!cost_cut || rest_cost >= 1) {
            var offense = parseInt(this.offense);
            var defense = parseInt(this.defense);
            var offense_skill = parseFloat(this.offense_skill);
            var defense_skill = parseFloat(this.defense_skill);
            if (member_type) {
                // フロント
                actual_offense = this.calc_front_status(offense, offense_skill, cost_cut, rest_cost, producer_type, appeal_bonus_list, institution_list, status_up, training_room_level, high_tension);
                actual_defense = this.calc_front_status(defense, defense_skill, cost_cut, rest_cost, producer_type, appeal_bonus_list, institution_list, status_up, training_room_level, high_tension);
            }
            else {
                // バック
                actual_offense = this.calc_back_status(offense, offense_skill, cost_cut, rest_cost);
                actual_defense = this.calc_back_status(defense, defense_skill, cost_cut, rest_cost);
            }
        }
        this.actual_offense = actual_offense;
        this.actual_defense = actual_defense;
    };
    UserIdol.prototype.calculation_festivalS = function (cost_cut, rest_cost, member_type, producer_type, appeal_bonus_list, institution_list, status_up, training_room_level, high_tension, groove_type) {
        var offense = parseInt(this.offense);
        var defense = parseInt(this.defense);
        var offense_skill = parseFloat(this.offense_skill);
        var defense_skill = parseFloat(this.defense_skill);
        var actual_offense = 0;
        var actual_defense = 0;
        if (member_type) {
            // フロント
            actual_offense = this.calc_festivalS_front_status(offense, offense_skill, cost_cut, rest_cost, producer_type, appeal_bonus_list, institution_list, status_up, training_room_level, high_tension, groove_type);
            actual_defense = this.calc_festivalS_front_status(defense, defense_skill, cost_cut, rest_cost, producer_type, appeal_bonus_list, institution_list, status_up, training_room_level, high_tension, -1);
        }
        else {
            // バック
            actual_offense = this.calc_back_status(offense, offense_skill, cost_cut, rest_cost);
            actual_defense = this.calc_back_status(defense, defense_skill, cost_cut, rest_cost);
        }
        this.actual_offense = actual_offense;
        this.actual_defense = actual_defense;
    };
    // フロントメンバー発揮値計算
    UserIdol.prototype.calc_front_status = function (status, skill, cost_cut, rest_cost, producer_type, appeal_bonus_list, institution_list, status_up, training_room_level, high_tension) {
        // コスト補正
        if (cost_cut) {
            status = this.get_cost_corrected_status(status, this.get_cost(), rest_cost);
        }
        // 施設補正
        var type = parseInt(this.type);
        for (var i = 0; i < institution_list.length; i++) {
            if (type == parseInt(institution_list[i])) {
                status = Math.ceil(status * (1 + UserIdol.INSTITUTION_COEFFICIENT));
                break;
            }
        }
        // ボーナス補正計算
        var ratio = 1 + this.get_type_ratio(producer_type, appeal_bonus_list) + (status_up + skill) / 100;
        if (this.is_festival) {
            ratio += training_room_level / 100;
            if (high_tension) {
                ratio += UserIdol.HIGH_TENSION_BONUS_COEFFICIENT;
            }
        }
        status = Math.ceil(status * ratio);
        return status;
    };
    // バックメンバー発揮値計算
    UserIdol.prototype.calc_back_status = function (status, skill, cost_cut, rest_cost) {
        // コスト値修正
        var cost = this.get_cost();
        // バックメンバー補正
        var base_status = Math.ceil(status * UserIdol.BACK_MEMBER_COEFFICIENT);
        var actual_status = base_status;
        // コスト補正
        if (cost_cut) {
            actual_status = this.get_cost_corrected_status(actual_status, cost, rest_cost);
        }
        // スキル補正計算
        if (!this.is_festival || (!cost_cut || rest_cost >= cost)) {
            var ratio = (skill) / 100;
            actual_status = Math.floor(actual_status) + Math.ceil(base_status * ratio * 10) / 10;
        }
        return actual_status;
    };
    // フェスフロントメンバー発揮値計算
    UserIdol.prototype.calc_festivalS_front_status = function (status, skill, cost_cut, rest_cost, producer_type, appeal_bonus_list, institution_list, status_up, training_room_level, high_tension, groove_type) {
        // コスト補正
        if (cost_cut) {
            status = this.get_cost_corrected_status(status, this.get_cost(), rest_cost);
        }
        // 施設補正
        var type = parseInt(this.type);
        for (var i = 0; i < institution_list.length; i++) {
            if (type == parseInt(institution_list[i])) {
                status = Math.ceil(status * (1 + UserIdol.INSTITUTION_COEFFICIENT));
                break;
            }
        }
        // ボーナス補正計算
        var ratio = 1 + this.get_type_ratio(producer_type, appeal_bonus_list) + (skill + training_room_level) / 100;
        status = Math.ceil(status * ratio);
        // コンボボーナス・
        ratio = 1 + status_up / 100;
        status = status * ratio;
        // グルーヴボーナス
        ratio = 1;
        if (type == groove_type) {
            ratio += UserIdol.GROOVE_BONUS_COEFFICIENT;
        }
        status = Math.round(status * ratio);
        // ハイテンションボーナス
        ratio = 1;
        if (high_tension) {
            ratio += UserIdol.HIGH_TENSION_BONUS_COEFFICIENT;
        }
        //status = Math.floor(status * ratio);
        status = Math.round(status * ratio);
        return status;
    };
    /******************************************************************************/
    // アイドルサバイバル
    /******************************************************************************/
    // 発揮値計算
    UserIdol.prototype.calculation_survival = function (cost_cut, rest_cost) {
        this.is_survival = true;
        // サバイバルパワー補正
        var status = Math.floor(parseInt(this.offense) * parseFloat(this.event_power));
        // コスト補正
        if (cost_cut) {
            status = this.get_cost_corrected_status(status, this.get_cost(), rest_cost);
        }
        this.actual_offense = status;
    };
    /******************************************************************************/
    // LIVEツアー
    /******************************************************************************/
    UserIdol.prototype.calculation_live_tour = function (member_type, producer_type, appeal_bonus_list, voltage_bonus, status_up, compatibility_type, training_room_level) {
        var offense = parseInt(this.offense);
        var defense = parseInt(this.defense);
        var offense_skill = parseFloat(this.offense_skill);
        var defense_skill = parseFloat(this.defense_skill);
        var actual_offense = 0;
        var actual_defense = 0;
        if (member_type) {
            // フロント
            actual_offense = this.calc_live_tour_front_status(offense, offense_skill, producer_type, appeal_bonus_list, voltage_bonus, status_up, compatibility_type, training_room_level);
            actual_defense = this.calc_live_tour_front_status(defense, defense_skill, producer_type, appeal_bonus_list, voltage_bonus, status_up, compatibility_type, training_room_level);
        }
        else {
            // バック
            actual_offense = this.calc_live_tour_back_status(offense, offense_skill, voltage_bonus);
            actual_defense = this.calc_live_tour_back_status(defense, defense_skill, voltage_bonus);
        }
        this.actual_offense = actual_offense;
        this.actual_defense = actual_defense;
    };
    // 発揮値計算
    UserIdol.prototype.calc_live_tour_status = function (status, skill, producer_type, appeal_bonus_list, status_up, compatibility_type) {
        // スターダムパワー補正
        var actual_status = Math.floor(status * parseFloat(this.event_power));
        // プロデューサー+アピールボーナス+スキル補正計算
        var ratio = 1 + this.get_type_ratio(producer_type, appeal_bonus_list) + skill / 100;
        actual_status = Math.ceil(actual_status * ratio);
        // コンボボーナス
        ratio = 1;
        ratio += (status_up) / 100;
        actual_status = Math.ceil(actual_status * ratio);
        // 相性ボーナス
        ratio = 1;
        if (parseInt(this.type) == compatibility_type) {
            ratio += UserIdol.COMPATIBILITY_BONUS_COEFFICIENT;
        }
        actual_status = actual_status * ratio;
        return actual_status;
    };
    UserIdol.prototype.calc_live_tour_front_status = function (status, skill, producer_type, appeal_bonus_list, voltage_bonus, status_up, compatibility_type, training_room_level) {
        // スターダムパワー補正
        var actual_status = Math.floor(status * parseFloat(this.event_power));
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
        if (parseInt(this.type) == compatibility_type) {
            ratio += UserIdol.COMPATIBILITY_BONUS_COEFFICIENT;
        }
        actual_status = actual_status * ratio;
        return actual_status;
    };
    UserIdol.prototype.calc_live_tour_back_status = function (status, skill, voltage_bonus) {
        // スターダムパワー補正
        var actual_status = Math.floor(status * parseFloat(this.event_power));
        // バックメンバー補正
        actual_status = Math.ceil(actual_status * UserIdol.BACK_MEMBER_COEFFICIENT);
        // スキル・ボルテージボーナス補正計算
        var ratio = 1 + (skill + voltage_bonus) / 100;
        actual_status = Math.ceil(actual_status * ratio);
        return actual_status;
    };
    // ダメージ計算
    UserIdol.prototype.calc_live_tour_damage = function (full_power) {
        var damage = Math.floor(this.actual_offense);
        if (full_power) {
            // フルパワー
            damage = damage * UserIdol.LIVE_TOUR_FULL_POWER_LIVE_COEFFICIENT;
        }
        else {
            // LP1
            damage = damage * UserIdol.LIVE_TOUR_NORMAL_LIVE_COEFFICIENT;
        }
        damage = damage / 5;
        return damage;
    };
    /******************************************************************************/
    // ドリームLIVEフェス
    /******************************************************************************/
    UserIdol.prototype.calculation_dream_live_festival = function (member_type, producer_type, appeal_bonus_list, combo_level, fever_bonus, training_room_level) {
        var offense = parseInt(this.offense);
        var defense = parseInt(this.defense);
        var offense_skill = parseFloat(this.offense_skill);
        var defense_skill = parseFloat(this.defense_skill);
        var actual_offense = 0;
        var actual_defense = 0;
        if (member_type) {
            // フロント
            actual_offense = this.calc_dream_live_festival_front_status(offense, offense_skill, producer_type, appeal_bonus_list, combo_level, fever_bonus, training_room_level);
            actual_defense = this.calc_dream_live_festival_front_status(defense, defense_skill, producer_type, appeal_bonus_list, combo_level, fever_bonus, training_room_level);
        }
        else {
            // バック
            actual_offense = this.calc_dream_live_festival_back_status(offense, offense_skill, fever_bonus);
            actual_defense = this.calc_dream_live_festival_back_status(defense, defense_skill, fever_bonus);
        }
        this.actual_offense = actual_offense;
        this.actual_defense = actual_defense;
    };
    UserIdol.prototype.calc_dream_live_festival_front_status = function (status, skill, producer_type, appeal_bonus_list, combo_level, fever_bonus, training_room_level) {
        // スターダムパワー補正
        var actual_status = Math.floor(status * parseFloat(this.event_power));
        // フィーバー補正
        var ratio = 1 + fever_bonus / 100;
        actual_status = Math.floor(actual_status * ratio);
        // ボーナス補正計算
        ratio = 1 + this.get_type_ratio(producer_type, appeal_bonus_list) + (skill + training_room_level) / 100;
        actual_status = Math.ceil(actual_status * ratio);
        // コンボボーナス
        ratio = 1;
        ratio += (Math.sqrt(UserIdol.DREAM_LIVE_FESTIVAL_COMBO_LEVEL_COEFFICIENT * combo_level)) / 100;
        actual_status = Math.ceil(actual_status * ratio);
        return actual_status;
    };
    UserIdol.prototype.calc_dream_live_festival_back_status = function (status, skill, fever_bonus) {
        // スターダムパワー補正
        var actual_status = Math.floor(status * parseFloat(this.event_power));
        // バックメンバー補正
        actual_status = Math.ceil(actual_status * UserIdol.BACK_MEMBER_COEFFICIENT);
        // フィーバー補正
        var ratio = 1 + fever_bonus / 100;
        actual_status = Math.floor(actual_status * ratio);
        // スキルボーナス補正計算
        ratio = 1 + (skill) / 100;
        actual_status = Math.ceil(actual_status * ratio);
        return actual_status;
    };
    // 与ダメージ計算
    UserIdol.prototype.calc_dream_live_festival_damage = function (full_power) {
        var damage = Math.floor(this.actual_offense);
        if (full_power) {
            // フルパワー
            damage = damage * UserIdol.DREAM_LIVE_FESTIVAL_FULL_POWER_LIVE_COEFFICIENT;
        }
        else {
            // LP1
            damage = damage * UserIdol.DREAM_LIVE_FESTIVAL_NORMAL_LIVE_COEFFICIENT;
        }
        damage = damage / 5;
        return damage;
    };
    /******************************************************************************/
    // LIVEロワイヤル
    /******************************************************************************/
    UserIdol.prototype.calculation_live_royal = function (member_type, enable_royal_power, producer_type, appeal_bonus_list, voltage_bonus, battle_point_rate, training_room_level) {
        // 位置補正
        var offense = parseInt(this.offense);
        var defense = parseInt(this.defense);
        var offense_skill = parseFloat(this.offense_skill);
        var defense_skill = parseFloat(this.defense_skill);
        var actual_offense = 0;
        var actual_defense = 0;
        if (member_type) {
            // フロント
            actual_offense = this.calc_live_royal_front_status(offense, offense_skill, enable_royal_power, producer_type, appeal_bonus_list, voltage_bonus, battle_point_rate, training_room_level);
            actual_defense = this.calc_live_royal_front_status(defense, defense_skill, enable_royal_power, producer_type, appeal_bonus_list, voltage_bonus, battle_point_rate, training_room_level);
        }
        else {
            // バック
            actual_offense = this.calc_live_royal_back_status(offense, offense_skill, enable_royal_power, voltage_bonus, battle_point_rate);
            actual_defense = this.calc_live_royal_back_status(defense, defense_skill, enable_royal_power, voltage_bonus, battle_point_rate);
        }
        this.actual_offense = actual_offense;
        this.actual_defense = actual_defense;
    };
    // フロントメンバー発揮値計算
    UserIdol.prototype.calc_live_royal_front_status = function (status, skill, enable_royal_power, producer_type, appeal_bonus_list, voltage_bonus, battle_point_rate, training_room_level) {
        // ロワイヤルパワー補正
        var event_power = 1;
        if (enable_royal_power) {
            event_power = parseFloat(this.event_power);
        }
        var actual_status = Math.ceil(status * event_power);
        // ボルテージボーナス
        actual_status = actual_status * voltage_bonus;
        // BP補正
        actual_status = actual_status * battle_point_rate;
        // ボーナス補正計算
        var ratio = 1 + this.get_type_ratio(producer_type, appeal_bonus_list) + (skill + training_room_level) / 100;
        actual_status = actual_status * ratio;
        actual_status = Math.round(actual_status * 10) / 10;
        return Math.ceil(actual_status);
    };
    // バックメンバー発揮値計算
    UserIdol.prototype.calc_live_royal_back_status = function (status, skill, enable_royal_power, voltage_bonus, battle_point_rate) {
        // ロワイヤルパワー補正
        var event_power = 1;
        if (enable_royal_power) {
            event_power = parseFloat(this.event_power);
        }
        var actual_status = Math.ceil(status * event_power);
        // バックメンバー補正
        actual_status = Math.ceil(actual_status * UserIdol.BACK_MEMBER_COEFFICIENT);
        // ボルテージボーナス
        actual_status = actual_status * voltage_bonus;
        // BP補正
        actual_status = actual_status * battle_point_rate;
        // スキル補正
        var ratio = 1 + skill / 100;
        actual_status = actual_status * ratio;
        actual_status = Math.round(actual_status * 10) / 10;
        return Math.ceil(actual_status);
    };
    // ダメージ計算
    UserIdol.prototype.calc_live_royal_damage = function () {
        return Math.floor(this.actual_offense) * UserIdol.LIVE_ROYAL_DAMAGE_COEFFICIENT;
    };
    /******************************************************************************/
    // LIVEトライアル
    /******************************************************************************/
    UserIdol.prototype.calculation_live_trial = function (cost_cut, rest_cost, member_type, producer_type) {
        // 位置補正
        var offense = parseInt(this.offense);
        var defense = parseInt(this.defense);
        var offense_skill = parseFloat(this.offense_skill);
        var defense_skill = parseFloat(this.defense_skill);
        var actual_offense = 0;
        var actual_defense = 0;
        if (member_type) {
            // フロント
            actual_offense = this.calc_live_trial_front_status(offense, offense_skill, cost_cut, rest_cost, producer_type);
            actual_defense = this.calc_live_trial_front_status(defense, defense_skill, cost_cut, rest_cost, producer_type);
        }
        else {
            // バック
            actual_offense = this.calc_live_trial_back_status(offense, offense_skill, cost_cut, rest_cost);
            actual_defense = this.calc_live_trial_back_status(defense, defense_skill, cost_cut, rest_cost);
        }
        this.actual_offense = actual_offense;
        this.actual_defense = actual_defense;
    };
    // フロントメンバー発揮値計算
    UserIdol.prototype.calc_live_trial_front_status = function (status, skill, cost_cut, rest_cost, producer_type) {
        // コスト値修正
        var cost = this.get_cost();
        // コスト補正
        if (cost_cut) {
            status = this.get_cost_corrected_status(status, cost, rest_cost);
        }
        // プロデューサー+スキル補正計算
        var ratio = 1;
        if (parseInt(this.type) == producer_type) {
            ratio += UserIdol.PRODUCER_TYPE_COEFFICIENT;
        }
        ratio += (skill) / 100;
        status = Math.ceil(status * ratio);
        return status;
    };
    // バックメンバー発揮値計算
    UserIdol.prototype.calc_live_trial_back_status = function (status, skill, cost_cut, rest_cost) {
        // コスト値修正
        var cost = this.get_cost();
        // バックメンバー補正
        var base_status = Math.floor(status * UserIdol.BACK_MEMBER_COEFFICIENT);
        var calc_status = base_status;
        // コスト補正
        if (cost_cut) {
            calc_status = this.get_cost_corrected_status(calc_status, cost, rest_cost);
            if (cost > rest_cost) {
                calc_status = calc_status * UserIdol.BACK_MEMBER_COEFFICIENT;
            }
        }
        // スキル補正計算
        if (!cost_cut || rest_cost >= cost) {
            var ratio = (skill) / 100;
            calc_status = Math.floor(calc_status) + Math.ceil(base_status * ratio * 10) / 10;
        }
        return Math.floor(calc_status);
    };
    /******************************************************************************/
    // トークバトル
    /******************************************************************************/
    UserIdol.prototype.calculation_talk_battle = function (member_type, producer_type, appeal_bonus_list, combo_level, cheer_bonus, training_room_level) {
        var offense = parseInt(this.offense);
        var defense = parseInt(this.defense);
        var offense_skill = parseFloat(this.offense_skill);
        var defense_skill = parseFloat(this.defense_skill);
        var actual_offense = 0;
        var actual_defense = 0;
        if (member_type) {
            // フロント
            actual_offense = this.calc_talk_battle_front_status(offense, offense_skill, producer_type, appeal_bonus_list, combo_level, cheer_bonus, training_room_level);
            actual_defense = this.calc_talk_battle_front_status(defense, defense_skill, producer_type, appeal_bonus_list, combo_level, cheer_bonus, training_room_level);
        }
        else {
            // バック
            actual_offense = this.calc_talk_battle_back_status(offense, offense_skill, combo_level, cheer_bonus);
            actual_defense = this.calc_talk_battle_back_status(defense, defense_skill, combo_level, cheer_bonus);
        }
        this.actual_offense = actual_offense;
        this.actual_defense = actual_defense;
    };
    UserIdol.prototype.calc_talk_battle_front_status = function (status, skill, producer_type, appeal_bonus_list, combo_level, cheer_bonus, training_room_level) {
        // トークパワー補正
        var actual_status = Math.floor(status * parseFloat(this.event_power));
        // プロデューサー+アピールボーナス計算
        var ratio = 1 + this.get_type_ratio(producer_type, appeal_bonus_list);
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
    };
    UserIdol.prototype.calc_talk_battle_back_status = function (status, skill, combo_level, cheer_bonus) {
        // トークパワー補正
        var actual_status = Math.floor(status * parseFloat(this.event_power));
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
    };
    // ダメージ計算
    UserIdol.prototype.calc_talk_battle_damage = function (full_power) {
        var damage = Math.floor(this.actual_offense);
        if (full_power) {
            // 全力トーク
            damage = damage * UserIdol.TALK_BATTLE_FULL_POWER_LIVE_COEFFICIENT;
        }
        damage = damage / 5;
        return damage;
    };
    /******************************************************************************/
    // アイドルチャレンジ
    /******************************************************************************/
    UserIdol.prototype.calculation_challenge = function (member_type, producer_type, appeal_bonus_list, unit_type, fever_bonus, training_room_level) {
        var offense = parseInt(this.offense);
        var defense = parseInt(this.defense);
        var offense_skill = parseFloat(this.offense_skill);
        var defense_skill = parseFloat(this.defense_skill);
        var actual_offense = 0;
        var actual_defense = 0;
        if (member_type) {
            // フロント
            actual_offense = this.calc_challenge_front_status(offense, offense_skill, producer_type, appeal_bonus_list, unit_type, fever_bonus, training_room_level);
            actual_defense = this.calc_challenge_front_status(defense, defense_skill, producer_type, appeal_bonus_list, unit_type, fever_bonus, training_room_level);
        }
        else {
            // バック
            actual_offense = this.calc_challenge_back_status(offense, offense_skill, unit_type);
            actual_defense = this.calc_challenge_back_status(defense, defense_skill, unit_type);
        }
        this.actual_offense = actual_offense;
        this.actual_defense = actual_defense;
    };
    UserIdol.prototype.calc_challenge_front_status = function (status, skill, producer_type, appeal_bonus_list, unit_type, fever_bonus, training_room_level) {
        // チャレンジパワー・ユニットタイプ補正
        var ratio = parseFloat(this.event_power);
        if (parseInt(this.type) == unit_type) {
            ratio *= 2;
        }
        var actual_status = Math.floor(status * ratio);
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
    };
    UserIdol.prototype.calc_challenge_back_status = function (status, skill, unit_type) {
        // チャレンジパワー・ユニットタイプ補正
        var ratio = parseFloat(this.event_power);
        if (parseInt(this.type) == unit_type) {
            ratio *= 2;
        }
        var actual_status = Math.floor(status * ratio);
        // バックメンバー補正
        actual_status = Math.ceil(actual_status * UserIdol.BACK_MEMBER_COEFFICIENT);
        // スキル補正計算
        ratio = 1 + skill / 100;
        actual_status = Math.round(actual_status * ratio);
        return actual_status;
    };
    // ダメージ計算
    UserIdol.prototype.calc_challenge_damage = function () {
        return Math.floor(this.actual_offense) / 5;
    };
    // 定数
    UserIdol.TRAINER_COST = 999;
    // 属性一致ボーナス係数
    UserIdol.PRODUCER_TYPE_COEFFICIENT = 0.05;
    // 施設ボーナス係数
    UserIdol.INSTITUTION_COEFFICIENT = 0.05;
    // バックメンバー係数
    UserIdol.BACK_MEMBER_COEFFICIENT = 0.8;
    // ハイテンションボーナス係数
    UserIdol.HIGH_TENSION_BONUS_COEFFICIENT = 0.1;
    // 相性ボーナス係数
    UserIdol.COMPATIBILITY_BONUS_COEFFICIENT = 0.2;
    // グルーヴボーナス係数
    UserIdol.GROOVE_BONUS_COEFFICIENT = 0.2;
    // LIVEツアー係数
    UserIdol.LIVE_TOUR_NORMAL_LIVE_COEFFICIENT = 0.5; // 通常LIVE時
    UserIdol.LIVE_TOUR_FULL_POWER_LIVE_COEFFICIENT = 2; // 全力LIVE時
    // LIVEロワイヤル係数
    UserIdol.LIVE_ROYAL_DAMAGE_COEFFICIENT = 0.2; // ダメージ係数
    // ドリームLIVEフェス
    UserIdol.DREAM_LIVE_FESTIVAL_NORMAL_LIVE_COEFFICIENT = 0.5; // 通常LIVE時
    UserIdol.DREAM_LIVE_FESTIVAL_FULL_POWER_LIVE_COEFFICIENT = 2.5; // 全力LIVE時
    UserIdol.DREAM_LIVE_FESTIVAL_COMBO_LEVEL_COEFFICIENT = 125; // コンボLV係数
    // トークバトル
    UserIdol.TALK_BATTLE_FULL_POWER_LIVE_COEFFICIENT = 5; // 全力LIVE時
    UserIdol.TALK_BATTLE_COMBO_LEVEL_COEFFICIENT = 50; // コンボLV係数
    return UserIdol;
})();
/// <reference path="typings/knockout/knockout.d.ts" />
/// <reference path="typings/knockout.es5/knockout.es5.d.ts" />
var UserPetitIdol = (function () {
    function UserPetitIdol() {
        // ステータス
        this.type = "0";
        this.vocal = "0";
        this.dance = "0";
        this.visual = "0";
        this.status = 0;
        ko.track(this);
    }
    UserPetitIdol.prototype.display_status = function () {
        return Math.ceil(this.status);
    };
    // 総ステータス取得
    UserPetitIdol.prototype.calculation = function () {
        var parameters = this.get_parameters();
        var status = 0;
        for (var i = 0; i < parameters.length; i++) {
            status += parameters[i];
        }
        this.status = status;
    };
    UserPetitIdol.prototype.calculation_live_tour = function (bonus_parameter, voltage_bonus) {
        var parameters = this.get_parameters();
        var status = 0;
        for (var i = 0; i < parameters.length; i++) {
            // パラメーターボーナス
            if (i == bonus_parameter) {
                parameters[i] += parameters[i] * UserPetitIdol.PARAMETER_BONUS_COEFFICIENT;
            }
            // ボルテージボーナス
            parameters[i] += parameters[i] * voltage_bonus / 100;
            status += parameters[i];
        }
        this.status = status;
    };
    UserPetitIdol.prototype.calculation_dream_live_festival = function (fever_bonus) {
        var parameters = this.get_parameters();
        var status = 0;
        for (var i = 0; i < parameters.length; i++) {
            // フィーバーボーナス
            parameters[i] += parameters[i] * fever_bonus / 100;
            status += parameters[i];
        }
        this.status = status;
    };
    UserPetitIdol.prototype.calculation_talk_battle = function (bonus_type, cheer_bonus) {
        var type = parseInt(this.type);
        var parameters = this.get_parameters();
        // ステータス計算
        var status = 0;
        for (var i = 0; i < parameters.length; i++) {
            // 属性ボーナス
            if (type == bonus_type) {
                parameters[i] += Math.ceil(parameters[i] * UserPetitIdol.TYPE_BONUS_COEFFICIENT);
            }
            // 応援ボーナス
            parameters[i] += parameters[i] * cheer_bonus / 100;
            status += parameters[i];
        }
        this.status = status;
    };
    UserPetitIdol.prototype.calculation_live_royal = function (battle_point_rate, voltage_bonus) {
        var parameters = this.get_parameters();
        var status = 0;
        for (var i = 0; i < parameters.length; i++) {
            // ボルテージボーナス
            parameters[i] = parameters[i] * voltage_bonus;
            status += parameters[i];
        }
        // BP補正
        status = status * battle_point_rate;
        this.status = status;
    };
    UserPetitIdol.prototype.calculation_challenge = function (bonus_type, fever_bonus) {
        var type = parseInt(this.type);
        var parameters = this.get_parameters();
        // ステータス計算
        var status = 0;
        for (var i = 0; i < parameters.length; i++) {
            // 属性ボーナス
            if (type == bonus_type) {
                parameters[i] += Math.ceil(parameters[i] * UserPetitIdol.TYPE_BONUS_COEFFICIENT);
            }
            // フィーバーボーナス
            parameters[i] += parameters[i] * fever_bonus / 100;
            status += parameters[i];
        }
        this.status = status;
    };
    UserPetitIdol.prototype.get_parameters = function () {
        var parameters = [];
        parameters.push(parseInt(this.vocal));
        parameters.push(parseInt(this.dance));
        parameters.push(parseInt(this.visual));
        for (var i = 0; i < parameters.length; i++) {
            if (isNaN(parameters[i])) {
                parameters[i] = 0;
            }
        }
        return parameters;
    };
    // 設定取得
    UserPetitIdol.prototype.get_setting = function () {
        var setting = {};
        setting["type"] = this.type;
        setting["vocal"] = this.vocal;
        setting["dance"] = this.dance;
        setting["visual"] = this.visual;
        return setting;
    };
    // 設定反映
    UserPetitIdol.prototype.set_setting = function (setting) {
        this.type = setting["type"];
        this.vocal = setting["vocal"];
        this.dance = setting["dance"];
        this.visual = setting["visual"];
    };
    // 属性一致ボーナス係数
    UserPetitIdol.TYPE_BONUS_COEFFICIENT = 0.2;
    // パラメーターボーナス係数
    UserPetitIdol.PARAMETER_BONUS_COEFFICIENT = 0.5;
    return UserPetitIdol;
})();
/// <reference path="typings/knockout/knockout.d.ts" />
/// <reference path="typings/knockout.es5/knockout.es5.d.ts" />
/// <reference path="common.ts" />
/// <reference path="idol.model.ts" />
/// <reference path="petit_idol.ts" />
// 計算モード
var CALCULATION_TYPE;
(function (CALCULATION_TYPE) {
    CALCULATION_TYPE[CALCULATION_TYPE["NORMAL"] = 0] = "NORMAL";
    CALCULATION_TYPE[CALCULATION_TYPE["SURVIVAL"] = 1] = "SURVIVAL";
    CALCULATION_TYPE[CALCULATION_TYPE["FESTIVAL"] = 2] = "FESTIVAL";
    CALCULATION_TYPE[CALCULATION_TYPE["LIVE_TOUR"] = 3] = "LIVE_TOUR";
    CALCULATION_TYPE[CALCULATION_TYPE["SESSION"] = 4] = "SESSION";
    CALCULATION_TYPE[CALCULATION_TYPE["DREAM_LIVE_FESTIVAL"] = 5] = "DREAM_LIVE_FESTIVAL";
    CALCULATION_TYPE[CALCULATION_TYPE["ROYAL"] = 6] = "ROYAL";
    CALCULATION_TYPE[CALCULATION_TYPE["ROYAL_GUEST"] = 7] = "ROYAL_GUEST";
    CALCULATION_TYPE[CALCULATION_TYPE["TALK_BATTLE"] = 8] = "TALK_BATTLE";
    CALCULATION_TYPE[CALCULATION_TYPE["CHALLENGE"] = 9] = "CHALLENGE";
    CALCULATION_TYPE[CALCULATION_TYPE["FESTIVAL_S"] = 10] = "FESTIVAL_S"; // フェスS
})(CALCULATION_TYPE || (CALCULATION_TYPE = {}));
// スキル効果対象ユニット
var SKILL_TARGET_UNIT;
(function (SKILL_TARGET_UNIT) {
    SKILL_TARGET_UNIT[SKILL_TARGET_UNIT["OWN"] = 0] = "OWN";
    SKILL_TARGET_UNIT[SKILL_TARGET_UNIT["RIVAL"] = 1] = "RIVAL"; // 相手ユニット
})(SKILL_TARGET_UNIT || (SKILL_TARGET_UNIT = {}));
// スキル効果対象メンバー
var SKILL_TARGET_MEMBER;
(function (SKILL_TARGET_MEMBER) {
    SKILL_TARGET_MEMBER[SKILL_TARGET_MEMBER["SELF"] = 0] = "SELF";
    SKILL_TARGET_MEMBER[SKILL_TARGET_MEMBER["FRONT"] = 1] = "FRONT";
    SKILL_TARGET_MEMBER[SKILL_TARGET_MEMBER["BACK"] = 2] = "BACK";
    SKILL_TARGET_MEMBER[SKILL_TARGET_MEMBER["ALL"] = 3] = "ALL"; // 全メンバー
})(SKILL_TARGET_MEMBER || (SKILL_TARGET_MEMBER = {}));
// スキル効果対象属性
var SKILL_TARGET_TYPE;
(function (SKILL_TARGET_TYPE) {
    SKILL_TARGET_TYPE[SKILL_TARGET_TYPE["CUTE"] = 1] = "CUTE";
    SKILL_TARGET_TYPE[SKILL_TARGET_TYPE["COOL"] = 2] = "COOL";
    SKILL_TARGET_TYPE[SKILL_TARGET_TYPE["PASSION"] = 4] = "PASSION";
    SKILL_TARGET_TYPE[SKILL_TARGET_TYPE["ALL"] = 7] = "ALL"; // 全属性
})(SKILL_TARGET_TYPE || (SKILL_TARGET_TYPE = {}));
// スキル効果対象ステータス
var SKILL_TARGET_PARAM;
(function (SKILL_TARGET_PARAM) {
    SKILL_TARGET_PARAM[SKILL_TARGET_PARAM["ALL"] = 0] = "ALL";
    SKILL_TARGET_PARAM[SKILL_TARGET_PARAM["OFFENSE"] = 1] = "OFFENSE";
    SKILL_TARGET_PARAM[SKILL_TARGET_PARAM["DEFENSE"] = 2] = "DEFENSE"; // 守
})(SKILL_TARGET_PARAM || (SKILL_TARGET_PARAM = {}));
// スキル入力モード
var SKILL_INPUT_MODE;
(function (SKILL_INPUT_MODE) {
    SKILL_INPUT_MODE[SKILL_INPUT_MODE["MANUAL"] = 0] = "MANUAL";
    SKILL_INPUT_MODE[SKILL_INPUT_MODE["AUTO"] = 1] = "AUTO";
    SKILL_INPUT_MODE[SKILL_INPUT_MODE["AUTO_MEAN"] = 2] = "AUTO_MEAN";
})(SKILL_INPUT_MODE || (SKILL_INPUT_MODE = {}));
// 有効発動スキル
var ENABLE_SKILL_TYPE;
(function (ENABLE_SKILL_TYPE) {
    ENABLE_SKILL_TYPE[ENABLE_SKILL_TYPE["ALL"] = 0] = "ALL";
    ENABLE_SKILL_TYPE[ENABLE_SKILL_TYPE["OFFENSE"] = 1] = "OFFENSE";
    ENABLE_SKILL_TYPE[ENABLE_SKILL_TYPE["DEFENSE"] = 2] = "DEFENSE"; // 守備時発動スキル
})(ENABLE_SKILL_TYPE || (ENABLE_SKILL_TYPE = {}));
var BaseLiveCalcViewModel = (function () {
    function BaseLiveCalcViewModel() {
        var self = this;
        // 入力項目
        this.calc_type = 0 /* NORMAL */.toString();
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
        this.move_up = function () {
            var index = self.idol_list.indexOf(this);
            if (index > 0) {
                self.idol_list.splice(index - 1, 2, self.idol_list[index], self.idol_list[index - 1]);
            }
        };
        this.move_down = function () {
            var index = self.idol_list.indexOf(this);
            if (index < self.idol_list.length - 1) {
                self.idol_list.splice(index, 2, self.idol_list[index + 1], self.idol_list[index]);
            }
        };
    }
    // 発揮値
    BaseLiveCalcViewModel.prototype.actual_status = function () {
        return [0, 0];
    };
    BaseLiveCalcViewModel.prototype.change_appeal_bonus = function () {
        ko.valueHasMutated(this, "appeal_bonus");
    };
    BaseLiveCalcViewModel.prototype.change_rival_front_num = function () {
        ko.valueHasMutated(this, "rival_front_num");
    };
    BaseLiveCalcViewModel.prototype.change_rival_back_num = function () {
        ko.valueHasMutated(this, "rival_back_num");
    };
    // アイドルリスト初期化
    BaseLiveCalcViewModel.prototype.init_list = function () {
        this.init_idol_list();
        this.init_petit_idol_list();
        // コードがあったら適用
        var param_list = Common.get_param_list();
        if (param_list["code"]) {
            this.code = param_list["code"];
            this.apply_code();
        }
    };
    BaseLiveCalcViewModel.prototype.init_idol_list = function () {
    };
    BaseLiveCalcViewModel.prototype.init_petit_idol_list = function () {
        var petit_idols = [];
        for (var i = 0; i < ViewModel.PETIT_IDOL_NUM; i++) {
            var petit_idol = new UserPetitIdol();
            petit_idols.push(petit_idol);
        }
        this.petit_idol_list = petit_idols;
    };
    BaseLiveCalcViewModel.prototype.calculation_petit_idol = function () {
        var petit_idol_bonus = 0;
        for (var i = 0; i < this.petit_idol_list.length; i++) {
            var petit_idol = this.petit_idol_list[i];
            petit_idol.calculation();
            petit_idol_bonus += petit_idol.status;
        }
        return petit_idol_bonus;
    };
    BaseLiveCalcViewModel.prototype.is_smartphone = function () {
        return Common.is_smartphone();
    };
    /******************************************************************************/
    // 設定関連
    /******************************************************************************/
    BaseLiveCalcViewModel.prototype.get_setting = function () {
        return {};
    };
    BaseLiveCalcViewModel.prototype.set_setting = function (setting) {
    };
    // アイドル設定取得
    BaseLiveCalcViewModel.prototype.get_idol_setting = function () {
        var setting = [];
        for (var i = 0; i < this.idol_list.length; i++) {
            setting.push(this.idol_list[i].get_setting());
        }
        return setting;
    };
    // アイドル設定反映
    BaseLiveCalcViewModel.prototype.set_idol_setting = function (settings, max_num) {
        var _this = this;
        if (max_num === void 0) { max_num = -1; }
        var deferred = jQuery.Deferred();
        var objects = {};
        for (var i = 0; i < settings.length; i++) {
            var key = "t" + settings[i]["type"] + "_r" + settings[i]["rarity"];
            if (!(key in objects)) {
                objects[key] = { type: settings[i]["type"], rarity: settings[i]["rarity"] };
            }
        }
        var keys = Object.keys(objects);
        var method_list = [];
        for (var i = 0; i < keys.length; i++) {
            var object = objects[keys[i]];
            method_list.push(Common.load_idol_list(parseInt(object["type"]), parseInt(object["rarity"])));
        }
        if (max_num == -1) {
            max_num = settings.length;
        }
        jQuery.when.apply(null, method_list).done(function () {
            var idol_list = [];
            for (var i = 0; i < settings.length && i < max_num; i++) {
                var idol = new UserIdol();
                idol.set_setting(settings[i]);
                idol_list.push(idol);
            }
            for (var i = idol_list.length; i < max_num; i++) {
                var idol = new UserIdol();
                idol_list.push(idol);
            }
            _this.idol_list = idol_list;
            deferred.resolve();
        });
        return deferred.promise();
    };
    // アピールボーナス設定取得
    BaseLiveCalcViewModel.prototype.get_appeal_bonus_setting = function () {
        var settings = [];
        for (var i = 0; i < this.appeal_bonus.length; i++) {
            var setting = {};
            setting["type"] = i.toString();
            setting["value"] = this.appeal_bonus[i];
            settings.push(setting);
        }
        return settings;
    };
    // アピールボーナス設定反映
    BaseLiveCalcViewModel.prototype.set_appeal_bonus_setting = function (settings) {
        if (settings == undefined) {
            return;
        }
        var appeal_bonus = this.appeal_bonus;
        for (var i = 0; i < settings.length; i++) {
            if (settings[i] != undefined) {
                var setting = settings[i];
                appeal_bonus[setting["type"]] = setting["value"];
            }
        }
        this.appeal_bonus = appeal_bonus;
        this.change_appeal_bonus();
    };
    // ライバルユニット設定取得
    BaseLiveCalcViewModel.prototype.get_rival_member_setting = function () {
        var settings = {};
        settings["front"] = [];
        for (var i = 0; i < this.rival_front_num.length; i++) {
            var setting = {};
            setting["type"] = i.toString();
            setting["value"] = this.rival_front_num[i];
            settings["front"].push(setting);
        }
        settings["back"] = [];
        for (var i = 0; i < this.rival_back_num.length; i++) {
            var setting = {};
            setting["type"] = i.toString();
            setting["value"] = this.rival_back_num[i];
            settings["back"].push(setting);
        }
        return settings;
    };
    // ライバルユニット設定反映
    BaseLiveCalcViewModel.prototype.set_rival_member_setting = function (settings) {
        if (settings == undefined) {
            return;
        }
        if (settings["front"] != undefined) {
            var rival_front_num = this.rival_front_num;
            for (var i = 0; i < settings["front"].length; i++) {
                if (settings["front"][i] != undefined) {
                    var setting = settings["front"][i];
                    rival_front_num[setting["type"]] = setting["value"];
                }
            }
            this.rival_front_num = rival_front_num;
            this.change_rival_front_num();
        }
        if (settings["back"] != undefined) {
            var rival_back_num = this.rival_back_num;
            for (var i = 0; i < settings["back"].length; i++) {
                if (settings["back"][i] != undefined) {
                    var setting = settings["back"][i];
                    rival_back_num[setting["type"]] = setting["value"];
                }
            }
            this.rival_back_num = rival_back_num;
            this.change_rival_back_num();
        }
    };
    // ぷちアイドル設定取得
    BaseLiveCalcViewModel.prototype.get_petit_idol_setting = function () {
        var setting = [];
        for (var i = 0; i < this.petit_idol_list.length; i++) {
            setting.push(this.petit_idol_list[i].get_setting());
        }
        return setting;
    };
    // ぷちアイドル設定反映
    BaseLiveCalcViewModel.prototype.set_petit_idol_setting = function (settings, max_num) {
        if (settings == null) {
            return;
        }
        var petit_idols = [];
        for (var i = 0; i < settings.length && i != max_num; i++) {
            var petit_idol = new UserPetitIdol();
            petit_idol.set_setting(settings[i]);
            petit_idols.push(petit_idol);
        }
        this.petit_idol_list = petit_idols;
    };
    // 設定保存
    BaseLiveCalcViewModel.prototype.save_setting = function () {
        try {
            // タイトルをlocalStorageに保存
            var key = this.save_data_key + "_title_" + this.save_data_id;
            localStorage.setItem(key, this.save_data_title);
            // 設定をlocalStorageに保存
            key = this.save_data_key + "_" + this.save_data_id;
            localStorage.setItem(key, JSON.stringify(this.get_setting()));
        }
        catch (e) {
            console.log(e.message);
            alert("データ保存時にエラーが発生しました。");
        }
    };
    // 設定読込
    BaseLiveCalcViewModel.prototype.load_setting = function () {
        try {
            // localStorageからタイトル読み込み
            var key = this.save_data_key + "_title_" + this.save_data_id;
            var title = localStorage.getItem(key);
            // localStorageから設定読み込み
            key = this.save_data_key + "_" + this.save_data_id;
            var value = localStorage.getItem(key);
            if (value != null) {
                if (title == null) {
                    title = "";
                }
                var setting = JSON.parse(value);
                this.save_data_title = title;
                this.set_setting(setting);
            }
            else {
                alert("データが保存されていません。");
            }
        }
        catch (e) {
            console.log(e.message);
            alert("データ読み込み時にエラーが発生しました。");
        }
    };
    // コード生成
    BaseLiveCalcViewModel.prototype.generate_code = function () {
        // 設定取得
        var setting = this.get_setting();
        // 設定データをJSON形式に変換
        var json = JSON.stringify(setting);
        try {
            // コード化
            var code = Common.get_compress_data(json);
            var url = Common.get_page_url() + "?code=" + code;
            this.code = code;
            this.apply_code_url = url;
        }
        catch (e) {
            console.log(e.message);
            alert("コードの生成に失敗しました。");
        }
    };
    // コード適用
    BaseLiveCalcViewModel.prototype.apply_code = function () {
        try {
            // コードからJSONデータ復元
            var json = Common.get_decompress_data(this.code);
            // JSONデータから設定データ復元
            var setting = JSON.parse(json);
            var url = Common.get_page_url() + "?code=" + this.code;
            // 設定
            this.set_setting(setting);
            this.apply_code_url = url;
        }
        catch (e) {
            console.log(e.message);
            alert("コードの適用に失敗しました。");
        }
    };
    /******************************************************************************/
    // スキル関連
    /******************************************************************************/
    // スキル入力モードがマニュアルか
    BaseLiveCalcViewModel.prototype.is_skill_input_type_manual = function () {
        return (parseInt(this.skill_input_type) == 0 /* MANUAL */);
    };
    // スキル自動計算
    BaseLiveCalcViewModel.prototype.calc_skill_value = function () {
        var _this = this;
        if (!this.is_skill_input_type_manual()) {
            for (var i = 0; i < this.idol_list.length; i++) {
                var idol = this.idol_list[i];
                idol.offense_skill = "0";
                idol.defense_skill = "0";
                idol.enable_skill = false;
            }
            // 発動スキル取得
            jQuery.when(this.get_invoke_skill_list()).done(function (invoke_skill_list) {
                for (var i = 0; i < invoke_skill_list.length; i++) {
                    var invoke_skill = invoke_skill_list[i];
                    var target_member = parseInt(invoke_skill["target_member"]);
                    switch (target_member) {
                        case 0 /* SELF */:
                            break;
                        case 1 /* FRONT */:
                            // フロントメンバー
                            _this.apply_skill_effect_front_member(invoke_skill, i);
                            break;
                        case 2 /* BACK */:
                            // バックメンバー
                            _this.apply_skill_effect_back_member(invoke_skill, i);
                            break;
                        case 3 /* ALL */:
                            // 全メンバー
                            _this.apply_skill_effect_front_member(invoke_skill, i);
                            _this.apply_skill_effect_back_member(invoke_skill, i);
                            break;
                        default:
                            break;
                    }
                }
            });
        }
    };
    // 発動スキル取得
    BaseLiveCalcViewModel.prototype.get_invoke_skill_list = function () {
        var _this = this;
        var front_num = parseInt(this.front_num);
        // 属性ごとのメンバー人数取得
        var member_num = [[0, 0, 0], [0, 0, 0]];
        for (var i = 0; i < this.idol_list.length; i++) {
            var type = parseInt(this.idol_list[i].type);
            if (i < front_num) {
                member_num[0][type]++;
            }
            else {
                member_num[1][type]++;
            }
        }
        // 属性ごとの相手メンバー人数取得
        var rival_member_num = [[0, 0, 0], [0, 0, 0]];
        for (var i = 0; i < this.rival_front_num.length; i++) {
            rival_member_num[0][i] = parseInt(this.rival_front_num[i]);
        }
        for (var i = 0; i < this.rival_back_num.length; i++) {
            rival_member_num[1][i] = parseInt(this.rival_back_num[i]);
        }
        // 発動可能スキル
        var deferred = jQuery.Deferred();
        jQuery.when(Common.load_skill_list()).done(function (skill_data_list) {
            var invoke_skill_list = [];
            var skill_count = 0;
            var skill_input_type = parseInt(_this.skill_input_type);
            for (var i = 0; i < _this.idol_list.length && i < front_num; i++) {
                var idol = _this.idol_list[i];
                if (parseInt(idol.skill_id) > 0 && parseInt(idol.skill_level) > 0) {
                    // 発動スキルを取得
                    var skill = _this.check_skill_enable(idol, skill_data_list, skill_count, member_num, rival_member_num);
                    if (skill != null) {
                        idol.enable_skill = true;
                        invoke_skill_list.push(skill);
                        skill_count++;
                    }
                    if (skill_input_type != 2 /* AUTO_MEAN */ && skill_count >= _this.max_skill_invoke) {
                        break;
                    }
                }
            }
            deferred.resolve(invoke_skill_list);
        });
        return deferred.promise();
    };
    // 発動可能なスキルかチェック
    BaseLiveCalcViewModel.prototype.check_skill_enable = function (idol, skill_data_list, skill_count, member_num, rival_member_num) {
        // 発動スキルを取得
        var skill = jQuery.extend(true, {}, skill_data_list[idol.skill_id]);
        skill["skill_level"] = parseInt(idol.skill_level);
        if (skill["skill_value_list"].length == 0) {
            return null;
        }
        var target_unit = parseInt(skill["target_unit"]);
        if (target_unit == 0 /* OWN */) {
            // 自分
            return this.check_target_own_unit_skill_enable(skill, member_num, idol, skill_count);
        }
        else {
            // 相手
            return this.check_target_rival_unit_skill_enable(skill, rival_member_num);
        }
    };
    BaseLiveCalcViewModel.prototype.check_target_own_unit_skill_enable = function (skill, member_num, idol, skill_count) {
        var enable_skill_type = parseInt(this.enable_skill_type);
        var target_param = parseInt(skill["target_param"]);
        var target_member = parseInt(skill["target_member"]);
        var target_type = parseInt(skill["target_type"]);
        // 有効スキルかチェック
        if (enable_skill_type != 0 /* ALL */ && target_param != 0 /* ALL */ && enable_skill_type != target_param) {
            return null;
        }
        if (target_member == 0 /* SELF */) {
            // 自分スキルの適用
            this.apply_skill_effect(idol, skill, skill_count);
            return skill;
        }
        // 対象範囲チェック
        if (!this.check_skill_target(target_member, target_type, member_num)) {
            return null;
        }
        return skill;
    };
    BaseLiveCalcViewModel.prototype.check_target_rival_unit_skill_enable = function (skill, rival_member_num) {
        var enable_skill_type = parseInt(this.enable_skill_type);
        var target_param = parseInt(skill["target_param"]);
        // 有効スキルかチェック
        if (enable_skill_type != 0 /* ALL */ && (enable_skill_type ^ target_param) == 0) {
            return null;
        }
        return skill;
    };
    // スキルの対象範囲をチェック
    BaseLiveCalcViewModel.prototype.check_skill_target = function (target_member, target_type, member_num) {
        var enable_skill = false;
        switch (target_member) {
            case 1 /* FRONT */:
                for (var i = 0; i < member_num[0].length; i++) {
                    if ((target_type & (1 << i)) > 0 && member_num[0][i] > 0) {
                        enable_skill = true;
                        break;
                    }
                }
                break;
            case 2 /* BACK */:
                for (var i = 0; i < member_num[1].length; i++) {
                    if ((target_type & (1 << i)) > 0 && member_num[1][i] > 0) {
                        enable_skill = true;
                        break;
                    }
                }
                break;
            case 3 /* ALL */:
                for (var i = 0; i < member_num.length; i++) {
                    for (var j = 0; j < member_num[i].length; j++) {
                        if ((target_type & (1 << j)) > 0 && member_num[i][j] > 0) {
                            enable_skill = true;
                            break;
                        }
                    }
                }
                break;
        }
        return enable_skill;
    };
    // フロントメンバーにスキル効果適用
    BaseLiveCalcViewModel.prototype.apply_skill_effect_front_member = function (invoke_skill, index) {
        var front_num = parseInt(this.front_num);
        for (var i = 0; i < this.idol_list.length && i < front_num; i++) {
            this.apply_skill_effect(this.idol_list[i], invoke_skill, index);
        }
    };
    // バックメンバーにスキル効果適用
    BaseLiveCalcViewModel.prototype.apply_skill_effect_back_member = function (invoke_skill, index) {
        var target_num = parseInt(invoke_skill["target_num"]);
        var front_num = parseInt(this.front_num);
        if (target_num == -1) {
            target_num = this.idol_list.length - front_num;
        }
        var count = 0;
        for (var i = front_num; i < this.idol_list.length && count < target_num; i++) {
            if (this.apply_skill_effect(this.idol_list[i], invoke_skill, index)) {
                count++;
            }
        }
    };
    // スキル効果適用
    BaseLiveCalcViewModel.prototype.apply_skill_effect = function (idol, invoke_skill, index) {
        // スキルが効果適用可能かチェック
        if (!this.check_apply_skill(idol, invoke_skill)) {
            return false;
        }
        var target_param = parseInt(invoke_skill["target_param"]);
        var skill_level = parseInt(invoke_skill["skill_level"]);
        var skill_value = 0;
        if (skill_level > 0) {
            skill_value = parseInt(invoke_skill["skill_value_list"][skill_level - 1]);
        }
        if (parseInt(this.skill_input_type) == 2 /* AUTO_MEAN */) {
            var rate = this.skill_invocation_rate_list[index];
            if (rate != undefined) {
                skill_value = skill_value * (rate / 100);
            }
        }
        return this.apply_skill_value(idol, target_param, skill_value);
    };
    BaseLiveCalcViewModel.prototype.apply_skill_value = function (idol, target_param, skill_value) {
        var result = false;
        var offense_skill = parseFloat(idol.offense_skill);
        var defense_skill = parseFloat(idol.defense_skill);
        switch (target_param) {
            case 0 /* ALL */:
                offense_skill += skill_value;
                defense_skill += skill_value;
                result = true;
                break;
            case 1 /* OFFENSE */:
                offense_skill += skill_value;
                result = true;
                break;
            case 2 /* DEFENSE */:
                defense_skill += skill_value;
                result = true;
                break;
        }
        idol.offense_skill = offense_skill.toString();
        idol.defense_skill = defense_skill.toString();
        return result;
    };
    // スキル効果適用可能チェック
    BaseLiveCalcViewModel.prototype.check_apply_skill = function (idol, invoke_skill) {
        var result = false;
        var type = parseInt(idol.type);
        var target_unit = parseInt(invoke_skill["target_unit"]);
        var target_member = parseInt(invoke_skill["target_member"]);
        var target_type = parseInt(invoke_skill["target_type"]);
        // スキルが効果適用可能かチェック
        if (target_unit == 0 /* OWN */) {
            if (target_member == 0 /* SELF */ || (target_type & (1 << type)) > 0) {
                result = true;
            }
        }
        return result;
    };
    // ぷちアイドル最大数
    BaseLiveCalcViewModel.PETIT_IDOL_NUM = 3;
    return BaseLiveCalcViewModel;
})();
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
/// <reference path="live_calc.base.ts" />
var DamageValue = (function () {
    function DamageValue(value) {
        if (value === void 0) { value = 0; }
        this.value = value;
    }
    DamageValue.prototype.get_turn_damage = function () {
        return Math.ceil(this.value);
    };
    DamageValue.prototype.get_battle_damage = function () {
        return this.get_turn_damage() * DamageValue.BATTLE_DAMAGE_COEFFICIENT;
    };
    DamageValue.BATTLE_DAMAGE_COEFFICIENT = 5;
    return DamageValue;
})();
var Damage = (function () {
    function Damage(name, value) {
        if (name === void 0) { name = ""; }
        if (value === void 0) { value = 0; }
        this.name = name;
        this.min = new DamageValue(value);
        this.max = new DamageValue(value);
        this.avg = new DamageValue(value);
    }
    Damage.prototype.add_damage = function (base) {
        this.min.value += Math.ceil(base * Damage.COEFFICIENT_MIN * 10) / 10;
        this.max.value += Math.ceil(base * Damage.COEFFICIENT_MAX * 10) / 10;
        this.avg.value += Math.ceil(base * Damage.COEFFICIENT_AVG * 10) / 10;
    };
    Damage.prototype.add_bonus = function (bonus) {
        this.min.value += bonus;
        this.max.value += bonus;
        this.avg.value += bonus;
    };
    // 定数
    // ダメージ係数
    Damage.COEFFICIENT_MIN = 0.97;
    Damage.COEFFICIENT_MAX = 1.02;
    Damage.COEFFICIENT_AVG = 0.995;
    return Damage;
})();
var BaseLiveTourCalcViewModel = (function (_super) {
    __extends(BaseLiveTourCalcViewModel, _super);
    function BaseLiveTourCalcViewModel() {
        _super.call(this);
        // 最大メンバー数
        this.max_member_num = 20;
        // 入力値
        this.front_num = "10";
        this.voltage_bonus = "0";
        this.petit_idol_bonus_type = "-1";
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
        this.damage_list = [];
    }
    // アイドルリスト初期化
    BaseLiveTourCalcViewModel.prototype.init_idol_list = function () {
        var member_num = this.max_member_num;
        var settings = [];
        var old_idols = this.idol_list;
        for (var i = 0; i < old_idols.length; i++) {
            settings.push(old_idols[i].get_setting());
        }
        var idols = [];
        for (var i = 0; i < member_num; i++) {
            var idol = new UserIdol();
            if (settings[i] != null) {
                idol.set_setting(settings[i]);
            }
            idols.push(idol);
        }
        this.idol_list = idols;
    };
    /******************************************************************************/
    // 設定関連
    /******************************************************************************/
    // 設定取得
    BaseLiveTourCalcViewModel.prototype.get_setting = function () {
        var setting = {};
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
    };
    // 設定反映
    BaseLiveTourCalcViewModel.prototype.set_setting = function (setting) {
        // 共通部分のパラメータ設定
        this.producer_type = setting["producer_type"];
        this.set_appeal_bonus_setting(setting["appeal_bonus"]);
        this.training_room_level = setting["training_room_level"];
        this.calc_type = setting["calc_type"];
        this.skill_input_type = setting["skill_input_type"];
        this.enable_skill_type = setting["enable_skill_type"];
        this.set_rival_member_setting(setting["rival_member"]);
        // アイドル個別のパラメータ設定
        this.set_idol_setting(setting["idol"], this.max_member_num);
        // ぷちアイドル個別のパラメータ設定
        this.set_petit_idol_setting(setting["petit_idol"], ViewModel.PETIT_IDOL_NUM);
    };
    /******************************************************************************/
    // スキル関連
    /******************************************************************************/
    BaseLiveTourCalcViewModel.prototype.check_target_rival_unit_skill_enable = function (skill, rival_member_num) {
        var enable_skill_type = parseInt(this.enable_skill_type);
        var target_param = parseInt(skill["target_param"]);
        var target_member = parseInt(skill["target_member"]);
        var target_type = parseInt(skill["target_type"]);
        // 有効スキルかチェック
        if (enable_skill_type != 0 /* ALL */ && (enable_skill_type ^ target_param) == 0) {
            return null;
        }
        if (target_member != 1 /* FRONT */ && target_member != 3 /* ALL */) {
            return null;
        }
        if (this.check_skill_target(target_member, target_type, rival_member_num)) {
            switch (target_param) {
                case 1 /* OFFENSE */:
                    target_param = 2 /* DEFENSE */;
                    break;
                case 2 /* DEFENSE */:
                    target_param = 1 /* OFFENSE */;
                    break;
            }
            skill["target_member"] = 1 /* FRONT */;
            skill["target_param"] = target_param;
        }
        else {
            skill["skill_level"] = 0;
        }
        return skill;
    };
    // スキル効果適用可能チェック
    BaseLiveTourCalcViewModel.prototype.check_apply_skill = function (idol, invoke_skill) {
        var result = false;
        var type = parseInt(idol.type);
        var target_unit = parseInt(invoke_skill["target_unit"]);
        var target_member = parseInt(invoke_skill["target_member"]);
        var target_type = parseInt(invoke_skill["target_type"]);
        // スキルが効果適用可能かチェック
        if (target_unit == 0 /* OWN */) {
            if (target_member == 0 /* SELF */ || (target_type & (1 << type)) > 0) {
                result = true;
            }
        }
        else if (target_unit == 1 /* RIVAL */) {
            result = true;
        }
        return result;
    };
    return BaseLiveTourCalcViewModel;
})(BaseLiveCalcViewModel);
/// <reference path="live_tour_calc.base.ts" />
var ViewModel = (function (_super) {
    __extends(ViewModel, _super);
    function ViewModel() {
        _super.call(this);
        // 入力値
        this.calc_type = 6 /* ROYAL */.toString();
        this.battle_point = "2";
        // セーブデータ関係
        this.save_data_key = "imas_cg_live_royal_calc";
        this.init_list();
        ko.track(this);
    }
    // 発揮値
    ViewModel.prototype.actual_status = function () {
        return this.calculation();
    };
    ViewModel.prototype.is_guest_live = function () {
        return (parseInt(this.calc_type) == 7 /* ROYAL_GUEST */);
    };
    // 発揮値計算
    ViewModel.prototype.calculation = function () {
        // スキル効果反映
        this.calc_skill_value();
        var battle_point_rate = this.get_battle_point_rate();
        var front_num = parseInt(this.front_num);
        var producer_type = parseInt(this.producer_type);
        var voltage_bonus = parseFloat(this.voltage_bonus);
        var training_room_level = parseInt(this.training_room_level);
        var is_guest_live = this.is_guest_live();
        // 総発揮値計算
        var total_offense = 0;
        var total_defense = 0;
        var damage = new Damage();
        var front_offense = 0;
        var front_defense = 0;
        var back_offense = 0;
        var back_defense = 0;
        for (var i = 0; i < this.idol_list.length; i++) {
            var idol = this.idol_list[i];
            var member_type = (i < front_num);
            // 発揮値計算
            idol.calculation_live_royal(member_type, is_guest_live, producer_type, this.appeal_bonus, voltage_bonus, battle_point_rate, training_room_level);
            var offense = idol.actual_offense;
            var defense = idol.actual_defense;
            if (member_type) {
                front_offense += offense;
                front_defense += defense;
            }
            else {
                back_offense += offense;
                back_defense += defense;
            }
            total_offense += offense;
            total_defense += defense;
            // 与ダメージ計算
            if (is_guest_live) {
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
        var petit_idol_total_status = this.calculation_petit_idol();
        damage.add_bonus(Math.floor(petit_idol_total_status * UserIdol.LIVE_ROYAL_DAMAGE_COEFFICIENT));
        total_offense += petit_idol_total_status;
        total_defense += petit_idol_total_status;
        this.petit_idol_total_status = petit_idol_total_status;
        this.damage_list = [damage];
        return [total_offense, total_defense];
    };
    ViewModel.prototype.calculation_petit_idol = function () {
        var battle_point_rate = this.get_battle_point_rate();
        var voltage_bonus = parseFloat(this.voltage_bonus);
        var status = 0;
        for (var i = 0; i < this.petit_idol_list.length; i++) {
            var petit_idol = this.petit_idol_list[i];
            petit_idol.calculation_live_royal(battle_point_rate, voltage_bonus);
            status += petit_idol.status;
        }
        return Math.ceil(status);
    };
    ViewModel.prototype.get_battle_point_rate = function () {
        var battle_point = parseInt(this.battle_point);
        var battle_point_rate = ViewModel.BATTLE_POINT_RATE_LIST[battle_point - 1];
        if (this.is_guest_live()) {
            battle_point_rate = ViewModel.GUEST_BATTLE_POINT_RATE_LIST[battle_point - 1];
        }
        return battle_point_rate;
    };
    /******************************************************************************/
    // 設定関連
    /******************************************************************************/
    // 設定取得
    ViewModel.prototype.get_setting = function () {
        var setting = _super.prototype.get_setting.call(this);
        setting["battle_point"] = this.battle_point;
        setting["voltage_bonus"] = this.voltage_bonus;
        return setting;
    };
    // 設定反映
    ViewModel.prototype.set_setting = function (setting) {
        _super.prototype.set_setting.call(this, setting);
        this.battle_point = setting["battle_point"];
        this.voltage_bonus = setting["voltage_bonus"];
    };
    /******************************************************************************/
    // スキル関連
    /******************************************************************************/
    ViewModel.prototype.check_target_rival_unit_skill_enable = function (skill, rival_member_num) {
        if (this.is_guest_live()) {
            return _super.prototype.check_target_rival_unit_skill_enable.call(this, skill, rival_member_num);
        }
        var enable_skill_type = parseInt(this.enable_skill_type);
        var target_param = parseInt(skill["target_param"]);
        // 有効スキルかチェック
        if (enable_skill_type != 0 /* ALL */ && (enable_skill_type ^ target_param) == 0) {
            return null;
        }
        return skill;
    };
    // スキル効果適用可能チェック
    ViewModel.prototype.check_apply_skill = function (idol, invoke_skill) {
        if (this.is_guest_live()) {
            return _super.prototype.check_apply_skill.call(this, idol, invoke_skill);
        }
        var result = false;
        var type = parseInt(idol.type);
        var target_unit = parseInt(invoke_skill["target_unit"]);
        var target_member = parseInt(invoke_skill["target_member"]);
        var target_type = parseInt(invoke_skill["target_type"]);
        // スキルが効果適用可能かチェック
        if (target_unit == 0 /* OWN */) {
            if (target_member == 0 /* SELF */ || (target_type & (1 << type)) > 0) {
                result = true;
            }
        }
        return result;
    };
    // 定数
    // バトルポイント係数
    ViewModel.BATTLE_POINT_RATE_LIST = [0.8, 1, 1.5, 2, 2.5]; // ロワイヤルLIVE時
    ViewModel.GUEST_BATTLE_POINT_RATE_LIST = [0.5, 1, 1.6, 2.25, 3]; // ゲストLIVE時
    return ViewModel;
})(BaseLiveTourCalcViewModel);
jQuery(function () {
    ko.applyBindings(new ViewModel());
});
//# sourceMappingURL=live_royal_calc.js.map