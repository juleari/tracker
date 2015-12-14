var http        = require("http"),
    url         = require("url"),
    mongo       = require('mongodb'),
    error_pages = require('./../views/error_pages'),
    DB          = require('./../modules/db'),
    BSON        = mongo.BSONPure,
    formidable  = require('formidable'),
    sys         = require('sys'),
    functions   = require('./functions');

function start(route, handle, db) {
    
    function if_ok(request, response, pathname, db, user_id, conn_id) {
  
        var postData = "";
        request.addListener("data", function(postDataChunk) {
          
            postData += postDataChunk;
        });

        request.addListener("end", function(postDataChunk) {
            
            route(handle, pathname, response, db, postData, request.headers['user-agent'], user_id, conn_id);
        });
    }

    function onRequest(request, response) {

        var callback_error = function(number) {

            console.log('callback_error', number);
            db.close();
            error_pages['p_' + number](response);
        }

        var pathname = url.parse(request.url).pathname,
            style    = /\/css(.*\.css)/,
            js       = /\/js(.*\.js)/,
            img      = /\/img(.*\..*)/;

        request.setEncoding("utf8");

        cookie = functions.parseCookies(request);

        if (pathname == '/reg_f' || pathname == '/reg_firm' || pathname == '/auth') {
            
            DB.open(db, function(db){

                console.log("server Connected!");
                if_ok(request, response, pathname, db);

            }, callback_error);
        
        } else {
            
            if (style.test(pathname) || js.test(pathname) || img.test(pathname)) {
                
                if_ok(request, response, pathname);
            
            } else {
                
                DB.open(db, function(db){

                    console.log("server Connected!");

                    if (cookie.tracker) {
                        
                        DB.findOne("Connections", {'_id': mongo.ObjectID(cookie.tracker)}, {}, function(conn) {
                            
                            if (!conn) {

                                console.log(conn);
                                handle['/'](response, db);

                            } else {
                                
                                user_id = conn.user_id;
                                if (pathname == '/') {
                                  
                                    if_ok(request, response, '/home', db, user_id, cookie.tracker);
                                
                                } else {
                                    
                                    if_ok(request, response, pathname, db, user_id, cookie.tracker);
                                }
                            }
                        }, callback_error, db);

                    } else {
                          
                        handle['/'](response, db);
                    }

                }, callback_error);
            }
        }
    }

    http.createServer(onRequest).listen(3001);
    console.log("Server has started.");
}

exports.start = start;