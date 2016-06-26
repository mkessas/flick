var request = require('request');

module.exports = class Flick {

    constructor (c) {
        this.conf = c;
        this.form = {
            grant_type: 'password',
            client_id: 'le37iwi3qctbduh39fvnpevt1m2uuvz',
            client_secret: 'ignwy9ztnst3azswww66y9vd9zt6qnt',
            username: this.conf.flick.email,
            password: this.conf.flick.password,
        }
        this.updatePrice(); 

    }

    updatePrice() {
        console.log("This form", this.form);
        request.post(this.conf.flick.oauth.url, { form: this.form }, (error, response, body) => {
            console.log(body);
            /*
            if (!error && response.statusCode == 200) {
                console.log(body) // Show the HTML for the Google homepage.
            }
            */
        })
    }
}
