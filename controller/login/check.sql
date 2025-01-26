select userID, email, hashPassword from Users 
where email = @email and hashPassword = @password
    and userID in (select sellerID from Seller);