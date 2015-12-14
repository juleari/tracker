var mongo = require('mongodb'),
    jade  = require("jade");

var arrToObj = function(arr, field, obj) {
    
    obj   = obj   || {};
    field = field || '_id';
    var id;

    for (var i = 0; i < arr.length; i++) {

        id      = arr[i][field].toString();
        obj[id] = arr[i];
    }

    return obj
}
var arrToArrObj = function(arr, field, obj) {
    
    obj = obj || {};
    var id;

    for (var i = 0; i < arr.length; i++) {

        id      = arr[i][field].toString();
        obj[id] = obj[id] || [];
        obj[id].push(arr[i]);
    }

    return obj
}

var chooseProj = function (projs, proj_id) {
  for (var i = 0; i < projs.length; i++) {
    if (projs[i]._id.toString() == proj_id) {
      var p = projs.splice(i, 1);
      projs.unshift(p[0]);
    }
  }

  return projs
}

var countStatus = function (projs, tasks) {
    
    var statuses = {}, t, i;
  
    for (i = 0; i < tasks.length; i ++) {

        t = tasks[i];

        projs[t.proj].statuses = projs[t.proj].statuses || {};
        projs[t.proj].statuses[t.status] = projs[t.proj].statuses[t.status] + 1 || 1;

        statuses[t.status] = 1;
    }

    for (i in projs) {

        projs[i].statuses = projs[i].statuses || {};

        for (j in statuses) {

            projs[i].statuses[j] = projs[i].statuses[j] || 0;
        }
    }

    return projs;
}

var dateString = function (dateNumber, dates) {
  var date   = new Date(dateNumber),
      now    = new Date(Date.now()),
      days   = dates.days,
      months = dates.months,
      today  = dates.today; 
  return (date.toDateString() == now.toDateString()) ?
          today + ', ' + date.toLocaleTimeString()   :
          days[ date.getDay() ] + ', ' +
          date.getDate() + ' ' + 
          months[ date.getMonth() ] + ' ' +
          date.getFullYear();
}

var find = function (where, what) {
  var whereArr = [], whatArr = [], rezArr = [], i, j, k = 0;
  if (what instanceof Array) {
    whatArr = what;
  } else {
    whatArr[0] = what;
  }

  if (where instanceof Array) {
    whereArr = where;
  } else {
    whereArr[0] = where;
  }

  for (j = 0; j < whatArr.length; j++) {
    for (i = 0; i < whereArr.length; i++) {
      if (whereArr[i]._id.toString() == whatArr[j]) {
        rezArr[ k++ ] = {
          id: whatArr[j],
          name: whereArr[i].name + ' ' + whereArr[i].surname
        }
        break;
      }
    }
  }

  return rezArr;
}

var getEmails = function(users) {

    var emails = users[0].email;

    for (var i = 1; i < users.length; i++) {

        emails += ', ' + users[i].email;

    }

    return emails;
}

var getInner = function(lang, sett) {
  var opts = lang.options, rez = [], i, j;
  for (i = 0; i < opts.length; i++) {
    if (opts[i].value == sett.default) {
      rez.push(opts.splice(i, 1)[0]);
      sett.options.splice(sett.options.indexOf(sett.default), 1);
      break;
    }
  }

  for (i = 0; i < opts.length; i++) {
    for (j = 0; j < sett.options.length; j++) {
      if (opts[i].value == sett.options[j]) {
        rez.push(opts[i]);
        sett.options.splice(j, 1);
        break;
      }
    }
  }

  lang.options = rez;
  return lang
}

var getMyFilters = function (filters, lang) {
  
    var temp = [], field,
        options = lang && lang.filters && lang.filters.list && lang.filters.list.options || [];

    filters = filters || [];

    for (var i = 0; i < filters.length; i++) {
        
        for (var j = 0; j < options.length; j++) {
            
            if (options[j].value == filters[i]._id.toString()) {
                
                temp[i] = {
                    name: options[j].my || options[j].name || lang.task.title || '',
                    fields: [],
                    by: filters[i].by,
                    values: filters[i].values
                };

                for (var k = 0; k < filters[i].fields.length; k++) {
                    
                    field = (/date_(.*)/.test(filters[i].fields[k])) ? 
                            lang.dates[RegExp.$1] :
                            lang.task.fields[filters[i].fields[k]].title || '';
                    
                    temp[i].fields.push({
                        name: field,
                        value: filters[i].fields[k]
                    });
                }

                options.splice(j, 1);

                break;
            }
        }
    }

    return temp;
}

var getObj = function (list, id) {
    
    var rez = [];
  
    for (var i = 0; i < list.length; i++) {
        
        rez.push(list[i][id].toString());
    }

    return rez
}

var getObjIds = function(objs) {

    var fields = [];

    if (objs[0] && typeof objs[0] == 'string') {

        for (var i = 0; i < objs.length; i++) {

            fields.push( mongo.ObjectID(objs[i]) );
        }

    } else {

        for (var i = 0; i < objs.length; i++) {

            fields.push( mongo.ObjectID(objs[i].id) );
        }
    }

    return fields;
}

var getElemsIds = function(elems, ids) {

    var result = [];

    for (var i = 0; i < ids.length; i++) {

        for (var j = 0; j < elems.length; j++) {

            if (elems[j].id == ids[i]) {

                result.push( elems[j] )
                break;
            }
        }
    }

    return result;
}

var getPass = function () {
  
    var symbols = 'qwertyuiop[];lkjhgfdsazxcvbnm,./>?<MNBVCXZASDFGHJKL:}{POIUYTREWQ1234567890-=+_)(*&^%$#@!',
        length = parseInt(Math.random() * 5 + 5),
        pass = '';

    for (var i = 0; i < length; i++) {
        pass += symbols[ parseInt( Math.random() * (symbols.length - 1) ) ]
    }

    return pass;
}

var id_name = function (ts, arr) {
  var rez = {}, i;
  console.log('id_name ', arr);
  for (i = 0; i < arr.length; i++) {
    console.log(arr[i]);
    rez[ arr[i]._id.toString() ] = arr[i].name;
  }
  rez[''] = 'без проекта';
  for (i = 0; i < ts.length; i++) {
    ts[i].proj = {name: rez[ ts[i].proj ], id: ts[i].proj};
  }
  return ts;
}

var parsePost = function (postData) {
    
    //postData = decodeURIComponent(postData);
    //console.log(postData);
    
    var darr = postData.split('&'),
        kv   = [], data = {};

    for (var i = 0; i < darr.length; i++) {
        
        kv[i] = [];
        kv[i] = darr[i].split('=');

        data[ kv[i][0] ] = decodeURIComponent(kv[i][1].replace(/\+/g,  " "));
    }

    // console.log(data);

    return data;
}

var parseFrame = function (postData) {
  //postData = decodeURIComponent(postData.replace('\n', '').replace('\r', ''));
  var darr = postData.split('Content-Disposition:'),
      kvRE = [],
      kv   = {}, temp;

  darr = postData.split( darr[0] );

  for (var i = 0; i < darr.length; i++) {
    kvRE[i] = darr[i].replace('\n', '').replace('\r', '');
    //console.log('darr', kvRE[i]);
    temp = kvRE[i].split('name="');
    //console.log(temp);
    if (temp && temp[1]) {
      if (temp.length > 2) {
        var data = (temp[2].split('"').slice(1).join('"') + temp.slice(3));
        ContentType = data.split('Content-Type:')[1].split('\n').join('').split('\r').join('');
        dataInner = ContentType.split('\n').slice(2).join('\n');

        kv[ temp[1].split('"')[0] ] = {
            name : temp[2].split('"')[0],
            //data : temp[2].split('"').slice(1).join('"') + temp.slice(3)
            data : dataInner,
            type : ContentType
          } 
      } else {
        temp = temp[1].split('"');
        kv[ temp[0] ] = decodeURIComponent(temp[1].split('\n').join('').split('\r').join(''));
      }
    }
  }

  return kv;
}

var parseCookies = function (request) {
  var list = {},
    rc = request.headers.cookie;

  rc && rc.split(';').forEach(function( cookie ) {
    var parts = cookie.split('=');
    list[parts.shift().trim()] = unescape(parts.join('='));
  });

  return list;
}

var projEdit = function (projs, arr) {
  for (var i = 0; i < projs.length; i++) {
    console.log(projs);
    projs[i].statuses = arr[ projs[i]._id.toString() ]
  }

  return projs;
}

var pureArr = function (arr) {
  
    var p_arr = [];

    for (var i = 0; i < arr.length; i++) {
        
        if (p_arr.indexOf(arr[i]) == -1) {
            
            p_arr.push(arr[i]);
        }
    }

    return p_arr;
}

var pureIds = function (arr) {
  
    var p_obj = {}, p_arr = [], j = 0;

    for (var i = 0; i < arr.length; i++) {
        
        p_obj[ arr[i]._id.toString() ] = arr[i];
    }

    for (i in p_obj) {
        
        p_arr.push(p_obj[i])
    }

    return p_arr;
}

var pureArrIndxs = function (arr, fieldName) {
  var p_arr = {}, i, id, j = 0;

  for (i = 0; i < arr.length; i++) {
    id = arr[i][fieldName].toString();
    if (p_arr[ id ]) {
      p_arr[ id ].push(i);
    } else {
      p_arr[ id ] = [i];
      j++;
    }
  }

  return [p_arr, j];
}

var setFilterValues = function (filters, values) {

    for (var i = 0; i < filters.length; i++) {

        for (var j = 0; j < values.length; j++) {

            if (filters[i]._id.toString() == values[j].id) {

                filters[i].values = values.splice(j, 1)[0].values;
                break;
            }
        }
    }

    return filters;
}

var setFirst = function (obj, value) {
  for (var i = 0; i < obj.length; i++) {
    if (obj[i].value == value) {
      obj.unshift(obj.splice(i, 1)[0]);
      return obj
    }
  }
}

var setUserFirst = function (users, id) {
  for (var i = 0; i < users.length; i++) {
    if (users[i].id == id) {
      users.unshift(users.splice(i, 1)[0]);
      return users
    }
  }
}

var toEdit = function (ts, arr) {
  for (var i = 0; i < ts.length; i++) {
    ts[i].to = arr[ ts[i].to ];
  }

  return ts;
}

exports.arrToObj        = arrToObj;
exports.arrToArrObj     = arrToArrObj;
exports.chooseProj      = chooseProj;
exports.countStatus     = countStatus;
exports.dateString      = dateString;
exports.find            = find;
exports.getElemsIds     = getElemsIds;
exports.getEmails       = getEmails;
exports.getInner        = getInner;
exports.getMyFilters    = getMyFilters;
exports.getObj          = getObj;
exports.getObjIds       = getObjIds;
exports.getPass         = getPass;
exports.id_name         = id_name;
exports.parseCookies    = parseCookies;
exports.parseFrame      = parseFrame;
exports.parsePost       = parsePost;
exports.projEdit        = projEdit;
exports.pureArr         = pureArr;
exports.pureIds         = pureIds;
exports.pureArrIndxs    = pureArrIndxs;
exports.setFilterValues = setFilterValues;
exports.setFirst        = setFirst;
exports.setUserFirst    = setUserFirst;
exports.toEdit          = toEdit;