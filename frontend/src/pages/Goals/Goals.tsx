// frontend/src/pages/Goals/Goals.tsx
import React, { useState, useEffect } from 'react';
import { Target, Plus, CheckCircle, Calendar, TrendingUp } from 'lucide-react';

const Goals: React.FC = () => {
  const [goals, setGoals] = useState([
    {
      id: 1,
      title: '本月阅读10本书',
      description: '提高阅读量，拓展知识面',
      type: 'reading',
      target: 10,
      current: 3,
      deadline: '2024-12-31',
      status: 'active'
    }
  ]);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const progress = (current: number, target: number) => {
    return Math.min(Math.round((current / target) * 100), 100);
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">我的目标</h1>
          <p className="text-gray-600 mt-1">设定阅读目标，追踪进度</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          新建目标
        </button>
      </div>

      {showCreateForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">创建新目标</h3>
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">目标标题</label>
              <input
                type="text"
                placeholder="例如：本月阅读10本书"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">目标描述</label>
              <textarea
                placeholder="描述你的目标..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md resize-none"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">目标数量</label>
                <input
                  type="number"
                  placeholder="10"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">截止日期</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                创建目标
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                取消
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-4">
        {goals.map((goal) => (
          <div key={goal.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{goal.title}</h3>
                <p className="text-gray-600 text-sm mt-1">{goal.description}</p>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                goal.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {goal.status === 'active' ? '进行中' : '已完成'}
              </span>
            </div>

            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  进度：{goal.current} / {goal.target}
                </span>
                <span className="text-sm text-gray-500">{progress(goal.current, goal.target)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${progress(goal.current, goal.target)}%` }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-sm text-gray-500">
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                <span>截止：{new Date(goal.deadline).toLocaleDateString()}</span>
              </div>
              <div className="flex space-x-4">
                <button className="text-blue-600 hover:text-blue-800">编辑</button>
                <button className="text-red-600 hover:text-red-800">删除</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Goals;