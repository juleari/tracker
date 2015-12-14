var error_pages= require('./views/error_pages');
function route(handle, pathname, response, db, data, ua, user_id, conn_id) {
  
    var style = /\/css(.*\.css)/,
        js    = /\/js(.*\.js)/,
        img   = /\/img(.*\..*)/,
        files = /\/files_(.*)/,
        proj  = /\/proj_(.*)/, 
        search= /\/search_(.*)/,
        add_t = /\/add_task_*(.*)/,
        task  = /\/task_(.*)/;

    if (data) {

        console.log('post data');
        if (typeof handle[pathname] === 'function') handle[pathname](response, db, data, ua, user_id)
        else {
            console.log("No request handler found for " + pathname, data);
            response.writeHead(404, {'Content-Type': 'text/plain'});
            response.write(404);
            response.end();
        }
   
    } else {

        if (typeof handle[pathname] === 'function') {

            handle[pathname](response, db, user_id, ua, conn_id);
            return;
        } else {

            if ((/(.*)_(.*)/).test(pathname) && typeof handle[RegExp.$1] === 'function') {

                handle[RegExp.$1](response, db, user_id, RegExp.$2);
                return;
            }
        }
        
        if (style.test(pathname)) {

            handle['/stat'](response, pathname, 'text/css');
            return;
        }

        if (js.test(pathname)) {

            handle['/stat'](response, pathname, 'text/javascript');
            return;
        }              

        if (img.test(pathname)) {

            handle['/stat'](response, pathname, 'image/png');
            return;
        }

        if (files.test(pathname)) {

            handle['/files'](response, db, user_id, RegExp.$1);
            return;
        }              
                        
        if (task.test(pathname)) {

            handle['/task'](response, db, user_id, RegExp.$1);
            return;
        }    /*          
                            
        if (proj.test(pathname)) {

            handle['/proj'](response, db, user_id, RegExp.$1);
            return;
        }              
                                
        if (search.test(pathname)) {

            handle['/search'](response, db, user_id, RegExp.$1);
            return;
        }              
                                  
        if (add_t.test(pathname)) {

            handle['/add_task'](response, db, user_id, RegExp.$1);
            return;
        }       */       
                                    
        db.close();
        error_pages.p_404(response, pathname);
    }
  
}

exports.route = route;