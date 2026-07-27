@echo off
echo 正在启动多模态智能模拟面试评测平台...
echo ===========================================

echo [1/5] 启动 Gateway (端口: 8080)
start "Gateway" cmd /k "java -jar gateway\target\gateway-1.0.0-SNAPSHOT.jar"
timeout /t 10 /nobreak > nul

echo [2/5] 启动 User Service (端口: 8081)
start "User Service" cmd /k "java -jar user-service\target\user-service-1.0.0-SNAPSHOT.jar"
timeout /t 10 /nobreak > nul

echo [3/5] 启动 Interview Service (端口: 8082)
start "Interview Service" cmd /k "java -jar interview-service\target\interview-service-1.0.0-SNAPSHOT.jar"
timeout /t 10 /nobreak > nul

echo [4/5] 启动 AI Service (端口: 8083)
start "AI Service" cmd /k "java -jar ai-service\target\ai-service-1.0.0-SNAPSHOT.jar"
timeout /t 10 /nobreak > nul

echo [5/5] 启动 Report Service (端口: 8084)
start "Report Service" cmd /k "java -jar report-service\target\report-service-1.0.0-SNAPSHOT.jar"

echo ===========================================
echo 所有服务已启动，请检查各窗口状态...
pause
