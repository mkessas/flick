var express = require('express');
var router = express.Router();

router.use( (req, res, next) => {

    if (!req.session.user) {
        res.status(401).json({ status: "err", details: "Authentication Required" });
    } else {
        next();
    }
});


router.get('/identity', (req,res,next) => {
    try {
        res.json({
            status: "ok",
            details: {
                agency: req.session.details.agency,
                admin: req.session.isAdmin,
                logoutUrl: req.session.details.logoutUrl,
                user: req.session.user
            }
        });
    } catch (e) {
        res.json({status: "err", message: "Identity details missing, please contact an administrator"});
    }

});

router.get('/token', (req, res, next) => {

    log.log({user: req.session.user, type: "list", details: "Retrieved Personal Token"});
    mfa.getUser(req.session.user, req.session.company, (ret, err) => {
        if (err) {
            res.json({status: "err", message: err});
        } else {
            res.json({status: "ok", details: ret.sptotpsecret});
        }
    });
});

module.exports = router;
