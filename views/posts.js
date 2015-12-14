var functions   = require('./../modules/functions'),
    nodemailer  = require('./../modules/nodemailer'),
    error_pages = require('./error_pages'),
    mongo       = require('mongodb'),
    fs          = require('fs'),
    DB          = require('./../modules/db');

var DAY = 24*60*60*1000;

function add_c(response, db, postData, ua, user_id) {
  console.log("Add comment");

  var callback_error = function(err) {
    console.log('error: ', err);
    db.close();
    error_pages.p_500(response, err.toString());
  }

  var send_ok = function(date, comm, lang) {
    db.close();
    response.writeHead(200, {'Content-Type': 'text/plain; charset=UTF-8'});
    response.write(comm._id.toString() + '_' + functions.dateString(date, lang.dates));
    response.end();
  }

  var find_language_user = function (user, date, comm, lang_code, langs) {
    langs.findOne({'lang_code': lang_code}, {fields: {'_id': 0}}, function(err, lang) {
      if (err) callback_error(err)
      else send_ok(date, comm, lang)
    })
  }

  var open_languages = function (user, date, comm, lang_code) {
    db.collection('Languages', {safe: true}, function(err, langs) {
      if (err) callback_error(err)
      else find_language_user(user, date, comm, lang_code, langs)
    });
  }

  var find_settings_user = function (user, date, comm, setts) {
    setts.findOne({'object_id': user_id}, {fields: {'_id': 0}}, function(err, sett) {
      if (err) callback_error(err)
      else open_languages(user, date, comm, (sett && sett.lang && sett.lang.default) ? sett.lang.default : 'ru')
    })
  }

  var open_settings = function (user, date, comm) {
    db.collection('Settings', {safe: true}, function(err, setts) {
      if (err) callback_error(err)
      else find_settings_user(user, date, comm, setts)
    });
  }

  var insert_comment = function(user, data, date, comments) {
    comments.insert(data, {safe: true}, function(err, comm) {
      if (err) callback_error(err)
      else open_settings(user, date, comm[0])
    }); 
  }

  var create_comments = function(user, data, date) {
    db.createCollection("Comments", {safe: true}, function(err, comments){
      if (err) callback_error(err)
      else insert_comment(user, data, date, comments)
    });
  }

  var getData = function(user) {
    var data = functions.parsePost(postData),
        date = Date.now();
    
    data.from = user_id;
    data.firm = user.firm;
    data.date_add = date;

    create_comments(user, data, date);
  }

  var find_user_id = function(users) {
    users.findOne({'_id': mongo.ObjectID(user_id)}, function(err, user) {
      if (err) callback_error(err)
      else getData(user)
    });
  }

  db.collection("Users", {safe: true}, function(err, users){
    if (err) callback_error(err)
    else find_user_id(users)
  });
}

function add_p(response, db, postData, ua, user_id) {
  console.log("Add project");

  var callback_error = function(err) {
    console.log('error: ', err);
    db.close();
    error_pages.p_500(response, err.toString());
  }

  var send_ok = function(proj) {
    db.close();
    response.writeHead(200, {'Content-Type': 'text/plain'});
    response.write(proj._id.toString());
    response.end();
  }

  var insert_project = function(data, projs) {
    projs.insert(data, {safe: true}, function(err, proj) {
      if (err) callback_error(err)
      else send_ok(proj[0])
    });
  }

  var create_projects = function(data) {
    db.createCollection("Projects", {safe: true}, function(err, projs){
      if (err) callback_error(err)
      else insert_project(data, projs)
    });
  }

  var getData = function(user) {
    var data = functions.parsePost(postData),
        date = Date.now();

    data.status = 'open';
    data.opened = 0;
    data.closed = 0;
    data.date_open = date;
    data.firm = user.firm;

    create_projects(data);
  }

  var find_user_id = function(users) {
    users.findOne({'_id': mongo.ObjectID(user_id)}, function(err, user) {
      if (err) callback_error(err)
      else getData(user)
    });
  }

  db.collection("Users", {safe: true}, function(err, users){
    if (err) callback_error(err)
    else find_user_id(users)
  });
}

function add_t(response, db, postData, ua, user_id) {
  //console.log("Add task", postData);

  var callback_error = function(err) {
    console.log('error: ', err);
    db.close();
    error_pages.p_500(response, err.toString());
  }

  var send_ok = function (task) {
    db.close();
    response.writeHead(200, {'Content-Type': 'text/plain'});
    response.write(task._id.toString());
    response.end();
  }

  var find_user_to = function (data, users, user, task) {
    console.log('find_user_to', data.to, 'endDataTo');
    users.findOne({_id: mongo.ObjectID(data.to)}, function(err, user_to){
      if (err) callback_error(err)
      else {
        nodemailer.sendNewTask(user_to.email, task, user);
        send_ok(task);
      }
    });
  }

  var insert_task = function (data, users, user, tasks) {
    console.log('insert_task');
    tasks.insert(data, {safe: true}, function(err, task) {
      if (err) callback_error(err)
      else {
        if (data.to != data.from) find_user_to(data, users, user, task[0])
        else send_ok(task[0])
      }
    });
  }

  var open_tasks = function (data, users, user) {
    console.log('open_tasks');
    db.createCollection('Tasks', {safe: true}, function(err, tasks) {
      if (err) callback_error(err)
      else insert_task(data, users, user, tasks);
    });
  }

  j = 0;
  var insert_file = function (data, users, user, i, files) {
    console.log('insert_file');
    data.files[i].firm = user.firm;

    files.insert(data.files[i], {safe: true}, function(err, file) {
      if (err) callback_error(err)
      else {
        var fileId = file[0]._id.toString();

        j++;

        if (j == data.count) {

            delete(data.files);
            open_tasks(data, users, user);

        }
      }
    });
  }

  var open_files = function (data, users, user) {
    console.log('open_files');
    db.createCollection("Files", {safe: true}, function(err, files){
      if (err) callback_error(err)
      else {
        for (var i = 0; i < parseInt(data.count); i++) {
          insert_file(data, users, user, i, files);
        }
      }
    });
  }

  var find_user_id = function(data, users) {
    console.log('find_user_id');
    users.findOne({'_id': mongo.ObjectID(user_id)}, function(err, user) {
      if (err) callback_error(err)
      else {
        data.firm = user.firm;
        if (parseInt(data.count)) open_files(data, users, user)
        else {
          delete(data.count);
          delete(data.files);
          open_tasks(data, users, user);
        }
      }
    });
  }

  var open_users = function(data) {
    
    db.collection("Users", {safe: true}, function(err, users){
      if (err) callback_error(err)
      else find_user_id(data, users)
    });

  }

  var getData = function(user) {
    var parse = functions.parsePost(postData),
        date = Date.now(),
        data = JSON.parse(parse['data']);

    data.date_open = date;
    data.status = 'open';
    data.from = user_id;
    data.listeners = functions.pureArr([data.to, user_id]);

    return data;
  }

  //var writer = fs.createWriteStream('temp/postData', {flags: 'w'});
  //writer.on('finish', function() {
  //  console.log('Запись выполнена успешно.');
    open_users(getData());
  //});

  //var ok = writer.write(postData);

  //if (!ok) callback_error('postData don\'t not ok')
  //else writer.end()
}

function auth(response, db, postData, ua) {
    console.log("Authorize user");

    var data = functions.parsePost(postData);

    console.log(data);

    var callback_error = function(number) {
        console.log('err', number)

        db.close();
        error_pages['p_' + number](response);
    }

    var send_ok = function (id) {

        var cookie   = 'tracker=' + id,
            tomorrow = new Date(Date.now() + DAY);

        if (!data.remember || data.remember.toString() != 'true') {

            cookie += '; expires=' + tomorrow.toGMTString()
        }
        
        db.close();
        response.writeHead(200, {'Content-Type': 'text/plain', 'Set-Cookie': cookie});
        response.write("success: " + id);
        response.end();
    }

    var insert_conn = function (id, Connections) {
        
        DB.createElem(Connections, {user_id: id, userAgent: ua}, function(conn) {
            
            send_ok(conn._id.toString())
        
        }, callback_error); 
    }

    var remove_old_conn = function (id, Connections) {
        
        DB.removeElem(Connections, {user_id: id, userAgent: ua}, function(){
        
            insert_conn(id, Connections)
        
        }, callback_error);
    }

    var create_conns = function(id) {
        
        DB.openCollection(db, "Connections", function(Connections){ 

            remove_old_conn(id, Connections)
        
        }, callback_error);
    }

    var find_user_data = function(Users) {
        
        DB.findOne(Users, {'email': data.email}, {}, function(user) {

            console.log('ok', user)

            if (!user || user.password != data.password) callback_error('401')
            else create_conns(user._id.toString())

        }, callback_error);
    }

    DB.openCollection(db, 'Users', find_user_data, callback_error)
}

function edit_filter (response, db, postData, ua) {
  console.log("Edit filter", postData);

  var callback_error = function(number, err) {
    console.log('error: ', err);
    db.close();
    error_pages['p_' + number](response, err.toString());
  }

  var send_ok = function() {
    db.close();
    response.writeHead(200, {'Content-Type': 'text/plain'});
    response.write("success");
    response.end();
  }

  var update_settings = function (data, filters, setts) {
    var dataSet = {$set: {filters: filters}};

    setts.update({'object_id': user_id}, dataSet, function(err, sett) {
      if (err) callback_error(500, err)
      else send_ok()
    });
  }

  var find_settings_user = function (data, setts) {
    setts.findOne({object_id: user_id}, function(err, sett){
      if (err) callback_error(500, err)
      else {
        var filt = sett.filters;
        for (var i = 0; i < filt.length; i++) {
          if (filt[i].id == data.id) {
            filt[i].fields = data.fields;
            update_settings(data, filt, setts)
          }
        }
      }
    })
  }

  db.collection("Settings", {safe: true}, function(err, setts){
    if (err) callback_error(500, err)
    else {
      var parse = functions.parsePost(postData);
      console.log(parse);
          data  = JSON.parse(parse['filter']);
      find_settings_user(data, setts)
    }
  });
}

function people_admin(response, db, postData, ua, user_id) {
  console.log('Change admin rights');

  var callback_error = function(number, err) {
    console.log('error: ', err);
    db.close();
    error_pages['p_' + number](response, err.toString());
  }

  var send_ok = function () {
    db.close();
    response.writeHead(200, {'Content-Type': 'text/plain'});
    response.write("success");
    response.end();
  }

  j = 0;
  var update_user_admin = function(users, data, i) {
    users.findAndModify({'_id': mongo.ObjectID(data[i].id)}, {}, {$set: {'admin': data[i].admin}}, {}, function(err, user) {
      if (err) error_pages(500, err)
      else {
        j++;
        if (j == data.length) send_ok()
      }
    });
  }

  var getData = function(users) {
    var parse = functions.parsePost(postData),
        data  = JSON.parse(parse['change']), j = 0;

    for (i = 0; i < data.length; i ++) {
      update_user_admin(users, data, i)
    }
  }

  var find_user_id = function(users) {
    users.findOne({'_id': mongo.ObjectID(user_id)}, function(err, user) {
      if (err) callback_error(500, err)
      else {

        console.log(user, user.admin, user.admin == true);
        if (user.admin && (user.admin == true || user.admin == 'true')) getData(users)
        else callback_error(403, 'you don\'t have access to do this')
      }
    });
  }

  db.collection("Users", {safe: true}, function(err, users){
    if (err) callback_error(err)
    else find_user_id(users)
  });
}

function reg_firm(response, db, postData, ua) {
  console.log("Registration firm");

  var callback_error = function(number, err) {
    console.log('error: ', err);
    db.close();
    error_pages['p_' + number](response, err.toString());
  }

  var send_ok = function (id) {
    db.close();
    response.writeHead(200, {'Content-Type': 'text/plain', 'Set-Cookie': 'tracker=' + id});
    response.write("success: " + id);
    response.end();
  }

  var insert_sett_user = function (id, conn_id, setts, sett) {
    var obj = {
      type: 'user',
      object_id: id
    }
    obj.lang = sett.lang;
    obj.filters = sett.filters;
    setts.insert(sett, function(err, s) {
      if (err) error_pages(500, err)
      else send_ok(conn_id)
    })
  } 

  var insert_sett_firm = function (id, firm_id, conn_id, setts, sett) {
    sett.type = 'firm';
    sett.object_id = firm_id;
    setts.insert(sett, function(err, s) {
      if (err) error_pages(500, err)
      else insert_sett_user(id, conn_id, setts, sett)
    })
  } 

  var find_sett_default = function (id, firm_id, conn_id, setts) {
    setts.findOne({type: 'default'}, {fields: {_id: 0, type: 0}}, function(err, sett) {
      if (err) error_pages(500, err)
      else {
        if (sett && sett[0]) insert_sett_firm(id, firm_id, conn_id, setts, sett);
        else send_ok(conn_id);
      }
    })
  } 

  var create_setts = function (id, firm_id, conn_id) {
    db.createCollection("Settings", {safe: true}, function(err, setts){
      if (err) error_pages(500, err)
      else find_sett_default(id, firm_id, conn_id, setts)
    });
  }

  var insert_conn = function (id, firm_id, conns) {
    conns.insert({user_id: id, userAgent: ua}, {safe: true}, function(err, conn) {
      if (err) error_pages(500, err)
      else create_setts(id, firm_id, conn[0]._id.toString())
    }); 
  }

  var remove_old_conn = function (id, firm_id, conns) {
    conns.remove({user_id: id, userAgent: ua}, function(err){
      if (err) error_pages(500, err)
      else insert_conn(id, firm_id, conns)
    });
  }

  var create_conns = function (id, firm_id) {
    db.createCollection("Connections", {safe: true}, function(err, conns){
      if (err) error_pages(500, err)
      else remove_old_conn(id, firm_id, conns)
    });
  }

  var insert_user = function (users, data, firm_id) {
    var user_data = {
            email   : data['email'],
            password: data['password'],
            name    : data['name'],
            surname : data['surname'],
            admin   : 'true',
            firm    : firm_id
          };

    users.insert(user_data, {safe: true}, function(err, user) {
      if (err) error_pages(500, err)
      else {
        nodemailer.sendRegistrFirm(data['firm'], data['email'], data['password']);
        create_conns(user[0]._id.toString(), firm_id)
      }
    });
  }

  var insert_firm = function (users, data, firms) {
    var firm_data = {
          firm : data['firm'],
          email: data['email']
        };

    firms.insert(firm_data, {safe: true}, function(err, firm) {
      if (err) error_pages(500, err)
      else insert_user(users, data, firm[0]._id.toString())
    });
  }

  var create_firms = function (users, data) {
    db.createCollection("Firms", {safe: true}, function(err, firms){
      if (err) callback_error(500, err)
      else insert_firm(users, data, firms)
    });
  }

  var find_user_data = function (users, data) {
    users.findOne({'email': data.email}, function(err, user){
      if (err) callback_error(500, err)
      else {
        if (user) callback_error(401, 'this email has already registered')
        else create_firms(users, data)
      }
    });
  }

  db.createCollection("Users", {safe: true}, function(err, users){
    if (err) callback_error(err)
    else find_user_data(users, functions.parsePost(postData))
  });
}

function reg_user(response, db, postData, ua, user_id) {
  console.log("Registration user");

  var callback_error = function(number, err) {
    console.log('error: ', err);
    db.close();
    error_pages['p_' + number](response, err.toString());
  }

  var send_ok = function (data, id) {
    nodemailer.sendRegistr(data.email, data.password);
    response.writeHead(200, {'Content-Type': 'text/plain'});
    response.write("success: " + id);
    response.end();
    db.close();
  }

  var insert_sett_user = function (data, id, setts, sett) {
    sett.object_id = id;
    setts.insert(sett, function(err, s) {
      if (err) error_pages(500, err)
      else send_ok(data, id)
    })
  }

  var find_sett_admin = function (data, id, setts) {
    setts.findOne({object_id: user_id}, {fields: {lang: 1, filters: 1, type: 1}}, function(err, sett) {
      if (err) error_pages(500, err)
      else {
        if (sett && sett[0]) insert_sett_user(data, id, setts, sett);
        else send_ok(data, id);
      }
    })
  } 

  var open_setts = function (data, id) {
    db.collection("Settings", {safe: true}, function(err, setts){
      if (err) error_pages(500, err)
      else find_sett_admin(data, id, setts)
    });
  }

  var insert_user = function (users, data) {
    users.insert(data, {safe: true}, function(err, user) {
      if (err) error_pages(500, err)
      else send_ok(data, user[0]._id.toString())
    });
  }

  var find_user_data = function (users, data) {
    users.findOne({'email': data.email}, function(err, user){
      if (err) callback_error(500, err)
      else {
        if (user) callback_error(401, 'this email has already registered')
        else insert_user(users, data)
      }
    });
  }

  var find_user_id = function (users, data) {
    users.findOne({'_id': mongo.ObjectID(user_id)}, function(err, admin){
      if (err) callback_error(500, err)
      else {
        if (admin && admin.admin && (admin.admin == 'true' || admin.admin == true)) { 
          data.firm = admin.firm;
          find_user_data(users, data)
        } else callback_error(403, 'you don\'t have access to add new people')
      }
    });
  }

  db.createCollection("Users", {safe: true}, function(err, users){
    if (err) callback_error(err)
    else find_user_id(users, functions.parsePost(postData))
  });
}

function task_desc(response, db, postData, ua, user_id) {
  console.log("Change task_desc");

  var callback_error = function(number, err) {
    console.log('error: ', err);
    db.close();
    error_pages['p_' + number](response, err.toString());
  }

  var send_ok = function() {
    db.close();
    response.writeHead(200, {'Content-Type': 'text/plain'});
    response.write("success");
    response.end();
  }

  var update_tasks = function (data, tasks) {
    tasks.update({'_id': mongo.ObjectID(data.task_id)}, {$set: {desc: data.desc, date_change: Date.now()}}, function(err, task) {
      if (err) callback_error(500, err)
      else send_ok()
    });
  }

  var open_tasks = function (data) {
    db.collection("Tasks", {safe: true}, function(err, tasks){
      if (err) callback_error(500, err)
      else update_tasks(data, tasks)
    });
  }

  var find_user_id = function (users, data) {
    users.findOne({'_id': mongo.ObjectID(user_id)}, function(err, admin){
      if (err) callback_error(500, err)
      else {
        if (admin.admin && (admin.admin == 'true' || admin.admin == true)) open_tasks(data)
        else callback_error(403, 'you don\'t have access to change description')
      }
    });
  }

  db.createCollection("Users", {safe: true}, function(err, users){
    if (err) callback_error(500, err)
    else find_user_id(users, functions.parsePost(postData))
  });
}

function task_name(response, db, postData, ua, user_id) {
  console.log("Change task_name");

  var callback_error = function(number, err) {
    console.log('error: ', err);
    db.close();
    error_pages['p_' + number](response, err.toString());
  }

  var send_ok = function() {
    db.close();
    response.writeHead(200, {'Content-Type': 'text/plain'});
    response.write("success");
    response.end();
  }

  var update_tasks = function (data, tasks) {
    tasks.update({'_id': mongo.ObjectID(data.task_id)}, {$set: {name: data.name, date_change: Date.now()}}, function(err, task) {
      if (err) callback_error(500, err)
      else send_ok()
    });
  }

  var open_tasks = function (data) {
    db.collection("Tasks", {safe: true}, function(err, tasks){
      if (err) callback_error(500, err)
      else update_tasks(data, tasks)
    });
  }

  var find_user_id = function (users, data) {
    users.findOne({'_id': mongo.ObjectID(user_id)}, function(err, admin){
      if (err) callback_error(500, err)
      else {
        if (admin.admin && (admin.admin == 'true' || admin.admin == true)) open_tasks(data)
        else callback_error(403, 'you don\'t have access to change task name')
      }
    });
  }

  db.createCollection("Users", {safe: true}, function(err, users){
    if (err) callback_error(500, err)
    else find_user_id(users, functions.parsePost(postData))
  });
}

function task_status(response, db, postData, ua, user_id) {
  console.log("Change task_status");

  var callback_error = function(number, err) {
    console.log('error: ', err);
    db.close();
    error_pages['p_' + number](response, err.toString());
  }

  var send_ok = function() {
    db.close();
    response.writeHead(200, {'Content-Type': 'text/plain'});
    response.write("success");
    response.end();
  }

  var update_tasks = function (data, tasks) {
    var now     = Date.now(),
        dataSet = {$set: {status: data.status, date_change: now}};

    if (data.status == 'close') {
      dataSet.$set.date_close = now;
    }

    if (data.status == 'open') {
      dataSet.$unset = {date_close: 1};
    }
    tasks.update({'_id': mongo.ObjectID(data.task_id)}, dataSet, function(err, task) {
      if (err) callback_error(500, err)
      else send_ok()
    });
  }

  var open_tasks = function (data) {
    db.collection("Tasks", {safe: true}, function(err, tasks){
      if (err) callback_error(500, err)
      else update_tasks(data, tasks)
    });
  }

  var find_user_id = function (users, data) {
    users.findOne({'_id': mongo.ObjectID(user_id)}, function(err, admin){
      if (err) callback_error(500, err)
      else {
        if (admin.admin && (admin.admin == 'true' || admin.admin == true)) open_tasks(data)
        else callback_error(403, 'you don\'t have access to change task status')
      }
    });
  }

  db.createCollection("Users", {safe: true}, function(err, users){
    if (err) callback_error(500, err)
    else find_user_id(users, functions.parsePost(postData))
  });
}

function task_to(response, db, postData, ua, user_id) {
  console.log("Change task_to");

  var callback_error = function(number, err) {
    console.log('error: ', err);
    db.close();
    error_pages['p_' + number](response, err.toString());
  }

  var send_ok = function() {
    db.close();
    response.writeHead(200, {'Content-Type': 'text/plain'});
    response.write("success");
    response.end();
  }

  var update_tasks = function (data, tasks) {
    tasks.update({'_id': mongo.ObjectID(data.task_id)}, {$set: {to: data.user_id, date_change: Date.now()}}, function(err, task) {
      if (err) callback_error(500, err)
      else send_ok()
    });
  }

  var open_tasks = function (data) {
    db.collection("Tasks", {safe: true}, function(err, tasks){
      if (err) callback_error(500, err)
      else update_tasks(data, tasks)
    });
  }

  var find_user_id = function (users, data) {
    users.findOne({'_id': mongo.ObjectID(user_id)}, function(err, admin){
      if (err) callback_error(500, err)
      else {
        if (admin.admin && (admin.admin == 'true' || admin.admin == true)) open_tasks(data)
        else callback_error(403, 'you don\'t have access to change task name')
      }
    });
  }

  db.createCollection("Users", {safe: true}, function(err, users){
    if (err) callback_error(500, err)
    else find_user_id(users, functions.parsePost(postData))
  });
}

exports.add_c        = add_c;
exports.add_p        = add_p;
exports.add_t        = add_t;
exports.auth         = auth;
exports.edit_filter  = edit_filter;
exports.people_admin = people_admin;
exports.reg_firm     = reg_firm;
exports.reg_user     = reg_user;
exports.task_desc    = task_desc;
exports.task_name    = task_name;
exports.task_status  = task_status;
exports.task_to      = task_to;