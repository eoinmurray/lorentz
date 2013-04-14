var fs = require('fs')

var walk = function(dir, action, done) {

    // this flag will indicate if an error occured (in this case we don't want to go on walking the tree)
    var dead = false;

    // this flag will store the number of pending async operations
    var pending = 0;

    var fail = function(err) {
        if(!dead&& done) {
            dead = true;
            done(err);
        }
    };

    var checkSuccess = function() {
        if(!dead && pending == 0 && done) {
            done();
        }
    };

    var performAction = function(file, stat) {
        if(!dead) {
            try {
                action(file, stat);
            }
            catch(error) {
                fail(error);
            }
        }
    };

    // this function will recursively explore one directory in the context defined by the variables above
    var dive = function(dir) {
        pending++; // async operation starting after this line
        fs.readdir(dir, function(err, list) {
            if(!dead) { // if we are already dead, we don't do anything
                if (err) {
                    fail(err); // if an error occured, let's fail
                }
                else { // iterate over the files
                    list.forEach(function(file) {
                        if(!dead) { // if we are already dead, we don't do anything
                            var path = dir + "/" + file;
                            pending++; // async operation starting after this line
                            fs.stat(path, function(err, stat) {
                                if(!dead) { // if we are already dead, we don't do anything
                                    if (err) {
                                        fail(err); // if an error occured, let's fail
                                    }
                                    else {
                                        if (stat && stat.isDirectory()) {
                                            dive(path); // it's a directory, let's explore recursively
                                        }
                                        else {
                                            performAction(path, stat); // it's not a directory, just perform the action
                                        }
                                        pending--; checkSuccess(); // async operation complete
                                    }
                                }
                            });
                        }
                    });
                    pending--; checkSuccess(); // async operation complete
                }
            }
        });
    };

    // start exploration
    dive(dir);
};

var addToWatchList = function(filename, handleChange){
fs.watch(filename, function(event, filename){
    debounceChange(event, filename, handleChange)
})
}

var isAllowed = function(filename, issallowed){
var boole = false
issallowed.forEach(function(checkString){
    if(filename.indexOf(checkString) != -1){
        boole = true
    }
})
return boole
}

var t1 = null;
var debounceChange = function(event, filename, handleChange){
var seconds = 0;
if(t1){
    var t2 = new Date()
    var dif = t1.getTime() - t2.getTime()
    var Seconds_from_T1_to_T2 = dif / 1000;
    seconds = Math.abs(Seconds_from_T1_to_T2);
    if(seconds < 1){
        handleChange(event, filename)
    }
}
t1 = new Date()
}

var startwalk = function(dir, handleChange){
fs.readFile(dir+'/.lorentzwatch', 'utf-8',  function(err, data){
    var issallowed;
    if (err || !data) issallowed = ['public/', 'app.js']

    else issallowed = data.split("\n")

    issallowed.forEach(function(d, i){
        if(d === '')
            delete issallowed[i]
    })

    walk(dir, function(filename){
        if(isAllowed(filename, issallowed))  addToWatchList(filename, handleChange)
    })
})

}

var liveReload = function(dir, port){
    var app = require('http').createServer(handler)
      , io = require('socket.io').listen(app)
      , fs = require('fs')
      , url = require("url")

    app.listen(port || 8081);



    function handler (req, res) {
        var uri = url.parse(req.url).pathname;
        if(uri.split('/').slice(-1)[0] === 'lorentz.js' ){
            res.writeHeader(200, {"Content-Type": "text/javascript"});
            res.write(script);
            res.end();
        }
    }

    io.sockets.on('connection', function (socket) {
        socket.emit('confirm', 'Connection is confirmed.');
        startwalk(dir, function(e, f){
            socket.emit('refresh', function () {});
        })
    });

}

exports.liveReload = liveReload

var runningAsScript = !module.parent;
if(runningAsScript){
    var port = process.argv[2] || 8081
    liveReload(port)
}

var script =
    'var head= document.getElementsByTagName("head")[0];\n'+
    'var script= document.createElement("script");\n'+
    'script.type= "text/javascript";\n'+
    'script.src= "http://localhost:8081/socket.io/socket.io.js";\n'+
    'head.appendChild(script);\n'+
    'window.addEventListener("load", function (e)  {\n'+
    'var socket = io.connect("http://localhost:8081");\n'+
    'socket.on("confirm", function(data){\n'+
    'console.log(data)\n'+
    '})\n'+
    'socket.on("refresh", function (filename) {\n'+
    'location.reload(true);\n'+
    '});\n'+
    '}, false);'