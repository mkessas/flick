var db = require('../modules/db');
var mealpicker = module.exports;

var conf;

mealpicker.init = (c) => {
    conf = c;
    if (conf.general.debug) {
        console.info("init(): Configuration:\n", c);
    }
    db.init(conf);
}

mealpicker.getMeals = (callback) => { 
    var ret = db.getMeals();
    callback(ret);
}


