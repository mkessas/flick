var express = require('express');
var router = express.Router();
var flick = require('../modules/flick');

/*
router.use( (req, res, next) => {

    if (!req.session.user) {
        res.status(401).json({ status: "err", details: "Authentication Required" });
    } else {
        next();
    }
});
*/


router.get('/price', (req, res, next) => {
    res.json({status: "ok", details: flick.getPrice()});
});

router.get('/update', (req, res, next) => {
    flick.updatePrice();
    res.json({status: "ok", details: "Triggered Price Update"});
});

module.exports = router;
