require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { connectMongoDB, initializeSQLite } = require('./config/database');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const groupRoutes = require('./routes/groups');
const promptRoutes = require('./routes/prompts');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, '../frontend')));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/prompts', promptRoutes);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/login.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dashboard.html'));
});

const startServer = async () => {
  try {
    await initializeSQLite();
    await connectMongoDB();
    
    app.listen(PORT, () => {
      console.log(`========================================`);
      console.log(`服务器运行在 http://localhost:${PORT}`);
      console.log(`========================================`);
      console.log('默认管理员账号: admin / admin123');
      console.log(`========================================`);
    });
  } catch (err) {
    console.error('启动服务器失败:', err.message);
    process.exit(1);
  }
};

startServer();
