var functions   = require('./../modules/functions'),
    DB          = require('./../modules/db'),
    error_pages = require('./error_pages'),
    mongo       = require('mongodb'),
    jade        = require("jade");

function people(response, db, user_id) {
  console.log("Request handler 'people' was called.");

  var callback_error = function(err) {
    console.log('error: ', err);
    db.close();
    error_pages.p_500(response, err.toString());
  }

  var show_page = function (user, users, lang) {
    var usr = {
          name : user.name + ' ' + user.surname,
          admin: user.admin ? 'true' : 'false',
          id   : user._id.toString()
        },
        obj = {
          header: lang.header,
          title: lang.people.title,
          user: usr,
          users: users,
          people: lang.people,
          form: lang.form
        },
        html = jade.renderFile(__dirname + '/templates/people.jade', obj);

    db.close();
    response.writeHead(200, {"Content-Type": "text/html"});
    response.write(html);
    response.end();
    console.log('close');
  }

  var find_language_user = function (user, users, lang_code, langs) {
    langs.findOne({'lang_code': lang_code}, {fields: {'_id': 0}}, function(err, lang) {
      if (err) callback_error(err)
      else show_page(user, users, lang)
    })
  }

  var open_languages = function (user, users, lang_code) {
    db.collection('Languages', {safe: true}, function(err, langs) {
      if (err) callback_error(err)
      else find_language_user(user, users, lang_code, langs)
    });
  }

  var find_settings_user = function (users, user, setts) {
    setts.findOne({'object_id': user_id}, {fields: {'_id': 0}}, function(err, sett) {
      if (err) callback_error(err)
      else open_languages(users, user, (sett && sett.lang && sett.lang.on) ? sett.lang.on : 'ru')
    })
  }

  var open_settings = function (users, user) {
    db.collection('Settings', {safe: true}, function(err, setts) {
      if (err) callback_error(err)
      else find_settings_user(users, user, setts)
    });
  }

  var find_users_firm = function (users, user, firm) {
    users.find({'firm': firm}, {fields: {_id: 1, name: 1, surname: 1, admin: 1}}).toArray(function(err, us) {
      if (err) callback_error(err)
      else {
        var usrs = [];
        for (i = 0; i < us.length; i++) {
          usrs[i] = {};
          usrs[i].name = us[i].name + ' ' + us[i].surname;
          usrs[i].admin= us[i].admin ? 'true' : 'false';
          usrs[i].id   = us[i]._id.toString();
        }
        open_settings(user, usrs);
      }
    });
  }

  var find_user_id = function(users) {
    users.findOne({'_id': mongo.ObjectID(user_id)}, function(err, user) {
      if (err) callback_error(err)
      else find_users_firm(users, user, user.firm)
    });
  }

  db.collection("Users", {safe: true}, function(err, users){
    if (err) callback_error(err)
    else find_user_id(users)
  });
}

function projs(response, db, user_id) {
    console.log("Request handler 'projs' was called.");

    var callback_error = function(number) {

        db.close();
        error_pages['p_' + number](response, number);
    }

    var show_page = function (user, projs, lang) {
        console.log('show_page', projs)

        var usr = {
                name : user.name + ' ' + user.surname,
                admin: user.admin ? 'true' : 'false',
                id   : user._id.toString()
            },
            obj = {
                title  : lang.proj.many,
                header : lang.header,
                projs  : projs,
                status : lang.task.fields.status.options,
                user   : usr
            },
            html = jade.renderFile(__dirname + '/templates/projs.jade', obj);

        response.writeHead(200, {"Content-Type": "text/html"});
        response.write(html);
        response.end();
        db.close();
    }

    var find_tasks_projs = function (user, projs, lang) {
        
        DB.findAll('Tasks', {proj: {$in: functions.getObj(projs, '_id')}}, {proj: 1, status: 1}, function(tasks) {

            show_page(user, functions.countStatus( functions.arrToObj(projs), tasks), lang);

        }, callback_error, db);
    }    

    var find_projs_firm = function (user, sett_firm, lang) {

        var obj = {firm: user.firm};

        if (sett_firm.show.on != 'all_users') {

            if (!user.admin || (user.admin != true && user.admin != 'true')) {

                callback_error(403);
            }
        } else {

            DB.findAll('Projects', obj, {}, function(projs) {
          
                find_tasks_projs(user, projs, lang);
            
            }, callback_error, db);
        }
    }

    var find_language_user = function (user, sett_firm, lang_code) {

        lang_code = lang_code || DEFAULT_LANG_CODE;
        
        DB.findOne('Languages', {'lang_code': lang_code}, {'_id': 0}, function(lang) {
        
            find_projs_firm(user, sett_firm, lang);
        
        }, callback_error, db);
    }

    var find_settings_firm = function (user, Settings) {

        DB.findOne(Settings, {'object_id': user.firm}, {'_id': 0}, function(sett_firm) {
          
            DB.findOne(Settings, {'object_id': user_id}, {'_id': 0}, function(sett) {

                var lang_code = (sett && sett.lang && sett.lang.default) || DEFAULT_LANG_CODE;
            
                find_language_user(user, sett_firm.proj, lang_code);

            }, callback_error);
            
        }, callback_error);
    }

    var open_settings = function (user) {
        
        DB.openCollection(db, 'Settings', function(Settings) {

            find_settings_firm(user, Settings);

        }, callback_error, db);
    }

    DB.findOne('Users', {'_id': mongo.ObjectID(user_id)}, {}, open_settings, callback_error, db);
}

function sett_admin(response, db, user_id) {
    console.log("Request handler 'sett_admin' was called.");

    var callback_error = function(number) {
        console.log('callback_error', number);

        db.close();
        error_pages['p_' + number](response, number);
    }

    var show_page = function (user, colls, lang, sett, def_sett) {
        
        var usr = {
                name   : user.name + ' ' + user.surname,
                admin  : user.admin ? 'true' : 'false',
                id     : user._id.toString()
            },
            obj = {
                header   : lang.header,
                title    : lang.sett.title.admin,
                colls    : colls,
                user     : usr,
                lang     : lang,
                sett     : sett,
                def_sett : def_sett
            },
            html = jade.renderFile(__dirname + '/templates/sett_admin.jade', obj);

        response.writeHead(200, {"Content-Type": "text/html"});
        response.write(html);
        response.end();
        db.close();
    }

    var find_filters = function(user, colls, lang, sett, def_sett) {

        DB.findAll('Filters', {_id: {$in: functions.getObjIds(sett.filters)}}, {}, function(filters){

            colls.Filters = filters;
            show_page(user, colls, lang, sett, def_sett);

        }, callback_error, db);
    }

    var find_settings_firm = function (user, colls, lang) {

        DB.findOne('Settings', {'object_id': user.firm}, {}, function(sett) {

            DB.findOne('Settings', {type: 'default'}, {}, function(def_sett) {

                find_filters(user, colls, lang, sett, def_sett);

            }, callback_error, db);

        }, callback_error, db);

    }

    var find_language_user = function (user, colls, lang_code) {

        lang_code = lang_code || DEFAULT_LANG_CODE;
        
        DB.findOne('Languages', {'lang_code': lang_code}, {'_id': 0}, function(lang) {
        
            find_settings_firm(user, colls, lang);
        
        }, callback_error, db);
    }

    var find_setts_user = function (user, colls) {
        
        DB.findOne('Settings', {'object_id': user_id}, {'_id': 0}, function(sett) {
          
            var lang_code = (sett && sett.lang && sett.lang.default) ? sett.lang.default : DEFAULT_LANG_CODE;
            
            find_language_user(user, colls, lang_code);

        }, callback_error, db);
    }

    var fins_langs = function (user, colls) {

        DB.findAll('Languages', {}, {_id: 1, lang_code: 1, lang_name: 1}, function(langs) {

            colls.Languages = functions.arrToObj(langs, 'lang_code');

            find_setts_user(user, colls);
        
        }, callback_error, db);

    }

    var find_tasks_firm = function (user, colls) {

        DB.findAll('Tasks', {'firm': user.firm}, {}, function(tasks) {
          
            colls.Tasks = functions.arrToObj(tasks, '_id');

            fins_langs(user, colls);
            
        }, callback_error, db);
    }

    var find_projs_firm = function (user, colls) {
        
        DB.findAll('Projects', {'firm': {$in: [user.firm, 'all']}}, {_id: 1, title: 1}, function(projs) {
          
            colls.Projects = functions.arrToObj(projs, '_id');

            find_tasks_firm(user, colls);
            
        }, callback_error, db);
    }

    var find_departs_firm = function (user, colls) {
        
        DB.findAll('Departments', {'firm': user.firm}, {}, function(departs) {
            
            colls.Departments = functions.arrToObj(departs, '_id');

            find_projs_firm(user, colls);
        
        }, callback_error, db);
    }

    var find_users_firm = function (Users, user) {
        
        DB.findAll(Users, {'firm': user.firm}, {_id: 1, name: 1, surname: 1, admin: 1}, function(users) {
            
            var colls = {'Users': functions.arrToObj(users, '_id')};

            find_departs_firm(user, colls);
        
        }, callback_error);
    }

    var find_user_id = function(Users) {
        
        DB.findOne(Users, {'_id': mongo.ObjectID(user_id)}, {}, function(user) {
            
            find_users_firm(Users, user);

        }, callback_error);
    }

    DB.openCollection(db, 'Users', find_user_id, callback_error);
}

function settings(response, db, user_id) {
    console.log("Request handler 'settings' was called.");

    var callback_error = function(number) {
        console.log('callback_error', number);

        db.close();
        error_pages['p_' + number](response, number);
    }

    var show_page = function (user, langs, sett, fields) {
        var usr = {
                name   : user.name + ' ' + user.surname,
                admin  : user.admin ? 'true' : 'false',
                id     : user._id.toString()
            },
            obj = {
                header   : langs[sett.lang.default].header,
                title    : langs[sett.lang.default].sett.title.user,
                user     : usr,
                langs    : langs,
                sett     : sett,
                fields   : fields
            },
            html = jade.renderFile(__dirname + '/templates/sett.jade', obj);

        response.writeHead(200, {"Content-Type": "text/html"});
        response.write(html);
        response.end();
        db.close();
    }

    var find_langs = function (user, lang_codes, sett, fields) {

        DB.findAll('Languages', {lang_code: {$in: lang_codes}}, {}, function(langs) {

            show_page(user, functions.arrToObj(langs, 'lang_code'), sett, fields);
        
        }, callback_error, db);

    }

    var find_settings = function (user) {

        DB.findOne('Settings', {'object_id': user.firm}, {lang: 1, task: 1}, function(sett) {

            var lang_codes = [];

            for (var i in sett.lang.options) {

                if (sett.lang.options[i].on.toString() == 'true') lang_codes.push(i)
            }

            DB.findOne('Settings', {'object_id': user_id}, {}, function(user_sett) {

                find_langs(user, lang_codes, user_sett, sett.task.fields);

            }, callback_error, db);

        }, callback_error, db);

    }

    DB.findOne('Users', {'_id': mongo.ObjectID(user_id)}, {}, find_settings, callback_error, db);
}

function task(response, db, user_id, task_id) {
    console.log("Request handler 'task' was called.");

    var callback_error = function(number) {
        console.log('callback_error', number);

        db.close();
        error_pages['p_' + number](response, number);
    }

    var show_page = function (user, colls, task, lang, sett) {
        console.log('show_page', colls.Comments);
        
        var i, desc = {}, people = {}, date = {}, stat = {}, files = {};

        for (i in sett) {
            
            if (sett[i].on) {

                if (sett[i].collection) {

                    for (var j in sett[i].collection) {

                        if (sett[i].collection[j].name == 'Users') {

                            people[i] = sett[i];
                            break;
                        }
                    }
                    
                    continue;
                }

                if (sett[i].type == 'option' && sett[i].options_type == 'text') {

                    stat[i] = sett[i];
                    continue;
                }

                if (sett[i].type == 'date') {

                    date[i] = sett[i];
                    continue;
                }

                if (sett[i].type == 'file') {

                    files[i] = sett[i];
                    continue;
                }

                desc[i] = sett[i];
            }
        }

        var usr = {
                name   : user.name + ' ' + user.surname,
                admin  : user.admin ? 'true' : 'false',
                id     : user._id.toString()
            },
            obj = {
                header : lang.header,
                title  : task.title + ' ' + task.beauty_name,
                error  : lang.error,
                colls  : colls,
                task   : task,
                user   : usr,
                dates  : lang.dates,
                lang   : lang.task,
                desc   : desc,
                people : people,
                stat   : stat,
                date   : date,
                files  : files,
                comms  : lang.comm
            },
            html = jade.renderFile(__dirname + '/templates/task.jade', obj);

        response.writeHead(200, {"Content-Type": "text/html"});
        response.write(html);
        response.end();
        db.close();
    }

    var find_language_user = function (user, colls, task, lang_code, sett) {
        
        DB.findOne('Languages', {'lang_code': lang_code}, {'_id': 0}, function(lang) {
          
            show_page(user, colls, task, lang, sett);

        }, callback_error, db);
    }

    var find_settings_firm = function (user, colls, task, lang_code) {
        
        DB.findOne('Settings', {'object_id': user.firm}, {'_id': 0}, function(sett) {
          
            find_language_user(user, colls, task, lang_code, sett.task.fields);

        }, callback_error, db);
    }

    var find_settings_user = function (user, colls, task) {
        
        DB.findOne('Settings', {'object_id': user_id}, {'_id': 0}, function(sett) {
          
            var lang_code = (sett && sett.lang && sett.lang.default) ? sett.lang.default : DEFAULT_LANG_CODE;
            
            find_settings_firm(user, colls, task, lang_code);

        }, callback_error, db);
    }

    var find_files_task = function (user, colls, task) {
        
        DB.findAll('Files', {'_id': {$in: functions.getObjIds(task.files)}}, {}, function(files) {
          
             colls.Files = functions.arrToObj(files, '_id');

            find_settings_user(user, colls, task);
            
        }, callback_error, db);
    }

    var find_comments_task = function (user, colls, task) {
        
        DB.findAll('Comments', {'task': task._id.toString()}, {}, function(comms) {
          
            colls.Comments = functions.arrToObj(comms, '_id');

            if (task.files && task.files.length) find_files_task(user, colls, task)
            else find_settings_user(user, colls, task);
            
        }, callback_error, db);
    }

    var find_tasks_firm = function (user, colls) {
        
        DB.findAll('Tasks', {'firm': user.firm}, {}, function(tasks) {
          
            colls.Tasks = functions.arrToObj(tasks, '_id');

            var task = colls.Tasks[task_id];

            if (!task) {

                for (var i in colls.Tasks) {

                    if (colls.Tasks[i].beauty_name == task_id) task = colls.Tasks[i]
                }
            }

            find_comments_task(user, colls, task);
            
        }, callback_error, db);
    }

    var find_projs_firm = function (user, colls) {
        
        DB.findAll('Projects', {'firm': {$in: [user.firm, 'all']}}, {_id: 1, title: 1, unique_title: 1}, function(projs) {
          
            colls.Projects = functions.arrToObj(projs, '_id');

            find_tasks_firm(user, colls);
            
        }, callback_error, db);
    }

    var find_departs_firm = function (user, colls) {
        
        DB.findAll('Departments', {'firm': user.firm}, {}, function(departs) {
            
            colls.Departments = functions.arrToObj(departs, '_id');

            find_projs_firm(user, colls);
        
        }, callback_error, db);
    }

    var find_users_firm = function (Users, user) {
        
        DB.findAll(Users, {'firm': user.firm}, {_id: 1, name: 1, surname: 1, admin: 1, email: 1}, function(users) {
            
            var colls = {'Users': functions.arrToObj(users, '_id')};

            find_departs_firm(user, colls);
        
        }, callback_error);
    }

    var find_user_id = function(Users) {
        
        DB.findOne(Users, {'_id': mongo.ObjectID(user_id)}, {}, function(user) {
            
            find_users_firm(Users, user);

        }, callback_error);
    }

    DB.openCollection(db, 'Users', find_user_id, callback_error);
}

function unauth(response, db, user_id, ua, conn_id) {
    console.log("Request handler 'unauth' was called.");

    var callback_error = function(number) {

        number = number || 500;
        
        db.close();
        error_pages['p_' + number](response);
    }

    var show_page = function (lang) {
    
        var html = jade.renderFile(__dirname + '/templates/auth.jade', {title: lang.auth.title, error: lang.error, auth: lang.auth, form: lang.form});

        response.writeHead(200, {'Content-Type': 'text/html', 'Set-Cookie': 'tracker='});
        response.write(html);
        response.end();
        db.close();
    }

    var find_settings_user = function (user) {
        
        DB.findOne('Settings', {'object_id': user_id}, {'lang': 1}, function(sett) {
          
            var lang_code = sett.lang.default || DEFAULT_LANG_CODE;

            DB.findOne('Languages', {'lang_code': lang_code}, {'_id': 0}, show_page, callback_error, db)
        
        }, callback_error, db)
    }

    var find_conn_user = function (user) {
        
        DB.removeElem('Connections', {user_id: user_id, userAgent: ua, _id: mongo.ObjectID(conn_id)}, function(){
            
            find_settings_user(user);

        }, callback_error, db);
    }

    DB.findOne('Users', {'_id': mongo.ObjectID(user_id)}, {}, find_conn_user, callback_error, db);
}

exports.people    = people;
exports.projs     = projs;
exports.sett_admin= sett_admin;
exports.settings  = settings;
exports.task      = task;
exports.unauth    = unauth;