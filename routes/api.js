const express = require('express');
const router = express.Router();
const flick = require('../modules/flick');
module.exports = router;

router.get('/price', (req, res, next) => {

    res.json({status: "ok", details: flick.getPrice()});

});

router.get('/update', (req, res, next) => {

    flick.updatePrice();
    res.json({status: "ok", details: "Triggered Price Update"});

});

