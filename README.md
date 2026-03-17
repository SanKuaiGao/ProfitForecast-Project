# Profit Forecast App

一个本地可运行的桌面端演示 App，包含：
- Revenue 输入
- Cost 输入
- Regression（线性回归预测未来 Profit）

## 1. 安装依赖

```bash
npm install
```

## 2. 本地网页开发模式

```bash
npm run dev
```

## 3. 桌面 App 开发模式（Electron）

```bash
npm run desktop
```

## 4. 打包成桌面 App

先构建前端：

```bash
npm run build
```

然后打包：

### macOS
```bash
npm run package:mac
```

### Windows
```bash
npm run package:win
```

### Linux
```bash
npm run package:linux
```

打包产物会在：

```bash
release/
```

## 说明

- 这是一个无需登录的 App 风格利润预测 Demo。
- 数据保存在浏览器本地存储中，适合课程展示和本地演示。
- 线性回归当前基于历史 Profit（Revenue - Cost）进行未来 3 期预测。


## Windows packaging

Build standard Windows installer (x64):

```bash
npm install
npm run package:win
```

Build portable Windows EXE (x64):

```bash
npm install
npm run package:win:portable
```

Generated files will be placed in `release/`.
# ProfitForecast-Project
# ProfitForecast-Project
