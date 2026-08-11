const express = require('express');
const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json());

// Trang chủ để Render biết app đang sống
app.get('/', (req, res) => {
  res.send('Bot Zalo đang hoạt động!');
});

// Endpoint Webhook tiếp nhận dữ liệu
app.post('/webhook', (req, res) => {
  console.log('Dữ liệu từ Webhook:', req.body);
  res.status(200).send('OK');
});

app.listen(PORT, () => {
  console.log(`Server đang chạy tại port ${PORT}`);
});

