// backend/src/middlewares/auth.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// 扩展Request接口，添加user属性
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: number;
        username: string;
      };
    }
  }
}

export interface JWTPayload {
  userId: number;
  username: string;
  iat?: number;
  exp?: number;
}

// JWT认证中间件
export const authenticateJWT = (req: Request, res: Response, next: NextFunction) => {
  console.log('🔐 JWT认证中间件:', req.method, req.path);
  
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    console.log('❌ 未提供认证令牌');
    return res.status(401).json({ error: '未提供认证令牌' });
  }

  const token = authHeader.split(' ')[1]; // Bearer TOKEN
  
  if (!token) {
    console.log('❌ 认证令牌格式错误');
    return res.status(401).json({ error: '认证令牌格式错误' });
  }

  try {
    const decoded = jwt.verify(
      token, 
      process.env.JWT_SECRET || 'default-secret-key'
    ) as JWTPayload;

    console.log('✅ JWT验证成功:', { userId: decoded.userId, username: decoded.username });

    req.user = {
      userId: decoded.userId,
      username: decoded.username
    };

    next();
  } catch (error: any) {
    console.error('❌ JWT验证失败:', error.message);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: '认证令牌已过期，请重新登录' });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: '无效的认证令牌' });
    } else {
      return res.status(401).json({ error: '认证失败' });
    }
  }
};

// 可选的JWT中间件（不强制要求登录）
export const optionalJWT = (req: Request, res: Response, next: NextFunction) => {
  console.log('🔓 可选JWT中间件:', req.method, req.path);
  
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    console.log('ℹ️ 无认证令牌，继续执行');
    return next(); // 没有token就继续，不报错
  }

  const token = authHeader.split(' ')[1];
  
  if (!token) {
    console.log('ℹ️ 认证令牌格式错误，继续执行');
    return next();
  }

  try {
    const decoded = jwt.verify(
      token, 
      process.env.JWT_SECRET || 'default-secret-key'
    ) as JWTPayload;

    console.log('✅ 可选JWT验证成功:', { userId: decoded.userId, username: decoded.username });

    req.user = {
      userId: decoded.userId,
      username: decoded.username
    };
  } catch (error) {
    // 忽略JWT错误，继续执行
    console.log('⚠️ 可选JWT验证失败，继续执行:', (error as Error).message);
  }
  
  next();
};