const crypto = require('crypto');

function getToken(_req, res){
    res.json({token: crypto.randomBytes(16).toString('hex')})
}

module.exports = {
    getToken
}