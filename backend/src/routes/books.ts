import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// 获取书籍列表
router.get('/', async (req: Request, res: Response) => {
  try {
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

// 获取单本书籍详情
router.get('/:id', async (req: Request, res: Response) => {
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

export default router;