module.exports = (grunt) ->
	# Project configuration.
	grunt.initConfig
		pkg: grunt.file.readJSON("package.json")
		ts:
			options:
				comments: true
				sourceMap: true
				target: "es5"
			live_calc:
				src: ["src/common.ts", "src/idol.model.ts", "src/skill.ts", "src/live_calc.base.ts", "src/live_calc.ts"]
				dest: "script/live_calc.js"
			survival_calc:
				src: ["src/common.ts", "src/idol.model.ts", "src/skill.ts", "src/live_calc.base.ts", "src/survival_calc.ts"]
				dest: "script/survival_calc.js"
			live_tour_calc:
				src: ["src/common.ts", "src/idol.model.ts", "src/skill.ts", "src/live_calc.base.ts", "src/live_tour_calc.base.ts", "src/live_tour_calc.ts"]
				dest: "script/live_tour_calc.js"
			live_royal_calc:
				src: ["src/common.ts", "src/idol.model.ts", "src/skill.ts", "src/live_calc.base.ts", "src/live_tour_calc.base.ts", "src/live_royal_calc.ts"]
				dest: "script/live_royal_calc.js"
			challenge_calc:
				src: ["src/common.ts", "src/idol.model.ts", "src/skill.ts", "src/live_calc.base.ts", "src/live_tour_calc.base.ts", "src/challenge_calc.ts"]
				dest: "script/challenge_calc.js"
			live_trial_calc:
				src: ["src/common.ts", "src/idol.model.ts", "src/skill.ts", "src/live_calc.base.ts", "src/live_trial_calc.ts"]
				dest: "script/live_trial_calc.js"
		uglify:
			options:
				compress: true
			live_calc:
				files:
					"script/live_calc.min.js": ["script/live_calc.js"]
			survival_calc:
				files:
					"script/survival_calc.min.js": ["script/survival_calc.js"]
			live_tour_calc:
				files:
					"script/live_tour_calc.min.js": ["script/live_tour_calc.js"]
			live_royal_calc:
				files:
					"script/live_royal_calc.min.js": ["script/live_royal_calc.js"]
			challenge_calc:
				files:
					"script/challenge_calc.min.js": ["script/challenge_calc.js"]
			live_trial_calc:
				files:
					"script/live_trial_calc.min.js": ["script/live_trial_calc.js"]

	# Load the plugin
	grunt.loadNpmTasks "grunt-ts"
	grunt.loadNpmTasks "grunt-contrib-uglify"

	# Tasks
	grunt.registerTask "build_live_calc", ["ts:live_calc", "uglify:live_calc"]
	grunt.registerTask "build_survival_calc", ["ts:survival_calc", "uglify:survival_calc"]
	grunt.registerTask "build_live_tour_calc", ["ts:live_tour_calc", "uglify:live_tour_calc"]
	grunt.registerTask "build_live_royal_calc", ["ts:live_royal_calc", "uglify:live_royal_calc"]
	grunt.registerTask "build_challenge_calc", ["ts:challenge_calc", "uglify:challenge_calc"]
	grunt.registerTask "build_live_trial_calc", ["ts:live_trial_calc", "uglify:live_trial_calc"]
	grunt.registerTask "default", ["ts", "uglify"]