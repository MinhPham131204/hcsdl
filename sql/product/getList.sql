select p.ID, p.productName, p.soldAmount, sum(m.quantity) as quantity, min(m.price) as minPrice, max(m.price) as maxPrice 
    from Products p 
    join ProductModel m on p.ID = m.productID 
    where p.sellerID = @id
    group by p.ID, p.productName, p.soldAmount 
    order by p.ID desc;
select p.ID, p.productName, p.soldAmount, s.stockQuantity as quantity, p.price
    from Products p
    join StockProduct s on p.ID = s.productID
    where p.sellerID = @id
    order by p.ID desc;