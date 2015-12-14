var functions   = require('./../modules/functions'),
    nodemailer  = require('./../modules/nodemailer'),
    error_pages = require('./error_pages'),
    DB          = require('./../modules/db'),
    mongo       = require('mongodb');

var DEFAULT_LANG_CODE  = 'ru',
    BASEURL            = 'http://localhost:3000/';

function change_default(response, db, postData, ua, user_id) {
    console.log('Change default');

    var data = functions.parsePost(postData);

    var callback_error = function(number) {
        
        response.writeHead(number, {'Content-Type': 'text/plain'});
        response.write(number);
        response.end();
        db.close();
    }

    var show_page = function() {
        console.log('send_ok')
        
        db.close();
        response.writeHead(200, {'Content-Type': 'text/plain'});
        response.write("success");
        response.end();
    }

    var find_setts = function (user) {

        DB.findOne('Settings', {object_id: user.firm}, {task: 1}, function(sett){

            var fields = sett.task.fields;

            if (fields[data.field]) {

                if (data.default_type) {

                    fields[data.field].default_type = data.default_type;

                }

                fields[data.field].default = data.value;
                sett.task.fields           = fields;

                DB.updateElem('Settings', {object_id: user.firm}, {task: sett.task}, show_page, callback_error, db)
            
            } else callback_error(403);

        }, callback_error, db);
    }

    DB.findOne('Users', {'_id': mongo.ObjectID(user_id)}, {}, find_setts, callback_error, db);
}

function change_fields(response, db, postData, ua, user_id) {
    console.log("Change fields");

    var data = functions.parsePost(postData);

    var callback_error = function(number) {
        
        response.writeHead(number, {'Content-Type': 'text/plain'});
        response.write(number);
        response.end();
        db.close();
    }

    var show_page = function() {
        console.log('send_ok')
        
        db.close();
        response.writeHead(200, {'Content-Type': 'text/plain'});
        response.write("success");
        response.end();
    }

    var find_setts = function (user) {

        DB.findOne('Settings', {object_id: user.firm}, {task: 1}, function(sett){

            var fields = sett.task.fields;

            if (fields[data.field] && fields[data.field].click.toString() == 'true') {

                fields[data.field].on = data.value;
                sett.task.fields   = fields;

                DB.updateElem('Settings', {object_id: user.firm}, {task: sett.task}, show_page, callback_error, db)
            
            } else callback_error(403);

        }, callback_error, db);
    }

    DB.findOne('Users', {'_id': mongo.ObjectID(user_id)}, {}, find_setts, callback_error, db);
}

function change_mess(response, db, postData, ua, user_id) {
    console.log("Change mess firm");

    var data = functions.parsePost(postData);
    console.log(data);

    var callback_error = function(number) {
        
        response.writeHead(number, {'Content-Type': 'text/plain'});
        response.write(number);
        response.end();
        db.close();
    }

    var show_page = function() {
        console.log('send_ok')
        
        db.close();
        response.writeHead(200, {'Content-Type': 'text/plain'});
        response.write("success");
        response.end();
    }

    var find_setts = function (user) {

        DB.findOne('Settings', {object_id: user.firm}, {task: 1}, function(sett){

            var fields = sett.task.fields;

            if (fields[data.field] && fields[data.field].edit && fields[data.field].edit != 'none') {

                fields[data.field].mess.on = data.value;
                sett.task.fields           = fields;

                DB.updateElem('Settings', {object_id: user.firm}, {task: sett.task}, show_page, callback_error, db)
            
            } else callback_error(403);

        }, callback_error, db);
    }

    DB.findOne('Users', {'_id': mongo.ObjectID(user_id)}, {}, find_setts, callback_error, db);
}

function change_pass(response, db, postData, ua, user_id) {
    console.log("Change password");

    var data = functions.parsePost(postData);

    var callback_error = function(number) {
        
        response.writeHead(number, {'Content-Type': 'text/plain'});
        response.write(number);
        response.end();
        db.close();
    }

    var send_ok = function() {
        console.log('send_ok')
        
        db.close();
        response.writeHead(200, {'Content-Type': 'text/plain'});
        response.write("success");
        response.end();
    }

    var send_mail = function (user, lang) {
        console.log('send_mail')
        
        var emails = [], subject, text, lang, link;

        link = BASEURL + 'settings';

        email   = user.email;
        subject = lang.nodemailer.sett.pass.subject;
        text    = lang.nodemailer.sett.pass.edit + '. \n' + 
                  lang.nodemailer.sett.pass.new + ': ' + data.new_pass + '\n' +
                  lang.nodemailer.sett.pass.edit_link + ': ' + link;

        nodemailer.send_mess(email, subject, text);

        send_ok();
    }

    var find_lang = function(user, lang_code) {
        
        lang_code = lang_code || DEFAULT_LANG_CODE;

        DB.findOne('Languages', {lang_code: lang_code}, {nodemailer: 1}, function(lang) {

            send_mail(user, lang);

        }, callback_error, db);

    }

    var find_setts = function (user) {

        DB.findOne('Settings', {object_id: user_id}, {lang: 1}, function(sett){

            find_lang(user, sett.lang.default);

        }, callback_error, db);
    }

    var update_pass = function (user) {

        if (data.old_pass == user.password) {

            DB.updateElem('Users', {_id: user._id}, {password: data.new_pass}, function(){

                find_setts(user)
            
            }, callback_error, db);
        
        } else {

            callback_error('401');
        }
    }

    DB.findOne('Users', {'_id': mongo.ObjectID(user_id)}, {_id: 1, password: 1, email: 1}, update_pass, callback_error, db);
}

function change_rights(response, db, postData, ua, user_id) {
    console.log("Change rights");

    var data = functions.parsePost(postData);
    console.log(data);

    var callback_error = function(number) {
        
        response.writeHead(number, {'Content-Type': 'text/plain'});
        response.write(number);
        response.end();
        db.close();
    }

    var show_page = function() {
        console.log('send_ok')
        
        db.close();
        response.writeHead(200, {'Content-Type': 'text/plain'});
        response.write("success");
        response.end();
    }

    var find_setts = function (user) {

        DB.findOne('Settings', {object_id: user.firm}, {task: 1}, function(sett){

            var fields = sett.task.fields;

            if (fields[data.field] && fields[data.field].edit && fields[data.field].edit != 'none') {

                fields[data.field].edit = data.value;
                sett.task.fields        = fields;

                DB.updateElem('Settings', {object_id: user.firm}, {task: sett.task}, show_page, callback_error, db)
            
            } else callback_error(403);

        }, callback_error, db);
    }

    DB.findOne('Users', {'_id': mongo.ObjectID(user_id)}, {}, find_setts, callback_error, db);
}

function change_user_lang(response, db, postData, ua, user_id) {
    console.log("Change password");

    var data = functions.parsePost(postData);

    var callback_error = function(number) {
        
        response.writeHead(number, {'Content-Type': 'text/plain'});
        response.write(number);
        response.end();
        db.close();
    }

    var show_page = function() {
        console.log('send_ok')
        
        db.close();
        response.writeHead(200, {'Content-Type': 'text/plain'});
        response.write("success");
        response.end();
    }

    var update_setts = function (user) {

        DB.updateElem('Settings', {object_id: user_id}, {lang: {default: data.lang_code}}, show_page, callback_error, db);
    }

    DB.findOne('Users', {'_id': mongo.ObjectID(user_id)}, {}, update_setts, callback_error, db);
}

function ch_user_search(response, db, postData, ua, user_id) {
    console.log("Change user search");

    var parse= functions.parsePost(postData);
    console.log(parse)
        data = JSON.parse(parse.data);

    var callback_error = function(number) {
        
        response.writeHead(number, {'Content-Type': 'text/plain'});
        response.write(number);
        response.end();
        db.close();
    }

    var show_page = function() {
        console.log('send_ok')
        
        db.close();
        response.writeHead(200, {'Content-Type': 'text/plain'});
        response.write("success");
        response.end();
    }

    var update_setts = function (user) {

        DB.updateElem('Settings', {object_id: user_id}, {search: data}, show_page, callback_error, db);
    }

    DB.findOne('Users', {'_id': mongo.ObjectID(user_id)}, {}, update_setts, callback_error, db);
}

function ch_user_mess(response, db, postData, ua, user_id) {
    console.log("Change user mess");

    var parse= functions.parsePost(postData);
    console.log(parse)
        data = JSON.parse(parse.data);

    var callback_error = function(number) {
        
        response.writeHead(number, {'Content-Type': 'text/plain'});
        response.write(number);
        response.end();
        db.close();
    }

    var show_page = function() {
        console.log('send_ok')
        
        db.close();
        response.writeHead(200, {'Content-Type': 'text/plain'});
        response.write("success");
        response.end();
    }

    var update_setts = function (user) {

        DB.updateElem('Settings', {object_id: user_id}, {task: {fields: data}}, show_page, callback_error, db);
    }

    DB.findOne('Users', {'_id': mongo.ObjectID(user_id)}, {}, update_setts, callback_error, db);
}

function task_edit(response, db, postData, ua, user_id) {
    console.log("Change task_edit");

    var data = functions.parsePost(postData);

    var callback_error = function(number) {
        
        response.writeHead(number, {'Content-Type': 'text/plain'});
        response.write("error");
        response.end();
        db.close();
    }

    var send_ok = function() {
        console.log('send_ok')
        
        db.close();
        response.writeHead(200, {'Content-Type': 'text/plain'});
        response.write("success");
        response.end();
    }

    var send_mail = function (task, langs) {
        console.log('send_mail')
        
        var emails = [], subject, text, lang, link;

        link = (task.beauty_name) ?
                BASEURL + 'task_' + task.beauty_name :
                BASEURL + 'task_' + task._id.toString();

        langs = langs || [];

        for (var i = 0; i < langs.length; i++) {

            lang   = langs[i];
            
            emails = functions.getEmails(lang.users);

            subject = lang.nodemailer.task.edit.subject;
            text    = lang.nodemailer.task.edit.edit_task + ' ' + task.title + '. \n' + 
                      lang.nodemailer.task.edit.field + ': \n' +
                      lang.task.fields[data.field].title + ': ' + data.value + '\n' +
                      lang.nodemailer.task.see_link + ': ' + link;

            nodemailer.send_mess(emails, subject, text);
        }

        send_ok();
    }

    var find_langs = function(task, lang_codes) {
        console.log('find_langs')
        
        var lang_ids = [];

        for (var i in lang_codes) lang_ids.push(i);

        DB.findAll('Languages', {lang_code: {$in : lang_ids}}, {nodemailer: 1, lang_code: 1, task: 1}, function(langs) {

            for (i = 0; i < langs.length; i++) {

                langs[i].users = lang_codes[ langs[i].lang_code ];

            }

            console.log(langs)

            send_mail(task, langs);

        }, callback_error, db);

    }

    var find_setts = function(users, task) {
        console.log('find_setts')
        
        var obj_ids    = functions.getObj(users, '_id'), 
            lang_codes = {}, 
            lang_users = functions.arrToObj(users);

        DB.findAll('Settings', {object_id: {$in : obj_ids}}, {lang: 1, object_id: 1}, function(setts) {

            for (i = 0; i < setts.length; i++) {

                lang_codes[setts[i].lang.default] = lang_codes[setts[i].lang.default] || [];
                lang_codes[setts[i].lang.default].push( lang_users[ setts[i].object_id ] );

            }

            find_langs(task, lang_codes);

        }, callback_error, db);

    }

    var find_users_send = function (mess, task) {
        
        var send_ids = [];

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
            console.log('find_users_send', users)
            DB.findAll('Users', {depart: {$in : send_ids}}, {email: 1, _id: 1}, function(departs) {
                
                departs = departs || [];

                console.log('find_departs_send', departs)
                
                users = functions.pureIds(users.concat(departs));

                if (mess.admin && (mess.admin == true || mess.admin == 'true')) {

                    DB.findAll('Users', 
                        {admin: {$in: [true, 'true']}, firm: task.firm}, 
                        {_id: 1, email: 1}, 
                        function(admins){

                            find_setts(functions.pureIds(users.concat(admins)), task);

                        }, callback_error, db);
                } else {

                    find_setts(users, task);
                }
            }, callback_error, db);

        }, callback_error, db);
    }

    var update_task = function (mess, task, Tasks) {

        var obj = {},
            now = Date.now(),
            unset;

        obj[data.field] = data.value;
        obj.date_change = now;

        if (data.field == 'status') {

            if (data.value == 'close') obj.date_close = now
            else unset = {date_close: 1}
        }

        DB.updateElem(Tasks, {_id: task._id}, obj, function(){

            find_users_send(mess, task);
        
        }, callback_error, db, unset);
    }

    var find_task = function (user, sett_task, Tasks) {

        DB.findOne(Tasks, {_id: mongo.ObjectID(data.id)}, {}, function(task) {

            if (task.status == 'close' && data.field != 'status') callback_error(402)
            else {

                switch (sett_task.edit) {

                    case 'all_users' :
                        update_task(sett_task.mess, task, Tasks);
                        break;

                    case 'from' :
                        if (task.from == user_id) update_task(sett_task.mess, task, Tasks)
                        else callback_error(403)
                        break;

                    case 'to' : 
                        if (task.to == user_id) update_task(sett_task.mess, task, Tasks)
                        else callback_error(403)
                        break;

                    case 'from_to' :
                        if (task.to == user_id || task.from == user_id) update_task(sett_task.mess, task, Tasks)
                        else callback_error(403)
                        break;

                    case 'admin' :
                        if (user.admin && (user.admin == true || user.admin == 'true')) update_task(sett_task.mess, task, Tasks)
                        else callback_error(403)
                        break;
                }
            }
        
        }, callback_error);
    }

    var open_tasks = function (user, sett_task) {

        DB.openCollection(db, 'Tasks', function(Tasks){

            find_task(user, sett_task, Tasks);
        
        }, callback_error);
    }

    var find_settings_firm = function (user) {

        DB.findOne('Settings', {object_id: user.firm}, {task: 1}, function(sett){

            var sett_task = sett.task.fields[data.field];

            console.log(data.field, data);

            if (sett_task.edit == 'none') callback_error(403)
            else open_tasks(user, sett_task)

        }, callback_error, db);
    }

    DB.findOne('Users', {'_id': mongo.ObjectID(user_id)}, {_id: 1, admin: 1}, find_settings_firm, callback_error, db);
}

exports.change_default   = change_default;
exports.change_fields    = change_fields;
exports.change_mess      = change_mess;
exports.change_pass      = change_pass;
exports.change_rights    = change_rights;
exports.change_user_lang = change_user_lang;
exports.ch_user_search   = ch_user_search;
exports.ch_user_mess     = ch_user_mess;
exports.task_edit        = task_edit;