#!/bin/bash
set -e

echo "=========================================="
echo "  NBA Service 一键部署脚本"
echo "=========================================="

# 1. 更新系统并安装依赖
echo "[1/6] 安装系统依赖..."
apt update
apt install -y python3 python3-pip python3-venv git

# 2. 克隆代码
echo "[2/6] 克隆代码仓库..."
cd /opt
if [ -d "sport-oracle" ]; then
    echo "目录已存在，更新代码..."
    cd sport-oracle
    git pull
else
    git clone https://github.com/czl524069797/sport-oracle.git
    cd sport-oracle
fi

# 3. 设置 Python 环境
echo "[3/6] 设置 Python 虚拟环境..."
cd /opt/sport-oracle/nba-service
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

# 4. 创建 systemd 服务
echo "[4/6] 配置系统服务..."
cat > /etc/systemd/system/nba-service.service << 'EOF'
[Unit]
Description=NBA Data Service
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/sport-oracle/nba-service
Environment=PATH=/opt/sport-oracle/nba-service/venv/bin
ExecStart=/opt/sport-oracle/nba-service/venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# 5. 启动服务
echo "[5/6] 启动服务..."
systemctl daemon-reload
systemctl enable nba-service
systemctl restart nba-service

# 6. 验证
echo "[6/6] 验证部署..."
sleep 3
systemctl status nba-service --no-pager

echo ""
echo "=========================================="
echo "  部署完成！"
echo "=========================================="
echo ""
echo "验证命令："
echo "  curl http://localhost:8000/health"
echo ""
echo "查看日志："
echo "  journalctl -u nba-service -f"
echo ""
echo "外网访问（需开放8000端口）："
echo "  http://101.36.105.161:8000/health"
echo ""
