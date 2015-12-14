var createElem = function (Collection, obj, success, error, db) {

    console.log("dsfkjs", typeof Collection == 'string');
    if (typeof Collection == 'string') {

        openCollection(db, Collection, function(Collection) {

            console.log("dsfkjs");
            Collection.insert(obj, {safe: true}, function(err, elem) {

                (err) ? error('500') : success(elem.ops[0]);
            });

        }, error);

    } else {

        Collection.insert(obj, {safe: true}, function(err, elem) {

            console.log("dsffhdkjs");
            console.log(elem)
            console.log(err);
            (err) ? error('500') : success(elem.ops[0]);

        });
    }
}

var findAll = function (Collection, obj, fields, success, error, db) {

    fields = fields || {};

    if (typeof Collection == 'string') {

        openCollection(db, Collection, function(Collection) {
            
            Collection.find(obj, {fields: fields}).toArray(function(err, arr) {

                (err) ? error('500') : success(arr);
            });

        }, error);

    } else {

        Collection.find(obj, {fields: fields}).toArray(function(err, arr) {

            (err) ? error('500') : success(arr);
        });
    }
}

var findOne = function (Collection, obj, fields, success, error, db) {

    fields = fields || {};

    if (typeof Collection == 'string') {

        openCollection(db, Collection, function(Collection) {

            Collection.findOne(obj, {fields: fields}, function(err, elem){
                (err) ? error('500') : success(elem);
            });

        }, error);

    } else {

        Collection.findOne(obj, {fields: fields}, function(err, elem){

            (err) ? error('500') : success(elem);
        });
    }
}

var mongoSearch = function (db, Collection, text, filter, success, error) {

    db.command({text: Collection, search: text, filter: filter}, function(err, result) {
          
        if (err) error(500)
        else {

            var search = { 
                query   : result.queryDebugString,
                results : []
            };
            
            for (var i = 0; i < result.results.length; i++) {

                search.results.push(result.results[i].obj);
            }

            success(search);
        }
    });
}

var open = function (db, success, error) {

    db.open(function(err, db){

        (err) ? error('500') : success(db);

    });
}

var openCollection = function (db, name, success, error) {

    db.createCollection(name, {safe: true}, function(err, Collection){

        (err) ? error('500') : success(Collection);

    });
}

var removeElem = function (Collection, obj, success, error, db) {

    if (typeof Collection == 'string') {

        openCollection(db, Collection, function(Collection) {
            
            Collection.remove(obj, function(err) {

                (err) ? error('500') : success();
            });

        }, error);

    } else {

        Collection.remove(obj, function(err) {

            (err) ? error('500') : success();
        });
    } 
}

var updateElem = function (Collection, obj, dataSet, success, error, db, unset, push) {

    unset = unset || {}; 
    push  = push  || {};

    if (typeof Collection == 'string') {

        openCollection(db, Collection, function(Collection) {
            
            Collection.update(obj, {$set: dataSet, $unset: unset, $push: push}, function(err, elem) {

                (err) ? error('500') : success(elem);
            });

        }, error);

    } else {

        Collection.update(obj, {$set: dataSet, $unset: unset, $push: push}, function(err, elem) {

            (err) ? error('500') : success(elem);
        });
    }
}

var getIncrementKey = function (db, proj_id, success, error) {

    openCollection(db, 'Autoincrement', function(Collection) {
            
        Collection.findAndModify({proj_id: proj_id}, [['_id','asc']], {$inc: {id: 1}}, function(err, elem) {

            (err) ? error('500') : success(elem.id);
        });

    }, error);

}

exports.createElem     = createElem;
exports.getIncrementKey= getIncrementKey;
exports.findAll        = findAll;
exports.findOne        = findOne;
exports.mongoSearch    = mongoSearch;
exports.open           = open;
exports.openCollection = openCollection;
exports.removeElem     = removeElem;
exports.updateElem     = updateElem;