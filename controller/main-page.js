const sql = require("mssql");
const sqlConfig = require("../configDB");

exports.mainPage = async(req, res) => {
    let pool = await sql.connect(sqlConfig);

    const result = await pool.request().input("id", sql.Int, req.user).query("SELECT username, phoneNum, userAddress from Users where userID = @id")

    res.render('main-page', {
        info: result.recordset[0]
    })
}