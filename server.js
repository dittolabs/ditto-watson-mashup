// nodejs server

var proxy = require('express-http-proxy'),
    express = require('express'),
    app = express();

// Serve static files
app.use(express.static(__dirname + '/client'));

// Proxy calls to Ditto API
app.use('/pditto', proxy('api.startditto.com', {
	forwardPath: function(request, response) {
		return require('url').parse(request.url).path;
	}
}));

app.listen(3000);
console.log('Open http://localhost:3000 in the browser');

