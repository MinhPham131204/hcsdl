const sql = require("mssql");
const sqlConfig = require("../../configDB");
const orderResult = require("../../sql/order");

class OrderList {
  async getList(req, res) {

    const list = await orderResult.getList(req.cookies.sellerID);

    res.render("orders/list", {
      list: list.recordsets[0]
    });
  }

  async detail(req, res) {

    const list = await orderResult.orderInfo(req.params.id)

    res.render("orders/detail", {
      detail: list.recordsets[0],
      mainInfo: (list.recordsets[1])[0],
    });
  }
}

module.exports = new OrderList();
