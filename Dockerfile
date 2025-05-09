FROM hub.040720.xyz/library/node:22-alpine
# node的app.js文件
WORKDIR /app
# 复制npm的依赖文件
COPY package*.json ./
# 项目安装依赖
RUN npm install
# 复制项目的文件
COPY . .
# node服务端口
EXPOSE 3000
# 启动项目
CMD ["npm", "start"]
