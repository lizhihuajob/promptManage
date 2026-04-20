# 提示词管理系统

一个全栈的提示词管理工具，用于管理和组织 AI 提示词。

## 功能特性

### 用户管理
- 内置管理员账号（admin/admin123），不可删除
- 管理员可添加、编辑、删除其他用户
- 用户角色：管理员(admin) / 普通用户(user)
- 所有用户可修改自己的密码

### 分组管理
- 创建、编辑、删除提示词分组
- 分组名称唯一
- 有提示词的分组不可删除

### 提示词管理
- 提示词存储在 MongoDB 中
- 字段包含：ID、名称、分组、内容、使用次数、修改次数、创建时间、最后修改时间
- 支持模糊查询（按名称或内容）
- 支持分组查询
- 支持分页显示
- 查看提示词时自动增加使用次数
- 修改提示词时自动增加修改次数

## 技术栈

### 后端
- Node.js + Express
- SQLite3 (用户数据存储)
- MongoDB (提示词和分组数据存储)
- JWT (身份认证)
- bcryptjs (密码加密)

### 前端
- 原生 HTML/CSS/JavaScript
- 响应式设计
- 支持分页、搜索、筛选

## 项目结构

```
promptManage/
├── backend/
│   ├── config/
│   │   └── database.js      # 数据库配置
│   ├── middleware/
│   │   └── auth.js          # 认证中间件
│   ├── models/
│   │   ├── Group.js         # 分组模型
│   │   └── Prompt.js        # 提示词模型
│   ├── routes/
│   │   ├── auth.js          # 认证路由
│   │   ├── groups.js        # 分组路由
│   │   ├── prompts.js       # 提示词路由
│   │   └── users.js         # 用户路由
│   └── server.js            # 服务器入口
├── frontend/
│   ├── login.html           # 登录页面
│   └── dashboard.html       # 主仪表板
├── data/                     # SQLite 数据目录 (运行时创建)
├── package.json
├── package-lock.json
├── .env                      # 环境变量
├── .env.example             # 环境变量示例
├── .gitignore
└── README.md
```

## 安装与运行

### 前置要求
- Node.js >= 14
- MongoDB (本地或远程)

### 安装步骤

1. 安装依赖
```bash
npm install
```

2. 配置环境变量

复制 `.env.example` 为 `.env` 并修改配置：
```bash
cp .env.example .env
```

编辑 `.env` 文件：
```
PORT=3000
JWT_SECRET=your_jwt_secret_key_here
MONGODB_URI=mongodb://localhost:27017/promptdb
```

3. 确保 MongoDB 服务正在运行

如果使用本地 MongoDB：
```bash
# 启动 MongoDB (根据您的安装方式)
mongod
```

4. 启动服务

开发模式（使用 nodemon）：
```bash
npm run dev
```

生产模式：
```bash
npm start
```

5. 访问系统

打开浏览器访问：http://localhost:3000

默认管理员账号：
- 用户名：`admin`
- 密码：`admin123`

## API 接口

### 认证相关

#### 登录
```
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```

#### 修改密码
```
PUT /api/auth/password
Authorization: Bearer <token>
Content-Type: application/json

{
  "oldPassword": "oldpass",
  "newPassword": "newpass"
}
```

#### 获取当前用户信息
```
GET /api/auth/me
Authorization: Bearer <token>
```

### 用户管理 (需要管理员权限)

#### 获取用户列表
```
GET /api/users
Authorization: Bearer <token>
```

#### 获取单个用户
```
GET /api/users/:id
Authorization: Bearer <token>
```

#### 创建用户
```
POST /api/users
Authorization: Bearer <token>
Content-Type: application/json

{
  "username": "newuser",
  "password": "password123",
  "role": "user"
}
```

#### 更新用户
```
PUT /api/users/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "username": "newname",
  "role": "admin"
}
```

#### 删除用户
```
DELETE /api/users/:id
Authorization: Bearer <token>
```

### 分组管理

#### 获取分组列表
```
GET /api/groups
Authorization: Bearer <token>
```

#### 获取单个分组
```
GET /api/groups/:id
Authorization: Bearer <token>
```

#### 创建分组
```
POST /api/groups
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "分组名称",
  "description": "分组描述"
}
```

#### 更新分组
```
PUT /api/groups/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "新名称",
  "description": "新描述"
}
```

#### 删除分组
```
DELETE /api/groups/:id
Authorization: Bearer <token>
```

### 提示词管理

#### 获取提示词列表 (分页)
```
GET /api/prompts?page=1&limit=20&keyword=搜索词&groupId=分组ID
Authorization: Bearer <token>
```

#### 获取所有提示词 (不分页)
```
GET /api/prompts/all?keyword=搜索词&groupId=分组ID
Authorization: Bearer <token>
```

#### 获取单个提示词
```
GET /api/prompts/:id
Authorization: Bearer <token>
```

#### 创建提示词
```
POST /api/prompts
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "提示词名称",
  "groupId": "分组ID (可选)",
  "content": "提示词内容"
}
```

#### 更新提示词
```
PUT /api/prompts/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "新名称",
  "groupId": "新分组ID",
  "content": "新内容"
}
```

#### 记录使用
```
POST /api/prompts/:id/use
Authorization: Bearer <token>
```

#### 删除提示词
```
DELETE /api/prompts/:id
Authorization: Bearer <token>
```

## 数据模型

### 用户 (SQLite)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键，自增 |
| username | TEXT | 用户名，唯一 |
| password | TEXT | 加密密码 |
| role | TEXT | 角色: admin/user |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |

### 分组 (MongoDB)
| 字段 | 类型 | 说明 |
|------|------|------|
| _id | ObjectId | 主键 |
| name | String | 分组名称，唯一 |
| description | String | 描述 |
| createdAt | Date | 创建时间 |
| updatedAt | Date | 更新时间 |

### 提示词 (MongoDB)
| 字段 | 类型 | 说明 |
|------|------|------|
| _id | ObjectId | 主键 |
| name | String | 提示词名称 |
| groupId | ObjectId | 关联分组ID |
| groupName | String | 分组名称 (冗余) |
| content | String | 提示词内容 |
| useCount | Number | 使用次数 |
| updateCount | Number | 修改次数 |
| createdAt | Date | 创建时间 |
| updatedAt | Date | 更新时间 |

## 安全特性

1. **密码加密**: 使用 bcryptjs 进行密码哈希存储
2. **JWT 认证**: 使用 JSON Web Token 进行身份验证
3. **角色权限**: 管理员才能访问用户管理接口
4. **管理员保护**: 主管理员账号 (id=1) 不可删除，角色不可修改
5. **输入验证**: 所有接口都有基本的输入验证

## 更新日志

### v1.0.0 (2024-04-20)
- 初始版本发布
- 实现用户管理功能
- 实现分组管理功能
- 实现提示词管理功能
- 支持模糊查询和分组查询
- 支持 JWT 身份认证
- 响应式前端界面

## License

MIT

## 注意事项

1. 首次运行时会自动创建 SQLite 数据库和默认管理员账号
2. 请确保 MongoDB 服务已启动且可连接
3. 生产环境请修改 `.env` 中的 `JWT_SECRET` 为安全的随机字符串
4. 建议首次登录后修改默认管理员密码
