var app = angular.module('tinker', [
	'pouchdb',
	'ionic',
	'angularMoment'
])

app.config(function($ionicConfigProvider) {
	$ionicConfigProvider.spinner.icon('none')
  $ionicConfigProvider.views.transition('ios')
  $ionicConfigProvider.tabs.style('standard').position('bottom')
  $ionicConfigProvider.navBar.alignTitle('center').positionPrimaryButtons('left')
})

app.run(function($window, $rootScope) {
	$rootScope.online = navigator.onLine

	$window.addEventListener('offline', function() {
		$rootScope.$apply(function() {
			$rootScope.online = false
		})
	}, false)

	$window.addEventListener('online', function() {
		$rootScope.$apply(function() {
			$rootScope.online = true
		})
	}, false)
})

app.controller('GamesCtrl', function(
	$log, $scope, $http, $ionicSideMenuDelegate,
	$ionicModal, $ionicPopover, pouchDB, $timeout,
	usersDB
) {
	$scope.timeboxStarted = false
	$scope.currentTimebox = {}

	var gamesDB = pouchDB('games'),
	changes = gamesDB.changes({live: true, since: 'now'}),
	numChanges = 0

	gamesDB.info().catch(function (err) {
		gamesDB = new PouchDB(remote)
	})

	sessionGame = window.sessionStorage.getItem('currentGame')

	var currentUser = window.sessionStorage.getItem('currentUser')

  $ionicModal.fromTemplateUrl('signInModal.html', (modal) => {
    $scope.signInModal = modal;
  }, {
    focusFirstInput: true
  })

  $ionicModal.fromTemplateUrl('signUpModal.html', (modal) => {
    $scope.signUpModal = modal;
  }, {
    focusFirstInput: true
  })

  $ionicPopover.fromTemplateUrl('editPopover.html').then((popover) => {
    $scope.popover = popover
  })

  $scope.openPopover = function($event) {
    $scope.popover.show($event);
  };

  $scope.closePopover = function() {
    $scope.popover.hide();
  };

  $scope.$on('$destroy', function() {
    $scope.popover.remove();
  });

	$scope.editTemp
	$scope.game = []
	$scope.game.game = ''
	$scope.game.end = ''
	$scope.game.repeat = ''
	$scope.game.priority = 4

	$scope.addForm = {
		game: {
			text: '',
			error: '',
			info: '',
			success: ''
		},
		time: {
			text: '',
			error: '',
			info: '',
			success: '',
			typeahead: ''
		}
	}

	$scope.editForm = {
		game: {
			text: '',
			error: '',
			info: '',
			success: ''
		},
		time: {
			text: '',
			error: '',
			info: '',
			success: '',
			typeahead: ''
		},
		priority: {
			value: $scope.game.priority
		}
	}

	$scope.replayForm = {
		time: {
			text: '',
			error: '',
			info: '',
			success: '',
			typeahead: ''
		},
		priority: {
			value: $scope.game.priority
		}
	}

	/**
	 * @description
	 * Performs some tasks when the data on the db changes
	 */
	changes.on('change', (change) => {

		if ($scope.currentGame._id != '_endgame') {
			$scope.fetchOne($scope.currentGame._id, (doc) => {
				$scope.currentGame = doc
				$scope.fetchPath($scope.currentGame._id)
			}, (err) => {

				if (err.status == 404) {
					$scope.currentGame = {
						_id: '_endgame'
					}
				} else {
					console.error(err)
				}
			})

			$scope.fetchOne($scope.currentGame.parent, (parent) => {
				$scope.currentParent = parent
			}, (err) => {
				console.error(err)
			})
		}

		$scope.fetchChildrenWithState($scope.currentGame._id)

		$scope.fetchDueTodays((dueTodays) => {
			$scope.dueTodays = dueTodays
		})
		$scope.fetchRoutines((routines) => {
			$scope.routines = routines
		})
		$scope.fetchPasts((pasts) => {
			$scope.pasts = pasts
		})
		$scope.fetchPrios((prios) => {
			$scope.prios = prios
		})
	})

	/**
	 * @name $scope.fetchChildren
	 * @description
	 * fetches all the children for the parent
	 * @param {string} parent - the parent id
	 * @param {function} success - callback on success
	 * @param {function} error - callback on error
	 * @returns {array} an array containing all the child games
	 */
	$scope.fetchChildren = function(parent, success, error) {

		if (success == undefined) {
			success = function() {}
		}

		if (error == undefined) {
			error = function() {}
		}

		childrenMap = function(doc, emit) {
		  if (doc.parent == parent && doc.user == currentUser) {

		    emit([doc.position])
		  }
		}

		gamesDB.query(childrenMap, {include_docs: true}).then((games) => {
			success(games.rows)
		}).catch((err) => {
			error(err)
		})
	}

	/**
	 * @name $scope.fetchChildrenWithState
	 * @description
	 * fetches the childrent of a parent and adds them to
	 * $scope variables based on their states
	 * i.e. if state ==
	 * 'playing' -> $scope.playingGames
	 * 'won' -> $scope.wonGames
	 * 'lost' -> $scope.lostGames
	 * @param {string} parent - the parent id
	 * @param {function} success - callback on success
	 * @param {function} error - callback on error
	 * @returns
	 */
	$scope.fetchChildrenWithState = function(parent, success, error) {

		if (success == undefined) {
			success = function() {}
		}

		if (error == undefined) {
			error = function() {}
		}

		childrenMap = function(doc, emit) {
		  if (doc.parent == parent && doc.user == currentUser) {

		    emit([doc.position])
		  }
		}

		gamesDB.query(
			childrenMap,
			{include_docs: true}
		).then((games) => {

			$scope.playingGames = []
			$scope.wonGames = []
			$scope.lostGames = []

			$.each(games.rows, function() {
        var game = $(this)[0].doc
        
        if (game.space === '_trash') {
          return false
        }

				if (game.plays[game.plays.length-1].state == 'playing') {
					$scope.playingGames.push($(this)[0])
				}

				if (game.plays[game.plays.length-1].state == 'won') {
					$scope.wonGames.push($(this)[0])
				}

				if (game.plays[game.plays.length-1].state == 'lost') {
					$scope.lostGames.push($(this)[0])
				}
			})

			success(games.rows)
		}).catch((err) => {
			error(err)
		})

	}

	/**
	 * @name $scope.fetchOne
	 * @description
	 * fetches a single game from the db
	 * @param {string} id - id of the game fetched
	 * @param {function} success - callback on success
	 * @param {function} error - callback on error
	 * @returns {object} the fetched game
	 */
	$scope.fetchOne = function(id, success, error) {

		if (success == undefined) {
			success = function() {}
		}

		if (error == undefined) {
			error = function() {}
		}

		gamesDB.get(id).then((doc) => {
			success(doc)
			return doc
		}).catch((err) => {
			error(err)
		})
	}

	/**
	 * @name $scope.fetchPath
	 * @description
	 * fetches the path leading to a game (the ancestors)
	 * and adds them into $scope.currentPath
	 * @param {string} id - id of the game
	 * @param {function} success - callback on success
	 * @param {function} error - callback on error
	 * @returns
	 */
	$scope.fetchPath = function(id, success, error) {

		var tempPath = []

		if (success == undefined) {
			success = function() {}
		}

		if (error == undefined) {
			error = function() {}
		}

		(function insertToPath(i, parent) {

   		gamesDB.get(parent, {include_docs: true}, function(err, current) {

      	if (--i > 0 && parent != '_endgame') {

					console.log(current)
					console.log(id)
      		if (id != current._id) {
      			tempPath.splice(0, 0, current)
      		}

	      	insertToPath(i, current.parent)
      	} else {
    			$scope.currentPath = []
    			$scope.currentPath = tempPath
    		}
   		})
		})(30, id)
	}

	/**
	 * @name $scope.fetchPrios
	 * @description
	 * calculates the priorities of each game
	 * and returns by ordering them using their respective priorities
	 * @param {string} parent - the parent game (not implemented yet)
	 * @param {function} success - callback on success
	 * @param {function} error - callback on error
	 * @returns {array} priority games
	 */
	$scope.fetchPrios = function(success, error) {

		if (success == undefined) {
			success = function() {}
		}

		if (error == undefined) {
			error = function() {}
		}

		prioMap = function(doc, emit) {
			var endTime = doc.plays[doc.plays.length-1].end,
			endDate = Date.create(endTime)

		  if (
				doc.space != '_trash'
				&& doc.user == currentUser
				&& doc.plays[doc.plays.length-1].state == 'playing'
				&& endDate.isAfter(Date.create().endOfDay())
			) {
				var now = Date.create().valueOf(),
				time = Date.create(doc.plays[doc.plays.length-1].end).valueOf(),
				priority = doc.plays[doc.plays.length-1].priority,
				diff = now - time,
				absDiff = Math.abs(diff)
				order = (time - (diff - absDiff) * Math.log(absDiff)) / Math.log(2000 + (priority/2))

		    emit([order])
		  }
		}

		gamesDB.query(
			prioMap,
			{include_docs: true, limit: 15}
		).then((games) => {
			success(games.rows)
		}).catch((err) => {
			error(err)
		})
	}

	/**
	 * @name $scope.fetchDueTodays
	 * @description
	 * calculates the priorities of each game
	 * and returns by ordering them using their respective priorities
	 * @param {string} parent - the parent game (not implemented yet)
	 * @param {function} success - callback on success
	 * @param {function} error - callback on error
	 * @returns {array} priority games
	 */
	$scope.fetchDueTodays = function(success, error) {

		if (success == undefined) {
			success = function() {}
		}

		if (error == undefined) {
			error = function() {}
		}

		gamesMap = function(doc, emit) {
			var endTime = doc.plays[doc.plays.length-1].end,
			endDate = Date.create(endTime)

		  if (
				doc.parent != '_trash'
				&& doc.user == currentUser
				&& doc.plays[doc.plays.length-1].state == 'playing'
				&& doc.repeat == undefined
				&& endDate.isBefore(Date.create().endOfDay())
				&& endDate.isAfter(Date.create().beginningOfDay())
			) {
				var now = Date.create().valueOf(),
				time = Date.create(doc.plays[doc.plays.length-1].end).valueOf(),
				priority = doc.plays[doc.plays.length-1].priority,
				diff = now - time,
				absDiff = Math.abs(diff)
				order = (time - (diff - absDiff) * Math.log(absDiff)) / Math.log(2000 + (priority/2))

		    emit([order])
		  }
		}

		gamesDB.query(gamesMap, {include_docs: true}).then((games) => {

			success(games.rows)
		}).catch((err) => {
			error(err)
		})
	}

	/**
	 * @name $scope.fetchPasts
	 * @description
	 * calculates the priorities of each game
	 * and returns by ordering them using their respective priorities
	 * @param {string} parent - the parent game (not implemented yet)
	 * @param {function} success - callback on success
	 * @param {function} error - callback on error
	 * @returns {array} priority games
	 */
	$scope.fetchPasts = function(success, error) {

		if (success == undefined) {
			success = function() {}
		}

		if (error == undefined) {
			error = function() {}
		}

		gamesMap = function(doc, emit) {
			var endTime = doc.plays[doc.plays.length-1].end,
			endDate = Date.create(endTime)

		  if (
				doc.parent != '_trash'
				&& doc.user == currentUser
				&& doc.plays[doc.plays.length-1].state == 'playing'
				&& doc.repeat == undefined
				&& endDate.isBefore(Date.create().beginningOfDay())
			) {
				var now = Date.create().valueOf(),
				time = Date.create(doc.plays[doc.plays.length-1].end).valueOf(),
				priority = doc.plays[doc.plays.length-1].priority,
				diff = now - time,
				absDiff = Math.abs(diff)
				order = (time - (diff - absDiff) * Math.log(absDiff)) / Math.log(2000 + (priority/2))

		    emit([order])
		  }
		}

		gamesDB.query(gamesMap, {include_docs: true}).then((games) => {

			success(games.rows)
		}).catch((err) => {
			error(err)
		})
	}

	/**
	 * @name $scope.fetchRoutines
	 * @description
	 * calculates the priorities of each game
	 * and returns by ordering them using their respective priorities
	 * @param {function} success - callback on success
	 * @param {function} error - callback on error
	 * @returns {array} priority games
	 */
	$scope.fetchRoutines = function(success, error) {

		if (success == undefined) {
			success = function() {}
		}

		if (error == undefined) {
			error = function() {}
		}

		gamesMap = function(doc, emit) {
			var endTime = doc.plays[doc.plays.length-1].end,
			endDate = Date.create(endTime)

		  if (
				doc.parent != '_trash'
				&& doc.user == currentUser
				&& doc.plays[doc.plays.length-1].state == 'playing'
				&& doc.repeat != undefined
				&& endDate.isBefore(Date.create().endOfDay())
			) {
				var now = Date.create().valueOf(),
				time = Date.create(doc.plays[doc.plays.length-1].end).valueOf(),
				priority = doc.plays[doc.plays.length-1].priority,
				diff = now - time,
				absDiff = Math.abs(diff)
				order = (time - (diff - absDiff) * Math.log(absDiff)) / Math.log(2000 + (priority/2))

		    emit([order])
		  }
		}

		gamesDB.query(gamesMap, {include_docs: true}).then((games) => {

			success(games.rows)
		}).catch((err) => {
			error(err)
		})
	}

	// set session game
	// this shouldn't be here!
	if (sessionGame == undefined || sessionGame == '_endgame') {

		$scope.currentGame = {
			_id: '_endgame'
		}

		$scope.currentParent = {
			_id: '_noparent'
		}

		window.sessionStorage.setItem('currentGame', '_endgame')

		$scope.fetchChildrenWithState($scope.currentGame._id)

		$scope.fetchDueTodays((dueTodays) => {
			$scope.dueTodays = dueTodays
		})
		$scope.fetchRoutines((routines) => {
			$scope.routines = routines
		})
		$scope.fetchPasts((pasts) => {
			$scope.pasts = pasts
		})
		$scope.fetchPrios((prios) => {
			$scope.prios = prios
		})
	} else {

		$scope.fetchOne(sessionGame, (doc) => {
			$scope.currentGame = doc

			$scope.fetchChildrenWithState($scope.currentGame._id)

			$scope.fetchDueTodays((dueTodays) => {
				$scope.dueTodays = dueTodays
			})
			$scope.fetchRoutines((routines) => {
				$scope.routines = routines
			})
			$scope.fetchPasts((pasts) => {
				$scope.pasts = pasts
			})
			$scope.fetchPrios((prios) => {
				$scope.prios = prios
			})

			if ($scope.currentGame.parent == '_endgame') {

				$scope.currentParent = {
					_id: '_noparent'
				}
			} else {

				$scope.fetchOne($scope.currentGame.parent, (doc) => {
					$scope.currentParent = doc
				})
			}

			$scope.fetchPath(doc._id)

		}, (err) => {
			window.sessionStorage.setItem('currentGame', '_endgame')

			$scope.currentGame = {
				_id: '_endgame'
			}

			$scope.currentParent = {
				_id: '_noparent'
			}

			$scope.fetchChildrenWithState($scope.currentGame._id)

			$scope.fetchDueTodays((dueTodays) => {
				$scope.dueTodays = dueTodays
			})
			$scope.fetchRoutines((routines) => {
				$scope.routines = routines
			})
			$scope.fetchPasts((pasts) => {
				$scope.pasts = pasts
			})
			$scope.fetchPrios((prios) => {
				$scope.prios = prios
			})
		})
	}


	/**
	 * @name $scope.validateGame
	 * @description
	 * checks if the input game ($scope.game.game) is valid
	 * @returns {boolean} is it valid?
	 */
	$scope.validateGame = function() {
		if ($scope.game.game == '') {
			$scope.addForm.game.error = 'what\'s the game?'
			return false
		} else {
			$scope.addForm.game.error = false
			return true
		}
	}

	/**
	 * @name $scope.validateTime
	 * @description
	 * checks if the input time ($scope.game.end) is valid
	 * @returns {boolean} is it valid?
	 */
	$scope.validateTime = (e) => {

		$('.form-wrap .typeahead').show()

		$scope.addForm.time.typeahead = ''

		var v

		if ($scope.currentGame._id != '_endgame') {
			if (
				$scope.currentGame.repeat != undefined
				&& $scope.currentGame.repeat != false
				&& $scope.currentGame.repeat != 0
			) {
				v = validateTime(
					$scope.game.end,
					$scope.currentGame.end
				)
			} else {
				v = validateTime($scope.game.end, $scope.currentGame.plays[$scope.currentGame.plays.length-1].end)
			}
		} else {
			v = validateTime($scope.game.end)
		}

		var success = v.success

		if (v.error != false) {
			$scope.addForm.time.error = v.error
			$scope.addForm.time.success = v.success

			return false
		} else {

			$scope.addForm.time.error = v.error
			$scope.addForm.time.success = v.success
			$scope.addForm.time.typeahead = v.typeahead

			return true
		}
	}


	/**
	 * @name $scope.validateEditTime
	 * @description
	 * checks if the input time for the edit form is valid
	 * @returns {boolean} is it valid?
	 */
	$scope.validateEditTime = function() {

		var v

		if ($scope.currentGame.parent != '_endgame') {

			if (
				$scope.currentParent.repeat != undefined
				&& $scope.currentParent.repeat != false
				&& $scope.currentParent.repeat != 0
			) {
				v = validateTime(
					$scope.editForm.time.text,
					$scope.currentParent.end
				)
			} else {

				v = validateTime(
					$scope.editForm.time.text,
					$scope.currentParent.plays[$scope.currentParent.plays.length-1].end,
					false
				)
			}
		} else {
			v = validateTime($scope.editForm.time.text, false, false)
		}

		var success = v.success

		if (v.error != false) {
			$scope.editForm.time.error = v.error
			$scope.editForm.time.success = v.success

			return false
		} else {

			$scope.editForm.time.error = v.error
			$scope.editForm.time.success = v.success

			return true
		}
	}


	/**
	 * @name $scope.validateReplayTime
	 * @description
	 * checks if the input time for the replay form is valid
	 * @returns {boolean} is it valid?
	 */
	$scope.validateReplayTime = function() {

		var v

		if ($scope.currentGame.parent != '_endgame') {

			if (
				$scope.currentParent.repeat != undefined
				&& $scope.currentParent.repeat != false
				&& $scope.currentParent.repeat != 0
			) {
				v = validateTime(
					$scope.replayForm.time.text,
					$scope.currentParent.end
				)
			} else {

				v = validateTime(
					$scope.replayForm.time.text,
					$scope.currentParent.plays[$scope.currentParent.plays.length-1].end,
					false
				)
			}
		} else {
			v = validateTime($scope.replayForm.time.text, false, false)
		}

		var success = v.success

		if (v.error != false) {
			$scope.replayForm.time.error = v.error
			$scope.replayForm.time.success = v.success

			return false
		} else {

			$scope.replayForm.time.error = v.error
			$scope.replayForm.time.success = v.success

			return true
		}
	}

	/**
	 * @name $scope.add
	 * @description
	 * put a new game into the db
	 * @returns
	 */
	$scope.add = function() {

		if ($scope.game.game == '') {
			$('.form-wrap .game-input').focus()
			$scope.addForm.game.error = 'what\'s the game?'
			return false
		}

		var v

		if ($scope.currentGame._id != '_endgame') {

			if (
				$scope.currentGame.repeat != undefined
				&& $scope.currentGame.repeat != false
				&& $scope.currentGame.repeat != 0
			) {
				v = validateTime(
					$scope.game.end,
					$scope.currentGame.end
				)
			} else {
				v = validateTime($scope.game.end, $scope.currentGame.plays[$scope.currentGame.plays.length-1].end)
			}
		} else {
			v = validateTime($scope.game.end)
		}

		if (v.error != false) {
			$('.form-wrap .time-input').focus()
			$scope.addForm.time.error = v.error

			return false
		}

		var now = Date.create(),
		end = parseTime($scope.game.end),
		gameId = generateId(),
		gameText = $scope.game.game.trim()

		if ($scope.game.repeat != '') {
			var repeat = parseTime($scope.game.repeat).getTime() - now.getTime(),
			repeatEnd = Date.create(Date.create().getTime() + repeat)
		}

		if (end == false) {
			$('.form-wrap .time-input').focus()
			$scope.addForm.time.error = 'unknown error'
			return false
		}

		countMap = function(doc, emit) {
			if(doc.parent == parent && doc.user == currentUser) {
				emit()
			}
		}

		// defining game and pushing to $scope.playingGames here because the ui needs to be rendered as fast as possible

		if (repeat != '' && repeat != undefined && repeat != false) {
			var playKind = 'repeat',
			playEnd = repeatEnd
		} else {
			var playKind = 'replay',
			playEnd = end
		}

		// check if there's a colon tag

		var colon = gameText.match(/:[a-zA-Z]+ /)

		if (colon != null && colon.count() > 0) {
			gameText = gameText.remove(/:[a-zA-Z]+ /)
			var colon = colon[0].replace(/:/, '').trim()
		}

		var game = {
			_id: gameId,
			user: currentUser,
			game: gameText,
			colons: [colon],
			parent: $scope.currentGame._id,
			space: '_endgame', // the space in which the game will be, spaces can be '_endgame', '_trash' or '_archive'
			repeat: repeat,
			end: end, // this is the ultimate end, as opposed to the play end (needed to distinguish between a repeat play's end and the game's end)
			created: now,
			plays: [
				{
					state: 'playing',
					end: playEnd,
					kind: playKind,
					priority: $scope.game.priority,
					created: now,
					updates: {
						state: [
							{
								value: 'playing',
								created: now
							}
						],
						end: [
							{
								value: playEnd,
								created: now
							}
						],
						priority: [
							{
								value: $scope.game.priority,
								created: now
							}
						]
					}
				}
			],
			updates: {
				title: [
					{
						value: gameText,
						created: now
					}
				],
				end: [
					{
						value: end,
						created: now
					}
				],
				repeat: [
					{
						value: repeat,
						created: now
					}
				],
				parent: [
					{
						value: $scope.currentGame._id,
						created: now
					}
				]
			}
		}

		var temp = {
			doc: game
		}

		if ($scope.playingGames == undefined) {
			$scope.playingGames = []
		}

		$scope.playingGames.reverse()
		$scope.playingGames.push(temp)
		$scope.playingGames.reverse()

		$scope.hideForm()

		$scope.addForm.time.error = false
		$scope.addForm.time.success = false

		$scope.fetchChildren($scope.currentGame._id, (children) => {

			var low = 1

			$.each(children, function() {
				pos = $(this)[0].doc.position

				if (pos < low) {
					low = pos
				}
			})

			game.position = low - 1

			gamesDB.put(game).then((meta) => {

				gamesDB.get(meta.id, {include_docs: true}).then((res) => {

					var game = {
						doc: res
					}

					$scope.game.game = ''
					$scope.game.end = ''
					$scope.game.repeat = ''
					$scope.game.priority = 4

					$('.form-wrap .repeat-input').hide()
				}).catch((err) => {
					console.log(err)
				})
			}).catch((err) => {
				console.log(err)
			})
		})
	}

	/**
	 * @name $scope.saveEdit
	 * @description
	 * saves an edit into the db
	 * @returns
	 */
	$scope.saveEdit = function() {
		$scope.update(function() {
			$scope.hideEditForm()
		})
	}

	/**
	 * @name $scope.findTrashed
	 * @description
	 * fetches games that have been trashed
	 * @param {function} success - callback on success
	 * @param {function} error - callback on error
	 * @returns {array} trashed games
	 */
	$scope.findTrashed = function(success, error) {

		if (success == undefined) {
			success = function() {}
		}

		if (error == undefined) {
			error = function() {}
		}

		var trashedMap = function(doc, emit) {
		  if (doc.game == '_trash' && doc.user == currentUser) {
		    emit([doc])
		  }
		}

		gamesDB.query(trashedMap, {include_docs: true}).then((trashed) => {
			success(trashed)
		}).catch((err) => {
			error(err)
		})
	}

	/**
	 * @name $scope.delete
	 * @description
	 * deletes $scope.currentGame
	 * @param {function} success - callback on success
	 * @param {function} error - callback on error
	 * @returns {array} trashed games
	 */
	$scope.delete = function(success, error) {

		if (success == undefined) {
			success = function() {}
		}

		if (error == undefined) {
			error = function() {}
		}

		$scope.trash($scope.currentGame._id)

		$scope.openCurrentParent()
		$scope.hideEditForm()
	}

	/**
	 * @name $scope.trash
	 * @description
	 * put a game into trash
	 * TODO: now, it's just changing the parent to '_trash',
	 * it should put it into trash in a way that can
	 * be recovered (without losing the original parent)
	 * @param {string} id - id of the game to be trashed
	 * @param {function} success - callback on success
	 * @param {function} error - callback on error
	 * @returns {object} the trashed game
	 */
	$scope.trash = function(id, success, error) {

		if (success == undefined) {
			success = function() {}
		}

		if (error == undefined) {
			error = function() {}
		}

		gamesDB.get(id).then((doc) => {
			var deleted = doc

			deleted.oldParent = doc.parent
			deleted.parent = '_trash'
			deleted.space = '_trash'

			// record the update
			var update = {
				value: '_trash',
				created: Date.create()
			}

			if (deleted.updates == undefined) {
				deleted.updates = {}
			}

			if (
				deleted.updates.space == undefined
			) {
				deleted.updates.space = []
			}

			deleted.updates.space.push(update)

			return gamesDB.put(deleted, doc._id, doc._rev).then(function() {
				//notify the user that the game has been moved to trash
			}).catch((err) => {
				console.error(err)
			})
		})
	}

	/**
	 * @name $scope.changeParent
	 * @description
	 * changes the parent id of a game
	 * @param {string} child - id of the game to adopted
	 * @param {string} parent - id of the parent game
	 * @param {function} success - callback on success
	 * @param {function} error - callback on error
	 * @returns {object} the adopted
	 */
	$scope.changeParent = function(child, parent, success, error) {


		if (success == undefined) {
			success = function() {}
		}

		if (error == undefined) {
			error = function() {}
		}

		gamesDB.get($scope.currentGame._id).then((edited) => {

			edited.parent = parent

			gamesDB.put(edited, edited._id, edited._rev).then((doc) => {
				success(doc)
			}).catch((err) => {
				error(err)
			})
		}).catch((err) => {
			error(err)
		})
	}

	/**
	 * @name $scope.update
	 * @description
	 * updates a games info based on the values on $scope
	 * @param {function} success - callback on success
	 * @param {function} error - callback on error
	 * @returns {object} the updated game
	 */
	$scope.update = function(success, error) {

		var v

		if ($scope.currentParent._id != '_noparent') {


			if (
				$scope.currentParent.repeat != undefined
				&& $scope.currentParent.repeat != false
				&& $scope.currentParent.repeat != 0
			) {
				v = validateTime(
					$scope.editForm.time.text,
					$scope.currentParent.end
				)
			} else {

				v = validateTime(
					$scope.editForm.time.text,
					$scope.currentParent.plays[$scope.currentParent.plays.length-1].end,
					false
				)
			}
		} else {
			v = validateTime($scope.editForm.time.text, false, false)
		}

		if (v.error != false) {
			$('.edit-form-wrap .time-input').focus()
			$scope.editForm.time.error = v.error
			return false
		}

		if (success == undefined) {
			success = function() {}
		}

		if (error == undefined) {
			error = function() {}
		}

		var end = parseTime($scope.editForm.time.text)

		if (end == false) {
			$('.edit-form-wrap .time-input').focus()
			$scope.editForm.time.error = 'unknown error'
			return false
		}

		if ($scope.editForm.game.text == '') {
			$('edit-form-wrap .game-input').focus()
			return false
		}

		if ($scope.editForm.time.text == '') {
			$('edit-form-wrap .time-input').focus()
			return false
		}

		gamesDB.get($scope.currentGame._id).then((edited) => {
			var gameText = $scope.editForm.game.text
			priority = $scope.editForm.priority.value


			// prepare to record the update
			if (
				edited.plays[edited.plays.length-1].updates == undefined
			) {
				edited.plays[edited.plays.length-1].updates = {}
			}

			if (
				edited.updates == undefined
			) {
				edited.updates = {}
			}

			if (gameText != '' && gameText != edited.game) {
				edited.game = gameText

				var update = {
					value: gameText,
					created: Date.create()
				}

				if (edited.updates.title == undefined) {
					edited.updates.title = []
				}

				edited.updates.title.push(update)
			}

			var update = {
				value: end,
				created: Date.create()
			}

			if (
				edited.plays[edited.plays.length-1].updates.end == undefined
			) {
				edited.plays[edited.plays.length-1].updates.end = []
			}

			if (edited.updates.end == undefined) {
				edited.updates.end = []
			}

			if (
				edited.repeat == undefined
				|| edited.repeat == 0
				|| edited.repeat == false
			) {

				if (end != '' && end != edited.plays[edited.plays.length-1].end) {
					edited.plays[edited.plays.length-1].end = end

					// also change the main end time
					edited.end = end

					edited.plays[edited.plays.length-1].updates.end.push(update)
					edited.updates.end.push(update)
				}
			} else {

				if (end != '' && end != edited.end) {
					edited.end = end

					edited.updates.end.push(update)
				}
			}

			if (priority != 8 && priority != 4 && priority != 2) {
				priority = 4
			}

			if (priority != edited.plays[edited.plays.length-1].priority) {
				edited.plays[edited.plays.length-1].priority = priority

				var update = {
					value: priority,
					created: Date.create()
				}

				if (
					edited.plays[edited.plays.length-1].updates.priority == undefined
				) {
					edited.plays[edited.plays.length-1].updates.priority = []
				}

				edited.plays[edited.plays.length-1].updates.priority.push(update)
			}

			gamesDB.put(edited, edited._id, edited._rev).then((doc) => {
				success(doc)
			}).catch((err) => {

				$scope.hideEditForm()
				error(err)
			})
		}).catch((err) => {
			error(err)
		})
	}

	/**
	 * @name $scope.createRepeat
	 * @description
	 * creates a repeat (a new play) to a game
	 * @param {string} id - id of the game to repeat
	 * @param {function} success - callback on success
	 * @param {function} error - callback on error
	 * @returns {object} the repeated game
	 */
	$scope.createRepeat = function(id, success, error) {

		if (success == undefined) {
			success = function() {}
		}

		if (error == undefined) {
			error = function() {}
		}

		gamesDB.get(id).then((repeated) => {

			var end = Date.create(
				Date.create(repeated.plays[repeated.plays.length-1].end)
				.getTime() + repeated.repeat
			)
			var	priority = repeated.plays[repeated.plays.length-1],
			now = Date.create()

			if (end.isAfter(Date.create(repeated.end))) {
				return false
			}

			if (priority != 8 && priority != 4 && priority != 2) {
				priority = 4
			}

			var replay = {
				state: 'playing',
				end: end,
				priority: priority,
				kind: 'repeat',
				created: now,
				updates: {
					state: [
						{
							value: 'playing',
							created: now
						}
					],
					end: [
						{
							value: end,
							created: now
						}
					],
					priority: [
						{
							value: priority,
							created: now
						}
					]
				}
			}

			repeated.plays.push(replay)

			gamesDB.put(repeated, repeated._id, repeated._rev).then((doc) => {
				success(repeated)
			}).catch((err) => {
				error(err)
			})
		}).catch((err) => {
			error(err)
		})
	}

	/**
	 * @name $scope.createReplay
	 * @description
	 * creates a replay for $scope.currentGame
	 * @param {function} success - callback on success
	 * @param {function} error - callback on error
	 * @returns {object} the game that the replay has been created for
	 */
	$scope.createReplay = function(success, error) {

		var v

		if ($scope.currentParent._id != '_noparent') {

			v = validateTime($scope.replayForm.time.text, $scope.currentParent.plays[$scope.currentParent.plays.length-1].end, false)
		} else {
			v = validateTime($scope.replayForm.time.text, false, false)
		}

		if (v.error != false) {
			$('.replay-form-wrap .time-input').focus()
			$scope.replayForm.time.error = v.error
			return false
		}

		if (success == undefined) {
			success = function() {}
		}

		if (error == undefined) {
			error = function() {}
		}

		var end = parseTime($scope.replayForm.time.text)

		if (end == false) {
			$('.replay-form-wrap .time-input').focus()
			$scope.replayForm.time.error = 'unknown error'
			return false
		}

		if ($scope.replayForm.time.text == '') {
			$('replay-form-wrap .time-input').focus()
			return false
		}

		gamesDB.get($scope.currentGame._id).then((edited) => {
			console.log('checkpoint 1: ' + edited)
			var	priority = $scope.replayForm.priority.value,
			now = Date.create()

			if (priority != 8 && priority != 4 && priority != 2) {
				priority = 4
			}

			var replay = {
				state: 'playing',
				end: end,
				priority: priority,
				created: now
			}

			edited.plays.push(replay)

			gamesDB.put(edited, edited._id, edited._rev).then((doc) => {

				$scope.replayForm.time.text = ''

				hideReplayForm()
				success(doc)
			}).catch((err) => {

				$scope.hideReplayForm()
				error(err)
			})
		}).catch((err) => {
			error(err)
		})
	}

	/**
	 * @name $scope.focusOnReplayTime
	 * @description
	 * focuses the keyboard on the replay time input
	 * TODO: should this be here?
	 * @returns
	 */
	$scope.focusOnReplayTime = function() {
		$('.replay-form-wrap .time-input').focus()
	}

	/**
	 * @name $scope.focusOnEditGame
	 * @description
	 * focuses the keyboard on the edit game input
	 * TODO: should this be here?
	 * @returns
	 */
	$scope.focusOnEditGame = function() {
		$('.edit-form-wrap .game-input').focus()
	}

	/**
	 * @name $scope.focusOnAddGame
	 * @description
	 * focuses the keyboard on the add game input
	 * TODO: should this be here?
	 * @returns
	 */
	$scope.focusOnAddGame = function() {
		$('.form-wrap .game-input').focus()
	}

	/**
	 * @name $scope.setState
	 * @description
	 * updates the state of the game
	 * todo: should be move to a service
	 * @param {string} id - id of the game
	 * @param {string} state - the state to set into
	 * @returns {object} the game
	 */
	$scope.setState = function(id, state) {
		$('.state-wrap.activate').removeClass('activate')

		// to reflect changes on the ui faster,
		// update the scope before the db returns the result
		// @todo: this should also be moved to the ui service and made more efficient
		$.each($scope.playingGames, function() {
			game = $(this);

			if (game[0].doc._id == id) {

				// freez the buttons
				game[0].doc.wait = true

				game[0].doc.plays[game[0].doc.plays.length-1].state = state
			}
		})

		$.each($scope.wonGames, function() {
			game = $(this);

			if (game[0].doc._id == id) {

				// freez the buttons
				game[0].doc.wait = true

				if (game[0].doc.plays[game[0].doc.plays.length-1].state == state) {
					game[0].doc.plays[game[0].doc.plays.length-1].state = 'playing'

				} else {
					game[0].doc.plays[game[0].doc.plays.length-1].state = state
				}
			}
		})

		$.each($scope.lostGames, function() {
			game = $(this);

			if (game[0].doc._id == id) {

				// freez the buttons
				game[0].doc.wait = true

				if (game[0].doc.plays[game[0].doc.plays.length-1].state == state) {
					game[0].doc.plays[game[0].doc.plays.length-1].state = 'playing'

				} else {
					game[0].doc.plays[game[0].doc.plays.length-1].state = state
				}
			}
		})


		gamesDB.get(id).then((doc) => {
			var updatedDoc = doc

			if (updatedDoc.plays[updatedDoc.plays.length-1].state == state) {
				state = 'playing'
			}

			updatedDoc.plays[updatedDoc.plays.length-1].state = state


			// record the update
			var update = {
				value: state,
				created: Date.create()
			}

			if (
				updatedDoc.plays[updatedDoc.plays.length-1].updates == undefined
			) {
				updatedDoc.plays[updatedDoc.plays.length-1].updates = {}
			}

			if (
				updatedDoc.plays[updatedDoc.plays.length-1].updates.state == undefined
			) {
				updatedDoc.plays[updatedDoc.plays.length-1].updates.state = []
			}

			updatedDoc.plays[updatedDoc.plays.length-1].updates.state.push(update)

			return gamesDB.put(updatedDoc, doc._id, doc._rev).then(function() {
				// updates the ui, the actual result is slow
				$.each($scope.playingGames, function() {
					if ($(this)[0].doc._id == id) {
						$(this)[0].doc = updatedDoc
					}
				})

				if (doc.repeat != '' && doc.repeat != undefined && doc.repeat != false) {

					var notifState = state

					// if (state == 'playing') {
					// 	notifState = 'reset'
					// }

					var notif = {
						message: '',
						state: notifState,
						gameId: doc._id
					}

					$scope.createRepeat(doc._id, (repeatDoc) => {

						notif.message = `Next repeat - about 
							${Date.create(
								repeatDoc.plays[repeatDoc.plays.length-1].end
							).relative()}`
					}, (err) => {
						console.error(err)
					})

					if ($scope.repeatNotifs == undefined) {
						$scope.repeatNotifs = []
					}

					$scope.repeatNotifs.push(notif)

					$timeout(function() {
						$scope.repeatNotifs.remove(
							$scope.repeatNotifs.find({gameId: doc._id})
						)
					}, 10000)
				} else {

					var notifState = state

					// if (state == 'playing') {
					// 	notifState = 'reset'
					// }

					var notif = {
						message: null,
						state: notifState,
						gameId: doc._id
					}

					if ($scope.repeatNotifs == undefined) {
						$scope.repeatNotifs = []
					}

					$scope.repeatNotifs.push(notif)

					$timeout(function() {
						$scope.repeatNotifs.remove(
							$scope.repeatNotifs.find({gameId: doc._id})
						)
					}, 3000)
				}
			}).catch((err) => {
				console.error(err)
			})
		})
	}

	/**
	 * @name $scope.setPosition
	 * @description
	 * updates the position of the game
	 * this was used to manually rearrange the position of
	 * games by dragging and droping. It's not being used right now
	 * thinking about removing it
	 * @param {string} id - id of the game
	 * @param {string} pos - the position to set into
	 * @returns {object} the game
	 */
	$scope.setPosition = function(id, pos) {

		gamesDB.get(id).then((doc) => {
			var updatedDoc = doc
			updatedDoc.position = pos

			return gamesDB.put(updatedDoc, doc._id, doc._rev).then(function() {
				console.log('updated')
			}).catch((err) => {
				console.error(err)
			})
		})
	}

	/**
	 * @name $scope.closeModal
	 * @description
	 * hides all modals
	 * @returns
	 */
  $scope.closeModal = function() {
    $scope.modal.hide();
  }

	/**
	 * @name $scope.isRightSideOpen
	 * @description
	 * checks if the right sidebar is open
	 * @returns {boolean} is it?
	 */
	$scope.isRightSideBarOpen = function() {
		return $ionicSideMenuDelegate.isOpenRight()
	}

	/**
	 * @name $scope.isLeftSideOpen
	 * @description
	 * checks if the left sidebar is open
	 * @returns {boolean} is it?
	 */
	$scope.isLeftSideBarOpen = function() {
		return $ionicSideMenuDelegate.isOpenLeft()
	}

	/**
	 * @name $scope.toggleRightMenu
	 * @description
	 * toggles the right side menu
	 * @returns
	 */
	$scope.toggleRightMenu = function() {
		$ionicSideMenuDelegate.toggleRight()
	}

	/**
	 * @name $scope.toggleLeftMenu
	 * @description
	 * toggles the left side menu
	 * @returns
	 */
	$scope.toggleLeftMenu = function() {
		$ionicSideMenuDelegate.toggleLeft()
	}

	/**
	 * @name $scope.showForm
	 * @description
	 * show the add game form
	 * @returns
	 */
	$scope.showForm = function() {
		$('.form-wrap .form-content-wrap').show(function() {

			$('.form-wrap .game-input').focus()
		})
		$('.form-wrap .form-switch').hide()
	}

	/**
	 * @name $scope.hideForm
	 * @description
	 * hide the add game form
	 * @returns
	 */
	$scope.hideForm = function() {
		$('.form-wrap .form-content-wrap').hide()
		$('.form-wrap .form-switch').show()

		$scope.addForm.time.error = false
		$scope.addForm.time.success = false

	}

	/**
	 * @name $scope.showEditForm
	 * @description
	 * shows the edit form
	 * @returns
	 */
	$scope.showEditForm = function() {
		$('.edit-form-wrap').fadeIn(500, function() {
			$('.edit-form-wrap .game-input').focus()
		})
		$('.editable-switch').hide()

		$scope.editForm.game.text = $scope.currentGame.game
		$scope.editForm.time.text = Date.create($scope.currentGame.plays[$scope.currentGame.plays.length-1].end)
		.format('{Mon} {d} {yyyy} {12hr}:{mm} {TT}')
		$scope.editForm.priority.value = $scope.currentGame.plays[$scope.currentGame.plays.length-1].priority

		$scope.editing = true
	}

	/**
	 * @name $scope.hideEditForm
	 * @description
	 * hides the edit form
	 * @returns
	 */
	$scope.hideEditForm = function() {

		$('.edit-form-wrap').hide()
		$('.editable-switch').fadeIn(500)
		$('.game-form-content').show()
		$('.edit-more-wrap').hide()

		$scope.editing = false

		$scope.editForm.time.error = false
		$scope.editForm.time.success = false
	}

	/**
	 * @name $scope.showReplayForm
	 * @description
	 * shows the replay form
	 * @returns
	 */
	$scope.showReplayForm = function() {
		$('.replay-form-wrap').fadeIn(500, function() {
			$('.replay-form-wrap .time-input').focus()
		})
		$('.editable').hide()
		$('.replay-form-switch').hide()

		$scope.replayForm.priority.value = $scope.currentGame.plays[$scope.currentGame.plays.length-1].priority
	}

	/**
	 * @name $scope.hideReplayForm
	 * @description
	 * hides the replay form
	 * @returns
	 */
	$scope.hideReplayForm = function() {

		$('.replay-form-wrap').hide()
		$('.replay-form-switch').show()
		$('.editable').fadeIn()

		$scope.replayForm.time.error = false
		$scope.replayForm.time.success = false
	}

	/**
	 * @name $scope.showRepeatInput
	 * @description
	 * shows repeat input on the add game form
	 * @returns
	 */
	$scope.showRepeatInput = function() {
		$('.form-wrap .repeat-input').toggle(function() {
			$(this).focus()
		})
	}

	/**
	 * @name $scope.hideRepeatInput
	 * @description
	 * hides repeat input on the add game form
	 * @returns
	 */
	$scope.hideRepeatInput = function() {
		$('.form-wrap .repeat-input')
			.hide()
	}

	/**
	 * @name $scope.setCurrentGame
	 * @description
	 * sets the session's current game into a new one
	 * thus navigating to it
	 * @param {string} id - id of the new game
	 * @returns {object} the new current game
	 */
	$scope.setCurrentGame = (id) => {
		if ($scope.currentGame._id == id) {
			return true
		}

		$scope.fetchPath(id)

		$('.form-wrap .game-input').val('')
		$('.form-wrap .time-input').val('')

		$scope.addForm.game.text =
		$scope.addForm.game.success =
		$scope.addForm.game.info =
		$scope.addForm.game.error =
		$scope.addForm.time.text =
		$scope.addForm.time.success =
		$scope.addForm.time.info =
		$scope.addForm.time.error =
		$scope.addForm.time.typeahead = ''

		$scope.currentPath = []


		$scope.playingGames = []
		$scope.wonGames = []
		$scope.lostGames = []

		$('.children-wrap .no-games').hide()

		$scope.fetchChildrenWithState(id, (children) => {

			if (
				children[0] != undefined
				&& children[0].doc.parent == $scope.currentGame._id
			) {

				$('.children-wrap')
				.css({
					'margin-top': 20
				})
				.animate({
					'margin-top': 0,
					'opacity': 1
				}, function() {
					setTimeout(function () {
						$('.children-wrap .no-games').fadeIn()
					}, 300)
				})
			}
		})

		if (id == '_endgame') {
			$scope.currentGame = { _id: id}
			window.sessionStorage.setItem('currentGame', id)
		} else {

			$scope.fetchOne(id, (current) => {
				$scope.currentGame = current
				$scope.game.priority = 4

				window.sessionStorage.setItem('currentGame', current._id)

				if ($scope.currentGame.parent == '_endgame') {

					$scope.currentParent = {
						_id: '_noparent'
					}
				} else {

					$scope.fetchOne($scope.currentGame.parent, (doc) => {
						$scope.currentParent = doc
					})
				}
			}, (err) => {
				console.error(err)
				$('.children-wrap').css('opacity', 1)
			})
		}
	}

	/**
	 * @name $scope.openGame
	 * @description
	 * opens a game when clicked on it
	 * @param {DOMEvent} e - the DOM event that triggered it
	 * @returns
	 */
	$scope.openGame = (e) => {
		var target = $(e.target),
		element = $(e.currentTarget),
		id = element.data('id')

		if (id != undefined && !target.is('.state-wrap') && !target.parents().is('.state-wrap')) {

			$scope.setCurrentGame(id)
		}
	}

	/**
	 * @name $scope.openCurrentParent
	 * @description
	 * sets the session's game to the current game's parent
	 * @returns
	 */
	$scope.openCurrentParent = function() {
		if ($scope.currentGame._id != '_endgame') {
			$scope.setCurrentGame($scope.currentGame.parent)
		}
	}

	/**
	 * @name $scope.showStateButtons
	 * @description
	 * shows the state buttons to the currently focused child game
	 * @param {DOMEvent} e - the DOM event, so that we know which child's
	 * state buttons to show
	 * @returns
	 */
	$scope.showStateButtons = (e) => {
		var element = $(e.currentTarget)

		$('.state-wrap')
			.removeClass('activate')
			.find('.state')
			.removeClass('ready')

		element
			.addClass('activate')
			.find('.state')
			.addClass('ready')
	}

	/**
	 * @name $scope.showEditMore
	 * @description
	 * shows the delete, change parent, add above and below buttons
	 * note: replaced with popovers, not being used
	 * @returns
	 */
	$scope.showEditMore = function() {
		$('.game-form-content').hide()
		$('.edit-more-wrap').fadeIn()

		return false
	}

	/**
	 * @name $scope.hideStateButtons
	 * @description
	 * hides the state buttons for a particular child game
	 * @param {DOMEvent} e - the DOM event so that we know which child
	 * @returns
	 */
	$scope.hideStateButtons = (e) => {
		var element = $(e.currentTarget)

		element.removeClass('activate')
	}

	/**
	 * @name $scope.replaceTypeahead
	 * @description
	 * replaces the time input with the typeahead generated
	 * @returns
	 */
	$scope.replaceTypeahead = function() {
		var typeahead = $scope.game.end + $scope.addForm.time.typeahead
		typeahead = typeahead
		.replace(/([0-9])([a-zA-Z])/, '$1 $2')

		$scope.addForm.time.typeahead = ''
		$('.form-wrap .time-input')
			.val(typeahead)
			.focus()

		$scope.game.end = typeahead
	}

	/**
	 * @name $scope.hideTypeahead
	 * @description
	 * hides the typeahead (meant to be used when
	 * the typeahead doen't make sense or there's an error)
	 * @returns
	 */
	$scope.hideTypeahead = function() {
		$('.form-wrap .typeahead').hide()
	}

	/**
	 * @name $scope.nextPriority
	 * @description
	 * when the priority icon is clicked on the form,
	 * it changes the priority
	 * i.e. if high -> mid, mid -> low, low -> high
	 * @returns
	 */
	$scope.nextPriority = function() {
		var p = $scope.game.priority

		if (p == 8) {
			$scope.game.priority = 4
		}

		if (p == 4) {
			$scope.game.priority = 2
		}

		if (p == 2) {
			$scope.game.priority = 8
		}

		$('.form-wrap .game-input').focus()
	}

	/**
	 * @name $scope.nextEditPriority
	 * @description
	 * when the priority icon is clicked on the edit game form,
	 * it changes the priority
	 * i.e. if high -> mid, mid -> low, low -> high
	 * @returns
	 */
	$scope.nextEditPriority = function() {
		var p = $scope.editForm.priority.value

		if (p == 8) {
			$scope.editForm.priority.value = 4
		}

		if (p == 4) {
			$scope.editForm.priority.value = 2
		}

		if (p == 2) {
			$scope.editForm.priority.value = 8
		}

		$('.edit-form-wrap .game-input').focus()
	}

	/**
	 * @name $scope.nextReplayPriority
	 * @description
	 * when the priority icon is clicked on the replay form,
	 * it changes the priority
	 * i.e. if high -> mid, mid -> low, low -> high
	 * @returns
	 */
	$scope.nextReplayPriority = function() {
		var p = $scope.replayForm.priority.value

		if (p == 8) {
			$scope.replayForm.priority.value = 4
		}

		if (p == 4) {
			$scope.replayForm.priority.value = 2
		}

		if (p == 2) {
			$scope.replayForm.priority.value = 8
		}
	}

	/**
	 * @name $scope.isPast
	 * @description
	 * checks if the time is past or not
	 * @param {string} time - the time being checked
	 * @returns {boolean}
	 */
	$scope.isPast = (time) => {
		var d = Date.create(time)

		return d.isPast()
	}

	/**
	 * @name $scope.isDueToday
	 * @description
	 * checks if the time is today or not
	 * @param {string} time - the time being checked
	 * @returns {boolean}
	 */
	$scope.isDueToday = (time) => {
		var d = Date.create(time).endOfDay().getTime(),
		n = Date.create().endOfDay().getTime()

		return d == n
	}

	/**
	 * @name $scope.isDuePast
	 * @description
	 * checks if the time is due past or not
	 * @param {string} time - the time being checked
	 * @returns {boolean}
	 */
	$scope.isDuePast = (time) => {

		// check if time is before today

		var d = Date.create(time).getTime(),
		n = Date.create().beginningOfDay().getTime()

		return d < n
	}

	/**
	 * @name $scope.startTimebox
	 * @description
	 * starts the timebox timer
	 * @param {string} id - the id of the game being timeboxed
	 * @returns
	 */
	$scope.startTimebox = (id) => {

		if (!$scope.timeboxStarted) {
			$scope.startTime = Date.create().getTime()
			$scope.counter = 3600
			window.sessionStorage.setItem('currentTimebox', id)
			$scope.currentTimebox._id = window.sessionStorage.getItem('currentTimebox')

			$scope.fetchOne(id, (doc) => {
				$scope.currentTimebox = doc
			})

			$scope.timeboxTimeout = $timeout($scope.onTimeout, 1000)

			$scope.timeboxStarted = true
		} else {
			$scope.setCurrentGame(id)
		}

	}

	/**
	 * @name $scope.startTimeboxOnCurrentGame
	 * @description
	 * starts the timebox timer on the current game
	 * @returns
	 */
	$scope.startTimeboxOnCurrentGame = function() {
		$scope.startTimebox($scope.currentGame._id)
	}

	/**
	 * @name $scope.closeNotif
	 * @description
	 * hides a particular notification
	 * @param {string} id - id of the notification
	 * @returns
	 */
	$scope.closeNotif = (id) => {

		$scope.notifs.remove(
			$scope.notifs.find({id: id})
		)
	}

	/**
	 * @name $scope.stopTimebox
	 * @description
	 * stops the currently running timebox
	 * @returns
	 */
	$scope.stopTimebox = function() {
		$timeout.cancel($scope.timeboxTimeout)

		var now = parseInt(Date.create().getTime()/1000),
		startTime = parseInt($scope.startTime/1000)

		var duration = now - startTime

		if (duration >= 60) {
			duration = parseInt(duration/60)

			if (duration == 1) {
				duration = '1 minute'
			} else {
				duration =  duration + ' minutes'
			}
		}

		if (duration < 60) {

			if (duration == 1) {
				duration = '1 second'
			} else {
				duration = duration + ' seconds'
			}
		}

		notif = {
			message: {
				a: $scope.currentTimebox.game,
				b: $scope.currentTimebox._id,
				c: duration
			},
			time: Date.create(),
			tag: 'success',
			type: 'timeboxEnded',
			id: 'notif-' + generateId()
		},
		length = 1

		if ($scope.notifs == undefined) {
			$scope.notifs = [notif]
		} else {
			$scope.notifs.remove(
				$scope.notifs.find({message: {b: $scope.currentTimebox._id}})
			)
			$scope.notifs.push(notif)
			length = $scope.notifs.length
		}

		window.sessionStorage.setItem('currentTimebox', '')
		$scope.currentTimebox._id = ''

		$scope.timeboxStarted = false
	}

	/**
	 * @name $scope.onTimeout
	 * @description
	 * decrements the timebox and updates the $scope
	 * @returns
	 */
	$scope.onTimeout = function() {
		var now = parseInt(Date.create().getTime()/1000),
		startTime = parseInt($scope.startTime/1000)
		$scope.counter = 3600 - (now - startTime)
		$scope.timeboxTimeout = $timeout($scope.onTimeout, 1000)

		if ($scope.counter <= 0) {

			$scope.stopTimebox()
		}
	}

	/**
	 * what to do when the mouseup, click and touch events
	 * are triggered on the document
	 * TODO: should use andular service...
	 */
	$(document).on('mouseup click touch', (e) => {
		var target = e.target,
		form = $('.form-wrap'),
		editForm = $('.editable')
		replayForm = $('.replay-wrap')

		if (
			!$(target).is(form) && !$(target).parents().is(form)
		) {
			$scope.hideForm()
		}

		if (
			!$(target).is(editForm)
			&& !$(target).parents().is(editForm)
			&& $scope.editing == true
		) {
			$scope.hideEditForm()
		}

		if (
			!$(target).is(replayForm)
			&& !$(target).parents().is(replayForm)
		) {
			$scope.hideReplayForm()
		}
	})


	/**
	 * what to do when the keyboard is clicked on the document
	 * TODO: should use angular service...
	 */
	$(document).keydown((e) => {
		if (e.keyCode === 27) {
			$scope.hideForm()
			$scope.hideEditForm()
			$scope.hideReplayForm()
			$scope.signInModal.hide()
			$scope.signUpModal.hide()
			return false
		}

		if (
			$scope.addForm.time.typeahead != ''
			&& $scope.addForm.time.typeahead != false
			&& $scope.addForm.time.typeahead != undefined
			&& $(e.target)[0] == $('.form-wrap .time-input')[0]
		) {

			if (e.keyCode == 9 || e.keyCode == 39) {
				$scope.replaceTypeahead()

				return false
			}

			if (e.keyCode == 13) {
				$scope.replaceTypeahead()
			}
		}
	})
})
