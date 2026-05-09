@echo off
chcp 65001 >nul
echo ====================================
echo    云迹无限画布 - 一键启动
echo ====================================
echo.

echo [1/3] 检查依赖...
if not exist "node_modules\" (
    echo 首次运行，正在安装依赖...
    call npm install
    if errorlevel 1 (
        echo 依赖安装失败，请检查网络或Node.js环境
        pause
        exit /b 1
    )
)

echo [2/3] 启动开发服务器...
echo 项目将在浏览器中自动打开 http://localhost:5173
echo.
echo 按 Ctrl+C 可停止服务器
echo.

start http://localhost:5173

echo [3/3] 运行中...
call npm run dev

pause
