const sql = require("mssql");
const sqlConfig = require("../../configDB");
const fs = require("fs");
const path = require("path");

const convert = (datetime) => {
  const dateObj = new Date(datetime);

  // Lấy các thành phần ngày, tháng, năm, giờ, phút, giây
  const day = String(dateObj.getDate()).padStart(2, "0");
  const month = String(dateObj.getMonth() + 1).padStart(2, "0"); // Tháng tính từ 0
  const year = dateObj.getFullYear();
  const hours = String(dateObj.getHours()).padStart(2, "0");
  const minutes = String(dateObj.getMinutes()).padStart(2, "0");
  const seconds = String(dateObj.getSeconds()).padStart(2, "0");

  // Tạo chuỗi định dạng "ngày/tháng/năm giờ"
  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
}

class Result {
  async getList(id) {
    try {
      let pool = await sql.connect(sqlConfig);
      const test = fs.readFileSync(path.join(__dirname, "getList.sql"), "utf8");

      const result = await pool.request().input("id", sql.Int, id).query(test);

      for (let e of result.recordsets[0]) {
        e.orderedTime = convert(e.orderedTime)

        if(e.totalPrice) e.totalPrice = e.totalPrice.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
        else e.totalPrice = 0
      }

      return result;
    } 
    catch (err) {
      console.log(err);
    }
  }

  async orderInfo(id) {
    let pool = await sql.connect(sqlConfig);
    const test = fs.readFileSync(path.join(__dirname, "detail.sql"), "utf8");

    const result = await pool.request().input("id", sql.Int, id).query(test);

    for (let e of result.recordsets[0]) {
      if(!e.discountID) e.discountID = 0

      e.fee = 0.08 * e.quantity * e.productPrice

      if(!e.price) e.price = e.quantity * e.productPrice - e.fee

      e.fee = e.fee.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
      if(e.productPrice) e.productPrice = e.productPrice.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
      e.price = e.price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    }

    const temp = result.recordsets[1]
    temp[0].orderedTime = convert(temp[0].orderedTime)
    temp[0].deliveryFee = temp[0].deliveryFee.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");

    if(temp[0].totalPrice) temp[0].totalPrice = temp[0].totalPrice.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    else temp[0].totalPrice = 0

    return result
  }
}

module.exports = new Result();
