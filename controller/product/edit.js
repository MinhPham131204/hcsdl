const sql = require("mssql");
const sqlConfig = require("../../configDB");

class UpdateProduct {
  // [GET] /product/:id/edit
  async getUI(req, res) {
    let pool = await sql.connect(sqlConfig);

    const category = await pool.request().query("SELECT * FROM Category");

    const getById = await pool
      .request()
      .input("Id", sql.Int, req.params.id)
      .query(
        "SELECT p.*, c.tên_danh_mục FROM Products p, Category c WHERE p.Id = @Id and p.categoryID = c.ID;"
      );

    const getModel = await pool
      .request()
      .input("id", sql.Int, req.params.id)
      .query(
        "SELECT m.*, a.stockAddress FROM ProductModel m JOIN StockAddress a ON m.addressID = a.ID where m.productID = @id"
      );

    // for(let e of getModel.recordsets[0]){
    //     e.price = e.price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    // }

    const stockInfo = await pool
      .request()
      .input("Id", sql.Int, req.params.id)
      .query(
        "SELECT m.*, a.stockAddress FROM StockProduct m JOIN StockAddress a ON m.stockAddressID = a.ID where m.productID = @Id"
      );

    if (getModel.recordsets[0].length) {
      for (let e of getModel.recordsets[0]) {
        e.price = e.price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
      }
    } else {
      for (let e of getById.recordsets[0]) {
        e.price = e.price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
      }
    }

    const getAddress = await pool
      .request()
      .input("Id", sql.Int, getById.recordsets[0][0].sellerID)
      .query("SELECT * FROM StockAddress WHERE sellerID = @Id");

    const getImage = await pool
      .request()
      .input("id", sql.Int, req.params.id)
      .query("SELECT * FROM productImage WHERE productID = @id");

    const response = {
      category: category.recordsets[0],
      info: getById.recordsets[0][0],
      address: getAddress.recordsets[0],
      model: getModel.recordsets[0].length ? getModel.recordsets[0] : "",
      stockInfo: stockInfo ? stockInfo.recordsets[0][0] : "",
      image: getImage.recordsets[0],
    };

    res.render("product/edit", response);
    // res.json(response)
  }

  // [PUT] /product/:id
  async update(req, res) {
    const request = new sql.Request();
    request.input("ID", sql.Int, req.params.id);
    request.input("sellerID", sql.Int, req.user); // Thay giá trị tham số phù hợp
    request.input("productName", sql.NVarChar, req.body.name);
    request.input("categoryID", sql.Int, req.body.categoryID);
    request.input("description", sql.NVarChar, req.body.description);
    request.input("status", sql.NVarChar, req.body.status);

    // if(req.body.model) {

    //   request.input("price", sql.Money, 0);

    //   await request.execute("UpdateProduct");

    //   const modelName = req.body.model

    //   let pool = await sql.connect(sqlConfig);

    //   const temp = await pool.request().input("productID", sql.Int, req.params.id).query("SELECT ID FROM ProductModel where productID = @productID order by ID");

    //   const modelID = temp.recordset

    //   console.log(modelID)

    //   for (let i in modelName) {
    //     req.body.price[i] = req.body.price[i].replace(/\D/g, '')

    //     const model_request = new sql.Request();
    //     model_request.input("modelID", sql.Int, modelID[i].ID);
    //     model_request.input("productID", sql.Int, req.params.id); // Thay giá trị tham số phù hợp
    //     model_request.input("modelName", sql.NVarChar, req.body.model[i]);
    //     model_request.input("modelPrice", sql.Money, req.body.price[i]);
    //     model_request.input("quantity", sql.Int, req.body.stockQuantity[i]);

    //     await model_request.execute("UpdateProductModel");
    //   }
    // }

    // else {
    //   req.body.price = req.body.price.replace(/\D/g, '')

    //   request.input("price", sql.Money, req.body.price);

    //   await request.execute("UpdateProduct");

    //   const stock_req = new sql.Request();
    //   stock_req.input("productID", sql.Int, req.params.id); // Thay giá trị tham số phù hợp
    //   stock_req.input("sellerID", sql.Int, req.user);
    //   stock_req.input("quantity", sql.Int, req.body.stockQuantity);
    //   stock_req.input("stockAddressID", sql.Int, req.body.address);

    //   await stock_req.execute("UpdateStockProduct")
    // }

    request.input("quantity", sql.Int, req.body.stockQuantity);
    request.input("addressID", sql.Int, req.body.address);

    req.body.price = req.body.price.replace(/\D/g, "");

    request.input("price", sql.Money, req.body.price);

    await request.execute("UpdateProductNoModel");

    res.redirect("/seller/product/list");
  }

  // async removeModel(req, res){
  //   let pool = await sql.connect(sqlConfig);

  //   await pool.request().input("ID", sql.Int, req.params.id).query("DELETE FROM ProductModel WHERE ID = @ID;");

  //   res.redirect('back')
  // }
}

module.exports = new UpdateProduct()