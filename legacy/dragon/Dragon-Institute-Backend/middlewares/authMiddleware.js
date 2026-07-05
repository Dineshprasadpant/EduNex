import * as userService from '../services/userService.js';

export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; 
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Access denied. No token provided.' 
      });
    }

    const decoded = await userService.verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ 
      success: false, 
      message: 'Invalid or expired token' 
    });
  }
};

export const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ 
      success: false, 
      message: 'Access denied. Admin privileges required.' 
    });
  }
};

export const isBoth = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'teacher')) {
    return next();
  }
  return res.status(403).json({ 
    success: false, 
    message: 'Access denied. Admin or Teacher privileges required.' 
  });
};

export const isTeacher = (req, res, next) => {
  if (req.user && (req.user.role === 'teacher' || req.user.role === 'admin')) {
    next();
  } else {
    return res.status(403).json({ 
      success: false, 
      message: 'Access denied. Teacher privileges required.' 
    });
  }
};

export const isUser = (req, res, next) => {
  if (req.user && ['user', 'teacher', 'admin'].includes(req.user.role)) {
    next();
  } else {
    return res.status(403).json({ 
      success: false, 
      message: 'Access denied. User privileges required.' 
    });
  }
};

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please login.'
      });
    }

    const token = authHeader && authHeader.split(' ')[1]; 
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication token is missing'
      });
    }
    console.log(token)
    const decoded = await userService.verifyToken(token);
   
    req.user = {
      id: decoded.id,
      plan: decoded.plan,
      courseEnrolled: decoded.courseEnrolled
    };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};


export const BasicAuthenticatation = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please login.'
      });
    }

    const token = authHeader && authHeader.split(' ')[1]; 
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication token is missing'
      });
    }
    console.log(token)
    const decoded = await userService.basicVerification(token);
   
    req.user = {
      id: decoded.id,
      plan: decoded.plan,
      courseEnrolled: decoded.courseEnrolled
    };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};


