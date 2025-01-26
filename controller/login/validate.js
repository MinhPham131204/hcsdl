const sql = require("mssql");
const sqlConfig = require("../../configDB");
const fs = require("fs");
const path = require("path");

class Login {
    loginUI(req, res) {
        if(req.cookies.sellerID) {
            res.redirect('seller/order/list')
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
            res.cookie('sellerID', result.recordset[0].userID, {
                maxAge:  60 * 60 * 1000, // 1 day
                httpOnly: true,
                secure: true,
            })
    
            res.redirect('/seller/order/list')
        }

        else res.render('validate/login', {
            layout: 'login',
            err: 'Người dùng nhập không chính xác'
        })
    }

    async mainPage(req, res) {
        let pool = await sql.connect(sqlConfig);

        const result = await pool.request().input("id", sql.Int, req.cookies.sellerID).query("SELECT username, phoneNum, userAddress from Users where userID = @id")

        res.render('main-page', {
            info: result.recordset[0]
        })
    }

    async logout(req, res){
        res.clearCookie('sellerID');
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

    async createNewPassword(req, res){
        res.render('validate/newPassword', {layout: 'login'})
    }

    async resetPassword(req, res) {
        
    }
}

module.exports = new Login()