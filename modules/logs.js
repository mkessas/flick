var fs = require('fs');

module.exports = class Log {

    constructor(c) {
        this.conf = c;
    }

    log(c) {
        var now = new Date();
        var msg = now.toISOString() + "\t" + c.user + "\t" + c.type + "\t" + c.details + '\n';
        fs.appendFile(this.conf.log.logfile, msg);
    }

    getLog(callback) {

        var logs = [];

        var l = fs.readFile(this.conf.log.logfile, (err, data) => {
            if (err) {
                callback(null, err);
            } else {
                data.toString().split('\n').forEach( l => {
                    let [time, user, type, details] = l.split('\t');
                    if (details) logs.unshift({time, user, type, details});
                });
                callback (logs);
            }
        });

    }
}

