var express = require('express');
var MFA = require('../modules/mfa');
var Log = require('../modules/logs');

var router = express.Router();
var conf;
var log;
var mfa;

router.conf = (c) => {
    conf = c;
    //mfa.conf(c);
    log = new Log(c);
    mfa = new MFA(c);
};

router.use((req, res, next) => {

    if (!req.session.user) {
        res.status(401).json({ status: "err", details: "Authentication Required" });
    } else {
        if (!req.session.isAdmin) {
            res.status(403).json({ status: "err", details: "Insufficient Privileges" });
        } else {
            next();
        }
    }
});

router.get('/search', (req,res,next) => {

    //log.log({user: req.session.user, type: "search", details: "Searched for " + req.query.q});
    mfa.search(req.query.q, req.session.details, (ret, err) => {
        if (err) {
            res.json({status: "err", message: err});
        } else {
            res.json({status: "ok", details: ret});
        }
    });
});

router.get('/users', (req, res, next) => {

    log.log({user: req.session.user, type: "list", details: "Retrieved User List"});
    mfa.getUsers(req.query.q, req.session.company, (ret, err) => {
        if (err) {
            res.json({status: "err", message: err});
        } else {
            res.json({status: "ok", details: ret});
        }
    });
});

router.put('/users', (req, res,next) => {
    var user = req.body;

    if (!user) {
        res.json({status: "err", message: "Missing Required Argument" });
        return;
    }

    mfa.registerUser(user, req.session.company, (err) => {
        if (err) {
            res.json({status: "err", message: err});
            log.log({user: req.session.user, type: "register", details: "Register user " + user.id + " Failed: " + err});
        } else {
            res.json({status: "ok", details: { message: "User Added Successfully"} });
            log.log({user: req.session.user, type: "register", details: "Register user " + user.id + " Successful"});
        }
    });
});

router.get('/history', (req, res, next) => {

    log.log({user: req.session.user, type: "history", details: "Retrieved Audit Log"});
    log.getLog((ret, err) => {
        if (err) {
            res.json({status: "err", message: err});
        } else {
            res.json({status: "ok", details: ret});
        }
    });
});


router.delete('/users/:user',  (req, res, next) => {

    log.log({user: req.session.user, type: "delete", details: "Deleted User " + req.params.user});
    mfa.deleteUser(req.params.user, req.session.company, (ret, err) => {
        if (err) {
            res.json({status: "err", message: err});
        } else {
            res.json({status: "ok", details: ret});
        }
    });
});

router.put('/users/:user/status', (req, res, next) => {

    var status = req.body.status == "Active" ? "false" : "true";

    log.log({user: req.session.user, type: "change", details: "Changed User Status of " + req.params.user + " to " + req.body.status});
    mfa.modifyUser(req.params.user, req.session.company, { sptotpdisabled: status},  (ret, err) => {
        if (err) {
            res.json({status: "err", message: err.message});
        } else {
            res.json({status: "ok", details: { message: ret, status: req.body.status } });
        }
    });
});

router.put('/users/:user/type', (req, res, next) => {

    log.log({user: req.session.user, type: "type", details: "Changed Token Type for  User " + req.params.user + " to " + req.body.type});
    mfa.modifyUser(req.params.user, req.session.company, { sptotptype: req.body.type ? req.body.type : "Soft"},  (ret, err) => {
        if (err) {
            res.json({status: "err", message: err.message});
        } else {
            res.json({status: "ok", details: { message: ret, type: req.body.type } });
        }
    });
});

router.post('/users/:user/token', (req, res, next) => {

    var user = req.params.user;
    var company = req.session.company;
    var type = req.body.type ? req.body.type : "Hard";

    mfa.assignToken(user, company, type, req.body.serial, (ret, err) => {

      if (err) {
        log.log({user: req.session.user, type: "assign", details: "Failed to retrieve new token for User " + user + ": " + err});
        res.json({status: "err", message: "Unable to assign new token"});
      } else {
        log.log({user: req.session.user, type: "assign", details: "Retrieved new token for User " + user});
        res.json({status: "ok", details:{ serial: ret, type, message: "Successfully assigned new token" } });
      }

    });
});

router.get('/agency', (req,res,next) => {
    try {
        res.json({status: "ok", details: { agency: req.session.details.agency}});
    } catch (e) {
        res.json({status: "err", message: e});
    }
});

module.exports = router;
