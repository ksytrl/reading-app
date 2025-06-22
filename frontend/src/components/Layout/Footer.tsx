// src/components/Layout/Footer.tsx
const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">阅读App</h3>
            <p className="text-gray-400 text-sm">
              为您提供优质的在线阅读体验
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-4">功能</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="#" className="hover:text-white transition-colors">书籍浏览</a></li>
              <li><a href="#" className="hover:text-white transition-colors">在线阅读</a></li>
              <li><a href="#" className="hover:text-white transition-colors">个人书架</a></li>
              <li><a href="#" className="hover:text-white transition-colors">阅读记录</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">分类</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="#" className="hover:text-white transition-colors">玄幻</a></li>
              <li><a href="#" className="hover:text-white transition-colors">都市</a></li>
              <li><a href="#" className="hover:text-white transition-colors">历史</a></li>
              <li><a href="#" className="hover:text-white transition-colors">科幻</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">联系我们</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>客服邮箱: support@readingapp.com</li>
              <li>意见反馈: feedback@readingapp.com</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
          <p>&copy; 2024 阅读App. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;