const express = require('express');
const router = express.Router();
const openecc = require('../lib/openecc');
const fs = require("fs");
const context = require("../context");

/* GET home page. */
router.get('/', function(req, res, next) {
    res.status(200).json(context)
});

// console.log(context);

router.get('/verifiablecredential', function(req, res, next) {     
    // pretty res
    res.set({'Content-Type': 'application/ld+json; charset=utf-8'}).status(200).send(JSON.stringify({ "@context": [{"@version": 1.1},context.verifiableCredential]}, undefined, ' '));
});

router.get('/presentation', function(req, res, next) {     
    // pretty res
    res.set({'Content-Type': 'application/ld+json; charset=utf-8'}).status(200).send(JSON.stringify({"@context" : [{"@version": 1.1},context.presentation]}, undefined, ' '));
});

router.get('/cucredentialsubject', function(req, res, next) {     
    // pretty res
    res.set({'Content-Type': 'application/ld+json; charset=utf-8'}).status(200).send(JSON.stringify({ "@context": [{"@version": 1.1},context.cucredentialSubject]}, undefined, ' '));
});

router.get('/termsofuse', function(req, res, next) {     
    // pretty res
    res.set({'Content-Type': 'application/ld+json; charset=utf-8'}).status(200).send(JSON.stringify({ "@context": [{"@version": 1.1},context.termsOfUse]}, undefined, ' '));
});

router.get('/prohibition', function(req, res, next) {     
    // pretty res
    res.set({'Content-Type': 'application/ld+json; charset=utf-8'}).status(200).send(JSON.stringify({ "@context": [{"@version": 1.1},context.prohibition]}, undefined, ' '));
});

router.get('/verifiablecredentialall', function(req, res, next) {     
    // pretty res
    res.set({'Content-Type': 'application/ld+json; charset=utf-8'}).status(200).send(JSON.stringify({ "@context": [{"@version": 1.1},context.verifiableCredentialAll]}, undefined, ' '));
});

router.get('/presentationall', function(req, res, next) {     
    // pretty res
    res.set({'Content-Type': 'application/ld+json; charset=utf-8'}).status(200).send(JSON.stringify({ "@context": [{"@version": 1.1},context.presentationAll]}, undefined, ' '));
});

router.get('/security', function(req, res, next) {     
    // pretty res
    res.redirect('https://web-payments.org/contexts/security-v2.jsonld')
});

module.exports = router;
