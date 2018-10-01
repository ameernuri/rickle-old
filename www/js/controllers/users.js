app.service('usersDB', function() {
	var remote = new PouchDB('http://localhost:5984/_users', {skipSetup: true})

	return {
		db: remote,
		getSession: function(success, error) {

			if (success == undefined) {
				success = function() {}
			}

			if (error == undefined) {
				error = function() {}
			}

			remote.getSession(function(err, res) {

				if (err) {
					error(err)
				} else {
					success(res)
				}
			})
		}
	}
})

app.controller('UsersCtrl', function($scope, pouchDB, usersDB) {

	usersDB.getSession(function(res) {
		$scope.currentUser = res
	}, function(err) {
		$scope.currentUser = res
		console.error(err)
	})

	var remote = usersDB.db

	/**
	 * @name $scope.signUp
	 * @description
	 * create a new user
	 * @returns
	 */
	$scope.signUp = function() {

		remote.signup($scope.signUpEmail, $scope.signUpPassword, {
			metadata: {
				verified: 'false'
			}
		}, function (err, res) {
				  
		  if (err) {
		    if (err.name === 'conflict') {
		      alert($scope.signUpEmail + ' is already registered')
		    } else if (err.name === 'forbidden') {
		      alert('forbidden: ' + err)
		    } else {
		      alert(err)
		    }
		  } else {

		  	remote.login($scope.signUpEmail, $scope.signUpPassword, function(err, res) {
		  		
		  		usersDB.getSession(function(res) {
		  			$scope.currentUser = res
		  		}, function(err) {
		  			$scope.currentUser = res
		  		})

		  		alert('your account has been created')
		  	})
		  }
		});
	}

	/**
	 * @name $scope.signIn
	 * @description
	 * sign in the user by taking the sign-in form values form scope
	 * @returns
	 */
	$scope.signIn = function() {

  	remote.login($scope.signInEmail, $scope.signInPassword, function(err, res) {
  		if (err) {
  			alert(err)
  		}
  		
  		usersDB.getSession(function(res) {
  			$scope.currentUser = res
  		}, function(err) {
  			$scope.currentUser = res
  		})
  	})
	}


	/**
	 * @name $scope.signOut
	 * @description
	 * destroy the session
	 * @returns
	 */
	$scope.signOut = function() {
		remote.logout(function (err, res) {
		  if (err) {
		    alert('Could not sign out.')
		  }
		  		
  		usersDB.getSession(function(res) {
  			$scope.currentUser = res
  		}, function(err) {
  			$scope.currentUser = res
  		})
		})
	}

	/** 
	 * @name $scope.getSession
	 * @description
	 * info about the currently logged in user
	 * @returns the session data
	 */
	$scope.getSession = function() {
		remote.getSession(function (err, res) {
		  if (err) {
		    console.error(err)
		  } else if (!res.userCtx.name) {
		    // nobody's logged in
		    return res
		  } else {
		  	return res
		  }
		});
	}

	/**
	 * @name $scope.getByEmail
	 * @description
	 * fetches user by email
	 * @param {string} email: the email
	 * @returns the found user
	 */
	 $scope.getByEmail = function(email) {
	 	db.getUser(email, function (err, res) {
			if (err) {
				if (err.name === 'not_found') {
				  // typo, or you don't have the privileges to see this user
				} else {
				  // some other error
				}
			} else {
				return res
			}
		});
	 }
})