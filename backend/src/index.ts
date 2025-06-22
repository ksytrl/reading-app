import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';

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
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 静态文件服务
app.use('/uploads', express.static(uploadsDir));

// 健康检查
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ 
    message: 'Reading App Server is running!', 
    timestamp: new Date().toISOString(),
    status: 'healthy',
    version: '1.0.0'
  });
});

// 临时内联路由 - 直接在主文件中定义，避免导入问题

// 认证路由
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
        password: hashedPassword
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
  } catch (error) {
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
        isVip: user.isVip
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: '登录失败，请稍后重试' });
  }
});

// 书籍路由
app.get('/api/books', async (req: Request, res: Response) => {
  try {
    console.log('收到获取书籍请求');
    
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 12;
    const category = req.query.category as string;
    const search = req.query.search as string;
    
    const skip = (page - 1) * limit;

    const where: any = {};
    
    if (category) {
      where.category = { name: category };
    }
    
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { author: { contains: search } }
      ];
    }

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
        orderBy: { updatedAt: 'desc' }
      }),
      prisma.book.count({ where })
    ]);

    console.log(`返回 ${books.length} 本书籍`);

    res.json({
      books,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get books error:', error);
    res.status(500).json({ error: '获取书籍列表失败' });
  }
});

app.get('/api/books/:id', async (req: Request, res: Response) => {
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

    res.json(book);
  } catch (error) {
    console.error('Get book detail error:', error);
    res.status(500).json({ error: '获取书籍详情失败' });
  }
});

// 用户路由
app.get('/api/users/profile', (req: Request, res: Response) => {
  res.json({ 
    message: 'User profile endpoint',
    timestamp: new Date().toISOString()
  });
});

// 测试所有路由
app.get('/api/test', (req: Request, res: Response) => {
  res.json({ 
    message: 'All routes working!',
    timestamp: new Date().toISOString(),
    routes: [
      'GET /api/health',
      'GET /api/books',
      'GET /api/books/:id',
      'POST /api/auth/login',
      'POST /api/auth/register',
      'GET /api/users/profile',
      'POST /api/reading-records',
      'POST /api/books/upload',        // ✅ 新添加
      'GET /api/users/books',          // ✅ 新添加
      'DELETE /api/books/:id'          // ✅ 新添加
    ]
  });
});



// 错误处理中间件
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error'
  });
});

// 启动服务器
const server = app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log(`📚 Reading App Backend Started!`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🗄️  Database: ${process.env.DATABASE_URL ? 'Connected' : 'Not configured'}`);
  console.log(`📋 Available routes:`);
  console.log(`   GET  /api/health`);
  console.log(`   GET  /api/books`);
  console.log(`   GET  /api/books/:id`);
  console.log(`   POST /api/auth/login`);
  console.log(`   POST /api/auth/register`);
  console.log(`   GET  /api/users/profile`);
  console.log(`   GET  /api/test`);
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

// 在现有的书籍路由后添加以下章节相关路由

// 获取单个章节详情
app.get('/api/chapters/:id', async (req: Request, res: Response) => {
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
  } catch (error) {
    console.error('Get chapter error:', error);
    res.status(500).json({ error: '获取章节详情失败' });
  }
});

// 获取书籍的章节列表（用于导航）
app.get('/api/books/:bookId/chapters', async (req: Request, res: Response) => {
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
  } catch (error) {
    console.error('Get book chapters error:', error);
    res.status(500).json({ error: '获取章节列表失败' });
  }
});

// 保存阅读记录（需要用户登录）
app.post('/api/reading-records', async (req: Request, res: Response) => {
  try {
    // TODO: 添加JWT验证中间件
    const { userId, bookId, chapterId, progressPercentage, readingPosition } = req.body;
    
    const record = await prisma.readingRecord.upsert({
      where: {
        userId_bookId_chapterId: {
          userId: parseInt(userId),
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
        userId: parseInt(userId),
        bookId: parseInt(bookId),
        chapterId: parseInt(chapterId),
        progressPercentage: parseFloat(progressPercentage),
        readingPosition: parseInt(readingPosition)
      }
    });

    res.json({ message: '阅读记录保存成功', record });
  } catch (error) {
    console.error('Save reading record error:', error);
    res.status(500).json({ error: '保存阅读记录失败' });
  }
});

// 在现有的路由之前添加以下代码

import multer from 'multer';

// 配置文件上传
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/books/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'book-' + uniqueSuffix + '.txt');
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/plain' || file.originalname.endsWith('.txt')) {
      cb(null, true);
    } else {
      cb(new Error('只支持txt格式文件'));
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

// 章节识别函数
function parseChapters(content: string): { title: string; content: string; chapterNumber: number }[] {
  const chapters: { title: string; content: string; chapterNumber: number }[] = [];
  
  // 多种章节标题模式
  const chapterPatterns = [
    /^第[一二三四五六七八九十百千万\d]+章.*/gm,           // 第一章、第1章
    /^第[一二三四五六七八九十百千万\d]+回.*/gm,           // 第一回、第1回
    /^第[一二三四五六七八九十百千万\d]+节.*/gm,           // 第一节、第1节
    /^第[一二三四五六七八九十百千万\d]+卷.*/gm,           // 第一卷、第1卷
    /^[第]?[一二三四五六七八九十百千万\d]+[、\.\s].*/gm,   // 一、1.
    /^Chapter\s+\d+.*/gmi,                                  // Chapter 1
    /^序章|楔子|引言|前言.*/gm,                              // 序章等
    /^\d+[、\.\s].*/gm                                      // 1、1.
  ];

  let bestMatch: { pattern: RegExp; matches: RegExpMatchArray } | null = null;
  let maxMatches = 0;

  // 找到匹配最多的模式
  for (const pattern of chapterPatterns) {
    const matches = content.match(pattern);
    if (matches && matches.length > maxMatches) {
      maxMatches = matches.length;
      bestMatch = { pattern, matches };
    }
  }

  if (!bestMatch || maxMatches === 0) {
    // 如果没有找到章节标题，整个文件作为一章
    return [{
      title: '全文',
      content: content.trim(),
      chapterNumber: 1
    }];
  }

  // 使用最佳匹配模式分割章节
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

  // 如果没有成功分割，尝试按段落分割
  if (chapters.length === 0) {
    const paragraphs = content.split(/\n\s*\n/);
    let chapterNum = 1;
    let currentChapter = '';
    
    for (const paragraph of paragraphs) {
      if (paragraph.trim().length > 0) {
        if (currentChapter.length > 3000) { // 每3000字分一章
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

// 从内容中提取书籍信息
function extractBookInfo(content: string, filename: string): { title: string; author: string; description: string } {
  const lines = content.split('\n').filter(line => line.trim());
  let title = filename.replace('.txt', '').replace(/^book-\d+-\d+-/, '');
  let author = '未知作者';
  let description = '';

  // 尝试从前几行提取标题和作者
  for (let i = 0; i < Math.min(10, lines.length); i++) {
    const line = lines[i].trim();
    
    // 检查是否为标题行
    if (line.length > 0 && line.length < 50 && 
        !line.includes('章') && !line.includes('回') && 
        !line.match(/^\d+/) && line.length > title.length) {
      title = line;
    }
    
    // 检查是否为作者行
    if (line.includes('作者') || line.includes('著') || line.includes('写')) {
      const authorMatch = line.match(/(作者|著|写)[：:]\s*(.+)/);
      if (authorMatch) {
        author = authorMatch[2].trim();
      }
    }
  }

  // 提取描述（前200字，去除章节标题）
  const cleanContent = content.replace(/第[一二三四五六七八九十百千万\d]+[章回节卷].*/g, '');
  description = cleanContent.substring(0, 200).trim() + '...';

  return { title, author, description };
}

// 上传txt书籍API
app.post('/api/books/upload', upload.single('txtFile'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '请选择txt文件' });
    }

    // TODO: 验证用户登录状态
    const userId = 1; // 临时使用testuser的ID，实际应该从JWT获取

    console.log('开始处理上传的txt文件:', req.file.originalname);

    // 读取文件内容
    const filePath = req.file.path;
    const fileContent = fs.readFileSync(filePath, 'utf-8');

    // 提取书籍信息
    const bookInfo = extractBookInfo(fileContent, req.file.originalname);
    
    // 解析章节
    const chapters = parseChapters(fileContent);
    
    console.log(`解析完成: 标题=${bookInfo.title}, 章节数=${chapters.length}`);

    if (chapters.length === 0) {
      fs.unlinkSync(filePath); // 删除文件
      return res.status(400).json({ error: '无法解析文件内容，请检查文件格式' });
    }

    // 获取默认分类
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
        title: bookInfo.title,
        author: bookInfo.author,
        description: bookInfo.description,
        categoryId: category.id,
        totalWords: fileContent.length,
        totalChapters: chapters.length,
        status: 'COMPLETED',
        isFree: true,
        rating: 0.0,
        isFeatured: false,
        tags: ['用户上传', '完整小说']
      }
    });

    // 创建章节记录
    for (const chapter of chapters) {
      await prisma.chapter.create({
        data: {
          bookId: book.id,
          chapterNumber: chapter.chapterNumber,
          title: chapter.title,
          content: chapter.content,
          wordCount: chapter.content.length,
          isFree: true
        }
      });
    }

    // 删除临时文件
    fs.unlinkSync(filePath);

    console.log(`书籍上传成功: ID=${book.id}, 标题=${book.title}`);

    res.json({
      message: '书籍上传成功',
      book: {
        id: book.id,
        title: book.title,
        author: book.author,
        totalChapters: book.totalChapters,
        totalWords: book.totalWords
      },
      chaptersCount: chapters.length
    });

  } catch (error) {
    console.error('Upload error:', error);
    
    // 清理文件
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (e) {
        console.error('Failed to delete file:', e);
      }
    }
    
    res.status(500).json({ error: '上传失败: ' + (error as Error).message });
  }
});

// 获取用户上传的书籍列表
app.get('/api/users/books', async (req: Request, res: Response) => {
  try {
    // TODO: 从JWT获取用户ID
    const userId = 1; // 临时使用

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
  } catch (error) {
    console.error('Get user books error:', error);
    res.status(500).json({ error: '获取用户书籍失败' });
  }
});

// 删除用户上传的书籍
app.delete('/api/books/:id', async (req: Request, res: Response) => {
  try {
    const bookId = parseInt(req.params.id);
    
    if (isNaN(bookId)) {
      return res.status(400).json({ error: '无效的书籍ID' });
    }

    // TODO: 验证是否为书籍的上传者
    
    // 删除书籍（会级联删除章节）
    await prisma.book.delete({
      where: { id: bookId }
    });

    res.json({ message: '书籍删除成功' });
  } catch (error) {
    console.error('Delete book error:', error);
    res.status(500).json({ error: '删除书籍失败' });
  }
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
      'GET /api/users/profile',
      'GET /api/test'
    ]
  });
});

export default app;