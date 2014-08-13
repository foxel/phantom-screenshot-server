var http = require("http"),
    url = require("url"),
    path = require("path"),
    fs = require("fs");

var childProcess = require('child_process');
var phantomjs = require('phantomjs');
var binPath = phantomjs.path;

var port = process.argv[2] || 8888;

http.createServer(function (request, response) {
    var parsedUrl   = url.parse(request.url),
        requestUri  = parsedUrl.path,
        requestHash = new Buffer(requestUri).toString('base64'),
        filename    = path.join(process.cwd(), '_images', requestHash + '.png');

    var sendFile = function () {
        fs.readFile(filename, "binary", function (err, file) {
            if (err) {
                response.writeHead(500, {"Content-Type": "text/plain"});
                response.write(err + "\n");
                response.end();
                return;
            }

            response.writeHead(200, {"Content-Type": "image/png"});
            response.write(file, "binary");
            response.end();
        });
    };

    fs.exists(filename, function (exists) {
        if (exists) {
            sendFile();
            return;
        }

        var childArgs = [
            path.join(process.cwd(), 'rasterize.js'),
            'http://' + requestUri,
            filename,
            '1280px*720px'
        ];

        childProcess.execFile(binPath, childArgs, function (err, stdout, stderr) {
            if (err) {
                response.writeHead(500, {"Content-Type": "text/plain"});
                response.write(err + "\n");
                response.end();
                return;
            }

            sendFile();
        });
    });
}).listen(parseInt(port, 10));

console.log("Static file server running at\n  => http://localhost:" + port + "/\nCTRL + C to shutdown");
