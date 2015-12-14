var fs          = require("fs"),
    error_pages = require('./error_pages'),
    DB          = require('./../modules/db'),
    mongo       = require('mongodb');

function files(response, db, user_id, file_id) {
    console.log("Request handler 'files' was called.");

    var callback_error = function(number) {

        db.close();
        error_pages['p_' + number](response);
    }

    var send_file = function (path, type) {
      
        fs.readFile(__dirname + '/' + path, "binary", function(error, file) {
          
            if(error) {
              
                response.writeHead(500, {"Content-Type": "text/plain"});
                response.write(error + "\n");
                response.end();
            
            } else {
              
                response.writeHead(200, {"Content-Type": type});
                response.write(file, "binary");
                response.end();
            }
        });
    }

    var create_file = function (file) {
        
        var dirPath = 'temp/id',
            path    = dirPath + '/' + file.name,
            re      = new RegExp('^data:' + file.type + ';base64,'),
            data    = file.data.replace(re, "");

            console.log(data);
        
        fd = fs.openSync(path, 'w', 0644); 
        
        var buff = new Buffer(data, 'base64');

        fs.write(fd, buff, 0, buff.length, 0, function(err, written){

            if (err) callback_error(404)
            else send_file(path, file.type);
        });
    }

    var find_file = function(user) {

        DB.findOne('Files', {firm: user.firm, _id: mongo.ObjectID(file_id)}, {}, function(file){

            if (!file) callback_error(404)
            else create_file(file);

        }, callback_error, db);
    }

    DB.findOne('Users', {'_id': mongo.ObjectID(user_id)}, {}, find_file, callback_error, db);
}

function stat(response, path, type) {
  
    fs.readFile(__dirname + "/public" + path, "binary", function(error, file) {
        
        if (error) {

            response.writeHead(500, {"Content-Type": "text/plain"});
            response.write(error + "\n");
            response.end();

        } else {

            response.writeHead(200, {"Content-Type": type});
            response.write(file, "binary");
            response.end();
        }
    });
}

exports.files = files;
exports.stat  = stat;