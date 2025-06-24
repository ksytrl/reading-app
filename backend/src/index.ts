import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import * as iconv from 'iconv-lite';
import * as jschardet from 'jschardet';
import { authenticateJWT, optionalJWT } from './middlewares/auth'; // 🎯 新增导入

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

// 创建uploads目录（如果不存在）
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// 中间件
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(morgan('combined'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 静态文件服务
app.use('/uploads', express.static(uploadsDir));

// 🔧 推荐算法工具函数
const calculateRecommendationScore = async (userId: number, bookId: number): Promise<number> => {
  try {
    // 获取用户阅读历史
    const userHistory = await prisma.readingRecord.findMany({
      where: { userId },
      include: { book: { include: { category: true } } }
    });

    // 获取目标书籍信息
    const targetBook = await prisma.book.findUnique({
      where: { id: bookId },
      include: { category: true }
    });

    if (!targetBook || userHistory.length === 0) {
      return 0.5; // 默认评分
    }

    let score = 0;
    let factors = 0;

    // 1. 分类偏好匹配 (权重: 0.4)
    if (targetBook.categoryId) {
      const categoryBooks = userHistory.filter(h => h.book.categoryId === targetBook.categoryId);
      const categoryScore = Math.min(categoryBooks.length / userHistory.length * 2, 1);
      score += categoryScore * 0.4;
      factors += 0.4;
    }

    // 2. 评分相似度 (权重: 0.3)
    const avgUserRating = userHistory.reduce((sum, h) => sum + h.book.rating, 0) / userHistory.length;
    const ratingDiff = Math.abs(targetBook.rating - avgUserRating);
    const ratingScore = Math.max(0, 1 - ratingDiff / 5);
    score += ratingScore * 0.3;
    factors += 0.3;

    // 3. 热门度 (权重: 0.3)
    const popularityScore = Math.min(targetBook.viewCount / 1000, 1);
    score += popularityScore * 0.3;
    factors += 0.3;

    return factors > 0 ? Math.min(score / factors, 1) : 0.5;
  } catch (error: any) {
    console.error('推荐评分计算失败:', error);
    return 0.5;
  }
};

// 健康检查
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ 
    message: 'Reading App Server is running!', 
    timestamp: new Date().toISOString(),
    status: 'healthy',
    version: '2.0.0',
    features: ['social', 'recommendations', 'multi-format']
  });
});

// 🎯 认证路由（不需要JWT验证）
app.post('/api/auth/register', async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: '用户名和密码不能为空' });
    }

    if (username.length < 3) {
      return res.status(400).json({ error: '用户名至少需要3个字符' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: '密码至少需要6个字符' });
    }

    // 检查用户是否已存在
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username },
          ...(email ? [{ email }] : [])
        ]
      }
    });

    if (existingUser) {
      return res.status(400).json({ error: '用户名或邮箱已存在' });
    }

    // 加密密码
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(password, 12);

    // 创建用户
    const user = await prisma.user.create({
      data: {
        username,
        email: email || null,
        password: hashedPassword,
        lastActiveAt: new Date()
      },
      select: {
        id: true,
        username: true,
        email: true,
        isVip: true,
        createdAt: true
      }
    });

    // 生成JWT
    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      process.env.JWT_SECRET || 'default-secret-key',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: '注册成功',
      user,
      token
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({ error: '注册失败，请稍后重试' });
  }
});

app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: '用户名和密码不能为空' });
    }

    // 查找用户
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username },
          { email: username }
        ]
      }
    });

    if (!user) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    // 验证密码
    const bcrypt = require('bcryptjs');
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    // 更新最后活跃时间
    await prisma.user.update({
      where: { id: user.id },
      data: { lastActiveAt: new Date() }
    });

    // 生成JWT
    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      process.env.JWT_SECRET || 'default-secret-key',
      { expiresIn: '7d' }
    );

    res.json({
      message: '登录成功',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        isVip: user.isVip,
        createdAt: user.createdAt
      },
      token
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: '登录失败，请稍后重试' });
  }
});

// 🎯 公开路由（不需要认证）
app.get('/api/books', optionalJWT, async (req: Request, res: Response) => {
  try {
    console.log('🔍 收到搜索请求:', req.query);
    
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 12;
    const category = req.query.category as string;
    const search = req.query.search as string;
    const sort = req.query.sort as string || 'updated';
    
    const skip = (page - 1) * limit;

    const where: any = {};
    
    // 🎯 分类筛选
    if (category) {
      console.log(`📂 筛选分类: ${category}`);
      where.category = { name: category };
    }
    
    // 🎯 修复搜索逻辑 - 移除不兼容的 mode 参数
    if (search) {
      console.log(`🔍 搜索关键词: ${search}`);
      where.OR = [
        { title: { contains: search } },
        { author: { contains: search } },
        { description: { contains: search } }
      ];
    }

    // 🎯 修复排序逻辑 - 使用单个对象而非数组
    let orderBy: any = { updatedAt: 'desc' }; // 默认排序
    
    switch (sort) {
      case 'relevance':
        if (search) {
          // 搜索时按评分排序
          orderBy = { rating: 'desc' };
        } else {
          orderBy = { updatedAt: 'desc' };
        }
        break;
      case 'rating':
        orderBy = { rating: 'desc' };
        break;
      case 'popular':
        orderBy = { viewCount: 'desc' };
        break;
      case 'newest':
        orderBy = { createdAt: 'desc' };
        break;
      case 'updated':
      default:
        orderBy = { updatedAt: 'desc' };
        break;
    }

    console.log('🗃️ 数据库查询条件:', JSON.stringify({ where, orderBy }, null, 2));

    const [books, total] = await Promise.all([
      prisma.book.findMany({
        where,
        include: {
          category: {
            select: {
              id: true,
              name: true
            }
          },
          _count: {
            select: {
              chapters: true,
              reviews: true
            }
          }
        },
        skip,
        take: limit,
        orderBy
      }),
      prisma.book.count({ where })
    ]);

    console.log(`✅ 搜索结果: 关键词="${search}", 分类="${category}", 排序="${sort}"`);
    console.log(`📊 返回 ${books.length}/${total} 本书籍`);

    res.json({
      books,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      searchInfo: {
        query: search || '',
        category: category || '',
        sort: sort || 'updated',
        hasResults: books.length > 0
      }
    });
  } catch (error: any) {
    console.error('❌ 搜索API错误:', error);
    console.error('错误详情:', error.message);
    console.error('错误堆栈:', error.stack);
    res.status(500).json({ 
      error: '获取书籍列表失败',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

app.get('/api/books/:id', optionalJWT, async (req: Request, res: Response) => {
  try {
    const bookId = parseInt(req.params.id);
    
    if (isNaN(bookId)) {
      return res.status(400).json({ error: '无效的书籍ID' });
    }
    
    const book = await prisma.book.findUnique({
      where: { id: bookId },
      include: {
        category: {
          select: {
            id: true,
            name: true
          }
        },
        chapters: {
          select: {
            id: true,
            chapterNumber: true,
            title: true,
            wordCount: true,
            isFree: true,
            createdAt: true
          },
          orderBy: { chapterNumber: 'asc' }
        },
        _count: {
          select: {
            reviews: true,
            bookshelf: true
          }
        }
      }
    });

    if (!book) {
      return res.status(404).json({ error: '书籍不存在' });
    }

    // 增加浏览次数
    await prisma.book.update({
      where: { id: bookId },
      data: { viewCount: { increment: 1 } }
    });

    // 如果用户已登录，记录阅读行为用于推荐系统
    if (req.user) {
      setImmediate(async () => {
        try {
          await prisma.user.update({
            where: { id: req.user!.userId },
            data: { lastActiveAt: new Date() }
          });
        } catch (err: any) {
          console.warn('记录用户行为失败:', err);
        }
      });
    }

    res.json(book);
  } catch (error: any) {
    console.error('Get book detail error:', error);
    res.status(500).json({ error: '获取书籍详情失败' });
  }
});

// 🎯 需要认证的用户路由
app.get('/api/users/profile', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId; // 从JWT获取

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        isVip: true,
        followerCount: true,
        followingCount: true,
        readingTime: true,
        booksRead: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }

    res.json(user);
  } catch (error: any) {
    console.error('Get user profile error:', error);
    res.status(500).json({ error: '获取用户信息失败' });
  }
});

// ==================== 社交功能API ====================

// 👥 关注用户
app.post('/api/users/:userId/follow', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const followerId = req.user!.userId;
    const followingId = parseInt(req.params.userId);

    if (followerId === followingId) {
      return res.status(400).json({ error: '不能关注自己' });
    }

    // 检查目标用户是否存在
    const targetUser = await prisma.user.findUnique({
      where: { id: followingId }
    });

    if (!targetUser) {
      return res.status(404).json({ error: '用户不存在' });
    }

    // 检查是否已经关注
    const existingFollow = await prisma.userFollows.findUnique({
      where: {
        followerId_followingId: { followerId, followingId }
      }
    });

    if (existingFollow) {
      return res.status(400).json({ error: '已经关注该用户' });
    }

    // 创建关注关系
    await prisma.userFollows.create({
      data: { followerId, followingId }
    });

    // 更新关注数统计
    await prisma.$transaction([
      prisma.user.update({
        where: { id: followerId },
        data: { followingCount: { increment: 1 } }
      }),
      prisma.user.update({
        where: { id: followingId },
        data: { followerCount: { increment: 1 } }
      })
    ]);

    res.json({ message: '关注成功' });
  } catch (error: any) {
    console.error('Follow user error:', error);
    res.status(500).json({ error: '关注失败' });
  }
});

// 👥 取消关注
app.delete('/api/users/:userId/follow', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const followerId = req.user!.userId;
    const followingId = parseInt(req.params.userId);

    const existingFollow = await prisma.userFollows.findUnique({
      where: {
        followerId_followingId: { followerId, followingId }
      }
    });

    if (!existingFollow) {
      return res.status(400).json({ error: '未关注该用户' });
    }

    // 删除关注关系
    await prisma.userFollows.delete({
      where: { id: existingFollow.id }
    });

    // 更新关注数统计
    await prisma.$transaction([
      prisma.user.update({
        where: { id: followerId },
        data: { followingCount: { decrement: 1 } }
      }),
      prisma.user.update({
        where: { id: followingId },
        data: { followerCount: { decrement: 1 } }
      })
    ]);

    res.json({ message: '取消关注成功' });
  } catch (error: any) {
    console.error('Unfollow user error:', error);
    res.status(500).json({ error: '取消关注失败' });
  }
});

// 📤 分享书籍
app.post('/api/books/:bookId/share', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const bookId = parseInt(req.params.bookId);
    const { platform, content } = req.body;

    const validPlatforms = ['wechat', 'weibo', 'qq', 'link'];
    if (!validPlatforms.includes(platform)) {
      return res.status(400).json({ error: '不支持的分享平台' });
    }

    // 检查书籍是否存在
    const book = await prisma.book.findUnique({
      where: { id: bookId }
    });

    if (!book) {
      return res.status(404).json({ error: '书籍不存在' });
    }

    // 创建分享记录
    const share = await prisma.share.create({
      data: {
        userId,
        bookId,
        platform,
        content: content || `我在阅读《${book.title}》，推荐给大家！`
      }
    });

    // 生成分享链接
    const shareUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/book/${bookId}?share=${share.id}`;

    res.json({
      message: '分享成功',
      shareUrl,
      shareId: share.id
    });
  } catch (error: any) {
    console.error('Share book error:', error);
    res.status(500).json({ error: '分享失败' });
  }
});

// 💬 创建讨论
app.post('/api/discussions', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { title, content, type, bookId } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: '标题和内容不能为空' });
    }

    const validTypes = ['GENERAL', 'BOOK_REVIEW', 'CHAPTER', 'AUTHOR', 'QUESTION'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: '讨论类型无效' });
    }

    // 如果指定了书籍，检查书籍是否存在
    if (bookId) {
      const book = await prisma.book.findUnique({
        where: { id: parseInt(bookId) }
      });

      if (!book) {
        return res.status(404).json({ error: '书籍不存在' });
      }
    }

    const discussion = await prisma.discussion.create({
      data: {
        userId,
        title,
        content,
        type,
        bookId: bookId ? parseInt(bookId) : null
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true,
            isVip: true
          }
        },
        book: {
          select: {
            id: true,
            title: true,
            author: true
          }
        }
      }
    });

    res.status(201).json({
      message: '讨论创建成功',
      discussion
    });
  } catch (error: any) {
    console.error('Create discussion error:', error);
    res.status(500).json({ error: '创建讨论失败' });
  }
});

// 💬 获取讨论列表
app.get('/api/discussions', optionalJWT, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const bookId = req.query.bookId as string;
    const type = req.query.type as string;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (bookId) where.bookId = parseInt(bookId);
    if (type) where.type = type;

    const [discussions, total] = await Promise.all([
      prisma.discussion.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              avatar: true,
              isVip: true
            }
          },
          book: {
            select: {
              id: true,
              title: true,
              author: true
            }
          },
          _count: {
            select: {
              comments: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.discussion.count({ where })
    ]);

    res.json({
      discussions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    console.error('Get discussions error:', error);
    res.status(500).json({ error: '获取讨论列表失败' });
  }
});

// ==================== 推荐系统API ====================

// 🎯 获取个性化推荐
app.get('/api/recommendations', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const limit = parseInt(req.query.limit as string) || 10;

    // 获取用户阅读历史
    const userHistory = await prisma.readingRecord.findMany({
      where: { userId },
      include: { book: { include: { category: true } } },
      orderBy: { lastReadAt: 'desc' },
      take: 50
    });

    if (userHistory.length === 0) {
      // 新用户推荐热门书籍
      const popularBooks = await prisma.book.findMany({
        orderBy: [
          { viewCount: 'desc' },
          { rating: 'desc' }
        ],
        take: limit,
        include: {
          category: true,
          _count: {
            select: { bookshelf: true, reviews: true }
          }
        }
      });

      return res.json({
        recommendations: popularBooks.map(book => ({
          book,
          score: 0.8,
          reason: '热门推荐',
          algorithm: 'trending'
        })),
        type: 'trending'
      });
    }

    // 获取候选书籍（排除已读书籍）
    const readBookIds = userHistory.map(h => h.bookId);
    const candidateBooks = await prisma.book.findMany({
      where: {
        id: { notIn: readBookIds }
      },
      include: {
        category: true,
        _count: {
          select: { bookshelf: true, reviews: true }
        }
      },
      take: 100
    });

    // 计算推荐分数
    const recommendations = await Promise.all(
      candidateBooks.map(async (book) => {
        const score = await calculateRecommendationScore(userId, book.id);
        return {
          book,
          score,
          reason: score > 0.7 ? '高度匹配您的阅读偏好' : score > 0.5 ? '可能感兴趣' : '尝试新类型',
          algorithm: 'hybrid'
        };
      })
    );

    // 排序并限制数量
    const sortedRecommendations = recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    res.json({
      recommendations: sortedRecommendations,
      type: 'personalized'
    });
  } catch (error: any) {
    console.error('Get recommendations error:', error);
    res.status(500).json({ error: '获取推荐失败' });
  }
});

// ==================== 多格式文件支持 ====================

// 🎯 文件上传配置 - 支持多格式
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/books/');
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
    const safeName = originalName.replace(/[^a-zA-Z0-9\u4e00-\u9fa5.-]/g, '_');
    const ext = path.extname(safeName);
    cb(null, `${timestamp}_${safeName}`);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.txt', '.epub', '.pdf'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('只支持 txt, epub, pdf 格式文件'));
    }
  },
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB限制
  }
});

// 创建books上传目录
const booksDir = path.join(__dirname, '../uploads/books');
if (!fs.existsSync(booksDir)) {
  fs.mkdirSync(booksDir, { recursive: true });
}

// 章节识别函数保持不变
function parseChapters(content: string): { title: string; content: string; chapterNumber: number }[] {
  const chapters: { title: string; content: string; chapterNumber: number }[] = [];
  
  const chapterPatterns = [
    /^第[一二三四五六七八九十百千万\d]+章.*/gm,
    /^第[一二三四五六七八九十百千万\d]+回.*/gm,
    /^第[一二三四五六七八九十百千万\d]+节.*/gm,
    /^第[一二三四五六七八九十百千万\d]+卷.*/gm,
    /^[第]?[一二三四五六七八九十百千万\d]+[、\.\s].*/gm,
    /^Chapter\s+\d+.*/gmi,
    /^序章|楔子|引言|前言.*/gm,
    /^\d+[、\.\s].*/gm
  ];

  let bestMatch: { pattern: RegExp; matches: RegExpMatchArray } | null = null;
  let maxMatches = 0;

  for (const pattern of chapterPatterns) {
    const matches = content.match(pattern);
    if (matches && matches.length > maxMatches) {
      maxMatches = matches.length;
      bestMatch = { pattern, matches };
    }
  }

  if (!bestMatch || maxMatches === 0) {
    return [{
      title: '全文',
      content: content.trim(),
      chapterNumber: 1
    }];
  }

  const parts = content.split(bestMatch.pattern);
  const matches = bestMatch.matches;

  for (let i = 0; i < matches.length; i++) {
    const title = matches[i].trim();
    const contentPart = i + 1 < parts.length ? parts[i + 1] : '';
    
    if (contentPart && contentPart.trim()) {
      chapters.push({
        title: title,
        content: contentPart.trim(),
        chapterNumber: i + 1
      });
    }
  }

  if (chapters.length === 0) {
    const paragraphs = content.split(/\n\s*\n/);
    let chapterNum = 1;
    let currentChapter = '';
    
    for (const paragraph of paragraphs) {
      if (paragraph.trim().length > 0) {
        if (currentChapter.length > 3000) {
          chapters.push({
            title: `第${chapterNum}章`,
            content: currentChapter.trim(),
            chapterNumber: chapterNum
          });
          chapterNum++;
          currentChapter = paragraph;
        } else {
          currentChapter += '\n\n' + paragraph;
        }
      }
    }
    
    if (currentChapter.trim()) {
      chapters.push({
        title: `第${chapterNum}章`,
        content: currentChapter.trim(),
        chapterNumber: chapterNum
      });
    }
  }

  return chapters;
}

function extractBookInfo(content: string, originalFilename: string): { title: string; author: string; description: string } {
  const lines = content.split('\n').filter(line => line.trim());
  
  let title = originalFilename;
  
  try {
    const decoded1 = Buffer.from(originalFilename, 'latin1').toString('utf8');
    if (decoded1.length > 0 && !decoded1.includes('�')) {
      title = decoded1;
    }
  } catch (e) {
    try {
      const decoded2 = iconv.decode(Buffer.from(originalFilename, 'binary'), 'gbk');
      if (decoded2.length > 0 && !decoded2.includes('�')) {
        title = decoded2;
      }
    } catch (e2) {
      try {
        title = decodeURIComponent(escape(originalFilename));
      } catch (e3) {
        title = originalFilename;
      }
    }
  }
  
  title = title.replace(/\.(txt|epub|pdf)$/i, '').trim();
  
  let author = '未知作者';
  let description = '';

  for (let i = 0; i < Math.min(10, lines.length); i++) {
    const line = lines[i].trim();
    
    if (line.includes('作者') || line.includes('著') || line.includes('写')) {
      const authorMatch = line.match(/(作者|著|写)[：:]\s*(.+)/);
      if (authorMatch) {
        author = authorMatch[2].trim();
        break;
      }
    }
  }

  const cleanContent = content.replace(/第[一二三四五六七八九十百千万\d]+[章回节卷].*/g, '');
  description = cleanContent.substring(0, 200).trim() + '...';

  return { title, author, description };
}

// 🎯 多格式文件上传处理
app.post('/api/books/upload', authenticateJWT, upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '请选择要上传的文件' });
    }

    const userId = req.user!.userId;
    const file = req.file;

    console.log(`📁 开始处理文件: ${file.originalname}`);

    const fileExt = path.extname(file.originalname).toLowerCase();
    let bookData: any = {};
    let chapters: any[] = [];

    // 根据文件格式处理
    switch (fileExt) {
      case '.txt':
        // TXT文件处理逻辑
        const fileBuffer = fs.readFileSync(file.path);
        const detected = jschardet.detect(fileBuffer);
        console.log('检测到的文件编码:', detected);
        
        let encoding = 'utf8';
        if (detected && detected.encoding) {
          const encodingMap: { [key: string]: string } = {
            'GB2312': 'gb2312',
            'GBK': 'gbk',
            'UTF-8': 'utf8',
            'UTF-16': 'utf16le',
            'Big5': 'big5'
          };
          encoding = encodingMap[detected.encoding] || detected.encoding.toLowerCase();
        }
        
        let content: string;
        if (encoding === 'utf8') {
          content = fileBuffer.toString('utf8');
        } else {
          content = iconv.decode(fileBuffer, encoding);
        }
        
        // 智能提取书籍信息
        const bookInfo = extractBookInfo(content, file.originalname);
        chapters = parseChapters(content);

        bookData = {
          title: bookInfo.title,
          author: bookInfo.author,
          description: bookInfo.description,
          totalWords: content.length,
          totalChapters: chapters.length,
          originalFormat: 'txt',
          fileSize: file.size,
          formats: JSON.stringify({ txt: `/uploads/${file.filename}` })
        };
        break;

      case '.epub':
        // EPUB文件处理
        bookData = {
          title: path.basename(file.originalname, '.epub'),
          author: '未知作者',
          description: 'EPUB格式电子书',
          totalWords: 0,
          totalChapters: 1,
          originalFormat: 'epub',
          fileSize: file.size,
          formats: JSON.stringify({ epub: `/uploads/${file.filename}` })
        };
        
        // 创建占位章节
        chapters.push({
          chapterNumber: 1,
          title: 'EPUB内容',
          content: 'EPUB格式暂不支持在线阅读，请下载客户端阅读。',
          wordCount: 50
        });
        break;

      case '.pdf':
        // PDF文件处理
        bookData = {
          title: path.basename(file.originalname, '.pdf'),
          author: '未知作者',
          description: 'PDF格式文档',
          totalWords: 0,
          totalChapters: 1,
          originalFormat: 'pdf',
          fileSize: file.size,
          formats: JSON.stringify({ pdf: `/uploads/${file.filename}` })
        };
        
        // 创建占位章节
        chapters.push({
          chapterNumber: 1,
          title: 'PDF内容',
          content: 'PDF格式暂不支持在线阅读，请下载查看。',
          wordCount: 50
        });
        break;

      default:
        return res.status(400).json({ error: '不支持的文件格式' });
    }

    if (chapters.length === 0) {
      fs.unlinkSync(file.path);
      return res.status(400).json({ error: '无法解析文件内容，请检查文件格式' });
    }

    let category = await prisma.category.findFirst({ where: { name: '用户上传' } });
    if (!category) {
      category = await prisma.category.create({
        data: {
          name: '用户上传',
          description: '用户上传的书籍',
          sortOrder: 99
        }
      });
    }

    // 创建书籍记录
    const book = await prisma.book.create({
      data: {
        ...bookData,
        categoryId: category.id,
        status: 'COMPLETED',
        isFree: true,
        rating: 0.0,
        isFeatured: false,
        tags: ['用户上传', bookData.originalFormat.toUpperCase()]
      }
    });

    // 批量创建章节
    const chaptersData = chapters.map(chapter => ({
      ...chapter,
      bookId: book.id,
      isFree: true
    }));

    await prisma.chapter.createMany({
      data: chaptersData
    });

    // 🎯 自动添加到用户书架
    await prisma.userBookshelf.create({
      data: {
        userId,
        bookId: book.id,
        lastReadAt: new Date()
      }
    });

    console.log(`✅ 文件上传成功: ${book.title} (${chapters.length}章, ${bookData.originalFormat}格式)`);

    res.status(201).json({
      message: '文件上传成功，已自动添加到书架',
      book: {
        id: book.id,
        title: book.title,
        author: book.author,
        totalChapters: book.totalChapters,
        format: bookData.originalFormat
      },
      chaptersCount: chapters.length,
      addedToBookshelf: true
    });

  } catch (error: any) {
    console.error('Upload error:', error);
    
    // 清理上传的文件
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError: any) {
        console.warn('清理文件失败:', cleanupError);
      }
    }
    
    res.status(500).json({ 
      error: '文件上传失败',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 测试路由
app.get('/api/test', (req: Request, res: Response) => {
  res.json({ 
    message: 'All routes working with enhanced features!',
    timestamp: new Date().toISOString(),
    routes: [
      'GET /api/health',
      'GET /api/books',
      'GET /api/books/:id',
      'POST /api/auth/login',
      'POST /api/auth/register',
      'GET /api/users/profile [AUTH]',
      'POST /api/reading-records [AUTH]',
      'POST /api/books/upload [AUTH] - Multi-format support',
      'GET /api/users/books [AUTH]',
      'DELETE /api/books/:id [AUTH]',
      'GET /api/users/bookshelf [AUTH]',
      'POST /api/users/bookshelf [AUTH]',
      'DELETE /api/users/bookshelf/:bookId [AUTH]',
      'PATCH /api/users/bookshelf/:bookId/favorite [AUTH]',
      'GET /api/users/bookshelf/check/:bookId [AUTH]',
      'POST /api/users/:userId/follow [AUTH] - Social',
      'DELETE /api/users/:userId/follow [AUTH] - Social',
      'POST /api/books/:bookId/share [AUTH] - Social',
      'POST /api/discussions [AUTH] - Social',
      'GET /api/discussions - Social',
      'GET /api/recommendations [AUTH] - AI Recommendations'
    ]
  });
});

// 🎯 章节路由（公开）
app.get('/api/chapters/:id', optionalJWT, async (req: Request, res: Response) => {
  try {
    const chapterId = parseInt(req.params.id);
    
    if (isNaN(chapterId)) {
      return res.status(400).json({ error: '无效的章节ID' });
    }
    
    console.log(`获取章节详情: ${chapterId}`);
    
    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      include: {
        book: {
          select: {
            id: true,
            title: true,
            author: true,
            totalChapters: true
          }
        }
      }
    });

    if (!chapter) {
      return res.status(404).json({ error: '章节不存在' });
    }

    console.log(`返回章节: ${chapter.title}`);
    res.json(chapter);
  } catch (error: any) {
    console.error('Get chapter error:', error);
    res.status(500).json({ error: '获取章节详情失败' });
  }
});

app.get('/api/books/:bookId/chapters', optionalJWT, async (req: Request, res: Response) => {
  try {
    const bookId = parseInt(req.params.bookId);
    
    if (isNaN(bookId)) {
      return res.status(400).json({ error: '无效的书籍ID' });
    }
    
    const chapters = await prisma.chapter.findMany({
      where: { bookId },
      select: {
        id: true,
        chapterNumber: true,
        title: true,
        wordCount: true,
        isFree: true,
        createdAt: true
      },
      orderBy: { chapterNumber: 'asc' }
    });

    res.json(chapters);
  } catch (error: any) {
    console.error('Get book chapters error:', error);
    res.status(500).json({ error: '获取章节列表失败' });
  }
});

// 🎯 需要认证的阅读记录
app.post('/api/reading-records', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId; // 🎯 从JWT获取，不再使用硬编码
    const { bookId, chapterId, progressPercentage, readingPosition } = req.body;
    
    const record = await prisma.readingRecord.upsert({
      where: {
        userId_bookId_chapterId: {
          userId,
          bookId: parseInt(bookId),
          chapterId: parseInt(chapterId)
        }
      },
      update: {
        progressPercentage: parseFloat(progressPercentage),
        readingPosition: parseInt(readingPosition),
        lastReadAt: new Date()
      },
      create: {
        userId,
        bookId: parseInt(bookId),
        chapterId: parseInt(chapterId),
        progressPercentage: parseFloat(progressPercentage),
        readingPosition: parseInt(readingPosition)
      }
    });

    res.json({ message: '阅读记录保存成功', record });
  } catch (error: any) {
    console.error('Save reading record error:', error);
    res.status(500).json({ error: '保存阅读记录失败' });
  }
});

// 🎯 需要认证的用户书籍列表
app.get('/api/users/books', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId; // 🎯 从JWT获取用户ID

    // 🎯 修改查询逻辑：查找该用户上传的书籍
    // 可以通过书架记录来找用户上传的书，或者在Book表中添加uploaderId字段
    // 暂时使用用户上传分类的所有书籍（后续可优化）
    const books = await prisma.book.findMany({
      where: {
        category: {
          name: '用户上传'
        }
      },
      include: {
        category: true,
        _count: {
          select: {
            chapters: true,
            reviews: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(books);
  } catch (error: any) {
    console.error('Get user books error:', error);
    res.status(500).json({ error: '获取用户书籍失败' });
  }
});

// 🎯 需要认证的删除书籍
app.delete('/api/books/:id', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const bookId = parseInt(req.params.id);
    const userId = req.user!.userId;
    
    if (isNaN(bookId)) {
      return res.status(400).json({ error: '无效的书籍ID' });
    }

    // TODO: 添加权限验证，确保只有书籍的上传者可以删除
    // 目前暂时允许删除，后续可以添加 uploaderId 字段到 Book 表
    
    await prisma.book.delete({
      where: { id: bookId }
    });

    console.log(`用户 ${req.user!.username} 删除了书籍 ${bookId}`);
    res.json({ message: '书籍删除成功' });
  } catch (error: any) {
    console.error('Delete book error:', error);
    res.status(500).json({ error: '删除书籍失败' });
  }
});

// 🎯 需要认证的书架管理API
app.get('/api/users/bookshelf', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId; // 🎯 从JWT获取用户ID

    const bookshelfItems = await prisma.userBookshelf.findMany({
      where: { userId },
      include: {
        book: {
          include: {
            category: {
              select: { id: true, name: true }
            },
            _count: {
              select: { chapters: true }
            }
          }
        }
      },
      orderBy: { lastReadAt: 'desc' }
    });

    const bookshelfWithProgress = await Promise.all(
      bookshelfItems.map(async (item) => {
        const latestRecord = await prisma.readingRecord.findFirst({
          where: {
            userId,
            bookId: item.bookId
          },
          include: {
            chapter: {
              select: { id: true, title: true, chapterNumber: true }
            }
          },
          orderBy: { lastReadAt: 'desc' }
        });

        let overallProgress = 0;
        if (latestRecord && item.book._count.chapters > 0) {
          overallProgress = (latestRecord.chapter.chapterNumber / item.book._count.chapters) * 100;
        }

        return {
          ...item,
          readingProgress: {
            overallProgress: Math.round(overallProgress),
            currentChapter: latestRecord?.chapter || null,
            chapterProgress: latestRecord?.progressPercentage || 0,
            lastReadAt: latestRecord?.lastReadAt || null
          }
        };
      })
    );

    res.json(bookshelfWithProgress);
  } catch (error: any) {
    console.error('Get bookshelf error:', error);
    res.status(500).json({ error: '获取书架失败' });
  }
});

app.post('/api/users/bookshelf', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId; // 🎯 从JWT获取用户ID
    const { bookId } = req.body;

    if (!bookId) {
      return res.status(400).json({ error: '书籍ID不能为空' });
    }

    const book = await prisma.book.findUnique({ where: { id: parseInt(bookId) } });
    if (!book) {
      return res.status(404).json({ error: '书籍不存在' });
    }

    const existing = await prisma.userBookshelf.findUnique({
      where: {
        userId_bookId: {
          userId,
          bookId: parseInt(bookId)
        }
      }
    });

    if (existing) {
      return res.status(400).json({ error: '书籍已在书架中' });
    }

    const bookshelfItem = await prisma.userBookshelf.create({
      data: {
        userId,
        bookId: parseInt(bookId)
      }
    });

    console.log(`用户 ${req.user!.username} 添加书籍《${book.title}》到书架`);

    res.json({ 
      message: '添加到书架成功', 
      bookshelfItem,
      book: { id: book.id, title: book.title }
    });
  } catch (error: any) {
    console.error('Add to bookshelf error:', error);
    res.status(500).json({ error: '添加到书架失败' });
  }
});

app.delete('/api/users/bookshelf/:bookId', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId; // 🎯 从JWT获取用户ID
    const bookId = parseInt(req.params.bookId);

    if (isNaN(bookId)) {
      return res.status(400).json({ error: '无效的书籍ID' });
    }

    const deleted = await prisma.userBookshelf.delete({
      where: {
        userId_bookId: {
          userId,
          bookId
        }
      }
    });

    console.log(`用户 ${req.user!.username} 从书架移除了书籍 ${bookId}`);
    res.json({ message: '从书架移除成功' });
  } catch (error: any) {
    console.error('Remove from bookshelf error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: '书籍不在书架中' });
    }
    res.status(500).json({ error: '从书架移除失败' });
  }
});

app.patch('/api/users/bookshelf/:bookId/favorite', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId; // 🎯 从JWT获取用户ID
    const bookId = parseInt(req.params.bookId);

    if (isNaN(bookId)) {
      return res.status(400).json({ error: '无效的书籍ID' });
    }

    const bookshelfItem = await prisma.userBookshelf.findUnique({
      where: {
        userId_bookId: {
          userId,
          bookId
        }
      }
    });

    if (!bookshelfItem) {
      return res.status(404).json({ error: '书籍不在书架中' });
    }

    const updated = await prisma.userBookshelf.update({
      where: {
        userId_bookId: {
          userId,
          bookId
        }
      },
      data: {
        isFavorite: !bookshelfItem.isFavorite
      }
    });

    console.log(`用户 ${req.user!.username} ${updated.isFavorite ? '收藏了' : '取消收藏了'}书籍 ${bookId}`);

    res.json({ 
      message: updated.isFavorite ? '已收藏' : '已取消收藏',
      isFavorite: updated.isFavorite
    });
  } catch (error: any) {
    console.error('Toggle favorite error:', error);
    res.status(500).json({ error: '切换收藏状态失败' });
  }
});

app.get('/api/users/bookshelf/check/:bookId', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId; // 🎯 从JWT获取用户ID
    const bookId = parseInt(req.params.bookId);

    if (isNaN(bookId)) {
      return res.status(400).json({ error: '无效的书籍ID' });
    }

    const bookshelfItem = await prisma.userBookshelf.findUnique({
      where: {
        userId_bookId: {
          userId,
          bookId
        }
      }
    });

    res.json({ 
      inBookshelf: !!bookshelfItem,
      isFavorite: bookshelfItem?.isFavorite || false
    });
  } catch (error: any) {
    console.error('Check bookshelf error:', error);
    res.status(500).json({ error: '检查书架状态失败' });
  }
});

// 在 backend/src/index.ts 中的其他路由后面添加以下评论API

// 🎯 评论相关API

// 获取书籍评论列表（公开）
app.get('/api/books/:bookId/reviews', optionalJWT, async (req: Request, res: Response) => {
  try {
    const bookId = parseInt(req.params.bookId);
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    
    if (isNaN(bookId)) {
      return res.status(400).json({ error: '无效的书籍ID' });
    }

    console.log(`获取书籍 ${bookId} 的评论列表`);

    const [reviews, total] = await Promise.all([
      prisma.bookReview.findMany({
        where: { bookId },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              avatar: true,
              isVip: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.bookReview.count({ where: { bookId } })
    ]);

    // 计算评分统计
    const ratingStats = await prisma.bookReview.groupBy({
      by: ['rating'],
      where: { bookId },
      _count: { rating: true }
    });

    const totalRatings = ratingStats.reduce((sum, stat) => sum + stat._count.rating, 0);
    const averageRating = totalRatings > 0 
      ? ratingStats.reduce((sum, stat) => sum + (stat.rating * stat._count.rating), 0) / totalRatings 
      : 0;

    res.json({
      reviews,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      stats: {
        totalReviews: total,
        averageRating: Math.round(averageRating * 10) / 10,
        ratingDistribution: ratingStats.reduce((acc: any, stat) => {
          acc[stat.rating] = stat._count.rating;
          return acc;
        }, {})
      }
    });
  } catch (error: any) {
    console.error('Get reviews error:', error);
    res.status(500).json({ error: '获取评论失败' });
  }
});

// 创建评论（需要认证）
app.post('/api/books/:bookId/reviews', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const bookId = parseInt(req.params.bookId);
    const userId = req.user!.userId;
    const { rating, content } = req.body;
    
    if (isNaN(bookId)) {
      return res.status(400).json({ error: '无效的书籍ID' });
    }

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: '评分必须是1-5之间的整数' });
    }

    if (!content || content.trim().length < 5) {
      return res.status(400).json({ error: '评论内容至少需要5个字符' });
    }

    // 检查书籍是否存在
    const book = await prisma.book.findUnique({ where: { id: bookId } });
    if (!book) {
      return res.status(404).json({ error: '书籍不存在' });
    }

    // 检查用户是否已经评论过
    const existingReview = await prisma.bookReview.findFirst({
      where: { userId, bookId }
    });

    if (existingReview) {
      return res.status(400).json({ error: '您已经评论过这本书了，可以编辑现有评论' });
    }

    // 创建评论
    const review = await prisma.bookReview.create({
      data: {
        userId,
        bookId,
        rating: parseInt(rating),
        content: content.trim()
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true,
            isVip: true
          }
        }
      }
    });

    // 更新书籍平均评分
    const allReviews = await prisma.bookReview.findMany({
      where: { bookId },
      select: { rating: true }
    });

    const newAverageRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
    
    await prisma.book.update({
      where: { id: bookId },
      data: { rating: Math.round(newAverageRating * 10) / 10 }
    });

    console.log(`用户 ${req.user!.username} 对书籍《${book.title}》发表了评论，评分 ${rating} 星`);

    res.status(201).json({
      message: '评论发表成功',
      review
    });
  } catch (error: any) {
    console.error('Create review error:', error);
    res.status(500).json({ error: '发表评论失败' });
  }
});

// 更新评论（需要认证，只能编辑自己的）
app.put('/api/reviews/:id', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const reviewId = parseInt(req.params.id);
    const userId = req.user!.userId;
    const { rating, content } = req.body;
    
    if (isNaN(reviewId)) {
      return res.status(400).json({ error: '无效的评论ID' });
    }

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: '评分必须是1-5之间的整数' });
    }

    if (!content || content.trim().length < 5) {
      return res.status(400).json({ error: '评论内容至少需要5个字符' });
    }

    // 检查评论是否存在且属于当前用户
    const existingReview = await prisma.bookReview.findUnique({
      where: { id: reviewId },
      include: { book: true }
    });

    if (!existingReview) {
      return res.status(404).json({ error: '评论不存在' });
    }

    if (existingReview.userId !== userId) {
      return res.status(403).json({ error: '只能编辑自己的评论' });
    }

    // 更新评论
    const updatedReview = await prisma.bookReview.update({
      where: { id: reviewId },
      data: {
        rating: parseInt(rating),
        content: content.trim(),
        updatedAt: new Date()
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true,
            isVip: true
          }
        }
      }
    });

    // 重新计算书籍平均评分
    const allReviews = await prisma.bookReview.findMany({
      where: { bookId: existingReview.bookId },
      select: { rating: true }
    });

    const newAverageRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
    
    await prisma.book.update({
      where: { id: existingReview.bookId },
      data: { rating: Math.round(newAverageRating * 10) / 10 }
    });

    console.log(`用户 ${req.user!.username} 更新了评论，新评分 ${rating} 星`);

    res.json({
      message: '评论更新成功',
      review: updatedReview
    });
  } catch (error: any) {
    console.error('Update review error:', error);
    res.status(500).json({ error: '更新评论失败' });
  }
});

// 删除评论（需要认证，只能删除自己的）
app.delete('/api/reviews/:id', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const reviewId = parseInt(req.params.id);
    const userId = req.user!.userId;
    
    if (isNaN(reviewId)) {
      return res.status(400).json({ error: '无效的评论ID' });
    }

    // 检查评论是否存在且属于当前用户
    const existingReview = await prisma.bookReview.findUnique({
      where: { id: reviewId },
      include: { book: true }
    });

    if (!existingReview) {
      return res.status(404).json({ error: '评论不存在' });
    }

    if (existingReview.userId !== userId) {
      return res.status(403).json({ error: '只能删除自己的评论' });
    }

    // 删除评论
    await prisma.bookReview.delete({
      where: { id: reviewId }
    });

    // 重新计算书籍平均评分
    const remainingReviews = await prisma.bookReview.findMany({
      where: { bookId: existingReview.bookId },
      select: { rating: true }
    });

    let newAverageRating = 0;
    if (remainingReviews.length > 0) {
      newAverageRating = remainingReviews.reduce((sum, r) => sum + r.rating, 0) / remainingReviews.length;
      newAverageRating = Math.round(newAverageRating * 10) / 10;
    }
    
    await prisma.book.update({
      where: { id: existingReview.bookId },
      data: { rating: newAverageRating }
    });

    console.log(`用户 ${req.user!.username} 删除了对《${existingReview.book.title}》的评论`);

    res.json({ message: '评论删除成功' });
  } catch (error: any) {
    console.error('Delete review error:', error);
    res.status(500).json({ error: '删除评论失败' });
  }
});

// 获取用户对特定书籍的评论（需要认证）
app.get('/api/books/:bookId/my-review', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const bookId = parseInt(req.params.bookId);
    const userId = req.user!.userId;
    
    if (isNaN(bookId)) {
      return res.status(400).json({ error: '无效的书籍ID' });
    }

    const review = await prisma.bookReview.findFirst({
      where: { userId, bookId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true,
            isVip: true
          }
        }
      }
    });

    res.json({ review });
  } catch (error: any) {
    console.error('Get my review error:', error);
    res.status(500).json({ error: '获取评论失败' });
  }
});

// 错误处理中间件
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error'
  });
});

// 404处理
app.use('*', (req: Request, res: Response) => {
  console.log(`404: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ 
    error: 'Route not found',
    method: req.method,
    path: req.originalUrl,
    availableRoutes: [
      'GET /api/health',
      'GET /api/books',
      'GET /api/books/:id',
      'POST /api/auth/login',
      'POST /api/auth/register',
      'GET /api/users/profile [AUTH]',
      'GET /api/test'
    ]
  });
});

// 启动服务器
const server = app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log(`📚 Reading App Backend Enhanced - Version 2.0!`);
  console.log(`🔐 JWT Authentication: ENABLED`);
  console.log(`👥 Social Features: ENABLED`);
  console.log(`🤖 AI Recommendations: ENABLED`);
  console.log(`📱 Multi-format Support: ENABLED`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🗄️  Database: ${process.env.DATABASE_URL ? 'Connected' : 'Not configured'}`);
});

// 优雅关闭
const gracefulShutdown = async () => {
  console.log('\n🛑 Shutting down server...');
  
  server.close(() => {
    console.log('📊 HTTP server closed');
  });
  
  await prisma.$disconnect();
  console.log('🗄️  Database connection closed');
  
  process.exit(0);
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

export default app;