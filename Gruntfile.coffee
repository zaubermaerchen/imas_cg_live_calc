module.exports = (grunt) ->
	# Project configuration.
	grunt.initConfig
		pkg: grunt.file.readJSON("package.json")
		typescript:
			options:
				comments: true
				sourceMap: true
			live_calc:
				src: ["src/common.ts", "src/idol.model.ts", "src/live_calc.base.ts", "src/live_calc.ts"]
				dest: "script/live_calc.js"
			survival_calc:
				src: ["src/common.ts", "src/idol.model.ts", "src/live_calc.base.ts", "src/survival_calc.ts"]
				dest: "script/survival_calc.js"
			live_tour_calc:
				src: ["src/common.ts", "src/idol.model.ts", "src/live_calc.base.ts", "src/live_tour_calc.base.ts", "src/live_tour_calc.ts"]
				dest: "script/live_tour_calc.js"
			live_royal_calc:
				src: ["src/common.ts", "src/idol.model.ts", "src/live_calc.base.ts", "src/live_tour_calc.base.ts", "src/live_royal_calc.ts"]
				dest: "script/live_royal_calc.js"
			challenge_calc:
				src: ["src/common.ts", "src/idol.model.ts", "src/live_calc.base.ts", "src/live_tour_calc.base.ts", "src/challenge_calc.ts"]
				dest: "script/challenge_calc.js"
			live_trial_calc:
				src: ["src/common.ts", "src/idol.model.ts", "src/live_calc.base.ts", "src/live_trial_calc.ts"]
				dest: "script/live_trial_calc.js"
		uglify:
			options:
				compress: true
			live_calc:
				files:
					"script/live_calc.min.js": ["script/live_calc.js"]
				options:
					banner: "/*!\n * THE IDOLM@STER CINDERELLA GIRLS Exertion Value Calculator\n * Copyright (c) 2012 Mutsuki Kimuraya (http://www4018uf.sakura.ne.jp/)\n * Released under the MIT license\n * http://opensource.org/licenses/mit-license.php\n */\n"
			survival_calc:
				files:
					"script/survival_calc.min.js": ["script/survival_calc.js"]
				options:
					banner: "/*!\n * THE IDOLM@STER CINDERELLA GIRLS Exertion Value Calculator for Idol Survival \n * Copyright (c) 2014 Mutsuki Kimuraya (http://www4018uf.sakura.ne.jp/)\n * Released under the MIT license\n * http://opensource.org/licenses/mit-license.php\n */\n"
			live_tour_calc:
				files:
					"script/live_tour_calc.min.js": ["script/live_tour_calc.js"]
				options:
					banner: "/*!\n * THE IDOLM@STER CINDERELLA GIRLS Exertion Value Calculator for Live Tour\n * Copyright (c) 2013 Mutsuki Kimuraya (http://www4018uf.sakura.ne.jp/)\n * Released under the MIT license\n * http://opensource.org/licenses/mit-license.php\n */\n"
			live_royal_calc:
				files:
					"script/live_royal_calc.min.js": ["script/live_royal_calc.js"]
				options:
					banner: "/*!\n * THE IDOLM@STER CINDERELLA GIRLS Exertion Value Calculator for Idol Live Royal \n * Copyright (c) 2013 Mutsuki Kimuraya (http://www4018uf.sakura.ne.jp/)\n * Released under the MIT license\n * http://opensource.org/licenses/mit-license.php\n */\n"
			challenge_calc:
				files:
					"script/challenge_calc.min.js": ["script/challenge_calc.js"]
				options:
					banner: "/*!\n * THE IDOLM@STER CINDERELLA GIRLS Exertion Value Calculator for Idol Challenge\n * Copyright (c) 2014 Mutsuki Kimuraya (http://www4018uf.sakura.ne.jp/)\n * Released under the MIT license\n * http://opensource.org/licenses/mit-license.php\n */\n"
			live_trial_calc:
				files:
					"script/live_trial_calc.min.js": ["script/live_trial_calc.js"]
				options:
					banner: "/*!\n * THE IDOLM@STER CINDERELLA GIRLS Exertion Value Calculator for Live Trial \n * Copyright (c) 2013 Mutsuki Kimuraya (http://www4018uf.sakura.ne.jp/)\n * Released under the MIT license\n * http://opensource.org/licenses/mit-license.php\n */\n"

	# Load the plugin
	grunt.loadNpmTasks "grunt-typescript"
	grunt.loadNpmTasks "grunt-contrib-uglify"

	# Tasks
	grunt.registerTask "build_live_calc", ["typescript:live_calc", "uglify:live_calc"]
	grunt.registerTask "build_survival_calc", ["typescript:survival_calc", "uglify:survival_calc"]
	grunt.registerTask "build_live_tour_calc", ["typescript:live_tour_calc", "uglify:live_tour_calc"]
	grunt.registerTask "build_live_royal_calc", ["typescript:live_royal_calc", "uglify:live_royal_calc"]
	grunt.registerTask "build_challenge_calc", ["typescript:challenge_calc", "uglify:challenge_calc"]
	grunt.registerTask "build_live_trial_calc", ["typescript:live_trial_calc", "uglify:live_trial_calc"]
	grunt.registerTask "default", ["typescript", "uglify"]