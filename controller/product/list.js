const sql = require("mssql");
const sqlConfig = require("../../configDB");
const productResult = require("../../sql/product");

class ProductList {
  // [GET] /product/list
  async showList(req, res) {
    let pool = await sql.connect(sqlConfig);

    const category = await pool.request().query("SELECT * FROM Category");
    // const test = fs.readFileSync(path.join(__dirname, 'getList.sql'), 'utf8')

    const list = await productResult.getList(req.user);

    res.render("product/list", {
      category: category.recordsets[0],
      model: list.recordsets[0],
      noModel: list.recordsets[1],
    });
  }

  async search(req, res) {
    let pool = await sql.connect(sqlConfig);

    const category = await pool.request().query("SELECT * FROM Category");
    
    const getCategoryName = await pool
        .request()
        .input("Id", sql.Int, req.query.categoryID)
        .query(
          "SELECT tên_danh_mục FROM Category where ID = @Id;"
        );

    const result = await productResult.searchRes(
      req.user,
      req.query.categoryID,
      req.query.searchTerm
    );

    const param = {
      term: req.query.searchTerm,
      categoryID: req.query.categoryID
    }

    if(getCategoryName.recordset[0]) param.categoryName = getCategoryName.recordset[0]["tên_danh_mục"]
    else param.categoryName = "Tất cả danh mục"

    res.render("product/list", {
      queryInfo: param,
      category: category.recordsets[0],
      model: result[0],
      noModel: result[1],
    });
  }

  async remove(req, res) {
    const request = new sql.Request();
    request.input("ID", sql.Int, req.params.id);

    await request.execute("DeleteProduct");

    res.redirect("/seller/product/list");
  }
}

module.exports = new ProductList()