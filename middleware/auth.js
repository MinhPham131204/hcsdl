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

exports.generateOTP = () => {
    let otpCode = Math.floor(Math.random() * 999999)
    let res = otpCode.toString()
    while(otpCode < Math.pow(10, 5)) {
        if(otpCode / 100000 < 1) {
            res = '0' + res
            otpCode *= 10
        }
    }
    return res
}