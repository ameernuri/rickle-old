const
	bodyParser = require('body-parser'),
	express = require('express'),
  http = require('http'),
  path = require('path')

const
	app = express(),
	server = http.createServer(app)


app
	.use(bodyParser.urlencoded({ extended: false }))
  .use(bodyParser.json())

app.use(express.static("./www"))

app.get("/*", (req, res) => {
  res.sendFile(`${__dirname}/www/index.html`)
})

const port = process.env.PORT || 8000

server.listen(port)

const
	msg = `Rickle running on port ${port}`

console.log(msg)
