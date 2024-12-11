CREATE OR ALTER PROCEDURE SearchProducts
    @sellerID,
    @categoryID int,
    @searchTerm NVARCHAR(255) = NULL, -- Tìm kiếm chung cho tên và mô tả
AS
BEGIN
    WITH findQuantity AS (
        select productID, sum(quantity) as quantity, min(price) as minPrice, max(price) as maxPrice from ProductModel group by productID
    )
    -- Truy vấn cơ bản
    SELECT 
        p.productName,
        p.status,
        p.rating,
        p.soldAmount
    FROM 
        Products p
    LEFT JOIN 
        Category c ON p.categoryID = c.ID
    WHERE 
        p.sellerID = sellerID AND
        -- Lọc theo danh mục
        (@categoryID IS NULL OR 
         c.ID = @categoryID
         c.mã_danh_mục_cha = (SELECT ID FROM Category WHERE ID = @categoryID)) AND
        -- Tìm kiếm chung theo tên và mô tả
        (@searchTerm IS NULL OR 
         p.productName LIKE '%' + @searchTerm + '%' OR 
         p.description LIKE '%' + @searchTerm + '%')
        -- Mặc định
    ORDER BY
        p.productName ASC,
        p.status ASC,
        p.soldAmount DESC;
END;