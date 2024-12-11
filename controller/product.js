const sql = require("mssql");
const sqlConfig = require("../configDB");
const fs = require("fs");
const path = require("path");
const productResult = require("../sql/product");

// const getProduct = async (req, res) => {
//     try {
//         // make sure that any items are correctly URL encoded in the connection string
//         let pool = await sql.connect(sqlConfig)
//         const test = fs.readFileSync(path.join(__dirname, 'test.sql'), 'utf8')
//         const result = await pool.request().query(test)
//         res.json(result.recordsets)
//     }
//     catch (err) {
//         console.log(err)
//         res.json('Error')
//     }
// }

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

class Product {
  // [GET] /product/create
  async create(req, res) {
    let pool = await sql.connect(sqlConfig);

    const category = await pool.request().query("SELECT * FROM Category");

    const address = await pool
      .request()
      .input("Id", sql.Int, 34)
      .query("SELECT * FROM StockAddress WHERE sellerID = @Id;");

    const response = {
      category: category.recordsets[0],
      address: address.recordsets[0],
    };

    res.render("product/createNoModel", response);
  }

  async insert(req, res){
    const createFile = await drive.files.create({
      requestBody: {
        name: req.file.originalname,
        mimeType: "image/jpg",
      },
      media: {
        mimeType: req.file.mimetype,
        body: fs.createReadStream(req.file.path),
      },
    });

    const fileId = createFile.data.id;
    
    await drive.permissions.create({
      fileId,
      requestBody: {
        role: "reader",
        type: "anyone",
      },
    });

    const directLink = `https://drive.google.com/thumbnail?id=${fileId}`;

    req.body.price = req.body.price.replace(/\D/g, '')

    const request = new sql.Request();
    request.input("sellerID", sql.Int, 34); // Thay giá trị tham số phù hợp
    request.input("productName", sql.NVarChar, req.body.name);
    request.input("categoryID", sql.Int, req.body.categoryID);
    request.input("description", sql.NVarChar, req.body.description);
    request.input("price", sql.Money, req.body.price);
    request.input("quantity", sql.Int, req.body.quantity);
    request.input("addressID", sql.Int, req.body.addressID);
    request.input("image", sql.VarChar, directLink);

    await request.execute("InsertProductNoModel");

    res.redirect('/seller/product/list')

  }

  async insertProduct(req, res) {
    // console.log(req.files);

    // console.log(req.body);

    // console.log(req.body.model.length);

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

    if (req.body.model.length) {
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
      }

      const request = new sql.Request();
      request.input("sellerID", sql.Int, 34); // Thay giá trị tham số phù hợp
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
      request.input("sellerID", sql.Int, 34); // Thay giá trị tham số phù hợp
      request.input("productName", sql.NVarChar, req.body.name);
      request.input("categoryID", sql.Int, req.body.categoryID);
      request.input("description", sql.NVarChar, req.body.description);
      request.input("price", sql.Money, req.body.price[1]);

      const temp = await request.execute("InsertProduct");

      const productID = parseInt(temp.recordset[0].ID)

      ID = productID

      const stock_req = new sql.Request();
      stock_req.input("productID", sql.Int, productID); // Thay giá trị tham số phù hợp
      stock_req.input("sellerID", sql.Int, 34);
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

    // res.json(req.body);
  }

  // [GET] /product/:id/edit
  async edit(req, res) {
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
  async update(req, res){

    const request = new sql.Request();
    request.input("ID", sql.Int, req.params.id); 
    request.input("sellerID", sql.Int, 34); // Thay giá trị tham số phù hợp
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
    //   stock_req.input("sellerID", sql.Int, 34);
    //   stock_req.input("quantity", sql.Int, req.body.stockQuantity);
    //   stock_req.input("stockAddressID", sql.Int, req.body.address);

    //   await stock_req.execute("UpdateStockProduct")
    // }

    request.input("quantity", sql.Int, req.body.stockQuantity);
    request.input("addressID", sql.Int, req.body.address);

    req.body.price = req.body.price.replace(/\D/g, '')

    request.input("price", sql.Money, req.body.price);

    request.execute("UpdateProductNoModel")

    res.redirect('/seller/product/list')

  }


  // [GET] /product/list
  async showList(req, res) {
    let pool = await sql.connect(sqlConfig);

    const category = await pool.request().query("SELECT * FROM Category");
    // const test = fs.readFileSync(path.join(__dirname, 'getList.sql'), 'utf8')

    const list = await productResult.getList(34);

    res.render("product/list", {
      category: category.recordsets[0],
      model: list.recordsets[0],
      noModel: list.recordsets[1],
    });
  }

  async search(req, res) {
    let pool = await sql.connect(sqlConfig);

    const category = await pool.request().query("SELECT * FROM Category");

    if (req.query.categoryID == 0) {
      if (req.query.searchTerm) {
        const result = await productResult.searchRes(
          34,
          req.query.categoryID,
          NULL
        );

        res.render("product/result", {
          result,
          category: category.recordsets[0],
        });
      }
    } else {
      const result = await productResult.searchRes(
        34,
        req.query.categoryID,
        req.query.searchTerm
      );

      res.render("product/result", {
        result,
        category: category.recordsets[0],
      });
    }
  }

  async remove(req, res){
    const request = new sql.Request();
    request.input("ID", sql.Int, req.params.id); 

    await request.execute('DeleteProduct')

    res.redirect('/seller/product/list')
  }

  // async removeModel(req, res){
  //   let pool = await sql.connect(sqlConfig);

  //   await pool.request().input("ID", sql.Int, req.params.id).query("DELETE FROM ProductModel WHERE ID = @ID;");

  //   res.redirect('back')
  // }
}

module.exports = new Product();
