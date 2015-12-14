var functions   = require('./../modules/functions'),
    nodemailer  = require('./../modules/nodemailer'),
    error_pages = require('./error_pages'),
    DB          = require('./../modules/db'),
    mongo       = require('mongodb'),
    BASEURL     = 'http://localhost:3000/';

function add_c(response, db, postData, ua, user_id) {
    console.log("Add comment");

    var callback_error = function(number) {
        console.log('callback_error');
        
        response.writeHead(number, {'Content-Type': 'text/plain'});
        response.write("error");
        response.end();
        db.close();
    }

    var send_ok = function(comm, dates) {
        console.log('send_ok');
        
        db.close();
        response.writeHead(200, {'Content-Type': 'text/plain; charset=UTF-8'});
        response.write(comm._id.toString() + '_' + functions.dateString(comm.date_add, dates));
        response.end();
    }

    var send_mail = function (user, comm, task, langs) {
        console.log('send_mail');
        
        var emails = [], subject, text, lang, link, user_lang;

        link = (task.beauty_name) ?
                BASEURL + 'task_' + task.beauty_name :
                BASEURL + 'task_' + task._id.toString();

        langs = langs || [];

        for (var i = 0; i < langs.length; i++) {

            lang   = langs[i].nodemailer.task;
            
            emails = functions.getEmails(langs[i].users);

            if (emails.indexOf(user.email) != -1) user_lang = langs[i];

            subject = lang.comm.subject;
            text    = lang.comm.in_task + ' ' + task.title + '. \n' + 
                      lang.comm.add + ': \n' +
                      user.name + ' ' + user.surname + ': \n' +
                      lang.see_link + ': ' + link;

            nodemailer.send_mess(emails, subject, text);
        }

        send_ok(comm, user_lang.dates);
    }

    var find_langs = function(user, comm, task, lang_codes) {
        console.log('find_langs');
        
        var lang_ids = [];

        for (var i in lang_codes) lang_ids.push(i);

        DB.findAll('Languages', {lang_code: {$in : lang_ids}}, {nodemailer: 1, lang_code: 1, dates: 1}, function(langs) {

            for (i = 0; i < langs.length; i++) {

                langs[i].users = lang_codes[ langs[i].lang_code ];
            }

            send_mail(user, comm, task, langs);

        }, callback_error, db);

    }

    var find_setts = function(user, users, comm, task) {
        console.log('find_setts');
        
        var obj_ids    = functions.getObj(users, '_id'), 
            lang_codes = {}, 
            lang_users = functions.arrToObj(users);

        DB.findAll('Settings', {object_id: {$in : obj_ids}}, {lang: 1, object_id: 1}, function(setts) {

            for (i = 0; i < setts.length; i++) {

                lang_codes[setts[i].lang.default] = lang_codes[setts[i].lang.default] || [];
                lang_codes[setts[i].lang.default].push( lang_users[ setts[i].object_id ] );

            }

            find_langs(user, comm, task, lang_codes);

        }, callback_error, db);

    }

    var find_users_send = function (user, comm, sett_task, task) {
        console.log('find_users_send');

        var mess     = sett_task.mess;
            send_ids = [];

        switch (mess.on) {

            case 'listeners':
                send_ids = task.listeners;
                break;

            case 'from':
                send_ids.push(task.from);
                break;

            case 'to':
                send_ids.push(task.to);
                break;
        }

        DB.findAll('Users', {_id: {$in: functions.getObjIds(send_ids)}}, {_id: 1, email: 1}, function(users){

            DB.findAll('Users', {depart: {$in : send_ids}}, {email: 1, _id: 1}, function(departs) {
                
                departs = departs || [];

                users = functions.pureIds(users.concat(departs));

                if (mess.admin && (mess.admin == true || mess.admin == 'true')) {

                    DB.findAll('Users', 
                        {admin: {$in: [true, 'true']}, firm: task.firm}, 
                        {_id: 1, email: 1}, 
                        function(admins){

                            find_setts(user, functions.pureIds(users.concat(admins).concat([user])), comm, task);

                        }, callback_error, db);
                } else {

                    find_setts(user, functions.pureIds(users.concat([user])), comm, task);
                }

            }, callback_error, db);

        }, callback_error, db);
    }

    var create_comment = function (user, data, sett_task, task) {
        console.log('create_comment');

        DB.createElem('Comments', data, function(comm){

            find_users_send(user, comm, sett_task, task);

        }, callback_error, db);
    }

    var find_task = function (user, data, sett_task) {
        console.log('find_task');

        DB.findOne('Tasks', {_id: mongo.ObjectID(data.task)}, {}, function(task) {

            switch (sett_task.add) {

                case 'all_users' :
                    create_comment(user, data, sett_task, task);
                    break;

                case 'listeners' :
                    if (task.listeners.indexOf(user_id) != -1) create_comment(user, data, sett_task, task);
                    break;

                case 'from' :
                    if (task.from == user_id) create_comment(user, data, sett_task, task)
                    else callback_error(403)
                    break;

                case 'to' : 
                    if (task.to == user_id) create_comment(user, data, sett_task, task);
                    else callback_error(403)
                    break;

                case 'from_to' :
                    if (task.to == user_id || task.from == user_id) create_comment(user, data, sett_task, task)
                    else callback_error(403)
                    break;

                case 'admin' :
                    if (user.admin && (user.admin == true || user.admin == 'true')) create_comment(user, data, sett_task, task)
                    else callback_error(403)
                    break;

                default :
                    create_comment(user, data, sett_task, task);
                    break;
            }
        
        }, callback_error, db);
    }

    var find_settings_firm = function (user, data) {
        console.log('find_settings_firm');

        DB.findOne('Settings', {object_id: user.firm}, {task: 1}, function(sett){

            var sett_task = sett.task.comm;

            find_task(user, data, sett_task);

        }, callback_error, db);
    }
    
    var getData = function (user) {
        console.log('getData');
        
        var data = functions.parsePost(postData),
            date  = Date.now();

        data.date_add = date;
        data.firm = user.firm;
        data.from = user_id;

        find_settings_firm(user, data);
    }
    
    DB.findOne('Users', {'_id': mongo.ObjectID(user_id)}, {}, getData, callback_error, db);
}

function add_p(response, db, postData, ua, user_id) {
    console.log("Add project");

    var callback_error = function(number) {
        
        db.close();
        error_pages['p_' + number](response);
    }

    var send_ok = function(proj_id) {
        
        db.close();
        response.writeHead(200, {'Content-Type': 'text/plain'});
        response.write(proj_id);
        response.end();
    }

    var create_sett_proj = function(sett_proj, proj) {

        var sett = {
                object_id: proj._id.toString(),
                type     : 'proj',
                add_task : sett_proj.add_task,
                show     : sett_proj.show,
                fields   : sett_proj.fields
            };

        DB.createElem('Settings', sett, function(){

            var id = proj.unique_title || proj._id.toString();

            DB.createElem('Autoincrement', {proj_id: proj._id.toString(), firm: proj.firm, id: 1}, function(){

                send_ok(id);
            
            }, callback_error, db);
        
        }, callback_error, db);
    }

    var getData = function(user, sett_proj) {
        var data = functions.parsePost(postData),
            date = Date.now();

        data.date_open = date;
        data.firm = user.firm;
        data.add_task = 'all_users';

        if (data.unique_title) {

            DB.findOne('Projects', {unique_title: data.unique_title}, {}, function(proj) {

                if (proj && proj._id) callback_error(401)
                else DB.createElem("Projects", data, function(proj){

                    create_sett_proj(sett_proj, proj);

                }, callback_error, db);

            }, error_pages, db)
        
        } else DB.createElem("Projects", data, send_ok, callback_error, db);
    }

    var find_settings_firm = function (user) {

        DB.findOne( 'Settings', 
            { 
                'object_id': user.firm
            }, 
            { 
                'proj': 1
            },
            function(sett_firm) {

                var add = sett_firm.proj.add;

                switch (add) {

                    case 'all_users': 
                        getData(user, sett_firm.proj)
                        break;

                    case 'list_of_users':
                        if (add.list.indexOf(user_id) != -1) getData(user, sett_firm.proj)
                        else callback_error(403)
                        break;

                    case 'only_admin':
                        if (user.admin && (user.admin == true || user.admin == 'true')) getData(user, sett_firm.proj)
                        else callback_error(403)
                        break;

                    default:
                        callback_error(403)

                }
          
            }, 
            callback_error, db
        );

    }
    
    DB.findOne('Users', {'_id': mongo.ObjectID(user_id)}, {}, find_settings_firm, callback_error, db);
}

function add_t(response, db, postData, ua, user_id) {
    console.log("Add task");

    var callback_error = function(number) {

        console.log('callback_error', number);
        db.close();
        error_pages['p_' + number](response);
    }

    var send_ok = function(task, user) {
        
        db.close();

        response.writeHead(200, {'Content-Type': 'text/plain'});
        response.write(task.beauty_name || task._id.toString());
        response.end();
    }

    var send_mail = function(task, user, langs) {

        var emails = [], subject, text, lang, link;

        link = (task.beauty_name) ?
                BASEURL + 'task_' + task.beauty_name :
                BASEURL + 'task_' + task._id.toString();

        langs = langs || [];

        for (var i = 0; i < langs.length; i++) {

            lang   = langs[i].nodemailer.task;
            
            emails = functions.getEmails(langs[i].users);

            subject = lang.new.subject;
            text    = lang.new.text.new_task + '. \n' + 
                      lang.new.text.title + ': ' + task.title + '\n' + 
                      lang.new.text.desc  + ': ' + task.desc + '\n' +
                      lang.new.text.from + ': ' + user.name + ' ' + user.surname +
                      " ( " + user.email + ' )\n' +
                      lang.see_link + ': ' + link;

            nodemailer.send_mess(emails, subject, text);
        }

        send_ok(task, user);
    }

    var filesId = [];
    var insert_file = function (data, user, langs, i, Files) {
        
        data.files[i].firm = user.firm;
        data.files[i].data = data.files[i].data.replace(' ', '+');

        DB.createElem(Files, data.files[i], function(file) {

            filesId.push(file._id.toString());

            if (i == data.count - 1) {

                delete(data.count);
                data.files = filesId;

                DB.createElem("Tasks", data, function(task){ send_mail(task, user, langs) }, callback_error, db);

            } else insert_file(data, user, langs, i + 1, Files);

        }, callback_error);
    }

    var open_files = function (data, user, langs) {

        DB.openCollection(db, 'Files', function(Files) {

            insert_file(data, user, langs, 0, Files);

        }, callback_error);
    }

    var check_files = function(data, user, langs) {
        
        if (parseInt(data.count)) open_files(data, user, langs)
        else DB.createElem("Tasks", data, function(task){ send_mail(task, user, langs) }, callback_error, db);
    }

    var find_langs = function(data, user, lang_codes) {
        
        var lang_ids = [];

        for (var i in lang_codes) lang_ids.push(i);

        DB.findAll('Languages', {lang_code: {$in : lang_ids}}, {nodemailer: 1, lang_code: 1}, function(langs) {

            for (i = 0; i < langs.length; i++) {

                langs[i].users = lang_codes[ langs[i].lang_code ];

            }

            check_files(data, user, langs);

        }, callback_error, db);

    }

    var find_setts = function(data, user, users) {
        
        var obj_ids = [], lang_codes = {}, lang_users = {};

        for (var i = 0; i < users.length; i++) {

            obj_ids.push(users[i]._id.toString());
            lang_users[users[i]._id.toString()] = users[i];
        }

        DB.findAll('Settings', {object_id: {$in : obj_ids}}, {lang: 1, object_id: 1}, function(setts) {

            for (i = 0; i < setts.length; i++) {

                lang_codes[setts[i].lang.default] = lang_codes[setts[i].lang.default] || [];
                lang_codes[setts[i].lang.default].push( lang_users[ setts[i].object_id ] );

            }

            find_langs(data, user, lang_codes);

        }, callback_error, db);

    }

    var find_mess = function(data, user) {
        
        var obj_ids = [], obj_mess = {};

        for (var i = 0; i < data.listeners.length; i++) {

            if (data.listeners[i] != user_id)
                obj_ids.push(mongo.ObjectID(data.listeners[i]))
        }

        DB.findAll('Users', {_id: {$in : obj_ids}}, {email: 1, _id: 1}, function(users) {

            if (users.length == obj_ids.length) find_setts(data, user, users)
            else DB.findAll('Users', {depart: {$in : data.listeners}}, {email: 1, _id: 1}, function(departs) {

                for (i = 0; i < users.length; i++) ids.push(users[i]._id.toString())
                
                for (i = 0; i < departs.length; i++) ids.push(departs[i]._id.toString())

                for (i = 0; i < ids.length; i++) obj_mess[ids[i]._id.toString()] = ids[i];

                find_setts(data, user, obj_mess);

            }, callback_error, db);

        }, callback_error, db);

    }

    var get_beauty_name = function(data, user) {
        
        if (data.proj) {

            DB.findOne('Projects', {_id: mongo.ObjectID(data.proj)}, {unique_title: 1}, function(proj) {

                if (proj.unique_title) {

                    DB.getIncrementKey(db, data.proj, function(id) {
                        
                        data.beauty_name = proj.unique_title + '_' + id;
                        if (data.listeners.length > 1) find_mess(data, user)
                        else check_files(data, user);

                    }, callback_error);

                } else {

                    if (data.listeners.length > 1) find_mess(data, user)
                    else check_files(data, user);
                }

            }, callback_error, db);

        } else {

            if (data.listeners.length > 1) find_mess(data, user)
            else check_files(data, user);
        }

    }

    var getData = function(user) {
        
        var parse = functions.parsePost(postData),
            date  = Date.now(),
            data  = JSON.parse(parse['data']);

        data.date_open = date;
        data.firm = user.firm;
        data.from = user_id;
        data.listeners = functions.pureArr([data.to, user_id]);

        if (data.proj == 'withoutproj') data.proj = '';

        get_beauty_name(data, user);
    }
    
    DB.findOne('Users', {'_id': mongo.ObjectID(user_id)}, {}, getData, callback_error, db);
}

function attach(response, db, postData, ua, user_id) {
    console.log("Attach");

    var callback_error = function(number) {

        console.log('callback_error', number);
        db.close();
        error_pages['p_' + number](response);
    }

    var send_ok = function() {
        console.log('send_ok')
        
        db.close();

        filesId = filesId || " ";

        response.writeHead(200, {'Content-Type': 'text/plain'});
        response.write(filesId.substr(1));
        response.end();
    }

    var send_mail = function(task, user, langs) {
        console.log('send_mail', task)

        var emails = [], subject, text, lang, link;

        link = (task.beauty_name) ?
                BASEURL + 'task_' + task.beauty_name :
                BASEURL + 'task_' + task._id.toString();

        langs = langs || [];

        for (var i = 0; i < langs.length; i++) {

            lang   = langs[i].nodemailer.task;
            
            emails = functions.getEmails(langs[i].users);

            subject = lang.file.subject;
            text    = lang.file.new + '. \n' + 
                      lang.file.from + ': ' + user.name + ' ' + user.surname +
                      " ( " + user.email + ' )\n' +
                      lang.see_link + ': ' + link;

            nodemailer.send_mess(emails, subject, text);
        }

        send_ok(task, user);
    }

    var filesId = '';
    var insert_file = function (data, user, langs, task, i, Files) {
        console.log('insert_file', i)
        
        data.files[i].firm = user.firm;
        data.files[i].data = data.files[i].data.replace(' ', '+');

        DB.createElem(Files, data.files[i], function(file) {

            filesId += file._id.toString();

            DB.updateElem("Tasks", {_id: mongo.ObjectID(data.task)}, {}, function(){ 

                if (i == data.count - 1) send_mail(task, user, langs) 
                else insert_file(data, user, langs, task, i + 1, Files);

            }, callback_error, db, {}, {files: file._id.toString()});

        }, callback_error);
    }

    var open_files = function (data, user, langs, task) {
        console.log('open_files')

        DB.openCollection(db, 'Files', function(Files) {

            insert_file(data, user, langs, task, 0, Files);

        }, callback_error);
    }

    var check_files = function(data, user, langs, task) {
        console.log('check_files')
        
        if (parseInt(data.count)) open_files(data, user, langs, task)
        else send_ok();
    }

    var find_langs = function(data, user, lang_codes, task) {
        console.log('find_langs')
        
        var lang_ids = [];

        for (var i in lang_codes) lang_ids.push(i);

        DB.findAll('Languages', {lang_code: {$in : lang_ids}}, {nodemailer: 1, lang_code: 1}, function(langs) {

            for (i = 0; i < langs.length; i++) {

                langs[i].users = lang_codes[ langs[i].lang_code ];

            }

            check_files(data, user, langs, task);

        }, callback_error, db);

    }

    var find_setts = function(data, user, users, task) {
        console.log('find_setts')
        
        var obj_ids = [], lang_codes = {}, lang_users = {};

        for (var i = 0; i < users.length; i++) {

            obj_ids.push(users[i]._id.toString());
            lang_users[users[i]._id.toString()] = users[i];
        }

        DB.findAll('Settings', {object_id: {$in : obj_ids}}, {lang: 1, object_id: 1}, function(setts) {

            for (i = 0; i < setts.length; i++) {

                lang_codes[setts[i].lang.default] = lang_codes[setts[i].lang.default] || [];
                lang_codes[setts[i].lang.default].push( lang_users[ setts[i].object_id ] );

            }

            find_langs(data, user, lang_codes, task);

        }, callback_error, db);

    }

    var find_mess = function(data, user, task) {
        console.log('find_mess')
        
        var send_ids = [];

        DB.findOne('Settings', {object_id: task.firm}, {task: 1}, function(sett){

            var mess = sett.task.fields.attach.mess || {};

            console.log('sett_firm', mess);

            switch (mess.on) {

                case 'all_users':
                    send_ids = task.listeners;
                    break;

                case 'listeners':
                    send_ids = task.listeners;
                    break;

                case 'from':
                    send_ids.push(task.from);
                    break;

                case 'to':
                    send_ids.push(task.to);
                    break;
            }

            DB.findAll('Users', {_id: {$in: functions.getObjIds(send_ids)}}, {_id: 1, email: 1}, function(users){
                console.log('user_list', functions.getObjIds(send_ids), users.length);

                DB.findAll('Users', {depart: {$in : send_ids}}, {email: 1, _id: 1}, function(departs) {
                    console.log('user_depart', departs);

                    departs = departs || [];

                    users = functions.pureIds(users.concat(departs));

                    if (mess.admin && (mess.admin == true || mess.admin == 'true')) {

                        DB.findAll('Users', 
                            {admin: {$in: [true, 'true']}, firm: task.firm}, 
                            {_id: 1, email: 1}, 
                            function(admins){
                                console.log('user_admins', admins)

                                find_setts(data, user, functions.pureIds(users.concat(admins)), task);

                            }, callback_error, db);
                    } else {

                        find_setts(data, user, users, task);
                    }
                }, callback_error, db);

            }, callback_error, db);

        }, callback_error, db);
    }

    var find_task = function (data, user) {
        console.log('find_task')

        DB.findOne('Tasks', {_id: mongo.ObjectID(data.task)}, {files: 0}, function(task){

            find_mess(data, user, task)
        
        }, callback_error, db);
    }

    var getData = function(user) {
        console.log('getData')
        
        var parse = functions.parsePost(postData),
            date  = Date.now(),
            data  = JSON.parse(parse['data']);

        find_task(data, user);
    }
    
    DB.findOne('Users', {'_id': mongo.ObjectID(user_id)}, {}, getData, callback_error, db);
}

function reg_firm(response, db, postData, ua) {
    console.log("Registration firm");

    var data = functions.parsePost(postData);
    
    var callback_error = function(number) {

        db.close();
        error_pages['p_' + number](response);
    }

    var send_ok = function(user_id, connect_id) {

        db.close();
        response.writeHead(200, {'Content-Type': 'text/plain', 'Set-Cookie': 'tracker=' + connect_id});
        response.write("success: " + user_id);
        response.end();
    }

    var create_conns = function (user) {

        var user_id  = user._id.toString(),
            conn_obj = {
                user_id  : user_id, 
                userAgent: ua
            };

        DB.createElem("Connections", conn_obj, function(connect){

            send_ok(user_id, connect._id.toString());
        
        }, callback_error, db)
    }

    var send_mail = function(user, lang) {

        var email   = user.email,
            subject = lang.subject, 
            text    = lang.reg_firm + ' ' + data['firm'] +
                    ' ' + lang.in_sys + '\n' +
                    lang.login + ': ' + email + '\n' +
                    lang.pass  + ': ' + data['password'] + '\n\n\n' + BASEURL;

        nodemailer.send_mess(email, subject, text);
        
        create_conns(user);
    }

    var find_language_user = function(user, lang_code) {

        lang_code = lang_code || 'ru';

        DB.findOne('Languages', {lang_code: lang_code}, {nodemailer: 1}, function(lang){ 
            
            send_mail(user, lang.nodemailer.registr.firm);

        }, callback_error, db);
    }

    var create_sett_user = function(Settings, user, sett) {

        var id        = user._id.toString(),
            user_sett = {
                filters  : [],
                lang     : sett.lang,
                object_id: id,
                search   : sett.search,
                type     : 'user'
            };

        for (var i = 0; i < sett.filters.length; i++) {

            user_sett.filters.push({id: sett.filters[i], values: [id]});
        }
        
        DB.createElem(Settings, user_sett, function() {
            
            find_language_user(user, user_sett.lang.default);
        
        }, callback_error);
    } 

    var find_sett_default = function (Settings, user) {

        DB.findOne(Settings, {type: 'default'}, {_id: 0, type: 0}, function(sett) {

            sett.type = 'firm';
            sett.object_id = user.firm;

            DB.createElem(Settings, sett, function(){ create_sett_user(Settings, user, sett) }, callback_error)

        }, callback_error);
    } 

    var open_setts = function (user) {

        DB.openCollection(db, "Settings", function(Settings){

            find_sett_default(Settings, user);
        }, callback_error);
    }

    var create_user = function (firm) {

        var firm_id   = firm._id.toString(),
            user_data = {
                email   : data['email'],
                password: data['password'],
                name    : data['name'],
                surname : data['surname'],
                admin   : 'true',
                firm    : firm_id
            };
        
        DB.createElem('Users', user_data, open_setts, callback_error, db);
    }
    
    DB.findOne('Users', {'email': data.email}, {}, function(user) {

        var firm_data = {
                firm : data['firm'], 
                email: data['email']
            };

        if (user) callback_error(401)
        else DB.createElem('Firms', firm_data, create_user, callback_error, db);

    }, callback_error, db);
}

function reg_user(response, db, postData, ua, user_id) {
    console.log("Registration user");

    var data = functions.parsePost(postData);
    
    var callback_error = function(number) {

        db.close();
        error_pages['p_' + number](response);
    }

    var send_ok = function (id) {

        response.writeHead(200, {'Content-Type': 'text/plain'});
        response.write("success: " + id);
        response.end();
        db.close();
    }

    var send_mail = function(user, lang) {
        
        var email   = user.email,
            subject = lang.subject, 
            text    = lang.you_reg + '\n' + 
                    lang.login + ': ' + email + '\n' +
                    lang.pass  + ': ' + user.password + '\n\n\n' + BASEURL;

        nodemailer.send_mess(email, subject, text);
        
        send_ok(user._id.toString());
    }

    var find_language_user = function(user, lang_code) {

        lang_code = lang_code || 'ru';


        DB.findOne('Languages', {lang_code: lang_code}, {nodemailer: 1}, function(lang){

            send_mail(user, lang.nodemailer.registr.user);

        }, callback_error, db)

    }

    var find_sett_firm = function(user, Settings) {

        DB.findOne(Settings, {object_id: user.firm}, {filters: 1, lang: 1, search: 1}, function(sett){
            console.log('create_sett_user');

            var id        = user._id.toString()
                sett_user = {
                    filters  : [],
                    lang     : sett.lang,
                    search   : sett.search,
                    object_id: id,
                    type     : 'user'
                };

            for (var i = 0; i < sett.filters.length; i++) {

                sett_user.filters.push({id: sett.filters[i], values: [id]});
            }

            DB.createElem(Settings, sett_user, function(){
                console.log('aaa');

                find_language_user(user, sett.lang.default)

            }, callback_error);

        }, callback_error);
    }

    var open_setts = function(user) {

        DB.openCollection(db, 'Settings', function(Settings){

            find_sett_firm(user, Settings);

        }, callback_error);
    }

    var create_user = function(Users, admin) {

        var user_data = {
                name    : data.name,
                surname : data.surname,
                email   : data.email,
                password: functions.getPass(),
                firm    : admin.firm,
                admin   : data.admin
            }

        if (data.depart) user_data.depart = data.depart;

        DB.createElem(Users, user_data, open_setts, callback_error);
    } 

    var find_unique = function(Users) {

        DB.findOne(Users, {'email': data.email}, {_id: 1}, function(user) {

            if (user) callback_error(401)
            else DB.findOne(Users, {'_id': mongo.ObjectID(user_id)}, {admin: 1, firm: 1}, function(admin){

                if (admin && admin.admin && (admin.admin == 'true' || admin.admin == true)) { 
                    
                    create_user(Users, admin);

                } else callback_error(403)

            }, callback_error);

        }, callback_error);
    }

    DB.openCollection(db, 'Users', find_unique, callback_error)
}

exports.add_c    = add_c;
exports.add_p    = add_p;
exports.add_t    = add_t;
exports.attach   = attach;
exports.reg_firm = reg_firm;
exports.reg_user = reg_user;