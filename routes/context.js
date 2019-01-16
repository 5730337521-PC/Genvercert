const express = require('express');
const router = express.Router();
const openecc = require('../lib/openecc');
const fs = require("fs");
const context = require("../context");

/* GET home page. */
router.get('/', function(req, res, next) {
    res.status(200).json(context)
});

router.get('/verifiablecredential', function(req, res, next) {     
    // pretty res
    res.set({'Content-Type': 'application/json; charset=utf-8'}).send(200, JSON.stringify({"@context" : context.verifiableCredential}, undefined, ' '));
});

router.get('/presentation', function(req, res, next) {     
    // pretty res
    res.set({'Content-Type': 'application/json; charset=utf-8'}).send(200, JSON.stringify({"@context" : context.presentation}, undefined, ' '));
});

router.get('/cucredentialsubject', function(req, res, next) {     
    // pretty res
    res.set({'Content-Type': 'application/json; charset=utf-8'}).send(200, JSON.stringify({"@context" : context.cucredentialSubject}, undefined, ' '));
});

router.get('/termsofuse', function(req, res, next) {     
    // pretty res
    res.set({'Content-Type': 'application/json; charset=utf-8'}).send(200, JSON.stringify({"@context" : context.termsOfUse}, undefined, ' '));
});

router.get('/prohibition', function(req, res, next) {     
    // pretty res
    res.set({'Content-Type': 'application/json; charset=utf-8'}).send(200, JSON.stringify({"@context" : context.prohibition}, undefined, ' '));
});

router.get('/verifiablecredentialall', function(req, res, next) {     
    // pretty res
    res.set({'Content-Type': 'application/json; charset=utf-8'}).send(200, JSON.stringify({"@context" : context.verifiableCredentialAll}, undefined, ' '));
});

router.get('/presentationall', function(req, res, next) {     
    // pretty res
    res.set({'Content-Type': 'application/json; charset=utf-8'}).send(200, JSON.stringify({"@context" : context.presentationAll}, undefined, ' '));
});

module.exports = router;