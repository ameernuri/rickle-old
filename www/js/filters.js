app.filter('repeatTime', function() {
  return function(input) {
    return 'every ' + Date.create(Date.create().getTime() + input).relative()
		.replace(' from now', '')
		.replace(' ago', '')
  }
})
.filter('relativeTime', function() {
  return function(input) {
		var t = Date.create(input)

		if (t.isPast()) {
			return t.relative()
		}

    return 'for ' + t.relative()
		.replace(' from now', '')
  }
})
.filter('toMinutes', function() {
  return function(input) {

		return zeroPad(parseInt(input/60))
  }
})
.filter('toSeconds', function() {
  return function(input) {

		return zeroPad(parseInt(input%60))
  }
})