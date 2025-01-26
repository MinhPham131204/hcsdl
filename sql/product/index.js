const sql = require('mssql')
const sqlConfig = require('../../configDB')
const fs = require('fs')
const path = require('path')

class Result {
    async getList(id) {
        try {
            let pool = await sql.connect(sqlConfig)
            const test = fs.readFileSync(path.join(__dirname, 'getList.sql'), 'utf8')

            const result = await pool.request().input('id', sql.Int, id).query(test)

            for(let e of result.recordsets[0]){
                e.minPrice = e.minPrice.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
                e.maxPrice = e.maxPrice.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
            }

            for(let e of result.recordsets[1]){
                e.price = e.price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
            }

            return result
        } 
        catch (err) {
            console.log(err)
        }
    }

    async searchRes(sellerID, categoryID, name) {
        let pool = await sql.connect(sqlConfig)
        const test = fs.readFileSync(path.join(__dirname, 'search.sql'), 'utf8')

        const result = await pool.request()
        .input('sellerID', sql.Int, sellerID)
        .input('categoryID', sql.Int, categoryID)
        .input('searchTerm', sql.NVarChar, name)
        .query(test);

        return result.recordsets;
    }
}

module.exports = new Result()