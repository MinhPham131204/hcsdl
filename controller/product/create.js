const sql = require("mssql");
const sqlConfig = require("../../configDB");
const fs = require("fs");
const path = require("path");

require("dotenv").config();

const { google } = require("googleapis");

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;
const REFRESH_TOKEN = process.env.REFRESH_TOKEN;

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);
oauth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

const drive = google.drive({
  version: "v3",
  auth: oauth2Client,
});

class CreateProduct {
  async getUI(req, res) {
    let pool = await sql.connect(sqlConfig);

    const category = await pool.request().query("SELECT * FROM Category");

    const address = await pool
      .request()
      .input("Id", sql.Int, req.user)
      .query("SELECT * FROM StockAddress WHERE sellerID = @Id;");

    const response = {
      category: category.recordsets[0],
      address: address.recordsets[0],
    };

    res.render("product/create", response);
  }

  async insertProduct(req, res) {
      const imgLinks = [];
  
      let ID;
  
      let pool = await sql.connect(sqlConfig);
  
      for (const file of req.files.image) {
        // Tải lên từng ảnh lên Google Drive
        const createFile = await drive.files.create({
          requestBody: {
            name: file.originalname, // Tên file trên Google Drive
            mimeType: file.mimetype,
          },
          media: {
            mimeType: file.mimetype,
            body: fs.createReadStream(file.path), // Đọc file từ local path
          },
        });
  
        // Lấy ID của file vừa tải lên
        const fileId = createFile.data.id;
  
        // Thiết lập quyền công khai để có thể chia sẻ link
        await drive.permissions.create({
          fileId,
          requestBody: {
            role: "reader",
            type: "anyone",
          },
        });
  
        // Tạo link trực tiếp cho ảnh
        const directLink = `https://drive.google.com/thumbnail?id=${fileId}`;
  
        // Đưa link vào mảng
        imgLinks.push(directLink);
      }
  
      if (req.body.model.length) {  // trường hợp có biến thể
        const modelName = req.body.model;
  
        const modelImgLinks = [];
  
        for (const file of req.files.model_img) {
          // Tải lên từng ảnh lên Google Drive
          const createFile = await drive.files.create({
            requestBody: {
              name: file.originalname, // Tên file trên Google Drive
              mimeType: file.mimetype,
            },
            media: {
              mimeType: file.mimetype,
              body: fs.createReadStream(file.path), // Đọc file từ local path
            },
          });
  
          // Lấy ID của file vừa tải lên
          const fileId = createFile.data.id;
  
          // Thiết lập quyền công khai để có thể chia sẻ link
          await drive.permissions.create({
            fileId,
            requestBody: {
              role: "reader",
              type: "anyone",
            },
          });
  
          // Tạo link trực tiếp cho ảnh
          const directLink = `https://drive.google.com/thumbnail?id=${fileId}`;
  
          // Đưa link vào mảng
          modelImgLinks.push(directLink);

          await unlinkAsync(file.path)
        }
  
        const request = new sql.Request();
        request.input("sellerID", sql.Int, req.user); // Thay giá trị tham số phù hợp
        request.input("productName", sql.NVarChar, req.body.name);
        request.input("categoryID", sql.Int, req.body.categoryID);
        request.input("description", sql.NVarChar, req.body.description);
        request.input("price", sql.Money, 0);
  
        const temp = await request.execute("InsertProduct");
  
        const productID = parseInt(temp.recordset[0].ID)
  
        for (let i in modelName) {
          req.body.price[i] = req.body.price[i].replace(/\D/g, '')
  
          const model_request = new sql.Request();
          model_request.input("productID", sql.Int, productID); // Thay giá trị tham số phù hợp
          model_request.input("modelName", sql.NVarChar, req.body.model[i]);
          model_request.input("modelPrice", sql.Money, req.body.price[i]);
          model_request.input("modelImage", sql.VarChar, modelImgLinks[i]);
          model_request.input("quantity", sql.Int, req.body.stockQuantity[i]);
          model_request.input("addressID", sql.Int, req.body.address[i]);
  
          await model_request.execute("InsertProductModel");
        }
  
        ID = productID
      } 
  
      else {
        req.body.price[1] = req.body.price[1].replace(/\D/g, '')
  
        const request = new sql.Request();
        request.input("sellerID", sql.Int, req.user); // Thay giá trị tham số phù hợp
        request.input("productName", sql.NVarChar, req.body.name);
        request.input("categoryID", sql.Int, req.body.categoryID);
        request.input("description", sql.NVarChar, req.body.description);
        request.input("price", sql.Money, req.body.price[1]);
  
        const temp = await request.execute("InsertProduct");
  
        const productID = parseInt(temp.recordset[0].ID)
  
        ID = productID
  
        const stock_req = new sql.Request();
        stock_req.input("productID", sql.Int, productID); // Thay giá trị tham số phù hợp
        stock_req.input("sellerID", sql.Int, req.user);
        stock_req.input("quantity", sql.Int, req.body.stockQuantity[1]);
        stock_req.input("stockAddressID", sql.Int, req.body.address[1]);
  
        await stock_req.execute("InsertStockProduct")
      }
  
      for (let i in imgLinks){
          const img_req = new sql.Request();
          img_req.input("productID", sql.Int, ID);
          img_req.input("image", sql.VarChar, imgLinks[i]);
  
          await img_req.execute("InsertProductImage");
      }
  
  
      res.redirect('/seller/product/create')
    }
}

module.exports = new CreateProduct()