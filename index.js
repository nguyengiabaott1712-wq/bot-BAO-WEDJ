const express = require('express');
const axios = require('axios');
const jsqr = require('jsqr');
const pngjs = require('pngjs').PNG;
const jpeg = require('jpeg-js');

const app = express();
const PORT = process.env.PORT || 10000;

// ⚠️ DÁN BOT TOKEN CỦA BẠN VÀO ĐÂY
const BOT_TOKEN = "3263910569141341001:SMJQmRxwmpZOZYQyicuJEAfkJbSMMhGWASvjSIXjrtGzDnSDBJheQUYAfegQEvgY";

// 👑 DANH SÁCH ZALO ID CỦA TRƯỞNG NHÓM VÀ PHÓ NHÓM
// (Thành viên có ID nằm trong danh sách này mới dùng được lệnh từ khóa)
const ADMIN_IDS = [
  "ID_TRUONG_NHOM",
  "ID_PHO_NHOM_1",
  "ID_PHO_NHOM_2"
];

// Kho lưu trữ nhạc DK
const musicStore = {}; 

// 🎯 DANH SÁCH TỪ KHÓA BẠN YÊU CẦU
const customResponses = {
  "tn": "Thông tin về TN: [Bạn điền nội dung TN vào đây]",
  "caothuc": "Thông tin về Cao Thức: [Bạn điền nội dung Cao Thức vào đây]",
  "quoc dinh": "Thông tin về Quốc Định: [Bạn điền nội dung Quốc Định vào đây]",
  "bach chien": "Thông tin về Bách Chiến: [Bạn điền nội dung Bách Chiến vào đây]",
  "hl": "Thông tin về HL: [Bạn điền nội dung HL vào đây]",
  "van tri": "Thông tin về Văn Trí: [Bạn điền nội dung Văn Trí vào đây]"
};

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Bot Zalo BAO WEDJ đang hoạt động!');
});

async function sendMessage(threadId, text, isGroup = true) {
  try {
    const endpoint = isGroup 
      ? `https://openapi.zalo.me/v2.0/oa/group/message?access_token=${BOT_TOKEN}`
      : `https://openapi.zalo.me/v2.0/oa/message?access_token=${BOT_TOKEN}`;

    const recipient = isGroup ? { group_id: threadId } : { user_id: threadId };

    await axios.post(endpoint, {
      recipient: recipient,
      message: { text: text }
    });
  } catch (err) {
    console.error('Lỗi gửi tin nhắn:', err.response ? err.response.data : err.message);
  }
}

async function deleteMessage(msgId) {
  try {
    await axios.post(`https://openapi.zalo.me/v2.0/oa/message/delete?access_token=${BOT_TOKEN}`, {
      message_id: msgId
    });
  } catch (err) {
    console.error('Lỗi xóa tin nhắn:', err.message);
  }
}

async function decodeQRFromUrl(url) {
  try {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(response.data);
    
    let imageData;
    if (url.endsWith('.png') || url.includes('image/png')) {
      const png = pngjs.sync.read(buffer);
      imageData = { data: new Uint8ClampedArray(png.data), width: png.width, height: png.height };
    } else {
      const jpg = jpeg.decode(buffer, { useTolerantDecoder: true });
      imageData = { data: new Uint8ClampedArray(jpg.data), width: jpg.width, height: jpg.height };
    }

    const code = jsqr(imageData.data, imageData.width, imageData.height);
    return code ? code.data : null;
  } catch (e) {
    return null;
  }
}

app.post('/webhook', async (req, res) => {
  res.status(200).send('OK');

  const data = req.body;
  if (!data || !data.event_name) return;

  const event = data.event_name;
  const groupId = data.recipient?.group_id || data.sender?.id;
  const senderId = data.sender?.id; // ID của người nhắn tin

  // In ra log console để dễ kiểm tra ID người gửi
  console.log(`[Tin nhắn từ ID: ${senderId}] Nội dung: ${data.message?.text || ''}`);

  // 1. CHÀO THÀNH VIÊN MỚI / THÀNH VIÊN RỜI NHÓM
  if (event === 'user_join_group') {
    const userName = data.user_name || 'Thành viên mới';
    await sendMessage(groupId, `🎉 Chào mừng ${userName} đã tham gia nhóm! Chúc bạn vui vẻ ❤️`);
  } 
  else if (event === 'user_leave_group') {
    const userName = data.user_name || 'Một thành viên';
    await sendMessage(groupId, `👋 ${userName} đã rời khỏi nhóm. Tạm biệt nhé!`);
  }

  // 2. XỬ LÝ TIN NHẮN & TỪ KHÓA
  if (event === 'user_send_text' || event === 'user_send_image' || event === 'user_send_file') {
    const msgId = data.message?.msg_id;
    const text = data.message?.text || '';
    const attachments = data.message?.attachments || [];
    const lowerText = text.toLowerCase().trim();

    // A. CHẶN LINK NHÓM
    const linkRegex = /(zalo\.me\/g\/|zalo\.me\/j\/|chat\.whatsapp\.com|t\.me\/)/i;
    if (linkRegex.test(text)) {
      if (msgId) await deleteMessage(msgId);
      await sendMessage(groupId, `⚠️ Vui lòng không gửi link nhóm khác vào đây!`);
      return;
    }

    // B. CHẶN MÃ QR NHÓM
    if (event === 'user_send_image' && attachments.length > 0) {
      for (const att of attachments) {
        if (att.payload?.url) {
          const qrData = await decodeQRFromUrl(att.payload.url);
          if (qrData && linkRegex.test(qrData)) {
            if (msgId) await deleteMessage(msgId);
            await sendMessage(groupId, `⚠️ Ảnh chứa mã QR nhóm khác đã bị gỡ!`);
            return;
          }
        }
      }
    }

    // C. TÌM KIẾM THEO TỪ KHÓA BẠN ĐẶT (CHỈ TRƯỞNG/PHÓ NHÓM MỚI DÙNG ĐƯỢC)
    for (const key in customResponses) {
      if (lowerText === key || lowerText.includes(key)) {
        if (ADMIN_IDS.includes(senderId)) {
          await sendMessage(groupId, customResponses[key]);
        } else {
          await sendMessage(groupId, `⚠️ Chỉ Trưởng/Phó nhóm mới có quyền sử dụng lệnh từ khóa này!`);
        }
        return;
      }
    }

    // D. LƯU & TÌM NHẠC DK (CHỈ TRƯỞNG/PHÓ NHÓM MỚI DÙNG ĐƯỢC)
    if (event === 'user_send_file' || data.message?.type === 'audio') {
      const fileName = data.message?.title || text || '';
      if (fileName.toUpperCase().includes('DK') || text.toUpperCase().includes('DK')) {
        if (!ADMIN_IDS.includes(senderId)) return; // Bỏ qua nếu không phải Admin
        
        const fileUrl = attachments[0]?.payload?.url;
        if (fileUrl) {
          const key = fileName.trim().toLowerCase();
          musicStore[key] = fileUrl;
          await sendMessage(groupId, `🎵 Đã lưu file nhạc DK "${fileName}" thành công!`);
          return;
        }
      }
    }

    if (lowerText.startsWith('dk') || lowerText.startsWith('tìm nhạc dk') || lowerText.startsWith('tim nhac dk')) {
      if (!ADMIN_IDS.includes(senderId)) {
        await sendMessage(groupId, `⚠️ Chỉ Trưởng/Phó nhóm mới được dùng chức năng tìm nhạc DK!`);
        return;
      }

      const keyword = lowerText.replace(/tìm nhạc dk|tim nhac dk|dk/gi, '').trim();
      const matchedKeys = Object.keys(musicStore).filter(k => k.includes(keyword) || k.includes('dk'));
      
      if (matchedKeys.length > 0) {
        let reply = `🎧 Kết quả tìm kiếm nhạc DK:\n`;
        matchedKeys.forEach((k, idx) => {
          reply += `${idx + 1}. ${k.toUpperCase()}: ${musicStore[k]}\n`;
        });
        await sendMessage(groupId, reply);
      } else {
        await sendMessage(groupId, `❌ Chưa có file nhạc DK nào tương ứng.`);
      }
    }
  }
});

app.listen(PORT, () => {
  console.log(`Server đang chạy trên port ${PORT}`);
});

