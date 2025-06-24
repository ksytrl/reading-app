// frontend/src/pages/Discussions/Discussions.tsx
import React, { useState, useEffect } from 'react';
import { MessageSquare, Plus, Filter, Search } from 'lucide-react';
import { DiscussionForm } from '../../components/Social/SocialFeatures';
import { socialApi } from '../../services/socialApi';

const Discussions: React.FC = () => {
  const [discussions, setDiscussions] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadDiscussions();
  }, [filter]);

  const loadDiscussions = async () => {
    try {
      const data = await socialApi.getDiscussions({
        type: filter === 'all' ? undefined : filter
      });
      setDiscussions(data.discussions || []);
    } catch (error) {
      console.error('加载讨论失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDiscussion = (discussion: any) => {
    setDiscussions([discussion, ...discussions]);
    setShowCreateForm(false);
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">讨论广场</h1>
          <p className="text-gray-600 mt-1">参与讨论，分享你的观点</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          发起讨论
        </button>
      </div>

      {showCreateForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">发起新讨论</h3>
          <DiscussionForm
            onSubmit={handleCreateDiscussion}
            onCancel={() => setShowCreateForm(false)}
          />
        </div>
      )}

      <div className="mb-6">
        <div className="flex space-x-2">
          {['all', 'GENERAL', 'BOOK_REVIEW', 'QUESTION'].map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === type
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {type === 'all' ? '全部' : 
               type === 'GENERAL' ? '一般讨论' :
               type === 'BOOK_REVIEW' ? '书评' : '问答'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">加载讨论中...</p>
        </div>
      ) : discussions.length === 0 ? (
        <div className="text-center py-12">
          <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">暂无讨论</p>
          <p className="text-sm text-gray-400 mt-2">成为第一个发起讨论的人吧！</p>
        </div>
      ) : (
        <div className="space-y-4">
          {discussions.map((discussion: any) => (
            <div key={discussion.id} className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {discussion.title}
              </h3>
              <p className="text-gray-600 mb-4">{discussion.content}</p>
              <div className="flex items-center justify-between text-sm text-gray-500">
                <div className="flex items-center space-x-4">
                  <span>作者：{discussion.user?.username}</span>
                  <span>时间：{new Date(discussion.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center space-x-4">
                  <span>{discussion.likesCount || 0} 点赞</span>
                  <span>{discussion.repliesCount || 0} 回复</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Discussions;