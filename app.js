var server       = require("./modules/server"),
    urls         = require("./urls"),
    views        =  {
                        views_files  : require("./views/views_files"),
                        views_form   : require("./views/views_form"),
                        views_other  : require("./views/views_other"),
                        views_tables : require("./views/views_tables"),
                        posts        : require("./views/posts"),
                        posts_insert : require("./views/posts_insert"),
                        posts_update : require("./views/posts_update"),
                    },
    mongo        = require('mongodb'),
    HOSTNAME     = 'localhost',
    port         = 27017;
    serv         = new mongo.Server(HOSTNAME, port, {auto_reconnect: true, poolsize: 100}),
    db           = new mongo.Db('tracker', serv, {safe: true});

var handle = {};

var keys =  { 
                views_files : [ "files", "stat" ],
                views_form  : [ "add_depart", "add_task", "add_proj", "reg_f", "reg_u" ],
                views_other : [ "people", "projs", "sett_admin", "settings", "task", "unauth" ],
                views_tables: [ "edit_filter", "filters", "home", "proj", "search", "tasks" ],
                posts       : [ "auth", "add_d", "add_f", "edit_filter", "people_admin" ],
                posts_insert: [ "add_c", "add_p", "add_t", "attach", "reg_firm", "reg_user" ],
                posts_update: [ "change_default", "change_fields", "change_mess", "change_pass",
                                "change_rights", "change_user_lang", "ch_user_mess", 
                                "ch_user_search", "task_edit" ]
            };

var v, k, kv, kvk;

for ( v in views ) {
    
    kv = keys[v];

    for ( k = 0; k < kv.length; k++ ) {

        kvk = kv[k];
        handle[ "/" + kvk ] = views[ v ][ kvk ];
    }
}

handle["/"] = views.views_form.auth;

server.start(urls.route, handle, db);