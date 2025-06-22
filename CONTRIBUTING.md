# 🤝 贡献指南

感谢您对 Reading App 项目的关注！我们欢迎任何形式的贡献。

## 🚀 快速开始

### 开发环境设置
1. Fork 本仓库
2. 克隆您的 fork
3. 安装依赖并启动开发服务器
4. 开始开发！

详细设置说明请参考 [QUICK_SETUP.md](QUICK_SETUP.md)

## 📋 贡献方式

### 🐛 报告 Bug
- 使用 [Issue 模板](../../issues/new) 报告问题
- 提供详细的重现步骤
- 包含错误截图或日志

### ✨ 建议新功能
- 在 [Discussions](../../discussions) 中讨论想法
- 创建详细的功能请求 Issue
- 考虑功能的可行性和用户价值

### 🔧 提交代码
1. 创建特性分支：`git checkout -b feature/amazing-feature`
2. 进行开发和测试
3. 提交更改：`git commit -m 'feat: add amazing feature'`
4. 推送分支：`git push origin feature/amazing-feature`
5. 创建 Pull Request

## 📝 代码规范

### Git 提交信息
使用约定式提交格式：
```
类型(范围): 描述

feat: 新功能
fix: 修复 bug
docs: 文档更新
style: 代码格式调整
refactor: 重构
test: 测试相关
chore: 构建或辅助工具变动
```

### 代码风格
- 使用 TypeScript 进行开发
- 遵循项目的 ESLint 配置
- 组件名使用 PascalCase
- 文件名使用 kebab-case
- 变量名使用 camelCase

### 文件结构
- 新组件放在 `frontend/src/components/`
- 新页面放在 `frontend/src/pages/`
- API 相关放在 `backend/src/routes/`
- 类型定义放在对应的 `types/` 目录

## 🧪 测试

### 运行测试
```bash
# 前端测试
cd frontend && npm test

# 后端测试
cd backend && npm test
```

### 测试要求
- 新功能必须包含相应测试
- 确保所有测试通过
- 保持测试覆盖率

## 📖 文档

### 文档更新
- 更新相关的 README 部分
- 添加 API 文档（如果适用）
- 更新类型定义注释

### 文档风格
- 使用清晰简洁的语言
- 提供代码示例
- 包含必要的截图

## 🔍 代码审查

### Pull Request 要求
- 清晰的标题和描述
- 关联相关的 Issue
- 通过所有自动化检查
- 获得至少一个审查批准

### 审查检查点
- 代码质量和可读性
- 功能完整性
- 测试覆盖率
- 文档完整性
- 性能影响

## 🏷️ 版本发布

### 发布流程
1. 更新版本号
2. 更新 CHANGELOG
3. 创建发布标签
4. 发布到生产环境

### 版本规范
遵循 [语义化版本](https://semver.org/):
- MAJOR: 不兼容的 API 更改
- MINOR: 向后兼容的功能新增
- PATCH: 向后兼容的问题修复

## 🎯 开发优先级

### 高优先级任务
- [ ] 完善评论系统
- [ ] 添加搜索功能
- [ ] 优化移动端体验
- [ ] 添加书签功能

### 中优先级任务
- [ ] 社交功能（分享、关注）
- [ ] 阅读统计分析
- [ ] 多语言支持
- [ ] 离线阅读功能

### 未来规划
- [ ] 语音朗读
- [ ] AI 推荐系统
- [ ] 多格式支持（epub、pdf）
- [ ] 插件系统

## 🤔 获取帮助

### 联系方式
- 📧 通过 GitHub Issues 提问
- 💬 在 Discussions 中讨论
- 📖 查看项目文档

### 常见问题
请先查看 [README.md](README.md) 和已有的 Issues，您的问题可能已经有解答。

## 🙏 致谢

感谢所有贡献者让这个项目变得更好！

---

再次感谢您的贡献！🎉