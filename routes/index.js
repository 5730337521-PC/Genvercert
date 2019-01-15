var express = require('express');
var router = express.Router();
var openecc = require('../lib/openecc');

const sevprivatekey =  '-----BEGIN RSA PRIVATE KEY-----\nMIIEogIBAAKCAQEAtbCrzkBEFSY5TdHC5VmJHvtdnx83ZPc+vSK/oXrFSkzMTVQs\n2cd76exCYlcBuDE1evHPBQuzFyNykw/XibW+mc6bJSqAdKcVCufSIT/SroSbZbam\nZP6n4TmEpDCmTdEYgqIsoXrfMZpyvhOL4CUU1SU9mg45OswuPsrtqM1Zg/FzV4cJ\ngfzKM9zUPxi+KSpsFUp2CIX/qgrYoAtOQhw3eTmNgP4j7uZ2DltBrTUaevjCN6XC\nanM470kAtYji7P9Tcbq3Q55klCme2dijb7VHKXssZDwF+1aueEhd1lQupZKJ8I8E\n1tdv7Ko38mkwC+sNgkAsASyoHMukvXZNnGy8JQIDAQABAoIBAH5B5UIQer9Prqab\nS5phW95Bw09eO/pXrit0yEIItKzrLVXXVsuHyl5GJeN8nt9Goulqu/e/p5Y+tdHo\nQlmaCHeNkVaEcHuf2AmaCvW8CkXoNKy7/mlUZYknlTsb65VL5oJw/B7C6fLoZzAb\nGSqL2iw8EtDJbY+kb8aG8hxJhxkeNmJyUXWvgIMA+usmM2yPhO92lpWx5q8zN/43\nGx3BSPCwvll9aQGeuiQND5JGYn0S5LcLxCe2lNXmsd+Kh2LBw2pEuJeDEzFOf69H\n3uZq7fO+BrUDJlzoet2gUUgBoU4kl7QkyloiCFnebC+CytItS9zIOGzLFaGRbw6/\nWc7PqAECgYEA446C6vNvC4iAOEBGuyFbjZNaOEqeR+XEEoMyebK4wFWgQBs6K4CB\nN+Aa5ta71Yb6Tuix+BN/29jiMetxBwb8Frq+feWIBJHmo+WnubzRHcL4Kcb6+hNP\nnjV3IKn5fJOBEvK0Jgeeoy+HMmjSoVFruOOcmJ2pSBXSCM2lZtQ6HwECgYEAzGZ+\nyQ8A6/kpbFxZv72aZ2Oe1bywMIxsxxJLpCJnGqAwRTB0nnbIpjaTQhjZUeKG2vPA\nYi6Y/o8XUHJD+uXQqCKs1j4DyZVyz52jeLvdFpOx6S2eP8/irzo+dvftDXjp+4M1\njGuRPaKfeW93crIh5R4PPLRQmihqQ/EViHUnQSUCgYAtrhoR2DReeFRk9mI8hoG+\ndeoSisgjXrhxjuy/CWWVFptIwy52NSG7eb1swYaLYsE0vfmb9y4fj/Y4Vy8lXf2V\nAn/i/gTEBhXqqNt2qbTA6LawjEUtllrRQ6JaaESxAVtT1mzbhYQO9ieJswk1YQbi\n4q445M1qrxautbmSXuAcAQKBgCmolhyKR0jQzmV8aPpQPWDnB99OBqbOZ/kmvG3m\naRcfINdpKcuGMBzYMKkfAWPUBGIpncMk9h+jsD/AGiTPo/gwoQNFPmZeZDj2SvP3\nbfcFARSiLIea6fuGpmZ+3zyIsT+GnWpSHhbuxwvr8O9aaNgWiUp5AZh5tjbEsvvN\nzMNVAoGAawJRlB4d4fuDqcCJXdGvt0S47c/HFV0b4PiuXuUBEKOVZZBZWSXyYZmm\nEGhC43EXuBbQWgtTdWmSIHHiAPj52bA5jdIgWkusC9E6q6n5aqmtBUZthExLS+wF\nDzlsj5cy21WvCFjf3AgymJga2erIUQKjTxCbrGyvpr00EK1ik8M=\n-----END RSA PRIVATE KEY-----\n';
const sevcert = '-----BEGIN CERTIFICATE-----\nMIICvzCCAmYCCQDn6dUjcju8mzAKBggqhkjOPQQDAjB/MQswCQYDVQQGEwJUSDEQ\nMA4GA1UECAwHQmFuZ2tvazEQMA4GA1UEBwwHQmFuZ2tvazENMAsGA1UECgwEUk9P\nVDENMAsGA1UECwwEUk9PVDERMA8GA1UEAwwIUk9PVC5jb20xGzAZBgkqhkiG9w0B\nCQEWDFJPT1RAYWJjLmNvbTAeFw0xODEyMjUwMzEwMjhaFw0xOTEyMjAwMzEwMjha\nMIGFMQswCQYDVQQGEwJUSDEQMA4GA1UECAwHQmFuZ2tvazEQMA4GA1UEBwwHQmFu\nZ2tvazEOMAwGA1UECgwFY3VuZXgxDjAMBgNVBAsMBWN1bmV4MRIwEAYDVQQDDAlj\ndW5leC5jb20xHjAcBgkqhkiG9w0BCQEWD2N1bmV4QGN1bmV4LmNvbTCCASIwDQYJ\nKoZIhvcNAQEBBQADggEPADCCAQoCggEBALWwq85ARBUmOU3RwuVZiR77XZ8fN2T3\nPr0iv6F6xUpMzE1ULNnHe+nsQmJXAbgxNXrxzwULsxcjcpMP14m1vpnOmyUqgHSn\nFQrn0iE/0q6Em2W2pmT+p+E5hKQwpk3RGIKiLKF63zGacr4Ti+AlFNUlPZoOOTrM\nLj7K7ajNWYPxc1eHCYH8yjPc1D8YvikqbBVKdgiF/6oK2KALTkIcN3k5jYD+I+7m\ndg5bQa01Gnr4wjelwmpzOO9JALWI4uz/U3G6t0OeZJQpntnYo2+1Ryl7LGQ8BftW\nrnhIXdZULqWSifCPBNbXb+yqN/JpMAvrDYJALAEsqBzLpL12TZxsvCUCAwEAATAK\nBggqhkjOPQQDAgNHADBEAiAch5L1BBs4VI6Op55fD/iY+NCZS0GJ4Owd23k+GTPW\nFAIgLB/hzRHIvEr1RFuQ1SvAIfv2asVmer9lZ8yPL36QA98=\n-----END CERTIFICATE-----'
const rootcert = '-----BEGIN CERTIFICATE-----\nMIICSTCCAe6gAwIBAgIJAOYMcCZ0CP8PMAoGCCqGSM49BAMCMH8xCzAJBgNVBAYT\nAlRIMRAwDgYDVQQIDAdCYW5na29rMRAwDgYDVQQHDAdCYW5na29rMQ0wCwYDVQQK\nDARST09UMQ0wCwYDVQQLDARST09UMREwDwYDVQQDDAhST09ULmNvbTEbMBkGCSqG\nSIb3DQEJARYMUk9PVEBhYmMuY29tMB4XDTE4MTIyNDEwMTMyM1oXDTE5MTIyNDEw\nMTMyM1owfzELMAkGA1UEBhMCVEgxEDAOBgNVBAgMB0Jhbmdrb2sxEDAOBgNVBAcM\nB0Jhbmdrb2sxDTALBgNVBAoMBFJPT1QxDTALBgNVBAsMBFJPT1QxETAPBgNVBAMM\nCFJPT1QuY29tMRswGQYJKoZIhvcNAQkBFgxST09UQGFiYy5jb20wWTATBgcqhkjO\nPQIBBggqhkjOPQMBBwNCAAQflRInwib33kFf72L8i7qtJftJ/84CcxGbwBXkCqd3\niAzoml1PfN5z9oaKtLpzJEuX+ZM3x360gA8KfS0uheUvo1MwUTAdBgNVHQ4EFgQU\nMEgUc0GLJSuh+m/usgdJFQjen2QwHwYDVR0jBBgwFoAUMEgUc0GLJSuh+m/usgdJ\nFQjen2QwDwYDVR0TAQH/BAUwAwEB/zAKBggqhkjOPQQDAgNJADBGAiEAqZPdJ0WJ\nYaicWxG1Zr/3h/FO2HLaS32CvoOWibimcc0CIQC63dsYxux6Xc4tFP/RsPIiw0W2\nojIqgF8XSr19W0L0Tw==\n-----END CERTIFICATE-----'


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
    var certchain  = sevcert+"\n"+cert.certificate
    res.send(certchain);
  })
})

router.post('/verifychain', function(req, res, next) {
  certificateChain = req.body.certificateChain
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
