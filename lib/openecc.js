const crypto = require('crypto');
const net = require('net');
const openssl = require('./openssl');
const helper = require('./helper');

module.exports.createPrivateKey = createPrivateKey;
module.exports.getPublicKey = getPublicKey;
module.exports.createCSR = createCSR;
module.exports.createCertificate = createCertificate;
module.exports.verifyCertificateChain = verifyCertificateChain;
module.exports.signCSRwithCert = signCSRwithCert;
module.exports.readCertificateInfo = readCertificateInfo;
module.exports.checkCertificate = checkCertificate;
module.exports.config = config;

// Gen privatekey using secp256k1
// cmd: openssl ecparam -name secp256k1 -genkey -out pk1.key
function createPrivateKey(callback){
  openssl.exec(['ecparam','-name','prime256v1','-genkey'], 'EC PRIVATE KEY', function (sslErr, key) {
    if (sslErr) {
      console.log(sslErr)
    }
    callback(key)
  });
};
  
// get pubkey from PublicKey
function getPublicKey(certificate,callback){
  if (!callback && typeof certificate === 'function') {
    callback = certificate
    certificate = undefined
  }
  certificate = (certificate || '').toString()
  var params
  if (certificate.match(/BEGIN(\sNEW)? CERTIFICATE REQUEST/)) {
    params = ['req',
      '-in',
      '--TMPFILE--',
      '-pubkey',
      '-noout'
    ]
  } else if (certificate.match(/BEGIN EC PRIVATE KEY/)) {
    params = ['ec',
      '-in',
      '--TMPFILE--',
      '-pubout'
    ]
  } else {
    params = ['x509',
      '-in',
      '--TMPFILE--',
      '-pubkey',
      '-noout'
    ]
  }
  openssl.exec(params, 'PUBLIC KEY', certificate, function (error, key) {
    if (error) {
      return callback(error)
    }
    return callback(null, {
      publicKey: key
    })
  })
};

// cmd: openssl req -new -subj /C=TH/ST=Bangkok/L=Bangkok/O=KBTG/OU=BlockChain/CN=sss.com/emailAddress=abc@abc.com -key pk1.key -out csr.csr
function createCSR (options, callback) {
  if (!callback && typeof options === 'function') {
    callback = options
    options = undefined
  }
  options = options || {}
  // Required field https://knowledge.digicert.com/solution/SO16317.html
  
  //common name field
  if (options.commonName && (net.isIPv4(options.commonName) || net.isIPv6(options.commonName))) {
    if (!options.altNames) {
      options.altNames = [options.commonName]
    } else if (options.altNames.indexOf(options.commonName) === -1) {
      options.altNames = options.altNames.concat([options.commonName])
    }
  }
  if (!options.clientKey) {
    createPrivateKey(function (err, key) {
      if (err) {
        console.log(err)
      }
      // console.log(key.privateKey)  
      options.clientKey = key.privateKey
      createCSR(options, callback)
    });
    return
  }
  var params = ['req',
    '-new'
  ]
  if (options.csrConfigFile) {
    params.push('-config')
    params.push(options.csrConfigFile)
  } else {
    params.push('-subj')
    params.push(generateCSRSubject(options))
  }
  params.push('-key')
  params.push('--TMPFILE--')
  var tmpfiles = [options.clientKey]
  var config = null
  if (options.altNames && Array.isArray(options.altNames) && options.altNames.length) {
    params.push('-extensions')
    params.push('v3_req')
    params.push('-config')
    params.push('--TMPFILE--')
    var altNamesRep = []
    for (var i = 0; i < options.altNames.length; i++) {
      altNamesRep.push((net.isIP(options.altNames[i]) ? 'IP' : 'DNS') + '.' + (i + 1) + ' = ' + options.altNames[i])
    }
    tmpfiles.push(config = [
      '[req]',
      'req_extensions = v3_req',
      'distinguished_name = req_distinguished_name',
      '[v3_req]',
      'subjectAltName = @alt_names',
      '[alt_names]',
      altNamesRep.join('\n'),
      '[req_distinguished_name]',
      'commonName = Common Name',
      'commonName_max = 64'
    ].join('\n'))
  } else if (options.config) {
    config = options.config
  }
  var delTempPWFiles = []
  if (options.clientKeyPassword) {
    helper.createPasswordFile({'cipher': '', 'password': options.clientKeyPassword, 'passType': 'in'}, params, delTempPWFiles[delTempPWFiles.length])
  }
  openssl.exec(params, 'CERTIFICATE REQUEST', tmpfiles, function (sslErr, data) {
    // console.log("params",params)
    function done (err) {
      if (err) {
        return callback(err)
      }
      callback(null, {
        csr: data,
        config: config,
        clientKey: options.clientKey
      })
    }
    helper.deleteTempFiles(delTempPWFiles, function (fsErr) {
      done(sslErr || fsErr)
    })
  })
}

//openssl x509 -signkey pk1.key -in csr.csr -req -days 365 -out cert.crt
function signCSRwithCert (options, callback) {
  if (!callback && typeof options === 'function') {
    callback = options
    options = undefined
  }
  options = options || {}
  if (!options.csr) {
    console.error("need csr in option")
    return
  }
  if (!options.signerkey) {
    console.error("need signkey in option")
    return
  }
  if (!options.cert) {
    console.error("need cert that associate with signkey in option")
    return
  }

  //openssl x509 -req -days 360 -in student.csr -CA cunex.crt -CAkey cunex.key -CAcreateserial -out student.crt
  var params = [    
    'x509',
    '-req',
    '-days',
    Number(options.days) || '365',
    '-in',
    '--TMPFILE--',
    '-CA',
    '--TMPFILE--',
    '-CAkey',
    '--TMPFILE--',
    '-CAcreateserial'
  ]
  var tmpfiles = [options.csr,options.cert,options.signerkey]
  console.log("tempfile ",tmpfiles)
  var delTempPWFiles = []
  if (options.config) {
    params.push('-extensions')
    params.push('v3_req')
    params.push('-extfile')
    params.push('--TMPFILE--')
    tmpfiles.push(options.config)
  } else if (options.extFile) {
    params.push('-extfile')
    params.push(options.extFile)
  }
  openssl.exec(params, 'CERTIFICATE', tmpfiles, function (sslErr, data) {
    console.log("params",params)
    console.log("tmpfiles",tmpfiles)
    function done (err) {
      if (err) {
        return callback(err)
      }
      var response = {
        csr: options.csr,
        certificate: data,
        signerkey: options.signerkey
      }
      return callback(null, response)
    }
    helper.deleteTempFiles(delTempPWFiles, function (fsErr) {
      done(sslErr || fsErr)
    })
  })
}

function createCertificate (options, callback) {
  if (!callback && typeof options === 'function') {
    callback = options
    options = undefined
  }
  options = options || {}
  if (!options.csr) {
    createCSR(options, function (error, keyData) {
      if (error) {
        return callback(error)
      }
      options.csr = keyData.csr
      options.config = keyData.config
      options.clientKey = keyData.clientKey
      createCertificate(options, callback)
    })
    return
  }
  if (!options.serviceKey) {
    if (options.selfSigned) {
      options.serviceKey = options.clientKey
    } else {
      createPrivateKey(function (error, key) {
        if (error) {
          return callback(error)
        }
        options.serviceKey = key.privateKey
        // console.log("options.serviceKey = key.privateKey ",options.serviceKey);
        createCertificate(options, callback)
      })
      return
    }
  }
  var params = [    
    'x509',
    '-req',
    '-' + (options.hash || 'sha256'),
    '-days',
    Number(options.days) || '365',
    '-in',
    '--TMPFILE--'
  ]
  var tmpfiles = [options.csr]
  console.log("tempfile ",tmpfiles)
  var delTempPWFiles = []
  if (options.serviceCertificate) {
    params.push('-CA')
    params.push('--TMPFILE--')
    params.push('-CAkey')
    params.push('--TMPFILE--')
    if (options.serial) {
      params.push('-set_serial')
      if (helper.isNumber(options.serial)) {
        // set the serial to the max lenth of 20 octets ()
        // A certificate serial number is not decimal conforming. That is the
        // bytes in a serial number do not necessarily map to a printable ASCII
        // character.
        // eg: 0x00 is a valid serial number and can not be represented in a
        // human readable format (atleast one that can be directly mapped to
        // the ACSII table).
        params.push('0x' + ('0000000000000000000000000000000000000000' + options.serial.toString(16)).slice(-40))
      } else {
        if (helper.isHex(options.serial)) {
          if (options.serial.startsWith('0x')) {
            options.serial = options.serial.substring(2, options.serial.length)
          }
          params.push('0x' + ('0000000000000000000000000000000000000000' + options.serial).slice(-40))
        } else {
          params.push('0x' + ('0000000000000000000000000000000000000000' + helper.toHex(options.serial)).slice(-40))
        }
      }
    } else {
      params.push('-CAcreateserial')
    }
    if (options.serviceKeyPassword) {
      helper.createPasswordFile({'cipher': '', 'password': options.serviceKeyPassword, 'passType': 'in'}, params, delTempPWFiles[delTempPWFiles.length])
    }
    tmpfiles.push(options.serviceCertificate)
    tmpfiles.push(options.serviceKey)
  } else {
    params.push('-signkey')
    params.push('--TMPFILE--')
    if (options.serviceKeyPassword) {
      helper.createPasswordFile({'cipher': '', 'password': options.serviceKeyPassword, 'passType': 'in'}, params, delTempPWFiles[delTempPWFiles.length])
    }
    tmpfiles.push(options.serviceKey)
  }
  if (options.config) {
    params.push('-extensions')
    params.push('v3_req')
    params.push('-extfile')
    params.push('--TMPFILE--')
    tmpfiles.push(options.config)
  } else if (options.extFile) {
    params.push('-extfile')
    params.push(options.extFile)
  }
  if (options.clientKeyPassword) {
    helper.createPasswordFile({'cipher': '', 'password': options.clientKeyPassword, 'passType': 'in'}, params, delTempPWFiles[delTempPWFiles.length])
  }
  openssl.exec(params, 'CERTIFICATE', tmpfiles, function (sslErr, data) {
    console.log("params",params)
    console.log("tmpfiles",tmpfiles)
    function done (err) {
      if (err) {
        return callback(err)
      }
      var response = {
        csr: options.csr,
        clientKey: options.clientKey,
        certificate: data,
        serviceKey: options.serviceKey
      }
      return callback(null, response)
    }
    helper.deleteTempFiles(delTempPWFiles, function (fsErr) {
      done(sslErr || fsErr)
    })
  })
}

function readCertificateInfo (certificate, callback) {
  if (!callback && typeof certificate === 'function') {
    callback = certificate
    certificate = undefined
  }
  certificate = (certificate || '').toString()
  var isMatch = certificate.match(/BEGIN(\sNEW)? CERTIFICATE REQUEST/)
  var type = isMatch ? 'req' : 'x509'
  var params = [type,
    '-noout',
    '-nameopt',
    'RFC2253,sep_multiline,space_eq',
    '-text',
    '-in',
    '--TMPFILE--'
  ]
  openssl.spawnWrapper(params, certificate, function (err, code, stdout) {
    if (err) {
      return callback(err)
    }
    return fetchCertificateData(stdout, callback)
  })
};

function verifyCertificateChain (certificateChain, rootCert, callback) {
  var params
  var delTempPWFiles = []
  if (!callback && typeof passphrase === 'function') {
    callback = passphrase
    passphrase = undefined
  }
  //openssl verify -CAfile root.crt inter-end.crt
  params = ['verify', '-CAfile', '--TMPFILE--', '--TMPFILE--']
  var tmpfiles = [rootCert,certificateChain]
  openssl.execBinary(params, tmpfiles, function (sslErr, data) {
    // console.log("tmpfiles",tmpfiles)
    // console.log("params",params)
    console.log("data",data.toString('utf8'))
    // console.log("sslErr",sslErr)
    function done (err) {
      if (err) {
        return callback(err)
      }
      return callback(null, data.toString('utf8'))
    }
    helper.deleteTempFiles(delTempPWFiles, function (fsErr) {
      done(sslErr || fsErr)
    })
  })
};

function checkCertificate (certificate, passphrase, callback) {
  var params
  var delTempPWFiles = []
  if (!callback && typeof passphrase === 'function') {
    callback = passphrase
    passphrase = undefined
  }
  certificate = (certificate || '').toString()
  if (certificate.match(/BEGIN(\sNEW)? CERTIFICATE REQUEST/)) {
    params = ['req', '-text', '-noout', '-verify', '-in', '--TMPFILE--']
  } else if (certificate.match(/BEGIN RSA PRIVATE KEY/) || certificate.match(/BEGIN PRIVATE KEY/)) {
    params = ['rsa', '-noout', '-check', '-in', '--TMPFILE--']
  } else {
    params = ['x509', '-text', '-noout', '-in', '--TMPFILE--']
  }
  if (passphrase) {
    helper.createPasswordFile({'cipher': '', 'password': passphrase, 'passType': 'in'}, params, delTempPWFiles[delTempPWFiles.length])
  }
  openssl.spawnWrapper(params, certificate, function (sslErr, code, stdout) {
    function done (err) {
      if (err) {
        return callback(err)
      }
      var result
      switch (params[0]) {
        case 'rsa':
          result = /^Rsa key ok$/i.test(stdout.trim())
          break
        default:
          result = /Signature Algorithm/im.test(stdout)
          break
      }
      callback(null, result)
    }
    helper.deleteTempFiles(delTempPWFiles, function (fsErr) {
      done(sslErr || fsErr)
    })
  })
};

function config (options) {
  Object.keys(options).forEach(function (k) {
    openssl.set(k, options[k])
  })
}

// HELPER FUNCTIONS
function fetchCertificateData (certData, callback) {
  certData = (certData || '').toString()
  var serial, subject, tmp, issuer
  var certValues = {
    issuer: {}
  }
  var validity = {}
  var san
  // serial
  if ((serial = certData.match(/\s*Serial Number:\r?\n?\s*([^\r\n]*)\r?\n\s*\b/)) && serial.length > 1) {
    certValues.serial = serial[1]
  }
  if ((subject = certData.match(/\s*Subject:\r?\n(\s*((C|L|O|OU|ST|CN|DC|emailAddress)\s=\s[^\r\n]+\r?\n))*\s*\b/)) && subject.length > 1) {
    subject = subject[0]
    // country
    tmp = subject.match(/\sC\s=\s([^\r\n].*?)[\r\n]/)
    certValues.country = (tmp && tmp[1]) || ''
    // state
    tmp = subject.match(/\sST\s=\s([^\r\n].*?)[\r\n]/)
    certValues.state = (tmp && tmp[1]) || ''
    // locality
    tmp = subject.match(/\sL\s=\s([^\r\n].*?)[\r\n]/)
    certValues.locality = (tmp && tmp[1]) || ''
    // organization
    tmp = matchAll(subject, /\sO\s=\s([^\r\n].*)/g)
    certValues.organization = tmp ? (tmp.length > 1 ? tmp.sort(function (t, n) {
      var e = t[1].toUpperCase()
      var r = n[1].toUpperCase()
      return r > e ? -1 : e > r ? 1 : 0
    }).sort(function (t, n) {
      return t[1].length - n[1].length
    }).map(function (t) {
      return t[1]
    }) : tmp[0][1]) : ''
    // unit
    tmp = matchAll(subject, /\sOU\s=\s([^\r\n].*)/g)
    certValues.organizationUnit = tmp ? (tmp.length > 1 ? tmp.sort(function (t, n) {
      var e = t[1].toUpperCase()
      var r = n[1].toUpperCase()
      return r > e ? -1 : e > r ? 1 : 0
    }).sort(function (t, n) {
      return t[1].length - n[1].length
    }).map(function (t) {
      return t[1]
    }) : tmp[0][1]) : ''
    // common name
    tmp = matchAll(subject, /\sCN\s=\s([^\r\n].*)/g)
    certValues.commonName = tmp ? (tmp.length > 1 ? tmp.sort(function (t, n) {
      var e = t[1].toUpperCase()
      var r = n[1].toUpperCase()
      return r > e ? -1 : e > r ? 1 : 0
    }).sort(function (t, n) {
      return t[1].length - n[1].length
    }).map(function (t) {
      return t[1]
    }) : tmp[0][1]) : ''
    // email
    tmp = matchAll(subject, /emailAddress\s=\s([^\r\n].*)/g)
    certValues.emailAddress = tmp ? (tmp.length > 1 ? tmp.sort(function (t, n) {
      var e = t[1].toUpperCase()
      var r = n[1].toUpperCase()
      return r > e ? -1 : e > r ? 1 : 0
    }).sort(function (t, n) {
      return t[1].length - n[1].length
    }).map(function (t) {
      return t[1]
    }) : tmp[0][1]) : ''
    // DC name
    tmp = matchAll(subject, /\sDC\s=\s([^\r\n].*)/g)
    certValues.dc = tmp ? (tmp.length > 1 ? tmp.sort(function (t, n) {
      var e = t[1].toUpperCase()
      var r = n[1].toUpperCase()
      return r > e ? -1 : e > r ? 1 : 0
    }).sort(function (t, n) {
      return t[1].length - n[1].length
    }).map(function (t) {
      return t[1]
    }) : tmp[0][1]) : ''
  }
  if ((issuer = certData.match(/\s*Issuer:\r?\n(\s*(C|L|O|OU|ST|CN|DC|emailAddress)\s=\s[^\r\n].*\r?\n)*\s*\b/)) && issuer.length > 1) {
    issuer = issuer[0]
    // country
    tmp = issuer.match(/\sC\s=\s([^\r\n].*?)[\r\n]/)
    certValues.issuer.country = (tmp && tmp[1]) || ''
    // state
    tmp = issuer.match(/\sST\s=\s([^\r\n].*?)[\r\n]/)
    certValues.issuer.state = (tmp && tmp[1]) || ''
    // locality
    tmp = issuer.match(/\sL\s=\s([^\r\n].*?)[\r\n]/)
    certValues.issuer.locality = (tmp && tmp[1]) || ''
    // organization
    tmp = matchAll(issuer, /\sO\s=\s([^\r\n].*)/g)
    certValues.issuer.organization = tmp ? (tmp.length > 1 ? tmp.sort(function (t, n) {
      var e = t[1].toUpperCase()
      var r = n[1].toUpperCase()
      return r > e ? -1 : e > r ? 1 : 0
    }).sort(function (t, n) {
      return t[1].length - n[1].length
    }).map(function (t) {
      return t[1]
    }) : tmp[0][1]) : ''
    // unit
    tmp = matchAll(issuer, /\sOU\s=\s([^\r\n].*)/g)
    certValues.issuer.organizationUnit = tmp ? (tmp.length > 1 ? tmp.sort(function (t, n) {
      var e = t[1].toUpperCase()
      var
        r = n[1].toUpperCase()
      return r > e ? -1 : e > r ? 1 : 0
    }).sort(function (t, n) {
      return t[1].length - n[1].length
    }).map(function (t) {
      return t[1]
    }) : tmp[0][1]) : ''
    // common name
    tmp = matchAll(issuer, /\sCN\s=\s([^\r\n].*)/g)
    certValues.issuer.commonName = tmp ? (tmp.length > 1 ? tmp.sort(function (t, n) {
      var e = t[1].toUpperCase()
      var
        r = n[1].toUpperCase()
      return r > e ? -1 : e > r ? 1 : 0
    }).sort(function (t, n) {
      return t[1].length - n[1].length
    }).map(function (t) {
      return t[1]
    }) : tmp[0][1]) : ''
    // DC name
    tmp = matchAll(issuer, /\sDC\s=\s([^\r\n].*)/g)
    certValues.issuer.dc = tmp ? (tmp.length > 1 ? tmp.sort(function (t, n) {
      var e = t[1].toUpperCase()
      var
        r = n[1].toUpperCase()
      return r > e ? -1 : e > r ? 1 : 0
    }).sort(function (t, n) {
      return t[1].length - n[1].length
    }).map(function (t) {
      return t[1]
    }) : tmp[0][1]) : ''
  }
  // SAN
  if ((san = certData.match(/X509v3 Subject Alternative Name: \r?\n([^\r\n]*)\r?\n/)) && san.length > 1) {
    san = san[1].trim() + '\n'
    certValues.san = {}
    // hostnames
    tmp = pregMatchAll('DNS:([^,\\r\\n].*?)[,\\r\\n]', san)
    certValues.san.dns = tmp || ''
    // IP-Addresses IPv4 & IPv6
    tmp = pregMatchAll('IP Address:([^,\\r\\n].*?)[,\\r\\n\\s]', san)
    certValues.san.ip = tmp || ''
  }
  // Validity
  if ((tmp = certData.match(/Not Before\s?:\s?([^\r\n]*)\r?\n/)) && tmp.length > 1) {
    validity.start = Date.parse((tmp && tmp[1]) || '')
  }
  if ((tmp = certData.match(/Not After\s?:\s?([^\r\n]*)\r?\n/)) && tmp.length > 1) {
    validity.end = Date.parse((tmp && tmp[1]) || '')
  }
  if (validity.start && validity.end) {
    certValues.validity = validity
  }
  // Validity end
  // Signature Algorithm
  if ((tmp = certData.match(/Signature Algorithm: ([^\r\n]*)\r?\n/)) && tmp.length > 1) {
    certValues.signatureAlgorithm = (tmp && tmp[1]) || ''
  }
  // Public Key
  if ((tmp = certData.match(/Public[ -]Key: ([^\r\n]*)\r?\n/)) && tmp.length > 1) {
    certValues.publicKeySize = ((tmp && tmp[1]) || '').replace(/[()]/g, '')
  }
  // Public Key Algorithm
  if ((tmp = certData.match(/Public Key Algorithm: ([^\r\n]*)\r?\n/)) && tmp.length > 1) {
    certValues.publicKeyAlgorithm = (tmp && tmp[1]) || ''
  }
  callback(null, certValues)
}
function matchAll (str, regexp) {
  var matches = []
  str.replace(regexp, function () {
    var arr = ([]).slice.call(arguments, 0)
    var extras = arr.splice(-2)
    arr.index = extras[0]
    arr.input = extras[1]
    matches.push(arr)
  })
  return matches.length ? matches : null
}
function pregMatchAll (regex, haystack) {
  var globalRegex = new RegExp(regex, 'g')
  var globalMatch = haystack.match(globalRegex) || []
  var matchArray = []
  var nonGlobalRegex, nonGlobalMatch
  for (var i = 0; i < globalMatch.length; i++) {
    nonGlobalRegex = new RegExp(regex)
    nonGlobalMatch = globalMatch[i].match(nonGlobalRegex)
    matchArray.push(nonGlobalMatch[1])
  }
  return matchArray
}
function generateCSRSubject (options) {
  options = options || {}
  var csrData = {
    C: options.country || options.C,
    ST: options.state || options.ST,
    L: options.locality || options.L,
    O: options.organization || options.O,
    OU: options.organizationUnit || options.OU,
    CN: options.commonName || options.CN || 'localhost',
    DC: options.dc || options.DC || '',
    emailAddress: options.emailAddress
  }
  var csrBuilder = Object.keys(csrData).map(function (key) {
    if (csrData[key]) {
      if (typeof csrData[key] === 'object' && csrData[key].length >= 1) {
        var tmpStr = ''
        csrData[key].map(function (o) {
          tmpStr += '/' + key + '=' + o.replace(/[^\w .*\-,@']+/g, ' ').trim()
        })
        return tmpStr
      } else {
        return '/' + key + '=' + csrData[key].replace(/[^\w .*\-,@']+/g, ' ').trim()
      }
    }
  })
  return csrBuilder.join('')
}
function readFromString (string, start, end) {
  if (Buffer.isBuffer(string)) {
    string = string.toString('utf8')
  }
  var output = []
  if (!string) {
    return output
  }
  var offset = string.indexOf(start)
  while (offset !== -1) {
    string = string.substring(offset)
    var endOffset = string.indexOf(end)
    if (endOffset === -1) {
      break
    }
    endOffset += end.length
    output.push(string.substring(0, endOffset))
    offset = string.indexOf(start, endOffset)
  }
  return output
}

// let createCSROption = {
//   clientKey         : "", //pubkey
//   keyBitsize        : "2048" ,
//   hash              : "sha256",
//   country           : "Thailand",
//   state             : "Bangkok",
//   locality          : "Bangkok",
//   organization      : "KBTG",
//   organizationUnit  : "BlockChain",
//   commonName        : "localhost",
//   emailAddress      : "abc@abc.com",
//   csrConfigFile     : "",
//   altNames          : []
// };

// let createCertOption = {
//   serviceKey          : "", //signer private key
//   serviceKeyPassword  : "",
//   selfSigned          : true,
//   serial              : "",
//   hash                : "",
//   csr                 : "",
//   days                : "",
//   clientKeyPassword   : "",
//   extFile             : "",
//   config              : "",
// }

