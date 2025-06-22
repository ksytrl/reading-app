import { Router, Request, Response } from 'express';

const router = Router();

// 获取用户信息
router.get('/profile', (req: Request, res: Response) => {
  res.json({ 
    message: 'User profile endpoint',
    timestamp: new Date().toISOString()
  });
});

export default router;