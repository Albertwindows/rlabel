# RLabel - 本地图像标注工具

基于 Tauri + React + TypeScript 开发的本地图像标注工具，参考 CVAT 的主要功能实现。

## 功能特性

### 标注工具
- **点标注 (P)**: 在图像上标记单个点
- **线标注 (L)**: 绘制直线段
- **多边形标注 (G)**: 绘制多边形区域
- **矩形标注 (R)**: 绘制矩形区域
- **选择工具 (V)**: 选择和编辑已有标注

### 数据导出
- **JSON 格式**: 标准标注格式
- **COCO 格式**: 适用于目标检测任务
- **YOLO 格式**: 适用于 YOLO 模型训练
- **VOC 格式**: Pascal VOC XML 格式

### 交互功能
- 缩放和平移
- 编辑标注标签和颜色
- 添加自定义属性
- 撤销/重做
- 键盘快捷键

## 快速开始

### 安装依赖

```bash
bun install
```

### 开发模式

```bash
bun run dev
```

### 构建应用

```bash
bun run build
```

### Tauri 构建

```bash
bun run tauri build
```

## 使用方法

1. 点击 "Open Image" 打开图像
2. 选择标注工具（点、线、多边形、矩形）
3. 在图像上绘制标注
4. 编辑标注标签和属性
5. 导出标注为各种格式

## 技术栈

- **Tauri 2.0**: 跨平台桌面应用框架
- **React 19**: UI 框架
- **TypeScript**: 类型安全
- **Vite**: 构建工具
- **Tailwind CSS 4**: 样式框架
- **Radix UI / shadcn/ui**: 组件库
- **Zustand**: 状态管理
- **HTML5 Canvas**: 绘图引擎

## 项目结构

```
src/
├── types/
│   ├── annotation.ts         # 标注类型定义
│   └── project.ts            # 项目类型定义
├── store/
│   ├── annotationStore.ts    # 标注状态管理
│   ├── themeStore.ts         # 主题状态管理
│   └── localeStore.ts        # 语言状态管理
├── hooks/
│   └── useKeyboardShortcuts.ts # 快捷键 Hook
├── utils/
│   ├── annotationHelpers.ts  # 标注辅助函数
│   ├── keyboardShortcuts.ts  # 快捷键定义
│   ├── exportImport.ts       # 导出/导入功能
│   └── fileOps.ts            # 文件操作
├── ui/                       # shadcn/ui 基础组件
├── components/
│   ├── modern/               # 主界面组件
│   │   ├── TopNav.tsx        # 顶部导航
│   │   ├── Canvas.tsx        # 标注画布
│   │   ├── Toolbar.tsx       # 工具栏
│   │   ├── Sidebar.tsx       # 右侧边栏
│   │   ├── ImageListSidebar.tsx # 图像列表
│   │   └── StatsDialog.tsx   # 统计对话框
│   ├── panels/               # 面板组件
│   └── layout/               # 布局组件
├── i18n/                     # 国际化
├── constants/
│   └── annotation.ts         # 常量定义
├── styles/
│   └── globals.css           # 全局样式
├── App.tsx                   # 主应用组件
└── main.tsx                  # 入口文件
```

## 快捷键

- `V` - 选择工具
- `P` - 点工具
- `L` - 线工具
- `G` - 多边形工具
- `R` - 矩形工具
- `Ctrl + O` - 打开图像
- `Ctrl + S` - 保存标注
- `Ctrl + Z` - 撤销
- `Ctrl + Y` - 重做
- `Delete` - 删除选中标注

## 许可证

MIT License

## 致谢

本项目参考了 CVAT (Computer Vision Annotation Tool) 的功能和设计理念。
