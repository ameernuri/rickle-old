var tinker = angular.module('tinker', ['pouchDB'])

var remote = 'https://penser:cloudant@penser.cloudant.com/games'
var remote2 = 'https://penser:cloudant@penser.cloudant.com/users'


/**
 * @name getTypeahead
 * @description
 * Predicts what the user is trying to type and return a typeahead
 * @param {String} the input
 * @returns {String} the full predicted typeahead.
 */
getTypeahead = function(input) {
	var output = input
	.toLowerCase()
    .trim()
  var now = new Date()

	output = output + ' '
	output = output

	// 'in' default
	.replace(/^(?:i|in(?:\s(0)*1)*)\s$/, `in 1 month`)
	.replace(/^in\s(0*[1-9]{1})\s*m\s$/, 'in $1 months')
	.replace(/^in\s([0-9]{1})\s$/, 'in $1 months')
	.replace(/^in\s([0-9]{2})\s$/, 'in $1 weeks')
	.replace(/^in\s([0-9]{3})\s$/, 'in $1 days')
	.replace(/^in\s([0-9]{4})\s$/, 'in $1 hours')
	.replace(/^in\s([0-9]{5})\s$/, 'in $1 minutes')

	// number default
	.replace(/^(?:1)\s$/, 'in 1 month')
	.replace(/^(0*[1-9]{1}\s*)m\s$/, 'in $1months')
	.replace(/^([0-9]{1})\s$/, 'in $1 months')
	.replace(/^([0-9]{2})\s$/, 'in $1 weeks')
	.replace(/^([0-9]{3})\s$/, 'in $1 days')

	// time measurements
	.replace(/^(in\s)*([0-9]+\s*)(?:hr|hrs|h|ho|hou)\s/, '$1$2hours')
	.replace(/^(in\s)*([0-9]+\s*)(?:mi|min|mins|minu|minut)\s/, '$1$2minutes')
	.replace(/^(in\s)*([0-9]+\s*)(?:s|se|sec|secs|seco|secon)\s/, '$1$2seconds')
	.replace(/^(in\s)*([0-9]+\s*)(?:d|da)\s/, '$1$2days')
	.replace(/^(in\s)*([0-9]+\s*)(?:w|we|wee)\s/, '$1$2weeks')
	.replace(/^(in\s)*([0-9]+\s*)(?:m|mo|mon|mont)\s/, '$1$2months')
	.replace(/^(in\s)*([0-9]+\s*)(?:y|yr|yrs|ye|yea)\s/, '$1$2years')

	// next
	.replace(/^(?:ne|nex)\s$/, 'next')

	// next what
	.replace(/(next\s)(?:w|we|wee)\s/, '$1week')
	.replace(/(next\s)(?:mont)\s/, '$1month')
	.replace(/(next\s)(?:y|yr|yrs|ye|yea)\s/, '$1year')

	// next default
	.replace(/^next\s*$/, 'next week')

	// relative days
	.replace(/^(?:t|to|tod|toda)\s$/, 'today')
	.replace(/^(?:t|to|ton|toni|tonig|tonigh)\s$/, 'tonight')
	.replace(/^(?:tom|tomo|tomor|tomorr|tomorro)\s$/, 'tomorrow')
	.replace(/^(?:y|ye|yes|yest|yeste|yester|yesterd|yesterda)\s$/, 'yesterday')

	// weekdays
	.replace(/^(next\s)*(?:s|su|sun|sund|sunda)\s$/, '$1sunday')
	.replace(/^(next\s)*(?:m|mo|mon|mond|monda)\s$/, '$1monday')
	.replace(/^(next\s)*(?:t|tu|tue|tues|tuesd|tuesda)\s$/, '$1tuesday')
	.replace(/^(next\s)*(?:w|we|wed|wedn|wedne|wednes|wednesd|wednesda|wedns|wednsd|wednsda|wednsday)\s$/, '$1wednesday')
	.replace(/^(next\s)*(?:th|thu|thur|thurs|thursd|thursda)\s$/, '$1thursday')
	.replace(/^(next\s)*(?:f|fr|fri|frid|frida)\s$/, '$1friday')
	.replace(/^(next\s)*(?:sa|sat|satu|satur|saturd|saturda)\s$/, '$1saturday')

	// months names
	.replace(/^(?:j|ja|jan|janu|janua|januar)\s$/, 'january')
	.replace(/^(?:f|fe|feb|febr|febru|februa|februar)\s$/, 'february')
	.replace(/^(?:m|ma|mar|marc)\s$/, 'march')
	.replace(/^(?:a|ap|apr|apri)\s$/, 'april')
	.replace(/^(?:ju|jun)\s$/, 'june')
	.replace(/^(?:jul)\s$/, 'july')
	.replace(/^(?:a|au|aug|augu|augus)\s$/, 'august')
	.replace(/^(?:se|sep|sept|septe|septem|septemb|septembe)\s$/, 'september')
	.replace(/^(?:o|oc|oct|octo|octob|octobe)\s$/, 'october')
	.replace(/^(?:n|no|nov|nove|novem|novemb|novembe)\s$/, 'november')
	.replace(/^(?:d|de|dec|dece|decem|decemb|decembe)\s$/, 'december')

	// month space
	.replace(/^(january|february|march|april|may|june|july|august|september|november|december)\s$/, '$1 01')

	// year
	.replace(/\s(201)\s$/, ' 2017')
	.replace(/\s(202)\s$/, ' 2020')

	// relative day space
	.replace(/^(today)\s(?:a|at)\s$/, '$1 at 12 am')
	.replace(/^(today|tomorrow)\s(?:a|at)\s$/, '$1 at 7 pm')
	.replace(/^(today|tomorrow)\s(?:a|at)\s([0-9])\s$/, '$1 at $2 pm')

	// characterizing words
	.replace(/\s(?:at)\s([0-9]+)\s$/, ' at $1 am')
	.replace(/\s(?:at)\s([0-9]+)(?:\s*a)\s*$/, ' at $1 am')
	.replace(/\s(?:at)\s([0-9]+)(?:\s*p)\s*$/, ' at $1 pm')
	.replace(/\s(?:a|at)\s$/, ' at 7 am')
	.replace(/\s(?:f|fr|fro|from|from |from n|from no)\s$/, ' from now')
	.replace(/\s(?:ag)\s$/, ' ago')

	// day times
	.replace(/\s(?:m|mo|mor|morn|morni|mornin)\s$/, ' morning')
	.replace(/\s(?:n|no|noo)\s$/, ' noon')
	.replace(/\s(?:a|af|aft|afte|after|aftern|afterno|afternoo)\s$/, ' afternoon')
	.replace(/\s(?:e|ev|eve|even|eveni|evenin)\s$/, ' evening')
	.replace(/\s(?:n|ni|nig|nigh)\s$/, ' night')

	// handle singular
	.replace(/(0*1)([\sa-z]+)s$/, '$1$2')

	// more fixes
	.trim()
	.toLowerCase()

	return output
}

/**
 * @name fixTimeInput
 * @description
 * Turns common words that are used into
 * a parsable input
 * @param {String} the input
 * @returns {Object}
 * fixed: a parsable version of the input
 * typeahead: the typeahead of the input
 */
fixTimeInput = function(input) {
	var typeahead = getTypeahead(input)

	fixed = typeahead
	.replace(/morning/, '7 am')
	.replace(/noon/, '12 pm')
	.replace(/afternoon/, '4 pm')
	.replace(/evening/, '6 pm')
	.replace(/tonight/, 'today at 9 pm')
	.replace(/night/, '9 pm')

	return {
		fixed: fixed,
		typeahead: typeahead
	}
}


/**
 * @name validateTime
 * @description
 * Checks if the input is valid in the context
 * @param {string} input - the input
 * @param {string} parentEnd - the parent game's end time - if it exists
 * @param {boolean} validateRange - whether or not to to check if
 * the input is in a valid range
 * @returns {Object}
 * error: if there's an error message, the message or boolean
 * success: if there's a success message, the message or boolean
 */
validateTime = function(input, parentEnd, validateRange) {

	if (parentEnd == undefined) {
		parentEnd = false
	}

	if (validateRange == undefined) {
		validateRange = true
	}

	console.log(parentEnd)

	var invalid = 'Invalid Date',
	info = 'time not parsed',
	error = false,
	success = false,
	fixed = fixTimeInput(input),
	parsed = parseTime(input)

	if (fixed.fixed == '') {
		return {
			error: 'when does it end?',
			success: false
		}
	}

	if (!parsed) {

		return {
			error: info,
			success: false
		}
	} else {

		console.log(parsed)

		var range = isValidRange(parsed, parentEnd)

		if (range == 'afterParent') {

			return {
				error: 'time has to be before parent\'s end time (~' + Date.create(parentEnd).relative() + ')',
				success: false
			}
		}

		if (range == 'farPast') {
			return {
				error: 'time can\'t be in the past',
				success: false
			}
		}

		if (range == 'farFuture') {
			return {
				error: 'time is too far in the future',
				success: false
			}
		}

		if (validateRange) {

			if (range == 'now') {

				return {
					error: 'time needs to be in the future',
					success: false
				}
			}

			if (range == 'soon') {

				return {
					error: 'time is too soon',
					success: false
				}
			}

			if (range == 'past') {

				return {
					error: 'time can\'t be in the past',
					success: false
				}
			}
		}

		var typeahead

		if (fixed.typeahead.indexOf(input.toLowerCase()) > -1) {

			typeahead = fixed.typeahead
			.substr(
				fixed.typeahead.indexOf(input.toLowerCase()) + input.length
			)
		} else {
			typeahead = ''
		}

		if (typeahead == '') {

			if (/in [0-9]+$/.test(input)) {
				var parsedInt = parseInt(input.replace('in ', ''))

				if (!isNaN(parsedInt) && parsedInt == 1) {
					typeahead = ' month'
				} else {
					typeahead = ' months'
				}
			}
		}

		return {
			error: false,
			success: Date.create(parsed).relative(),
			typeahead: typeahead
		}
	}
}

/**
 * @name parseTime
 * @description
 * Turns the input time into a parsed Date
 * @param {string} input - the input
 * @returns {date} a parsed date
 */
parseTime = function(input) {

	input = fixTimeInput(input).fixed

	if (Date.create(input) == 'Invalid Date') {
		input = input + ' from now'
	}

	var parsed = Date.future(input)

	if (
		parsed.getHours() == 0
		&& parsed.getHours() == 0
		&& parsed.getHours() == 0
	) {
		parsed = Date.future(input).endOfDay()
	}

	if (parsed == 'Invalid Date') {
		return false
	}

	return parsed
}

/**
 * @name isValidRange
 * @description
 * Checks if the input time is between now and parent's end time
 * @param {string} input - the input
 * @param {string} parentEnd - the parent's end time
 * @returns {boolean} is it in a valid range?
 */
isValidRange = function(input, parentEnd) {

	if (parentEnd == undefined) {
		parentEnd = false
	}

	var time = Date.future(input)

	if (
		time.getHours() == 0
		&& time.getHours() == 0
		&& time.getHours() == 0
	) {
		time = Date.future(input).endOfDay()
	}

	if (parentEnd != false && time.isAfter(Date.create(parentEnd))) {

		return 'afterParent'
	}

	if (time.isBefore(Date.create().addMonths(-6))) {
		return 'farPast'
	}

	if (time.isPast()) {
		return 'past'
	}

	if (time.isAfter(Date.create().addYears(30))) {
		return 'farFuture'
	}

	if (time.isBefore(Date.create().addMinutes(5))) {
		return 'soon'
	}

	return true
}

/**
 * @name randomChars
 * @description
 * Generate 5 random characters to be used to append to a generated ID
 * @returns {string} the generated chars
 */
randomChars = function() {
  return Math.random().toString(36).substr(2, 5)
}

/**
 * @name generateId
 * @description
 * Generate an ID using timestamp and appending random chars to it
 * @returns {string} the generated ID
 */
generateId = function() {
	return Date.create().getTime() + '_' + randomChars()
}

/**
 * @name zeroPad
 * @description
 * Adds leading zero on a number. 9 -> 09 but 10 stays 10
 * @param {num} the number to be padded.
 * @returns A padded number.
 */
function zeroPad(num) {
  var zero = 2 - num.toString().length + 1;
  return Array(+(zero > 0 && zero)).join("0") + num;
}

/**
 * @name createDesignDoc
 * @description
 * Creates a PouchDB design doc
 * https://pouchdb.com/2014/05/01/secondary-indexes-have-landed-in-pouchdb.html
 * @param {string} the design doc name
 * @param {function} the design doc function
 * @returns the design doc
 */
createDesignDoc = function(name, mapFn) {
  var ddoc = {
    _id: '_design/' + name,
    views: {
    }
  }
  ddoc.views[name] = {
  	map: mapFn.toString()
  }
  return ddoc;
}


// /**
//  * sync to the remote 'games' db
//  */
// PouchDB.sync('games', remote, {
// 	live: true,
// 	retry: true
// }).on('complete', function () {
//   console.log('sync complete')
// }).on('error', function (err) {
//   alert('sync error...')
//   alert(err)
// })

// /**
//  * sync to the remote 'users' db
//  */
// PouchDB.sync('users', remote2, {
// 	live: true,
// 	retry: true
// }).on('complete', function () {
//   console.log('sync complete')
// }).on('error', function (err) {
//   alert('sync error...')
//   alert(err)
// })
