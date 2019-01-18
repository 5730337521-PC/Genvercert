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

module.exports = {
    "verifiableCredential" : verifiableCredential,
    "presentation" : presentation,
    "cucredentialSubject" : cucredentialSubject,
    "termsOfUse" : termsOfUse,
    "prohibition" : prohibition,
    "verifiableCredentialAll" : Object.assign(verifiableCredential,cucredentialSubject),
    "presentationAll" : Object.assign(presentation,verifiableCredential,cucredentialSubject,termsOfUse,prohibition),
}