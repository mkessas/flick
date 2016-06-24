var express = require('express');
var router = express.Router();
var path = require('path');

var conf;

router.conf = (c) => {
  conf = c;
}

router.use((req, res, next) => {

    if (!req.session.isAdmin) {
        res.status(403).json({ status: "err", details: "Insufficient Privileges" });
    } else {
        next();
    }
});


router.use((req, res, next) => {

    try {
        res.sendFile(path.join(__dirname, '..', conf.static.directory, "admin", req._parsedUrl.pathname));
    } catch (e) {
        res.status(404).send("<html><head><title>Not Found</title><body><h4>File Not Found</h4> "+e+"</body></html>");
    }

});

module.exports = router;
