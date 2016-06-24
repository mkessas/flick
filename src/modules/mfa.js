//var mfa = module.exports;
var base32 = require('hi-base32');
var ldap = require('ldapjs');

module.exports = class mfa {

    constructor (c) {
        this.conf = c;
    }

    genkey(length) {
        var key = "";

        for (let i=0;i<length;i++) {
            var r = Math.floor(Math.random() * 255 + 1).toString(16);
            key += (r.length == 1 ? "0"+r : r);
        }
        return { secret: key, encoded: base32.encode(new Buffer(key, 'hex')).toUpperCase() };

    }

    grabToken(user,company, type, callback) {

        var client = ldap.createClient( {url: this.conf.mfa.directory } );
        var ou = "ou="+company+","+this.conf.mfa.tokenstore;
        var filter = "(&(sptokenstatus=available)(sptokentype="+type.toLowerCase()+"))"; 

        client.search(ou, {
            filter: filter,
            scope: 'sub',
            sizeLimit: 1,
            attributes: ["sptokensecret","sptokenserialno","sptokentype"],
        }, (err, r) => {
            var token;
            r.on('searchEntry', (entry) => {
                //console.log('entry: ' + JSON.stringify(entry.object)); 
                    token = entry.object;     
            });
            r.on('end', (err) => {
                //console.error('error: ' + err.message); 
                callback("No Tokens Found");
            });
            r.on('error', (err) => {
                //console.error('error: ' + err.message); 
                if (!token) { callback(err.message); return; }

                var change = new ldap.Change({
                    operation: 'replace',
                    modification: { sptokenstatus: user }
                });

                client.bind(this.conf.mfa.binddn, this.conf.mfa.bindpw, (err) => {

                    if (err) {
                        console.log("mfa.grabToken():", "Error Binding to "+this.conf.mfa.directory+": " + err.message);
                    } else {

                        client.modify('cn='+token.sptokenserialno+','+ou, change, (err) => {
                            if (err) console.log("mfa.grabToken():", "Error Updating Token Status", token.sptokenserialno, err.message);
                        });
                    }
                });
                if (!token.sptokensecret) {
                    var newkey = this.genkey(this.conf.mfa.keysize);
                    token.sptokensecret = newkey.secret;
                }
                callback(null, {serial: token.sptokenserialno, secret: token.sptokensecret});

            });
        });
    }

    releaseToken(token, company, callback) {

        if (!token || !company) callback(null);

        var client = ldap.createClient( {url: this.conf.mfa.directory } );
        var ou = "ou="+company+","+this.conf.mfa.tokenstore;

        var change = new ldap.Change({
            operation: 'replace',
            modification: { sptokenstatus: "available" }
        });

        client.bind(this.conf.mfa.binddn, this.conf.mfa.bindpw, (err) => {

            if (err) {
                console.log("mfa.releaseToken():", "Error Binding to "+this.conf.mfa.directory+": " + err.message);
                callback(err.message);
            } else {

                client.modify('cn='+token+','+ou, change, (err) => {
                    if (err) {
                        console.log("mfa.releaseToken():", "Error Updating Token Status", token.sptokenserialno, err.message);
                        callback(err.message);
                    } else {
                        callback(null);
                    }
                });
            }
        });

    }

    search(q, details, callback) {

        var ret=[];
        var client = ldap.createClient( {url: details.url } );
        var filter;

        var match = q.toLowerCase().match(/^t[0-9]/gi);
        //console.log('match: ' + match);
        if (match == null) {
            match = -1;
        }
        if (q.toLowerCase().indexOf(match[0]) == 0) {
            filter = "(cn="+q+"*)";
        } else if (q.indexOf(" ") >= 0) {
            var name = q.split(" ");
            filter = "(&(givenName="+name[0]+"*)(sn="+name[1]+"*))";
        } else {
            filter = "(|(givenName=*"+q+"*)(sn=*"+q+"*))";
        }

        client.bind(details.username, details.password, (err) => {
            if (err) {
                callback(null, "Error binding to " + details.url +": " + err.message);
            } else {
     
                client.search(details.base, { 
                    filter: filter, 
                    scope: 'sub', 
                    sizeLimit: 20 
                }, (err, r) => {
                    r.on('searchEntry', (entry) => {
                        //console.log('entry: ' + JSON.stringify(entry.object));
                        var acct = entry.object.sAMAccountName ? entry.object.sAMAccountName : "";
                        var name = entry.object.givenName ? entry.object.givenName : "";
                        var sn = entry.object.sn ? entry.object.sn : "";
                        if (ret.length < 20)
                            ret.push({ id: acct, name: name + " " + sn });
                    });
                    r.on('error', (err) => {
                        //console.error('error: ' + err.message);
                        if (ret.length)
                            callback(ret);
                        else
                            callback(null, err.message);

                    });
                    r.on('end', (result) => {
                        //console.log('status: ' + result.status);
                        callback(ret);
                        client.unbind( (err) => { });
                    });
                });
            }
        });
    }

    getUser(user, company, callback) {
        var client = ldap.createClient( {url: this.conf.mfa.directory } );
        var ou = "ou="+company+","+this.conf.mfa.search;
        var ret;
        var filter = "(&(objectClass=person)(uid=*"+user+"*))"; 

        client.search(ou, {
            filter: filter,
            scope: 'sub',
            attributes: ["*"],
        }, (err, r) => {
            r.on('searchEntry', (entry) => {
                //console.log('entry: ' + JSON.stringify(entry.object)); 
                    ret = entry.object;     
            });
            r.on('error', (err) => {
                //console.error('error: ' + err.message); 
                if (ret) {
                    if (ret.sptotpsecret) {
                        ret.sptotpsecret = base32.encode(new Buffer(ret.sptotpsecret, 'hex'));
                    } 
                    callback(ret);
                } else
                    callback(null, err.message);

            });
            r.on('end', (result) => {
                //console.log('status: ' + result.status); 
                if (ret) {
                    if (ret.sptotpsecret) {
                        ret.sptotpsecret = base32.encode(new Buffer(ret.sptotpsecret, 'hex'));
                    }
                    callback(ret);
                } else
                    callback(null, "Failed to retrieve user token");
                //callback(ret); 
                client.unbind( (err) => { });
            });
        });
    }

    getUsers(q, company, callback) {
        var client = ldap.createClient( {url: this.conf.mfa.directory } ); 
        var ou = "ou="+company+","+this.conf.mfa.search;
        var ret=[]; 
        var filter = "(objectClass=person)"; 
     
        if (q) { 
            if (q.indexOf(" ") >= 0) { 
                var name = q.split(" "); 
                filter = "(&(objectClass=person)(givenName="+name[0]+"*)(sn="+name[1]+"*))"; 
            } else { 
                filter = "(&(objectClass=person)(|(givenName=*"+q+"*)(sn=*"+q+"*)(uid=*"+q+"*)))"; 
            } 
        } 
     
        client.search(ou, { 
            filter: filter, 
            scope: 'sub', 
            attributes: ["+","*"],
            sizeLimit: 20
        }, (err, r) => {
            r.on('searchEntry', (entry) => {
                //console.log('entry: ' + JSON.stringify(entry.object)); 
                if (ret.length < 20) 
                    ret.push({  
                        id: entry.object.uid,  
                        name: entry.object.givenName + " " + entry.object.sn, 
                        serial:  entry.object.sptotpserial,
                        type: entry.object.sptotptype, 
                        modifyTimestamp: entry.object.modifyTimestamp ? entry.object.modifyTimestamp : entry.object.createTimestamp,
                        createTimestamp: entry.object.createTimestamp,
                        status: entry.object.sptotpdisabled == "true" ? "Suspended" : "Active" 
                    }); 
            }); 
            r.on('error', (err) => {
                //console.error('error: ' + err.message); 
                if (ret.length) 
                    callback(ret); 
                else 
                    callback(null, err.message); 
     
            }); 
            r.on('end', (result) => {
                //console.log('status: ' + result.status); 
                callback(ret.sort((a, b) => parseInt(b.modifyTimestamp) - parseInt(a.modifyTimestamp) ));
                //callback(ret); 
                client.unbind( (err) => { }); 
            }); 
        }); 
    }

    registerUser(user, company, callback) {
        var client = ldap.createClient( {url: this.conf.mfa.directory } );
        var ou = "ou="+company+","+this.conf.mfa.search;
        var ret;

        if (!user) {
            callback(null, "Missing Required Argument");
            return;
        }

        client.bind(this.conf.mfa.binddn, this.conf.mfa.bindpw, (err) => {

            if (err) {
                callback(null, "Error Binding to "+this.conf.mfa.directory+": " + err.message);
                return;
            } else {

                this.grabToken(user.id, company, user.type, (err, token) => {

                    var [givenName, sn] = user.name.split(" ");
                    var newuser = {
                            objectClass: [ 'top', 'person', 'organizationalPerson', 'inetOrgPerson', 'spTOTPAux' ],
                            cn: user.id,
                            sn: sn ? sn : "-",
                            givenName: givenName,
                            userpassword: '1234',
                            sptotpcompany: company,
                            sptotptype: user.type,
                            sptotpRole: 'user'
                    };
                    if (!err) {
                        newuser.sptotpsecret = token.secret;
                        newuser.sptotpserial = token.serial;
                    }

                    client.add('uid='+user.id+','+ou, newuser, (err) => {
                        client.unbind( (err) => {} );
                        if (err) {
                            callback("Error Adding user:" + err.message);
                        } else {
                            callback();
                        }
                    });
                });
            }
        });

    }

    deleteUser(id, company, callback) {
        var client = ldap.createClient( {url: this.conf.mfa.directory } );
        var ou = "ou="+company+","+this.conf.mfa.search;
        var ret=[];

        if (!id) {
            callback(null, "Missing Required Argument");
            return;
        }

        this.getUser(id, company, (user, err) => {

            if (err) {
                callback(null, "User Not Found: " + err);
            } else {

                if (user.sptotpserial) this.releaseToken(user.sptotpserial, company, (err) => {});

                client.bind(this.conf.mfa.binddn, this.conf.mfa.bindpw, (err) => {

                    if (err) {
                        callback(null, "Error Binding to "+this.conf.mfa.directory+": " + err.message);
                        return;
                    } else {

                        client.del('uid='+id+','+ou, (err) => {
                            if (err) {
                                callback(null, err.message);
                            } else {
                                callback("User Deleted Successfully");
                            }
                            client.unbind((err) => {} );
                        });
                    }
                });
            }
        });

    }

    assignToken(uid, company, type, serial, callback) {

      this.getUser(uid, company, (user, err) => {

        if (err) {
            callback(null, "User Not Found: " + err);
        } else {
            this.releaseToken(user.sptotpserial, company, (err) => { });
            this.grabToken(uid, company, type, (err, token) => {

              if (err) {
                callback(null, "Unable to grab a new token: " + err);
              } else {
                
                this.modifyUser(uid, company, [
                    {sptotpsecret: token.secret},
                    {sptotpserial: token.serial},
                    {sptotptype: type}
                ],  (ret, err) => {
                    if (err) {
                        callback(null, "Unable to assign token to user: " + err);
                    } else {
                        callback(token.serial);
                    }
                });
             }
           });
        }
      });
    }

    modifyUser(user, company, c, callback) {

        var client = ldap.createClient( {url: this.conf.mfa.directory } );
        var ou = "ou="+company+","+this.conf.mfa.search;
        var ret = [];
        var changes = [];


        client.bind(this.conf.mfa.binddn, this.conf.mfa.bindpw, (err) => {

            if (err) {
                callback(null, "Error Binding to "+this.conf.mfa.directory+": " + err.message);
                return;
            }

            try {
                c = [].concat(c);
                c.forEach( (ch) => {
                    //for (k in ch) {
                        //if (!ch[k]) continue;
                        let change = new ldap.Change({
                            operation: 'replace',
                            modification: ch
                        });
                        changes.push(change);
                    //}
                })
            } catch (e) {
                callback(null, e);
            }

            client.modify('uid='+user+','+ou, changes, (err) => {
                client.unbind( (err) => { }); 
                if (err) {
                    callback(null, "Error Modifying User: "+err.message);
                } else {
                    callback("Successfuly modified user");
                }
            });
        });
    }

    getCompanyDetails(company, callback) {

        var client = ldap.createClient( {url: this.conf.mfa.directory } );
        var ou = "ou="+company+","+this.conf.mfa.search;
        var ret={};

        client.bind(this.conf.mfa.binddn, this.conf.mfa.bindpw, (err) => {

            if (err) {
                callback("Error binding to "+this.conf.mfa.directory+": "+err.message, null);
            }

            client.search(ou, { 
                scope: 'base', 
            }, (err, r) => {
                r.on('searchEntry', (entry) => {
                    ret = { 
                        agency: entry.object.ou,
                        username: entry.object.spmfatldapadmin,
                        password: entry.object.spmfatldapadminpw,
                        base: entry.object.spmfatldapbase,
                        url: "ldap://"+entry.object.spmfatldapserver,
                        logoutUrl: this.conf.logout.url
                    };
                }); 
                r.on('error', (err) => {
                    callback(err.message, null);
                }); 
                r.on('end', (result) => {
                    //console.log('status: ' + result.status); 
                    callback(null, ret);
                    //callback(ret); 
                    client.unbind( (err) => { }); 
                }); 
            }); 
        });

    }
}
