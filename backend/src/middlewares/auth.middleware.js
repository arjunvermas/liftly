const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
dotenv.config();
const jwt = require('jsonwebtoken');


// cookie middleware done
function authMiddleWare(req, res, next){
    const cookieToken = req.cookies?.token;
    const authHeader = req.headers.authorization;
    const bearerToken = authHeader?.startsWith('Bearer ')
        ? authHeader.slice(7)
        : null;
    const token = cookieToken || bearerToken;

    if (!token) {
        return res.status(401).json({error: "Unauthorized"});
    }

    try{
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userID = decoded.userId;
        return next();
    }
    catch(err){
        return res.status(401).json({error: "Unauthorized"});
    }
}

module.exports = {authMiddleWare};