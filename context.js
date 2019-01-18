const verifiableCredential = {
    id : "@id",
    type : "@type",
    edoc: "https://edoc.com#",
    issuer: "edoc:issuer",
    issuanceDate: "edoc:issuanceDate",
    expirationDate : "edoc:expirationDate",
    credentialSubject : "edoc:credentialSubject",
    proof : "edoc:proof",
    txhash : "edoc:txhash"
}

const presentation = {
    id : "@id",
    type : "@type",
    edoc: "https://edoc.com#",
    issuanceDate: "edoc:issuanceDate",
    expirationDate : "edoc:expirationDate",       
    verifiableCredential : "edoc:verifiableCredential",     
    termsOfUse : "edoc:credentialSubject",
    proof : "edoc:proof",
    txhash : "edoc:txhash"
}

const cucredentialSubject = {
    id : "@id",
    type : "@type",
    content : "https://reg.chula.ac.th/content"
}

const termsOfUse = {
    id : "@id",
    type : "@type",
    profile : "https://edoc.com/termsofuse",
    prohibition : "https://edoc.com/prohibition"
}

const prohibition = {
    prohibition : "https://edoc.com/prohibition/",
    assigner : "prohibition:assigner",
    assignee : "prohibition:assignee",
    target : "prohibition:target",
    action : "prohibition:action",
}

const verifiableCredentialall = Object.assign(clone(verifiableCredential),clone(cucredentialSubject))
const presentationAll= Object.assign(clone(presentation),clone(verifiableCredential),clone(cucredentialSubject),clone(termsOfUse),clone(prohibition))

function clone(obj) {
    var copy;

    // Handle the 3 simple types, and null or undefined
    if (null == obj || "object" != typeof obj) return obj;

    // Handle Date
    if (obj instanceof Date) {
        copy = new Date();
        copy.setTime(obj.getTime());
        return copy;
    }

    // Handle Array
    if (obj instanceof Array) {
        copy = [];
        for (var i = 0, len = obj.length; i < len; i++) {
            copy[i] = clone(obj[i]);
        }
        return copy;
    }

    // Handle Object
    if (obj instanceof Object) {
        copy = {};
        for (var attr in obj) {
            if (obj.hasOwnProperty(attr)) copy[attr] = clone(obj[attr]);
        }
        return copy;
    }

    throw new Error("Unable to copy obj! Its type isn't supported.");
}


module.exports = {
    "verifiableCredential" : verifiableCredential,
    "presentation" : presentation,
    "cucredentialSubject" : cucredentialSubject,
    "termsOfUse" : termsOfUse,
    "prohibition" : prohibition,
    "verifiableCredentialAll" : verifiableCredentialall,
    "presentationAll" : presentationAll
}