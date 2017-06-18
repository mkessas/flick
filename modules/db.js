var mongodb = require('mongodb').MongoClient;
var db = module.exports;

var conf;

db.init = (c) => {
    conf = c;
    try {
        if (conf.general.debug) {
            console.info("init(): Configuration:\n", c);
        }
    } catch (e) {
        console.log("init():", e.message);
        conf = { db: { url: 'mongodb://localhost:27017/flick' }};
    }
}

db.insert = (price) => {
    if (conf.general.debug) console.info("insert(): Inserting", JSON.stringify(price));
    mongodb.connect(conf.db.url, (err, db) => {
        if (conf.general.debug) console.info("insert(): Connect Result:", err);
        if (!err) 
            db.collection("price").insert(price, (err, result) => {
                if (conf.general.debug) console.info("insert(): Insert Result:", err);
                db.close();
            });
        else
            console.log(err);
    });
}

db.getMin = (date, callback) => {
    if (conf.general.debug) console.info("getMin(): Finding Lowest Price for ", date);
    mongodb.connect(conf.db.url, (err, db) => {
        if (conf.general.debug) console.info("getMin(): Connect Result:", err);
        if (!err) {
            var notBefore = new Date(date);
            var notAfter = new Date(new Date(date).getTime() + 86400 * 1000);
            if (conf.general.debug) console.info("getMin(): Date range between",notBefore,"and",notAfter);
            var cursor = db.collection("price")
                            .find({"updated":{$gt: notBefore, $lt: notAfter}})
                            .sort({"price":1,"updated":-1})
                            .limit(1);

            cursor.each(function(err, doc) {
                if (doc != null) {
                    callback(doc);
                }
            });
            //db.close();
            
        } else {
            console.log(err);
            callback();
        }
    });

} 

db.getMax = (date, callback) => {
    if (conf.general.debug) console.info("getMax(): Finding Highest Price for ", date);
    mongodb.connect(conf.db.url, (err, db) => {
        if (conf.general.debug) console.info("getMax(): Connect Result:", err);
        if (!err) {
            var notBefore = new Date(date);
            var notAfter = new Date(new Date(date).getTime() + 86400 * 1000);
            if (conf.general.debug) console.info("getMax(): Date range between",notBefore,"and",notAfter);
            var cursor = db.collection("price")
                            .find({"updated":{$gt: notBefore, $lt: notAfter}})
                            .sort({"price":-1,"updated":-1})
                            .limit(1);

            cursor.each(function(err, doc) {
                if (doc != null) {
                    callback(doc);
                }
            });
            //db.close();
            
        } else {
            console.log(err);
            callback();
        }
    });

}

db.find = (url, collection, query, callback) => {

    if (conf.general.debug) console.info("getAll(): Get All Records");
    if (!url || !collection) callback(undefined);

    mongodb.connect(url, (err, db) => {
        if (conf.general.debug) console.info("getAll(): Connect Result:", err);
        if (!err) {
            var cursor = db.collection(collection).find(query);
            var ret = [];

            cursor.each(function(err, doc) {
                if (doc != null) {
                    ret.push(doc);
                }
            });
            db.close();
            callback(ret);
            
        } else {
            console.log(err);
            callback();
        }
    });

}
