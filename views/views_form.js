var functions   = require('./../modules/functions'),
    DB          = require('./../modules/db'),
    error_pages = require('./error_pages'),
    mongo       = require('mongodb'),
    jade        = require("jade");

var DEFAULT_LANG_CODE  = 'ru';

function add_depart(response, db, user_id) {
    console.log("Request handler 'views_form/add_depart' was called.");

    var callback_error = function(number) {
        
        db.close();
        error_pages['p_' + number](response);
    }

    var show_page = function (user, users, lang) {

        if (!users.length) {
            users = {none: lang.depart.none}
        }

        var usr = {
                name  : user.name + ' ' + user.surname,
                admin : user.admin ? 'true' : 'false',
                id    : user._id.toString()
            },
            obj = {
                title  : lang.depart.new,
                error  : lang.error.default,
                header : lang.header,
                user   : usr,
                users  : users,
                lang   : lang.depart,
                button: {
                    id: 'create_depart',
                    create: lang.form.create
                }
            },
            html = jade.renderFile(__dirname + '/templates/add_depart.jade', obj);

        response.writeHead(200, {"Content-Type": "text/html"});
        response.write(html);
        response.end();
        db.close();
    }

    var find_language_user = function (user, users, lang_code) {
        
        DB.findOne('Languages', {'lang_code': lang_code}, {'_id': 0}, function(lang) {

            show_page(user, users, lang);

        }, callback_error, db);
    }

    var find_settings_user = function (user, users) {

        DB.findOne( 'Settings', 
            { 'object_id': mongo.ObjectID(user_id) }, 
            { 'lang': 1 },
            function(sett_user) {

                var lang_code = (sett_user && sett_user.lang && sett_user.lang.default) || DEFAULT_LANG_CODE;

                find_language_user(user, users, lang_code);
            
            }, 
            callback_error, db
        );
    }

    var find_users_firm = function(Users, user) {
    
        DB.findAll(Users, {'firm': user.firm}, {}, function(users) {

            var without_depart = [];

            for (var i = 0; i < users.length; i++) {

                if (!users[i].depart) {

                    without_depart.push({ 
                        name: users[i].name + ' ' + users[i].surname,
                        id  : users[i]._id.toString()
                    });
                }
            }

            find_settings_user(user, without_depart);

        }, callback_error);
    }

    var find_user_id = function(Users) {
    
        DB.findOne(Users, {'_id': mongo.ObjectID(user_id)}, {}, function(user) {

            find_users_firm(Users, user);

        }, callback_error);
    }

    DB.openCollection(db, 'Users', find_user_id, callback_error);
}

function add_proj(response, db, user_id) {
    console.log("Request handler 'views_form/add_proj' was called.");

    var callback_error = function(number) {
        
        db.close();
        error_pages['p_' + number](response);
    }

    var show_page = function (user, fields, lang, colls) {

        console.log('show_page', fields, colls);

        var usr = {
                name : user.name + ' ' + user.surname,
                admin : user.admin ? 'true' : 'false',
                id : user._id.toString()
            },
            obj = {
                title: lang.proj.new,
                error: lang.error.default,
                header: lang.header,
                user: usr,
                fields: fields,
                colls: colls,
                button: {
                    id: 'send_proj',
                    create: lang.form.create
                },
                lang_fields: lang.proj.fields,
                files: lang.files
            },
            html = jade.renderFile(__dirname + '/templates/add_new.jade', obj);

        response.writeHead(200, {"Content-Type": "text/html"});
        response.write(html);
        response.end();
        db.close();
    }

    var colls = {};
    var get_collection_elems = function(user, fields, lang, col_fields, col_name, col_length, col_ind, Collection) {

        var fields_name = functions.pureArr(col_fields), i, fields_use = {};

        for (i = 0; i < fields_name.length; i++) {

            fields_use[fields_name[i]] = 1;
        }

        DB.findAll(Collection, {firm: {$in: [user.firm, 'all']}}, fields_use, function(coll_elems){

            colls[col_name] = coll_elems;

            if (col_ind == col_length - 1) {

                show_page(user, fields, lang, colls);
            }

        }, callback_error)

    }

    var get_collection = function(user, fields, lang, col_fields, col_name, col_length, col_ind) {

        DB.openCollection(db, col_name, function(Collection) {

            get_collection_elems(user, fields, lang, col_fields, col_name, col_length, col_ind, Collection)

        }, callback_error)

    }

    var get_fields = function(user, fields, lang) {
        var temp = {}, field, i, j, k = 0;

        for (i in fields) {

            field = fields[i];

            if (field.on) {

                if (field.collection && field.collection.length) {

                    for (j = 0; j < field.collection.length; j++) {

                        temp[ field.collection[j].name ] = temp[ field.collection[j].name ] || [];
                        temp[ field.collection[j].name ].push( field.collection[j].fields );

                    }
                }
            }
        }

        j = 0;
        for (i in temp) j++;

        for (i in temp) {

            get_collection(user, fields, lang, temp[i], i, j, k++)

        }

        if (j == 0) show_page(user, fields, lang);

    }

    var find_language_user = function (user, fields, Languages, lang_code) {
        
        DB.findOne(Languages, {'lang_code': lang_code}, {'_id': 0}, function(lang) {

            get_fields(user, fields, lang);

        }, callback_error);

    }

    var open_languages = function (user, fields, lang_code) {
        console.log('open_languages')
        
        DB.openCollection(db, 'Languages', function(Languages) {

            find_language_user(user, fields, Languages, lang_code);
        
        }, callback_error);
    }

    var find_settings_user = function (user, Settings, sett_firm) {

        DB.findOne( Settings, 
            { 'object_id': mongo.ObjectID(user_id) }, 
            { 'lang': 1 },
            function(sett_user) {

                var lang_code = (sett_user && sett_user.lang && sett_user.lang.default) || 
                                (sett_firm && sett_firm.lang && sett_firm.lang.default) || DEFAULT_LANG_CODE;

                open_languages(user, sett_firm.proj.fields, lang_code);
            
            }, 
            callback_error
        );
        
    }

    var find_settings_firm = function (user, Settings) {

        DB.findOne( Settings, 
            { 
                'object_id': user.firm
            }, 
            { 
                'proj': 1,
                'lang': 1
            },
            function(sett_firm) {

                var add = sett_firm.proj.add;

                switch (add) {

                    case 'all_users': 
                        find_settings_user(user, Settings, sett_firm);
                        break;

                    case 'list_of_users':
                        if (add.list.indexOf(user_id) != -1) find_settings_user(user, Settings, sett_firm)
                        else callback_error(403)
                        break;

                    case 'only_admin':
                        if (user.admin) find_settings_user(user, Settings, sett_firm)
                        else callback_error(403)
                        break;

                    default:
                        callback_error(403)

                }
          
            }, 
            callback_error
        );

    }

    var open_settings = function (user) {
        
        DB.openCollection(db, 'Settings', function(Settings) {

            find_settings_firm(user, Settings);

        }, callback_error);
    
    }

    var find_user_id = function(Users) {
    
        DB.findOne(Users, {'_id': mongo.ObjectID(user_id)}, {}, open_settings, callback_error);
    }

    DB.openCollection(db, 'Users', find_user_id, callback_error);
};

function add_task(response, db, user_id, proj_id) {
    console.log("Request handler 'add_task' was called.");

    var callback_error = function(number) {
        
        db.close();
        error_pages['p_' + number](response);
    }

    var show_page = function (user, fields, lang, colls) {
        console.log('show_page', fields)

        for (var i in colls.Projects) {

            console.log(proj_id, i, colls.Projects[i].unique_title);

            if (i == proj_id || colls.Projects[i].unique_title == proj_id){

                for (var j = 0; j < fields.length; j++){
                    
                    if (fields[j].title == 'proj') {
                        fields[j].default = i;
                        break;
                    }
                } 
                break; 
            }
        }

        var usr = {
                name : user.name + ' ' + user.surname,
                admin : user.admin ? 'true' : 'false',
                id : user._id.toString()
            },
            obj = {
                title  : lang.task.new,
                error  : lang.error.default,
                header : lang.header,
                proj_id: proj_id,
                user   : usr,
                fields : fields,
                colls  : colls,
                lang_fields: lang.task.fields,
                files  : lang.files,
                button : {
                    id: 'send_task',
                    create: lang.form.create
                }
            },
            html = jade.renderFile(__dirname + '/templates/add_new.jade', obj);

        response.writeHead(200, {"Content-Type": "text/html"});
        response.write(html);
        response.end();
        db.close();
    }

    var colls = {};
    var get_collection_elems = function(user, fields, lang, col_arr, col_ind, Collection) {

        var fields_name = functions.pureArr(col_arr[col_ind].fields.concat("_id")), i, fields_use = {}, temp = {};

        for (i = 0; i < fields_name.length; i++) {

            fields_use[fields_name[i]] = 1;
        }

        DB.findAll(Collection, {firm: {$in: [user.firm, 'all']}}, {}, function(coll_elems){

            for (i = 0; i < coll_elems.length; i++) {

                temp[coll_elems[i]._id.toString()] = coll_elems[i]
            }
            colls[col_arr[col_ind].name] = temp;

            if (col_ind == col_arr.length - 1) show_page(user, fields, lang, colls)
            else get_collection(user, fields, lang, col_arr, col_ind + 1)

        }, callback_error)

    }

    var get_collection = function(user, fields, lang, col_arr, col_ind) {

        DB.openCollection(db, col_arr[col_ind].name, function(Collection) {

            get_collection_elems(user, fields, lang, col_arr, col_ind, Collection)

        }, callback_error)

    }

    var get_fields = function(user, fields, lang) {
        var temp = {}, temp_arr = [], field, i, j, k, fields_name,
            use_fields = [];

        for (i in fields) {

            field = fields[i];

            if (field.on && field.on.toString() == 'true' && field.edit != 'none') {

                if (field.collection && field.collection.length) {

                    for (j = 0; j < field.collection.length; j++) {

                        fields_name = field.collection[j].fields || {none: [], title: []};

                        console.log('get_fields', fields_name);
                        temp[ field.collection[j].name ] = temp[ field.collection[j].name ] || [];
                        for (k = 0; k <= fields_name.none.length; k++)
                            temp[ field.collection[j].name ].push( fields_name.none[k] );
                        for (k = 0; k <= fields_name.title.length; k++)
                            temp[ field.collection[j].name ].push( fields_name.title[k] );

                    }
                }

                use_fields.push(field);
            }
        }

        for (i in temp) temp_arr.push({name: i, fields: temp[i]});

        if (temp_arr.length == 0) show_page(user, use_fields, lang)
        else get_collection(user, use_fields, lang, temp_arr, 0)

    }

    var find_language_user = function (user, fields, Languages, lang_code) {
        
        DB.findOne(Languages, {'lang_code': lang_code}, {'_id': 0}, function(lang) {

            get_fields(user, fields, lang);

        }, callback_error);

    }

    var open_languages = function (user, fields, lang_code) {
        console.log('open_languages')
        
        DB.openCollection(db, 'Languages', function(Languages) {

            find_language_user(user, fields, Languages, lang_code);
        
        }, callback_error);
    }

    var find_settings_user = function (user, Settings, fields, lang_firm) {

        DB.findOne( Settings, 
            { 'object_id': mongo.ObjectID(user_id) }, 
            { 'lang': 1 },
            function(sett_user) {

                var lang_code = (sett_user && sett_user.lang && sett_user.lang.default) || 
                                (lang_firm && lang_firm.default) || DEFAULT_LANG_CODE;

                open_languages(user, fields, lang_code);
            
            }, 
            callback_error
        );
        
    }

    var find_settings_firm = function (user, Settings) {

        DB.findOne( Settings, 
            { 
                'object_id': user.firm
            }, 
            { 
                'task': 1,
                'lang': 1
            },
            function(sett_firm) {

                sett_firm = sett_firm || {};

                find_settings_user(user, Settings, sett_firm.task.fields, sett_firm.lang);
          
            }, 
            callback_error
        );

    }

    var open_settings = function (user) {
        
        DB.openCollection(db, 'Settings', function(Settings) {

            find_settings_firm(user, Settings);

        }, callback_error);
    
    }

    var find_user_id = function(Users) {
    
        DB.findOne(Users, {'_id': mongo.ObjectID(user_id)}, {}, open_settings, callback_error);

    }

    DB.openCollection(db, 'Users', find_user_id, callback_error);
}

function auth(response, db) {
    console.log("Request handler 'auth' was called.");

    var callback_error = function(number) {
        console.log('error: ', number);
        error_pages['p_' + number](response, {'db': db});
    }

    var show_page = function(lang) {

        console.log(lang);

        var html = jade.renderFile(__dirname + '/templates/auth.jade', {title: lang.auth.title, error: lang.error, auth: lang.auth, form: lang.form});

        db.close();
        response.writeHead(200, {"Content-Type": "text/html"});
        response.write(html);
        response.end();

    }

    DB.openCollection(db, 'Languages', function(Languages) {

        DB.findOne(Languages, {'lang_code': DEFAULT_LANG_CODE}, {'_id': 0}, show_page, callback_error);

    }, callback_error);
}

function reg_u(response, db, user_id) {
    console.log("Request handler 'reg_u' was called.");

    var callback_error = function(number) {
        
        db.close();
        error_pages['p_' + number](response);
    }

    var show_page = function (user, lang) {

        var usr = {
                name : user.name + ' ' + user.surname,
                admin : user.admin ? 'true' : 'false',
                id : user._id.toString()
            },
            obj = {
                title: lang.auth.reg,
                error: lang.error,
                header: lang.header,
                form: lang.form,
                user: usr
            },
            html = jade.renderFile(__dirname + '/templates/reg_user.jade', obj);

        db.close();
        response.writeHead(200, {"Content-Type": "text/html"});
        response.write(html);
        response.end();
    }

    var find_language_user = function (user, Languages, lang_code) {
        
        DB.findOne(Languages, {'lang_code': lang_code}, {'_id': 0}, function(lang) {

            show_page(user, lang);

        }, callback_error);

    }

    var open_languages = function (user, lang_code) {
        console.log('open_languages')
        
        DB.openCollection(db, 'Languages', function(Languages) {

            find_language_user(user, Languages, lang_code);
        
        }, callback_error);
    }

    var find_settings_user = function (user, Settings, lang_code) {

        DB.findOne( Settings, 
            { 'object_id': mongo.ObjectID(user_id) }, 
            { 'lang': 1 },
            function(sett_user) {

                var lang_code = (sett_user && sett_user.lang && sett_user.lang.default) || 
                                lang_code || DEFAULT_LANG_CODE;

                open_languages(user, lang_code);
            
            }, 
            callback_error
        );
        
    }

    var find_settings_firm = function (user, Settings) {

        DB.findOne( Settings, 
            { 
                'object_id': user.firm
            }, 
            {
                'lang': 1
            },
            function(sett_firm) { find_settings_user(user, Settings, sett_firm.lang.default) }, 
            callback_error
        );

    }

    var open_settings = function (user) {

        if (user.admin && user.admin == true || user.admin == 'true') {
        
            DB.openCollection(db, 'Settings', function(Settings) {

                find_settings_firm(user, Settings);
                
            }, callback_error);
        
        } else callback_error(403);
    }

    var find_user_id = function(Users) {
    
        DB.findOne(Users, {'_id': mongo.ObjectID(user_id)}, {}, open_settings, callback_error);
    }

    DB.openCollection(db, 'Users', find_user_id, callback_error);
}

function reg_f(response, db) {
  console.log("Request handler 'registr_f' was called.");

    var callback_error = function(number) {
        
        db.close();
        error_pages['p_' + number](response);
    }

    var show_page = function (lang) {

        var html = jade.renderFile(__dirname + '/templates/reg_firm.jade', {title: lang.auth.reg, form: lang.form, error: lang.error});

        db.close();
        response.writeHead(200, {"Content-Type": "text/html"});
        response.write(html);
        response.end();
    }

    var find_language_user = function (Languages) {
        
        DB.findOne(Languages, {'lang_code': DEFAULT_LANG_CODE}, {'_id': 0}, function(lang) {

            show_page(lang);

        }, callback_error);
    }

    DB.openCollection(db, 'Languages', find_language_user, callback_error);
}

exports.add_depart= add_depart;
exports.add_proj  = add_proj;
exports.add_task  = add_task;
exports.auth      = auth;
exports.reg_u     = reg_u;
exports.reg_f     = reg_f;