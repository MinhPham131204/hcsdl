require('dotenv').config()
const jwt = require('jsonwebtoken')

exports.generateToken = (payload)=>{
    return jwt.sign(payload, process.env.SECRET_KEY, { expiresIn: "24h" })
}

exports.verifyToken = (req, res, next) => {
    try {
        let decodedInfo;

        if(req.cookies.token) decodedInfo = jwt.verify(req.cookies.token, process.env.SECRET_KEY)

        if(decodedInfo && decodedInfo.sellerID){
            req.user = decodedInfo.sellerID
            next()
        }

        else{
            console.log(decodedInfo)
            res.json('Verify error')
        }
    }
    catch(err){
        console.log(err)
    }
}