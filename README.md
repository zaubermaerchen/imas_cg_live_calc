THE IDOLM@STER CINDERELLA GIRLS 発揮値計算機
=================
THE IDOLM@STER CINDERELLA GIRLSの各種イベントでの発揮値等をシミュレートする計算機です。
計算機と各イベントの対応状況は下記の通りです。

* live_calc - 通常LIVEバトル/プロダクションマッチフェスティバル/プロダクションマッチフェスティバルS
* survival_calc - アイドルサバイバル
* live_tour_calc - アイドルLIVEツアー/ドリームLIVEフェスティバル/プロダクション対抗トークバトルショー
* live_royal_calc - アイドルLIVEロワイヤル
* challenge_calc - アイドルチャレンジ
* live_trial_calc - アイドルセッション(未完成)

必要ミドルウェア
---------------

* Node.js >= 0.10.29

必要Node.jsモジュール
---------------

* typescript >= 1.3.0
* tsd >= 0.5.7
* grunt >= 0.4.5
* grunt-cli >= 0.1.13
* grunt-typescript >= 0.4.7
* grunt-contrib-uglify >= 0.7.7

スクリプトビルド手順
---------------

1. 必要ミドルウェアをインストールする
1. プロジェクトのルートディレクトリで「npm install」を実行し、必要Node.jsモジュールをインストールする
1. プロジェクトのルートディレクトリで「node_modules/.bin/grunt」を実行するとビルドが実行され、scriptディレクトリ内に最新スクリプトが出力される

使用JavaScriptライブラリ
---------------

* [jQuery](http://jquery.com/)
* [jQuery UI](http://jqueryui.com/)
* [Knockout](http://knockoutjs.com/)
* [knockout-es5](https://github.com/SteveSanderson/knockout-es5)
* [knockout-sortable](https://github.com/rniemeyer/knockout-sortable)
* [Select2](http://ivaynberg.github.io/select2/)
* [zlib.js](https://github.com/imaya/zlib.js)