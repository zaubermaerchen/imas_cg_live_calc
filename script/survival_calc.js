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
        var actual_status = Math.ceil(status * UserIdol.BACK_MEMBER_COEFFICIENT);
        // コスト補正
        if (cost_cut) {
            actual_status = this.get_cost_corrected_status(actual_status, cost, rest_cost);
        }
        // スキル補正計算
        var ratio = 1 + (skill) / 100;
        actual_status = Math.floor(actual_status * ratio * 10) / 10;
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
    UserPetitIdol.prototype.calculation = function (event_bonus, bonus_type, bonus_parameter) {
        if (event_bonus === void 0) { event_bonus = 0; }
        if (bonus_type === void 0) { bonus_type = -1; }
        if (bonus_parameter === void 0) { bonus_parameter = -1; }
        var type = parseInt(this.type);
        var parameters = this.get_parameters();
        var status = 0;
        for (var i = 0; i < parameters.length; i++) {
            // パラメーターボーナス
            if (i == bonus_parameter) {
                parameters[i] += Math.ceil(parameters[i] * UserPetitIdol.PARAMETER_BONUS_COEFFICIENT);
            }
            status += parameters[i];
        }
        // 属性ボーナス
        if (type == bonus_type) {
            status += Math.ceil(status * UserPetitIdol.TYPE_BONUS_COEFFICIENT);
        }
        // ボルテージボーナス
        status += status * event_bonus / 100;
        this.status = status;
    };
    UserPetitIdol.prototype.calculation_festival = function (high_tension) {
        var high_tension_bonus = 0;
        if (high_tension) {
            high_tension_bonus = UserPetitIdol.HIGH_TENSION_BONUS_COEFFICIENT * 100;
        }
        this.calculation(high_tension_bonus);
    };
    UserPetitIdol.prototype.calculation_live_royal = function (bonus_type, bonus_parameter, battle_point_rate, voltage_bonus) {
        this.calculation(0, bonus_type, bonus_parameter);
        var status = this.status;
        // ボルテージボーナス
        status = Math.ceil(status * voltage_bonus);
        // BP補正
        status = status * battle_point_rate;
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
    // ハイテンションボーナス係数
    UserPetitIdol.HIGH_TENSION_BONUS_COEFFICIENT = 0.1;
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
var Skill = (function () {
    function Skill(skill_data, level) {
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
    return Skill;
})();
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
    BaseLiveCalcViewModel.prototype.calculation_petit_idol = function (event_bonus, bonus_type, bonus_parameter) {
        if (event_bonus === void 0) { event_bonus = 0; }
        if (bonus_type === void 0) { bonus_type = -1; }
        if (bonus_parameter === void 0) { bonus_parameter = -1; }
        var petit_idol_bonus = 0;
        for (var i = 0; i < this.petit_idol_list.length; i++) {
            var petit_idol = this.petit_idol_list[i];
            petit_idol.calculation(event_bonus, bonus_type, bonus_parameter);
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
                appeal_bonus[setting["type"]] = setting["value"].toString();
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
                    rival_front_num[setting["type"]] = setting["value"].toString();
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
                    rival_back_num[setting["type"]] = setting["value"].toString();
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
        if (this.is_skill_input_type_manual()) {
            return;
        }
        for (var i = 0; i < this.idol_list.length; i++) {
            var idol = this.idol_list[i];
            idol.offense_skill = "0";
            idol.defense_skill = "0";
            idol.enable_skill = false;
        }
        // 発動スキル取得
        jQuery.when(this.get_invoke_skill_list()).done(function (skills) {
            // スキル効果適用
            var front_num = parseInt(_this.front_num);
            for (var i = 0; i < _this.idol_list.length; i++) {
                var front_member = (i < front_num);
                _this.apply_skill_effect(_this.idol_list[i], front_member, skills);
            }
        });
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
            var invoke_skills = [];
            var skill_input_type = parseInt(_this.skill_input_type);
            for (var i = 0; i < _this.idol_list.length && i < front_num; i++) {
                var idol = _this.idol_list[i];
                if (parseInt(idol.skill_id) > 0 && parseInt(idol.skill_level) > 0) {
                    // 発動スキルを取得
                    var skill = _this.get_skill(idol, skill_data_list);
                    if (skill != null && _this.check_skill_enable(skill, member_num, rival_member_num)) {
                        idol.enable_skill = true;
                        _this.correct_skill_value(skill, invoke_skills.length);
                        if (skill.target_member == 0 /* SELF */) {
                            // 自分スキルの適用
                            _this.apply_skill_value(idol, skill);
                        }
                        invoke_skills.push(skill);
                    }
                    if (skill_input_type != 2 /* AUTO_MEAN */ && invoke_skills.length >= _this.max_skill_invoke) {
                        break;
                    }
                }
            }
            deferred.resolve(invoke_skills);
        });
        return deferred.promise();
    };
    // スキル取得
    BaseLiveCalcViewModel.prototype.get_skill = function (idol, skill_data_list) {
        // 発動スキルを取得
        var skill_data = jQuery.extend(true, {}, skill_data_list[idol.skill_id]);
        if (skill_data["skill_value_list"].length == 0) {
            return null;
        }
        var skill = new Skill(skill_data, parseInt(idol.skill_level));
        return skill;
    };
    BaseLiveCalcViewModel.prototype.check_skill_enable = function (skill, member_num, rival_member_num) {
        if (skill.target_unit == 0 /* OWN */) {
            // 自分
            return this.check_target_own_unit_skill_enable(skill, member_num);
        }
        // 相手
        return this.check_target_rival_unit_skill_enable(skill, rival_member_num);
    };
    BaseLiveCalcViewModel.prototype.check_target_own_unit_skill_enable = function (skill, member_num) {
        var enable_skill_type = parseInt(this.enable_skill_type);
        // 有効スキルかチェック
        if (enable_skill_type != 0 /* ALL */ && skill.target_param != 0 /* ALL */ && enable_skill_type != skill.target_param) {
            return false;
        }
        if (skill.target_member == 0 /* SELF */) {
            return true;
        }
        // 対象範囲チェック
        return this.check_skill_target(skill, member_num);
    };
    BaseLiveCalcViewModel.prototype.check_target_rival_unit_skill_enable = function (skill, rival_member_num) {
        var enable_skill_type = parseInt(this.enable_skill_type);
        // 有効スキルかチェック
        return (enable_skill_type == 0 /* ALL */ || (enable_skill_type ^ skill.target_param) > 0);
    };
    // スキルの対象範囲をチェック
    BaseLiveCalcViewModel.prototype.check_skill_target = function (skill, member_num) {
        var enable_skill = false;
        switch (skill.target_member) {
            case 1 /* FRONT */:
                for (var i = 0; i < member_num[0].length; i++) {
                    if ((skill.target_type & (1 << i)) > 0 && member_num[0][i] > 0) {
                        enable_skill = true;
                        break;
                    }
                }
                break;
            case 2 /* BACK */:
                for (var i = 0; i < member_num[1].length; i++) {
                    if ((skill.target_type & (1 << i)) > 0 && member_num[1][i] > 0) {
                        enable_skill = true;
                        break;
                    }
                }
                break;
            case 3 /* ALL */:
                for (var i = 0; i < member_num.length; i++) {
                    for (var j = 0; j < member_num[i].length; j++) {
                        if ((skill.target_type & (1 << j)) > 0 && member_num[i][j] > 0) {
                            enable_skill = true;
                            break;
                        }
                    }
                }
                break;
        }
        return enable_skill;
    };
    //
    BaseLiveCalcViewModel.prototype.correct_skill_value = function (skill, index) {
        if (parseInt(this.skill_input_type) != 2 /* AUTO_MEAN */) {
            return;
        }
        var rate = this.skill_invocation_rate_list[index];
        if (rate != undefined) {
            skill.value *= (rate / 100);
        }
    };
    BaseLiveCalcViewModel.prototype.apply_skill_effect = function (idol, front_member, skills) {
        for (var i = 0; i < skills.length; i++) {
            var skill = skills[i];
            if (!this.check_apply_skill(idol, skill)) {
                continue;
            }
            switch (skill.target_member) {
                case 0 /* SELF */:
                    break;
                case 1 /* FRONT */:
                    // フロントメンバー
                    if (front_member) {
                        this.apply_skill_value(idol, skill);
                    }
                    break;
                case 2 /* BACK */:
                    // バックメンバー
                    if (!front_member && (skill.target_num == -1 || skill.target_num > 0)) {
                        this.apply_skill_value(idol, skill);
                        skill.target_num--;
                    }
                    break;
                case 3 /* ALL */:
                    // 全メンバー
                    if (front_member) {
                        this.apply_skill_value(idol, skill);
                    }
                    else if (skill.target_num == -1 || skill.target_num > 0) {
                        this.apply_skill_value(idol, skill);
                        skill.target_num--;
                    }
                    break;
                default:
                    break;
            }
        }
    };
    BaseLiveCalcViewModel.prototype.apply_skill_value = function (idol, skill) {
        var offense_skill = parseFloat(idol.offense_skill);
        var defense_skill = parseFloat(idol.defense_skill);
        switch (skill.target_param) {
            case 0 /* ALL */:
                offense_skill += skill.value;
                defense_skill += skill.value;
                break;
            case 1 /* OFFENSE */:
                offense_skill += skill.value;
                break;
            case 2 /* DEFENSE */:
                defense_skill += skill.value;
                break;
        }
        idol.offense_skill = offense_skill.toString();
        idol.defense_skill = defense_skill.toString();
    };
    // スキル効果適用可能チェック
    BaseLiveCalcViewModel.prototype.check_apply_skill = function (idol, skill) {
        var result = false;
        var type = parseInt(idol.type);
        // スキルが効果適用可能かチェック
        if (skill.target_unit == 0 /* OWN */) {
            if (skill.target_member == 0 /* SELF */ || (skill.target_type & (1 << type)) > 0) {
                result = true;
            }
        }
        return result;
    };
    // ぷちアイドル最大数
    BaseLiveCalcViewModel.PETIT_IDOL_NUM = 3;
    return BaseLiveCalcViewModel;
})();
/// <reference path="live_calc.base.ts" />
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var ViewModel = (function (_super) {
    __extends(ViewModel, _super);
    function ViewModel() {
        _super.call(this);
        this.calc_type = 1 /* SURVIVAL */.toString();
        // 入力項目
        this.total_cost = "0";
        this.use_cost_percent = "100";
        this.status_up = "0";
        this.auto_sort = false;
        this.sort_type = "0";
        this.add_idol = new UserIdol();
        this.add_idol_num = "1";
        // 発揮値
        this.total_offense = 0;
        // セーブデータ関係
        this.save_data_key = "imas_cg_survival_calc";
        var self = this;
        this.add = function () {
            var index = self.idol_list.indexOf(this);
            self.idol_list.splice(index + 1, 0, new UserIdol());
        };
        this.remove = function () {
            if (self.idol_list.length > 1) {
                self.idol_list.remove(this);
            }
        };
        this.init_list();
        ko.track(this);
    }
    ViewModel.prototype.actual_offense = function () {
        return this.calculation();
    };
    // アイドルリスト初期化
    ViewModel.prototype.init_idol_list = function () {
        var idols = [];
        idols.push(new UserIdol());
        this.idol_list = idols;
    };
    // 発揮値計算
    ViewModel.prototype.calculation = function () {
        // ソート
        this.sort_idol();
        var total_cost = parseInt(this.total_cost);
        var cost_cut = (total_cost > 0);
        var status_up = parseInt(this.status_up);
        var training_room_level = parseInt(this.training_room_level);
        // 使用コスト計算
        var use_cost_list = [];
        for (var i = 20; i <= 100; i = i + 20) {
            use_cost_list.push(Math.floor(total_cost * (i / 100)));
        }
        var rest_cost = parseInt(this.total_cost);
        var ratio = parseInt(this.use_cost_percent) / 100;
        var use_cost = Math.floor(rest_cost * ratio);
        // 合計発揮値計算
        var total_offense = 0;
        for (var i = 0; i < this.idol_list.length; i++) {
            var idol = this.idol_list[i];
            // アイドルごとの発揮値計算
            idol.calculation_survival(cost_cut, rest_cost);
            total_offense += idol.actual_offense;
            // 文字色変更
            var class_name = "";
            if (cost_cut && rest_cost > 0) {
                var _total_cost = total_cost - rest_cost;
                for (var j = 0; j < use_cost_list.length; j++) {
                    if (_total_cost < use_cost_list[j]) {
                        class_name = "survival" + ((j + 1) * 20);
                        break;
                    }
                }
            }
            if (cost_cut && rest_cost < idol.get_cost()) {
                class_name += " cost_over";
            }
            idol.style = "numeric " + class_name;
            rest_cost -= parseInt(idol.cost);
            if (rest_cost < 0) {
                rest_cost = 0;
            }
        }
        this.total_offense = Math.ceil(total_offense * 100) / 100;
        // 実発揮値計算
        var actual_offense = Math.ceil(total_offense);
        // 消費コスト補正
        var total_cost = total_cost - rest_cost;
        if (total_cost > use_cost) {
            actual_offense = actual_offense * (use_cost / total_cost);
            actual_offense = Math.ceil(actual_offense);
        }
        // 能力値上昇値計算
        var ratio = status_up / 100;
        var status_up_bonus = actual_offense * ratio;
        // トレーニングルームボーナス値計算
        ratio = training_room_level / 100;
        var training_room_bonus = Math.ceil(actual_offense * ratio) + Math.ceil(status_up_bonus * ratio);
        // ボーナス補正
        actual_offense = Math.ceil(actual_offense + status_up_bonus) + training_room_bonus;
        return actual_offense;
    };
    // ソート処理
    ViewModel.prototype.sort_idol = function () {
        if (this.auto_sort) {
            var idol_list = this.idol_list;
            idol_list.sort(function (a, b) {
                var result = 0;
                var a_ratio = a.offense_per_cost();
                var a_value = parseInt(a.offense);
                var b_ratio = b.offense_per_cost();
                var b_value = parseInt(b.offense);
                if (a_ratio != b_ratio) {
                    // コスト比大きさでソート
                    result = (b_ratio > a_ratio) ? 1 : -1;
                }
                else if (a_value != b_value) {
                    // コスト比が同じ場合、ステータスの大きさでソート
                    result = (b_value > a_value) ? 1 : -1;
                }
                return result;
            });
            this.idol_list = idol_list;
        }
    };
    // 設定取得
    ViewModel.prototype.get_setting = function () {
        var setting = {};
        // 共通部分のパラメータ取得
        setting["user_cost"] = this.total_cost;
        setting["use_cost_percent"] = this.use_cost_percent;
        setting["status_up"] = this.status_up;
        setting["training_room_level"] = this.training_room_level;
        // アイドル個別のパラメータ取得
        setting["idol"] = this.get_idol_setting();
        return setting;
    };
    // 設定反映
    ViewModel.prototype.set_setting = function (setting) {
        // 共通部分のパラメータ設定
        this.total_cost = setting["user_cost"];
        this.use_cost_percent = setting["use_cost_percent"];
        this.status_up = setting["status_up"];
        this.training_room_level = setting["training_room_level"];
        // アイドル個別のパラメータ設定
        this.set_idol_setting(setting["idol"]);
    };
    // アイドル一括追加
    ViewModel.prototype.add_idols = function () {
        var setting = this.add_idol.get_setting();
        var num = parseInt(this.add_idol_num);
        var idol_list = this.idol_list;
        for (var i = 0; i < num; i++) {
            var idol = new UserIdol();
            idol.set_setting(setting);
            idol_list.push(idol);
        }
        ko.valueHasMutated(this, "idol_list");
    };
    return ViewModel;
})(BaseLiveCalcViewModel);
jQuery(function () {
    ko.applyBindings(new ViewModel());
});
//# sourceMappingURL=survival_calc.js.map