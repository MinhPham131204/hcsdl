const sql = require("mssql");
const sqlConfig = require("../../configDB");
const fs = require("fs");
const path = require("path");
const { generateToken, generateOTP } = require("../../middleware/auth");
const { sendMail } = require("../../middleware/email");

var otpCode;

class Login {
    loginUI(req, res) {
        if(req.cookies.token) {
            res.redirect('/seller/order/list')
        }
        else {
            res.render('validate/login', {layout: 'login'})
        }
    }

    async verify(req, res) {
        let pool = await sql.connect(sqlConfig);

        const check = fs.readFileSync(path.join(__dirname, "check.sql"), "utf8");

        const result = await pool.request()
        .input("email", sql.VarChar, req.body.email)
        .input("password", sql.NVarChar, req.body.password)
        .query(check);

        if(result.recordset[0]) {
            const info = {
                sellerID: result.recordset[0].userID,
                email: req.body.email
            }

            const jwt = generateToken(info)

            res.cookie('token', jwt, {
                maxAge:  60 * 60 * 1000, // 1 hour
                httpOnly: true,
                secure: true,
            })
    
            res.redirect('/seller/order/list')
            // res.json('OK')
        }

        else res.render('validate/login', {
            layout: 'login',
            err: 'Người dùng nhập không chính xác'
        })
    }

    async logout(req, res){
        res.clearCookie('token');
        res.redirect('/')
    }

    async yourEmail(req, res){
        res.render('validate/yourEmail', {layout: 'login'})
    }

    async verifyEmail(req, res){
        let pool = await sql.connect(sqlConfig);

        const result = await pool.request()
        .input("email", sql.VarChar, req.body.email)
        .query("select email from Users where email = @email and userID in (select sellerID from Seller)")

        if(result.recordset[0]) {
            otpCode = generateOTP();

            console.log(otpCode)

            await sendMail(
                req.body.email,
                'Gửi mã OTP xác nhận để đổi mật khẩu',
                `Đây là mã OTP của bạn: ${otpCode}`
            )

            res.cookie('email', result.recordset[0].email, {
                maxAge:  10 * 60 * 1000, // 1 day
                httpOnly: true,
                secure: true,
            })

            res.redirect('/getOTP')
        }

        else res.render('validate/yourEmail', {
            layout: 'login',
            err: 'Email nhà bán không tồn tại',
            email: req.body.email
        })
    }

    async yourOTP(req, res){
        res.render('validate/getOTP', {layout: 'login'})
    }

    async verifyOTP(req, res){
        if(req.body.otpCode == otpCode) {
            res.redirect('/createNewPassword')
        }
        else {
            otpCode = generateOTP()

            await sendMail(
                req.cookies.email,
                'Gửi mã OTP xác nhận để đổi mật khẩu',
                `Đây là mã OTP của bạn: ${otpCode}`
            )

            res.render('validate/getOTP', {
                layout: 'login',
                alert: 'OTP bạn nhập không chính xác. Chúng tôi đã gửi OTP mới. Vui lòng kiểm tra'
            })
        }
    }

    async createNewPassword(req, res){
        res.render('validate/newPassword', {layout: 'login'})
    }

    async resetPassword(req, res) {
        if(req.body.newPassword == req.body.reEnter) {
            // update new password
            let pool = await sql.connect(sqlConfig);

            await pool.request()
            .input('email', sql.NVarChar, req.cookies.email)
            .input('password', sql.NVarChar, req.body.newPassword)
            .query("update Users set hashPassword = @password where email = @email")

            res.clearCookie('email')
            res.redirect('/')
        }
        else res.render('validate/newPassword', {
            layout: 'login',
            err: 'Mật khẩu không trùng khớp'
        })
    }
}

module.exports = new Login()