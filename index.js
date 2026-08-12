const express = require('express');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 10000;

// Bot Token của Bảo
const BOT_TOKEN = "3263910569141341001:kjGtgFCljEbwEJlJUIKkKHNuIWZCpEgCmdzbOUvbVPjcICXgatLDPvJvENFUkWIk";

// Danh sách câu chào RANDOM khi tag bot
const randomGreetings = [
  "Dạ chào {name}! Em là Bot BAO WEDJ, cần tìm nhạc gì gõ từ khóa nha!",
  "Heloo {name}! Chúc bạn một ngày nghe nhạc vui vẻ nha 🎵",
  "Dạ Bảo nghe đây {name} ơi! Cần tìm nhạc gì gõ tên nha 😉",
  "Chào {name} nha! Gõ từ khóa tên DJ để tìm nhạc nhanh nè 🎧",
  "Sẵn sàng phục vụ {name} rồi đây! Bạn cần tìm thông tin gì nè?"
];

// Danh sách từ khóa trả lời tự động
const customResponses = {
  "tn": "Bạn ấn vào tên nhóm, rồi vào ô tìm kiếm: nhập [tn] nha🥰",
  "caothuc": "Bạn ấn vào tên nhóm, rồi vào ô tìm kiếm: nhập [caothuc] nha🥰",
  "quoc dinh": "Bạn ấn vào tên nhóm, rồi vào ô tìm kiếm: nhập [quoc dinh] nha🥰",
  "bach chien": "Bạn ấn vào tên nhóm, rồi vào ô tìm kiếm: nhập [bach chien] nha🥰",
  "hl": "Bạn ấn vào tên nhóm, rồi vào ô tìm kiếm: nhập [hl] nha🥰",
  "van tri": "Bạn ấn vào tên nhóm, rồi vào ô tìm kiếm: nhập [van tri] nha🥰",
  "damcuoi": "Bạn ấn vào tên nhóm, rồi vào ô tìm kiếm: [caothuc] vs [quocdinh] nha🥰"
};

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Bot Zalo BAO WEDJ đang chạy ngon lành!');
});

app.get('/webhook', (req, res) => {
  res.status(200).send(req.query.challenge || 'OK');
});

// Hàm gửi tin nhắn
async function sendBotMessage(chatId, text) {
  try {
    const url = `https://bot-api.zaloplatforms.com/bot${BOT_TOKEN}/sendMessage`;

    const response = await axios.post(url, {
      chat_id: String(chatId),
      text: text
    }, {
      headers: { 'Content-Type': 'application/json' }
    });

    console.log("--> Đã gửi tin thành công:", response.data);
  } catch (err) {
    console.error('Lỗi gửi tin:', err.response ? err.response.data : err.message);
  }
}

app.post('/webhook', async (req, res) => {
  res.status(200).send('OK');

  const data = req.body;
  const result = data.result || data;
  const eventName = data.event_name || result.event_name;

  const senderId = result.from?.id || result.message?.from?.id;
  const senderName = result.from?.display_name || result.message?.from?.display_name || 'bạn';
  const chatId = result.chat?.id || result.message?.chat?.id || senderId;

  if (!chatId) return;

  // 💥 XỬ LÝ TỰ ĐỘNG CHÀO THÀNH VIÊN MỚI VÀO NHÓM
  if (eventName === "group_user_joined" || eventName === "user_join_group" || data.user_joined) {
    const newMemberName = data.user_joined?.display_name || senderName;
    await sendBotMessage(chatId, `🎉 Chào mừng ${newMemberName} đã tham gia nhóm! Bạn cần tìm nhạc cứ gõ tên DJ hoặc từ khóa như: tn, caothuc, quoc dinh... nha 🥰`);
    return;
  }

  // XỬ LÝ TIN NHẮN VĂN BẢN
  let rawText = result.message?.text || result.text || '';
  let text = rawText.toLowerCase().trim().replace(/@bot bao wedj/g, '').trim();

  if (rawText) {
    console.log(`[Tin nhắn từ ${senderName} (${senderId})]: ${text}`);

    // 1. Chỉ tag bot hoặc gõ câu chào -> Chào RANDOM
    if (text === "" || text === "hi" || text === "hello" || text === "chao" || text === "chào") {
      const randomIndex = Math.floor(Math.random() * randomGreetings.length);
      let greetingText = randomGreetings[randomIndex].replace("{name}", senderName);
      await sendBotMessage(chatId, greetingText);
      return;
    }

    // 2. Lệnh xem ID
    if (text === "id" || text === "myid") {
      await sendBotMessage(chatId, `🆔 Chào ${senderName}, ID Zalo của bạn là: ${senderId}`);
      return;
    }

    // 3. Kiểm tra từ khóa hợp lệ
    let matched = false;
    for (const key in customResponses) {
      if (text.includes(key)) {
        await sendBotMessage(chatId, customResponses[key]);
        matched = true;
        break;
      }
    }

    // 4. Nếu gõ sai từ khóa -> Nhắc nhở cú pháp
    if (!matched) {
      await sendBotMessage(chatId, `⚠️ Từ khóa "${text}" không có trong hệ thống!\nBạn gõ thử các từ khóa như: tn, caothuc, quoc dinh, bach chien, hl, van tri, damcuoi nha 🥰`);
    }
  }
});

app.listen(PORT, () => {
  console.log(`Server đang chạy trên port ${PORT}`);
});
