const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
  let authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      
      // FIX: Check if token exists, is not empty string, and is not literal string 'null'/'undefined'
      if (!token || token.trim() === '' || token === 'undefined' || token === 'null') {
        return res.status(401).json({ message: 'Not authorized, invalid token format' });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded.id;
      next();
    } catch (error) {
      return res.status(401).json({ message: 'Not authorized, token expired or invalid' });
    }
  } else {
    return res.status(401).json({ message: 'Not authorized, no authorization header provided' });
  }
};

module.exports = { protect };