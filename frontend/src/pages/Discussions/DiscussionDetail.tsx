// frontend/src/pages/Discussions/DiscussionDetail.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Heart, MessageSquare, Share2 } from 'lucide-react';
import { socialApi } from '../../services/socialApi';

const DiscussionDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [discussion, setDiscussion] = useState<any>(null);
  const [replies, setReplies] = useState([]);
  const [replyContent, setReplyContent] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadDiscussionDetail();
    }
  }, [id]);

  const loadDiscussionDetail = async () => {
    try {
      const data = await socialApi.getDiscussionDetail(parseInt(id!));
      setDiscussion(data.discussion);
      setReplies(data.replies || []);
    } catch (error) {
      console.error('加载讨论详情失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim()) return;

    try {
      const reply = await socialApi.replyToDiscussion(parseInt(id!), replyContent);
      setReplies([...replies, reply]);
      setReplyContent('');
    } catch (error) {
      console.error('回复失败:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">加载中...</p>
        </div>
      </div>
    );
  }

  if (!discussion) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="text-center">
          <p className="text-gray-500">讨论不存在</p>
          <button
            onClick={() => navigate('/discussions')}
            className="mt-4 text-blue-600 hover:text-blue-800"
          >
            返回讨论列表
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="mb-6">
        <button
          onClick={() => navigate('/discussions')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          返回讨论列表
        </button>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {discussion.title}
          </h1>
          
          <div className="flex items-center space-x-4 mb-6 text-sm text-gray-500">
            <span>作者：{discussion.user?.username}</span>
            <span>发布时间：{new Date(discussion.createdAt).toLocaleString()}</span>
            <span>类型：{discussion.type}</span>
          </div>
          
          <div className="prose max-w-none mb-6">
            <p className="text-gray-700 whitespace-pre-wrap">{discussion.content}</p>
          </div>
          
          <div className="flex items-center space-x-6 pt-4 border-t">
            <button className="flex items-center space-x-2 text-gray-500 hover:text-red-500">
              <Heart className="w-4 h-4" />
              <span>{discussion.likesCount || 0}</span>
            </button>
            <div className="flex items-center space-x-2 text-gray-500">
              <MessageSquare className="w-4 h-4" />
              <span>{replies.length}</span>
            </div>
            <button className="flex items-center space-x-2 text-gray-500 hover:text-blue-500">
              <Share2 className="w-4 h-4" />
              <span>分享</span>
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">回复讨论</h3>
        <form onSubmit={handleReply}>
          <textarea
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            placeholder="写下你的回复..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md resize-none"
            rows={4}
          />
          <div className="mt-4 flex justify-end">
            <button
              type="submit"
              disabled={!replyContent.trim()}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              发布回复
            </button>
          </div>
        </form>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">回复 ({replies.length})</h3>
        {replies.map((reply: any) => (
          <div key={reply.id} className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center space-x-2 mb-2 text-sm text-gray-500">
              <span>{reply.user?.username}</span>
              <span>•</span>
              <span>{new Date(reply.createdAt).toLocaleString()}</span>
            </div>
            <p className="text-gray-700">{reply.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DiscussionDetail;