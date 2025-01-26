const sql = require("mssql");
const sqlConfig = require("../../configDB");

class CreateDiscount {
  async getUI(req, res) {
    let pool = await sql.connect(sqlConfig);

    const type = await pool.request().query("SELECT * FROM Ưu_đãi");

    const response = {
      type: type.recordsets[0],
    };

    res.render("discount/create", response);
  }
}

module.exports = new CreateDiscount()
