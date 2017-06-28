const request = require('request');
const db = require('../modules/db');
const flick = module.exports;

var conf;
var token;
var price;
var max, min;

flick.init = (c) => {

    conf = c;

    if (!conf.flick.refresh) conf.flick.refresh = 60;

    if (conf.general.debug) {
        console.info("init(): Configuration:\n", c);
    }


    var today = new Date();

    if (conf.db.enabled) {
        db.init(conf);
        db.getMax((today.getYear() + 1900) + "-" + (today.getMonth() + 1) + "-" + today.getDate(), (ret) => max = ret);
        db.getMin((today.getYear() + 1900) + "-" + (today.getMonth() + 1) + "-" + today.getDate(), (ret) => min = ret);
    }

}

flick.getPrice = () => { return { price, min, max }; }

flick.updatePrice = (loopback) => {
    if (!token) {
        flick.updateToken(flick.updatePrice);
        return;
    }

    var options = {
        url: conf.flick.portal.url,
        headers: {
            'User-Agent': 'Mozilla/5.0 (Linux; Android 5.1.1; GT-N7100 Build/LMY48G) AppleWebKit/537.36 (KHTML, like Gecko)',
            'Authorization': 'Bearer ' + token
        }
    }

    if (conf.general.debug) { console.info("updatePrice(): Sending Request:\n", options); }

    request(options, (error, response, body) => {

        if (conf.general.debug) { console.info("updatePrice(): Server Response:\n", body); }

        try {
            if (response.headers['content-type'].indexOf('json') > -1) {
                ret = JSON.parse(body);

                if (conf.general.debug) { console.info("updatePrice(): Setting Price to", ret.needle.price); }

            }
        } catch (e) {
            console.log("Failed to parse response: ", e);
            return;
        }

        // Check if date rolled over first
        if (price) {
            var now = new Date();
            var last = new Date(price.updated);
            if (now.getDate() != last.getDate()) {
                min = undefined;
                max = undefined;
            }
        }
        
        let tax = 1.0;

        if (conf.tax.enabled && conf.tax.percent) {
             tax = 1 + conf.tax.percent / 100;
        }

        if (conf.general.debug) { console.info("Tax is: ", tax); }

        price = { 
            price: Math.round(ret.needle.price*Math.pow(10,2))/Math.pow(10,2),
            total: Math.round(ret.needle.price * tax * Math.pow(10,2))/Math.pow(10,2), 
            components: ret.needle.components,
            updated: new Date() 
        };

        if (!max || price.price > max.price) max = price;
        if (!min || price.price < min.price) min = price;

        if (conf.db.enabled) db.insert(price);

    });

    if (loopback) setTimeout(() => flick.updatePrice(true), conf.flick.refresh * 1000);
}

flick.updateToken = (callback) => {

    let form = {
        grant_type: 'password',
        client_id: 'le37iwi3qctbduh39fvnpevt1m2uuvz',
        client_secret: 'ignwy9ztnst3azswww66y9vd9zt6qnt',
        username: conf.flick.email,
        password: conf.flick.password,
    }

    if (conf.general.debug) { console.info("updateToken(): Sending Request:\n", form); }

    request.post(conf.flick.oauth.url, { form }, (error, response, body) => {

        if (conf.general.debug) { console.info("updateToken(): Received Response:\n", body); }

        if (!error && response.statusCode == 200) {
            try {
                if (response.headers['content-type'].indexOf('json') > -1) {
                    ret = JSON.parse(body);
                    token = ret.id_token;
                    callback(null);
                }
            } catch (e) {
                console.log("Failed to parse response: ", e);
            }
        }
    })
}
