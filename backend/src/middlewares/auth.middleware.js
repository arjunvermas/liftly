const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
dotenv.config();
const jwt = require('jsonwebtoken');


//cookie middleware done
function authMiddleWare(req, res, next){
    try{
        console.log(req.cookies);
        const decoded = jwt.verify(req.cookies.token, process.env.JWT_SECRET);
        req.userID = decoded.userId;
        console.log("User verified:", decoded);
        return next();
    }
    catch(err){
        console.log(err);
        return res.status(401).json({error: "Unauthorized"});
    }
    
}

module.exports = {authMiddleWare};