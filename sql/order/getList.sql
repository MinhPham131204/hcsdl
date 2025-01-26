with info as (
	select orderID, sum(quantity) as quantity, sum(price) as totalPrice from OrderDetail where sellerID = @id group by orderID
)
select o.orderID, orderedTime, i.quantity, i.totalPrice from Orders o inner join info i
on i.orderID = o.orderID