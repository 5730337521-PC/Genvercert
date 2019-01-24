const express = require('express');
const router = express.Router();
const openecc = require('../lib/openecc');
const fs = require("fs");

const sevprivatekey =  fs.readFileSync('./certchain/cunex.key','utf8')
const sevcert = fs.readFileSync('./certchain/cunex.crt','utf8')
const rootcert = fs.readFileSync('./certchain/root.crt','utf8')


/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.post('/signcsr', function(req, res, next) {
  csr = req.body.csr
  // console.log("csr:\n",csr)
  // console.log("privatekey:\n", sevprivatekey)
  const options = {
    signerkey : sevprivatekey, //signer private key
    cert : sevcert,
    csr : csr,
    days : "30",
    extFile : "",
    config : "",
  }
  openecc.signCSRwithCert(options,(option,cert)=>{
    console.log("cert:\n",cert)
    var certchain  = [sevcert,cert.certificate]
    res.send(certchain);
  })
})

router.post('/verifychain', function(req, res, next) {
  certificateChain = req.body.certificateChain
  if(certificateChain != null){
    console.log("certificateChain:\n", certificateChain)
    openecc.verifyCertificateChain(certificateChain,rootcert,(option,result)=>{
      console.log("option:\n",option)
      // console.log(result)
      if(result.includes("OK")){
        res.status(200).json({result : "verified"});
      }else{
        res.status(200).json({result :"verification fail"});
      }
    })
  } else{
    res.status(200).json({result :"verification fail, certificateChain is empty"});
  }

})

router.post('/cusign', function(req, res, next) {
  //todo
  document = req.body.document
  
  })

router.post('/studentsign', function(req, res, next) {
  //todo
})



router.post('/docverify', function(req, res, next) {
//todo
})

router.post('/consentverify', function(req, res, next) {
//todo
})

router.post('/verify', function(req, res, next) {
//todo
})

module.exports = router;
