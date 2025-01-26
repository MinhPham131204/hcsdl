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

        res.cookie('sellerID', result.recordset[0].userID, {
            maxAge:  15 * 60 * 1000, // 1 day
            httpOnly: true,
            secure: true,
        })

        res.redirect('/seller/order/list')
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
}

module.exports = new Login()