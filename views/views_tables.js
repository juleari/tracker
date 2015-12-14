var functions   = require('./../modules/functions'),
    DB          = require('./../modules/db'),
    mongo       = require('mongodb'),
    error_pages = require('./error_pages'),
    jade        = require("jade");

var DEFAULT_LANG_CODE  = 'ru',
    MIN_RESULTS_LENGTH = 5;

function home(response, db, user_id) {
    console.log("Request handler 'start' was called.");

    var callback_error = function(number) {
        console.log('callback_error', number);

        db.close();
        error_pages['p_' + number](response, number);
    }

    var show_page = function (user, colls, lang, filters) {
        console.log('show', filters[0].tasks)
        
        var usr = {
                name   : user.name + ' ' + user.surname,
                admin  : user.admin ? 'true' : 'false',
                id     : user._id.toString()
            },
            obj = {
                header : lang.header,
                title  : 'Tracker',
                colls  : colls,
                user   : usr,
                lang   : lang.task.fields,
                filters: filters
            },
            html = jade.renderFile(__dirname + '/templates/index.jade', obj);

        response.writeHead(200, {"Content-Type": "text/html"});
        response.write(html);
        response.end();
        db.close();
    }

    var find_tasks_to = function (user, colls, lang, sett_task, Tasks) {
        console.log('find_tasks_to');
        
        DB.findAll(Tasks, {'to': user_id}, {type: 1, _id: 1, title: 1, prior: 1, beauty_name: 1}, function(tasks) {
        
            if (!tasks || tasks.length == 0) {
                tasks = {none: 'true', text: lang.task.none}
            
            }
            
            var filter = {
                name: (lang && lang.filters && lang.filters.list && lang.filters.list.options && lang.filters.list.options[0] && lang.filters.list.options[0].my) || (lang && lang.task && lang.task.title) || 'My tasks',
                fields: [
                    sett_task['type'],
                    sett_task['prior'],
                    sett_task['title']
                ],
                tasks: tasks
            };
            
            show_page(user, colls, lang, [filter]);

        }, callback_error);
    }

    var filters_tasks = [];
    var find_tasks_filters = function (user, colls, lang, filters, sett_task, Tasks, i) {
        console.log('find_tasks_filters', i, filters[0].fields);
        
        var find_data = {}, fields = {}, j;

        for (j = 0; j < filters[i].by.length; j++) {
            
            find_data[ filters[i].by[j] ] = filters[i].values[j];
        }

        for (j = 0; j < filters[i].fields.length; j++) {
        
            fields[ filters[i].fields[j].value ] = sett_task[ filters[i].fields[j].value ];
        }
        
        DB.findAll(Tasks, find_data, {files: 0}, function(tasks) {
            console.log('find_tasks_all');
        
            if (!tasks || tasks.length == 0) {
                
                tasks = {none: 'true', text: lang.task.none};
            }

            filters_tasks.push({
                name   : filters[i].name,
                fields : fields,
                tasks  : tasks
            });

            if (filters_tasks.length == filters.length) {

                show_page(user, colls, lang, filters_tasks);
            
            } else {

                find_tasks_filters(user, colls, lang, filters, sett_task, Tasks, i+1);
            }

        }, callback_error);
    }

    var open_tasks = function (user, colls, lang, filters, sett_task) {
        console.log('open_tasks');
        
        DB.openCollection(db, 'Tasks', function(Tasks){
          
            DB.findAll(Tasks, {firm: user.firm}, {}, function(tasks){

                colls.Tasks = functions.arrToObj(tasks, '_id');

                if (filters && filters.length > 0) {
                
                    find_tasks_filters(user, colls, lang, filters, sett_task, Tasks, 0);
                
                } else find_tasks_to(user, colls, lang, sett_task, Tasks);
            
            });

        });
    }

    var find_settings_firm = function (user, colls, lang, filters) {

        DB.findOne('Settings', {'object_id': user.firm}, {'task': 1}, function(sett) {
          
            open_tasks(user, colls, lang, filters, sett.task.fields);;

        }, callback_error, db);

    }

    var find_language_user = function (user, colls, lang_code, filters) {
        console.log('find_language_user');

        lang_code = lang_code || DEFAULT_LANG_CODE;
        
        DB.findOne('Languages', {'lang_code': lang_code}, {'_id': 0}, function(lang) {
        
            find_settings_firm(user, colls, lang, functions.getMyFilters(filters, lang));
        
        }, callback_error, db);
    }

    var find_filters_user = function (user, colls, sett, lang_code) {
        console.log('find_filters_user');

        DB.findAll('Filters', {_id: {$in: functions.getObjIds(sett.filters)}}, {}, function(filters) {

            var filters_show = functions.setFilterValues(filters, sett.filters);

            find_language_user(user, colls, lang_code, filters_show);

        }, callback_error, db);
    }

    var find_settings_user = function (user, colls) {
        console.log('find_settings_user');
        
        DB.findOne('Settings', {'object_id': user_id}, {'_id': 0}, function(sett) {
          
            var lang_code = (sett && sett.lang && sett.lang.default) ? sett.lang.default : DEFAULT_LANG_CODE;
            
            if (sett && sett.filters && sett.filters.length) find_filters_user(user, colls, sett, lang_code)
            else  find_language_user(user, colls, lang_code);

        }, callback_error, db);
    }

    var find_projs_firm = function (user, colls) {
        console.log('find_projs_firm');
        
        DB.findAll('Projects', {'firm': {$in: [user.firm, 'all']}}, {_id: 1, title: 1, unique_title: 1}, function(projs) {
          
            colls.Projects = functions.arrToObj(projs, '_id');

            find_settings_user(user, colls);
            
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
        console.log('find_user_id');
        
        DB.findOne(Users, {'_id': mongo.ObjectID(user_id)}, {}, function(user) {
            
            find_users_firm(Users, user);

        }, callback_error);
    }

    DB.openCollection(db, 'Users', find_user_id, callback_error);
}

function filter(response, db, user_id) {
  console.log("Request handler 'filters' was called.");

    var find_settings_firm = function (users, user, sett_user, setts) {
        
        setts.findOne({'object_id': user.firm}, function(err, sett) {
          
            if (err) callback_error(500, err)
            else open_languages(users, user, sett_user, sett)
        });
    }

    var callback_error = function(number) {

        db.close();
        error_pages['p_' + number](response, number);
    }

    var show_page = function (user, lang, filters) {
        
        var usr = {
                name   : user.name + ' ' + user.surname,
                admin  : user.admin ? 'true' : 'false',
                id     : user._id.toString()
            },
            obj = {
                header : lang.header,
                title  : lang.filters.title,
                user   : usr,
                users  : users,
                projs  : projs,
                tasks  : tasks,
                filters: filters
            },
            html = jade.renderFile(__dirname + '/templates/filters.jade', obj);

        response.writeHead(200, {"Content-Type": "text/html"});
        response.write(html);
        response.end();
        db.close();
    }

    var find_tasks = function (user, users, projs, lang, filters) {
        
        DB.findAll('Tasks', {'firm': user.firm}, {}, function(tasks){
          
            show_page(user, users, projs, lang, filters, tasks);

        }, callback_error, db);
    }

    var find_filters_user = function (user, users, projs, sett, lang_code) {

        DB.findAll('Filters', {}, {}, function(filters) {

            var fs = functions.arrToObj(lang.filters, 'list'), o, field = {},
                    u_filt = functions.getObj(sett.filters, 'id');
                
            for (var i = 0; i < filters.length; i++) {
                
                o = fs[ filters[i]._id.toString() ]
                filters[i].value = o.value;
                filters[i].name = o.name;
                filters[i].desc = o.desc;
                filters[i].on = (u_filt.indexOf(o.value) != -1).toString();
                field = functions.arrToObj(lang.filters, 'list_shown');
                
                for (var j = 0; j < filters[i].fields.length; j++) {
                    field[ filters[i].fields[j] ].on = 'true';
                }

                filters[i].fields = field;
            }

            find_tasks(user, users, projs, lang, filters);

        }, callback_error, db);
    }

    var find_language_user = function (user, users, projs, sett) {

        lang_code = (sett && sett.lang && sett.lang.default) || DEFAULT_LANG_CODE;
        
        DB.findOne('Languages', {'lang_code': lang_code}, {'_id': 0}, function(lang) {
        
            find_filters_user(user, users, projs, sett, lang);
        
        }, callback_error, db);
    }

    var find_settings_user = function (user, users, projs) {
        
        DB.findOne('Settings', {'object_id': user_id}, {'_id': 0}, function(sett) {
          
            var lang_code = (sett && sett.lang && sett.lang.default) ? sett.lang.default : DEFAULT_LANG_CODE;
            
            find_language_user(user, users, projs, sett);

        }, callback_error, db);
    }

    var find_projs_firm = function (user, users) {
        
        DB.findAll('Projects', {'firm': {$in: [user.firm, 'all']}}, {_id: 1, title: 1}, function(projs) {
          
            var projects = {};
            
            for (var i = 0; i < projs.length; i++) {
              
                projects[ projs[i]._id.toString() ] = {
                    title: projs[i].title,
                    id   : projs[i]._id.toString()
                }
            }

            find_settings_user(user, users, projects);
            
        }, callback_error, db);
    }

    var find_users_firm = function (Users, user) {
        
        DB.findAll(Users, {'firm': user.firm}, {_id: 1, name: 1, surname: 1, depart: 1}, function(users) {
          
            var usrs = {};
            
            for (var i = 0; i < users.length; i++) {
                
                usrs[users[i]._id.toString()] = {
                    name: users[i].name + ' ' + users[i].surname,
                    id  : users[i]._id.toString()
                }
            }
            
            find_projs_firm(user, usrs);
        
        }, callback_error);
    }

    var find_user_id = function(Users) {
        
        DB.findOne(Users, {'_id': mongo.ObjectID(user_id)}, {}, function(user) {
            
            if (user && user.admin && user.admin.toString() == 'true') find_users_firm(Users, user)
            else callback_error(403);

        }, callback_error);
    }

    DB.openCollection(db, 'Users', find_user_id, callback_error);
}

function proj(response, db, user_id, proj_id) {
    console.log("Request handler 'proj' was called.");

    var callback_error = function(number) {

        db.close();
        error_pages['p_' + number](response, number);
    }

    var show_page = function (user, colls, proj, tasks, sett_task, sett_proj, lang) {
        
        var proj_tasks = {
                name: lang.task.many,
                fields: [
                    sett_task['type'],
                    sett_task['prior'],
                    sett_task['title'],
                    sett_task['to']
                ]
            };

        proj_tasks.tasks = (tasks && tasks[0]) ? 
                        tasks : 
                        { none : 'true', text : lang.task.none };
                
        var usr = {
                name : user.name + ' ' + user.surname,
                admin: user.admin ? 'true' : 'false',
                id   : user._id.toString()
            },
            obj = {
                title  : proj.title,
                header : lang.header,
                lang_p : lang.proj.fields,
                lang   : lang.task.fields,
                proj   : proj,
                colls  : colls,
                f      : proj_tasks,
                sett   : sett_proj,
                user   : usr,
                proj_id: proj_id
            },
            html = jade.renderFile(__dirname + '/templates/proj.jade', obj);

        response.writeHead(200, {"Content-Type": "text/html"});
        response.write(html);
        response.end();
        db.close();
    }

    var find_tasks_proj = function (user, colls, proj, sett_task, sett_proj, lang) {
        
        DB.findAll('Tasks', {proj: proj._id.toString()}, {files: 0}, function(tasks) {
        
            DB.findAll('Tasks', {firm: user.firm}, {files: 0}, function(tasks_firm) {
                
                colls.Tasks = functions.arrToObj(tasks_firm, '_id');
                show_page(user, colls, proj, tasks, sett_task, sett_proj, lang);

            }, callback_error, db);

        }, callback_error, db);
    }

    var find_language_user = function (user, colls, proj, sett_task, sett_proj, lang_code) {

        lang_code = lang_code || DEFAULT_LANG_CODE;
        
        DB.findOne('Languages', {'lang_code': lang_code}, {'_id': 0}, function(lang) {
        
            find_tasks_proj(user, colls, proj, sett_task, sett_proj, lang);
        
        }, callback_error, db);
    }

    var find_settings = function (user, colls, proj) {
        
        DB.findAll('Settings', {'object_id': {$in: [user_id, proj._id.toString(), user.firm]}}, {'_id': 0}, function(setts) {
          
            var sett, sett_proj;

            if (setts[0].object_id == user_id) {

                sett = setts[0];

                if (setts[1].object_id == proj._id.toString()) {

                    sett_proj = setts[1];
                    sett_task = setts[2];
                
                } else {

                    sett_proj = setts[2];
                    sett_task = setts[1];

                }
            
            } else {

                if (setts[0].object_id == proj._id.toString()) {

                    sett_proj = setts[0];

                    if (setts[1].object_id == user_id) {

                        sett      = setts[1];
                        sett_task = setts[2];
                    
                    } else {

                        sett      = setts[2];
                        sett_task = setts[1];

                    }
                
                } else {

                    sett_task = setts[0];

                    if (setts[1].object_id == user_id) {

                        sett      = setts[1];
                        sett_proj = setts[2];
                    
                    } else {

                        sett      = setts[2];
                        sett_proj = setts[1];

                    }
                }
            } 

            var lang_code = (sett && sett.lang && sett.lang.default) ? sett.lang.default : DEFAULT_LANG_CODE;
            
            find_language_user(user, colls, proj, sett_task.task.fields, sett_proj, lang_code);

        }, callback_error, db);
    }

    var find_proj = function (user, colls) {
        
        DB.openCollection(db, 'Projects', function(Projects){

            DB.findAll(Projects, {'firm': {$in: [user.firm, 'all']}}, {firm: 0}, function(projs) {
          
                var proj;

                for (var i = 0; i < projs.length; i++) {

                    if (projs[i]._id.toString() == proj_id || projs[i].unique_title == proj_id) {

                        proj = projs[i];
                        proj.id = proj.unique_title || proj._id.toString();
                    
                    } else {

                        projs[i].id = projs[i].unique_title || projs[i]._id.toString();

                    }
                }

                colls.Projects = functions.arrToObj(projs, '_id');

                find_settings(user, colls, proj);
                
            }, callback_error);

        }, callback_error)
    }

    var find_departs_firm = function (user, colls) {

        DB.findAll('Departments', {'firm': user.firm}, {}, function(departs) {
          
            colls.Departments = functions.arrToObj(departs, '_id');
            find_proj(user, colls);
        
        }, callback_error, db);
    }

    var find_users_firm = function (Users, user) {
        
        DB.findAll(Users, {'firm': user.firm}, {_id: 1, name: 1, surname: 1, admin: 1, depart: 1}, function(users) {
          
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

function search(response, db, user_id, text) {
    text = decodeURIComponent(text);
    console.log('Searching ', text);
    
    var callback_error = function(number) {

        db.close();
        error_pages['p_' + number](response, number);
    }

    var show_page = function (user, colls, lang, query, results, search) {
        console.log(search);

        var usr = {
                name : user.name + ' ' + user.surname,
                admin : user.admin ? 'true' : 'false',
                id : user._id.toString()
            },
            obj = {
                header : lang.header,
                title  : 'Результаты запроса',
                colls  : colls,
                lang   : lang.search,
                comms  : lang.comm,
                dates  : lang.dates,
                tasks  : lang.task.fields,
                projs  : lang.proj,
                user   : usr,
                query  : query,
                result : results,
                text   : text,
                search : search
            },
            html = jade.renderFile(__dirname + '/templates/search.jade', obj);

        response.writeHead(200, {"Content-Type": "text/html"});
        response.write(html);
        response.end();
        db.close();
    }

    var find_tasks_search = function (user, colls, Tasks, search, lang, query, results, task_ids) {

        query   = query   || {};
        results = results || {};

        DB.findAll(Tasks, {'firm': user.firm, 'title': {$regex: text}, _id : {$nin: task_ids}}, {}, function(tasks) {

            query.Tasks   = text;
            results.Tasks = functions.arrToObj(tasks, '_id', results.Tasks);

            DB.findAll(Tasks, {'firm': user.firm, 'desc': {$regex: text}, _id : {$nin: task_ids}}, {}, function(tasks) {

                query.Tasks   = text;
                results.Tasks = functions.arrToObj(tasks, '_id', results.Tasks);

                show_page(user, colls, lang, query, results, search);

            }, callback_error);

        }, callback_error);
    }

    var mongo_search_tasks = function (user, colls, Tasks, search, lang, query, results, task_ids) {

        query   = query   || {};
        results = results || {};

        DB.mongoSearch(db, 'Tasks', text, { 
            
                firm : user.firm, 
                _id : {$nin: task_ids}
            
            }, function(tasks) {

            query.Tasks   = tasks.query,
            results.Tasks = functions.arrToObj(tasks.results, '_id');

            console.log('mongo_search_tasks', tasks);

            if (tasks.results.length < MIN_RESULTS_LENGTH) find_tasks_search(user, colls, Tasks, search, lang, query, results, task_ids)
            else show_page(user, colls, lang, query, results, search);

        }, callback_error);
    }

    var find_comms_search = function (user, colls, Tasks, search, lang, query, results) {
        
        query    = query   || {};
        results  = results || {};

        DB.findAll('Comments', {'firm': user.firm, 'text': { $regex: text}}, {}, function(comms) {

            query.Comments   = text;
            results.Comments = functions.arrToArrObj(comms, 'task', results.Comments);
            var task_ids = functions.getObjIds(
                            functions.pureArr(
                                functions.getObj(results.Comments, 'task')));

            mongo_search_tasks(user, colls, Tasks, search, lang, query, results, task_ids);

        }, callback_error, db);
    }

    var mongo_search_comments = function (user, colls, Tasks, search, lang) {
        
        DB.mongoSearch(db, 'Comments', text, { firm : user.firm }, function(comms) {

            var query    = {Comments: comms.query},
                results  = {Comments: functions.arrToArrObj(comms.results, 'task')},
                task_ids = functions.getObjIds(
                            functions.pureArr(
                                functions.getObj(results.Comments, 'task')));

            if (comms.results.length < MIN_RESULTS_LENGTH) find_comms_search(user, colls, Tasks, search, lang, query, results)
            else mongo_search_tasks(user, colls, Tasks, lang, query, results, task_ids)

        }, callback_error);
    }

    var find_language_user = function (user, colls, Tasks, search, lang_code) {

        lang_code = lang_code || DEFAULT_LANG_CODE;
        
        DB.findOne('Languages', {'lang_code': lang_code}, {'_id': 0}, function(lang) {
        
            mongo_search_comments(user, colls, Tasks, search, lang)
        
        }, callback_error, db);
    }

    var find_settings_user = function (user, colls, Tasks) {
        
        DB.findOne('Settings', {'object_id': user_id}, {'_id': 0}, function(sett) {
          
            var lang_code = (sett && sett.lang && sett.lang.default) ? sett.lang.default : DEFAULT_LANG_CODE;
            
            find_language_user(user, colls, Tasks, sett.search, lang_code);

        }, callback_error, db);
    }

    var find_tasks_firm = function (user, colls, Tasks) {

        DB.findAll(Tasks, {'firm': user.firm}, {}, function(tasks) {
          
            colls.Tasks = functions.arrToObj(tasks, '_id');
            find_settings_user(user, colls, Tasks);
        
        }, callback_error);
    }

    var open_tasks = function (user, colls) {
        
        DB.openCollection(db, 'Tasks', function(Tasks) {
        
            find_tasks_firm(user, colls, Tasks);

        }, callback_error);
    }

    var find_projs_firm = function (user, colls) {

        DB.findAll('Projects', {'firm': {$in: [user.firm, 'all']}}, {}, function(projs) {
          
            colls.Projects = functions.arrToObj(projs, '_id');
            open_tasks(user, colls);
        
        }, callback_error, db);
    }

    var find_departs_firm = function (user, colls) {

        DB.findAll('Departments', {'firm': user.firm}, {}, function(departs) {
          
            colls.Departments = functions.arrToObj(departs, '_id');
            find_projs_firm(user, colls);
        
        }, callback_error, db);
    }

    var find_users_firm = function (Users, user) {
        
        DB.findAll(Users, {'firm': user.firm}, {_id: 1, name: 1, surname: 1, admin: 1, depart: 1}, function(users) {
          
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

function tasks(response, db, user_id) {
    console.log("Request handler 'tasks' was called.");

    var callback_error = function(number) {

        db.close();
        error_pages['p_' + number](response, number);
    }

    var show_page = function (user, colls, sett_firm, lang) {
        
        var filter = {
                fields: [
                    sett_firm.type, 
                    sett_firm.title,
                    sett_firm.from,
                    sett_firm.to
                ],
                tasks : colls.Tasks
            };
        console.log(filter.fields);

        var usr = {
                name : user.name + ' ' + user.surname,
                admin: user.admin ? 'true' : 'false',
                id   : user._id.toString()
            },
            obj = {
                title  : lang.task.many,
                header : lang.header,
                colls  : colls,
                lang   : lang.task.fields,
                f      : filter,
                user   : usr
            },
            html = jade.renderFile(__dirname + '/templates/proj.jade', obj);

        response.writeHead(200, {"Content-Type": "text/html"});
        response.write(html);
        response.end();
        db.close();
    }

    var find_language_user = function (user, colls, sett_firm, lang_code) {

        lang_code = lang_code || DEFAULT_LANG_CODE;
        
        DB.findOne('Languages', {'lang_code': lang_code}, {'_id': 0}, function(lang) {
        
            show_page(user, colls, sett_firm, lang);
        
        }, callback_error, db);
    }

    var find_settings = function (user, colls) {
        
        DB.findOne('Settings', {'object_id': user_id}, {'_id': 0}, function(sett) {
          
            var lang_code = (sett && sett.lang && sett.lang.default) ? sett.lang.default : DEFAULT_LANG_CODE;
            
            DB.findOne('Settings', {'object_id': user.firm}, {'_id': 0}, function(sett) {

                find_language_user(user, colls, sett.task.fields, lang_code);
            
            }, callback_error, db);

        }, callback_error, db);
    }

    var find_tasks_firm = function (user, colls) {
        
        DB.findAll('Tasks', {firm: user.firm}, {files: 0}, function(tasks) {
                
            colls.Tasks = functions.arrToObj(tasks, '_id');
            find_settings(user, colls);

        }, callback_error, db);
    }

    var find_projs_firm = function (user, colls) {

        DB.findAll('Projects', {'firm': {$in: [user.firm, 'all']}}, {}, function(projs) {
          
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
        
        DB.findAll(Users, {'firm': user.firm}, {_id: 1, name: 1, surname: 1, admin: 1, depart: 1}, function(users) {
          
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

exports.home    = home;
exports.filters = filter;
exports.proj    = proj;
exports.search  = search;
exports.tasks   = tasks;