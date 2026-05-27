const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const axios = require('axios');
const http = require('http');

// Configuration
const config = {
  botName: process.env.BOT_NAME || 'Admin Bot',
  prefix: process.env.PREFIX || '!',
  ownerNumber: process.env.OWNER_NUMBER || '2349016105277',
};

const warnings = {};

const client = new Client({
  authStrategy: new LocalAuth({
    dataPath: process.env.WWEB_AUTH_PATH || '.wwebjs_auth'
  }),
  puppeteer: {
    executablePath: '/usr/bin/chromium-browser',  // Fixed for Render
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--single-process',
      '--disable-gpu',
      '--disable-extensions',
      '--disable-background-networking'
    ],
    headless: true,
    timeout: 60000,
    ignoreHTTPSErrors: true
  }
});

client.on('ready', () => {
  console.log('✅ Bot is successfully connected and ready!');
  console.log(`🤖 Bot Name: ${config.botName}`);
});

client.on('auth_failure', (msg) => {
  console.error('❌ Authentication failed:', msg);
});

client.on('loading_screen', (percent, message) => {
  console.log(`Loading: ${percent}% - ${message}`);
});

// Generate Pairing Code (No QR)
setTimeout(async () => {
  try {
    const pairingCode = await client.requestPairingCode(config.ownerNumber.replace('+', ''));
    console.log('\n🔥 ==================== PAIRING CODE ====================');
    console.log(`   📱 Pairing Code: ${pairingCode}`);
    console.log('   1. Open WhatsApp on your phone');
    console.log('   2. Go to Settings → Linked Devices');
    console.log('   3. Tap "Link a Device"');
    console.log('   4. Choose "Link with phone number"');
    console.log('   5. Enter the code above');
    console.log('====================================================\n');
  } catch (err) {
    console.error('Failed to generate pairing code:', err.message);
  }
}, 10000);

// Message Handler
client.on('message', async (msg) => {
  try {
    const body = msg.body || '';
    const from = msg.from;
    const isGroup = from.endsWith('@g.us');
    const isDM = !isGroup;
    const isCmd = body.startsWith(config.prefix);
    const args = body.slice(1).trim().split(/\s+/);
    const cmd = isCmd ? args[0].toLowerCase() : '';

    if (!isCmd && isDM) {
      await msg.reply(`👋 Hey! The owner is currently unavailable.\nType *!menu* to see commands.`);
      await client.sendMessage(`${config.ownerNumber}@c.us`, `📩 *New DM Alert!*\nFrom: \( {from}\n\n💬 " \){body}"`);
      return;
    }

    if (!isCmd) return;

    // ==================== COMMANDS ====================

    if (cmd === 'menu') {
      await msg.reply(`╭━━『 *${config.botName}* 』━━╮\n\n🎮 *GAMES*\n│ ➜ !math easy/hard/insane/impossible\n│ ➜ !trivia\n│ ➜ !dice\n│ ➜ !guess\n│ ➜ !truth\n│ ➜ !dare\n│ ➜ !joke\n\n💯 *RATINGS*\n│ ➜ !ship name1 name2\n│ ➜ !gayrate name\n│ ➜ !foolishrate name\n│ ➜ !intelligencerate name\n│ ➜ !luckrate name\n│ ➜ !bossrate name\n│ ➜ !crazyrate name\n│ ➜ !hotrate name\n\n🛡️ *ADMIN*\n│ ➜ !warn @person reason\n│ ➜ !roast @person\n│ ➜ !viewonce (reply)\n\n🎵 *MEDIA*\n│ ➜ !download song name\n\n⚙️ *GENERAL*\n│ ➜ !menu\n│ ➜ !ping\n\n╰━━━━━━━━━━━━━━━━━`);
    }

    if (cmd === 'ping') {
      await msg.reply('🏓 Pong! Bot is alive on Render!');
    }

    // Math Game
    if (cmd === 'math') {
      const level = args[1]?.toLowerCase();
      let mathQuestion, answer;
      if (level === 'easy') {
        const a = Math.floor(Math.random() * 10) + 1;
        const b = Math.floor(Math.random() * 10) + 1;
        const ops = ['+', '-'];
        const op = ops[Math.floor(Math.random() * ops.length)];
        answer = op === '+' ? a + b : a - b;
        mathQuestion = `${a} ${op} ${b}`;
      } else if (level === 'hard') {
        const a = Math.floor(Math.random() * 12) + 2;
        const b = Math.floor(Math.random() * 12) + 2;
        answer = a * b;
        mathQuestion = `${a} × ${b}`;
      } else if (level === 'insane') {
        const a = Math.floor(Math.random() * 20) + 10;
        const b = Math.floor(Math.random() * 10) + 2;
        const c = Math.floor(Math.random() * 20) + 5;
        answer = a * b + c;
        mathQuestion = `${a} × ${b} + ${c}`;
      } else if (level === 'impossible') {
        const a = Math.floor(Math.random() * 50) + 20;
        const b = Math.floor(Math.random() * 20) + 5;
        const c = Math.floor(Math.random() * 30) + 10;
        const d = Math.floor(Math.random() * 5) + 2;
        answer = a * b - c * d;
        mathQuestion = `${a} × ${b} - ${c} × ${d}`;
      } else {
        await msg.reply('🧮 Usage: *!math easy* | *!math hard* | *!math insane* | *!math impossible*');
        return;
      }
      await msg.reply(`🧮 *Math Challenge - \( {level?.toUpperCase()}*\n\nWhat is * \){mathQuestion}*?\n\nReply with *!answer ${answer}*`);
    }

    if (cmd === 'answer') {
      await msg.reply('✅ Correct! Well done! Use *!math* to play again.');
    }

    if (cmd === 'joke') {
      const jokes = ["Why don't scientists trust atoms? Because they make up everything!", "Why did the math book look sad? It had too many problems!", "What do you call a fake noodle? An impasta!", "Why don't eggs tell jokes? They'd crack each other up!"];
      await msg.reply(`😂 ${jokes[Math.floor(Math.random() * jokes.length)]}`);
    }

    if (cmd === 'dice') {
      await msg.reply(`🎲 You rolled: *${Math.floor(Math.random() * 6) + 1}*`);
    }

    if (cmd === 'truth') {
      const truths = ["What is your biggest fear?", "What is the most embarrassing thing you've ever done?", "Who was your first crush?"];
      await msg.reply(`🤔 *Truth:* ${truths[Math.floor(Math.random() * truths.length)]}`);
    }

    if (cmd === 'dare') {
      const dares = ["Send a funny selfie right now!", "Do 10 pushups and send proof!", "Change your status to something embarrassing!"];
      await msg.reply(`😈 *Dare:* ${dares[Math.floor(Math.random() * dares.length)]}`);
    }

    // Rate Commands
    const rateCmds = ['gayrate', 'foolishrate', 'intelligencerate', 'luckrate', 'bossrate', 'crazyrate', 'hotrate'];
    if (rateCmds.includes(cmd)) {
      const target = args.slice(1).join(' ') || 'you';
      const percent = Math.floor(Math.random() * 101);
      const emojis = { gayrate: '🌈', foolishrate: '🤪', intelligencerate: '🧠', luckrate: '🍀', bossrate: '👑', crazyrate: '🤯', hotrate: '🔥' };
      const labels = { gayrate: 'gay', foolishrate: 'foolish', intelligencerate: 'intelligent', luckrate: 'lucky', bossrate: 'a boss', crazyrate: 'crazy', hotrate: 'hot' };
      await msg.reply(`\( {emojis[cmd]} * \){target}* is *${percent}%* ${labels[cmd]}!`);
    }

    if (cmd === 'ship') {
      const name1 = args[1] || 'Person1';
      const name2 = args[2] || 'Person2';
      const percent = Math.floor(Math.random() * 101);
      await msg.reply(`💕 *\( {name1}* + * \){name2}* = ${percent}%`);
    }

    if (cmd === 'roast') {
      const target = args.slice(1).join(' ') || 'you';
      const roasts = ["is the reason they put instructions on shampoo bottles!", "has the personality of a wet sock."];
      await msg.reply(`🔥 *${target}* ${roasts[Math.floor(Math.random() * roasts.length)]}`);
    }

    if (cmd === 'warn') {
      const mentioned = msg.mentionedIds?.[0];
      const reason = args.slice(2).join(' ') || 'No reason';
      if (!mentioned) return msg.reply('⚠️ Please mention someone!\n*!warn @user reason*');
      const num = mentioned.split('@')[0];
      if (!warnings[num]) warnings[num] = 0;
      warnings[num]++;
      await msg.reply(`⚠️ Warning \( {warnings[num]}/3 for @ \){num}\nReason: ${reason}`);
    }

    // View Once Command
    if (cmd === 'viewonce') {
      if (!msg.hasQuotedMsg) return msg.reply('Reply to a View Once message with *!viewonce*');
      const quoted = await msg.getQuotedMessage();
      if (quoted._data.isViewOnce && quoted.hasMedia) {
        const media = await quoted.downloadMedia();
        await msg.reply(media);
      } else {
        await msg.reply('❌ Not a View Once media.');
      }
    }

    // Download Command
    if (cmd === 'download') {
      const songName = args.slice(1).join(' ');
      if (!songName) return msg.reply('🎵 Please provide a song name!');
      await msg.reply(`🔍 Searching for *${songName}*...`);
      try {
        const searchRes = await axios.get(`https://api.fabdl.com/youtube/search?q=${encodeURIComponent(songName)}`);
        const video = searchRes.data.result?.[0];
        if (!video) return msg.reply('❌ Song not found.');

        const dlRes = await axios.get(`https://api.fabdl.com/youtube/mp3?id=${video.id}`);
        const taskId = dlRes.data.result?.id;
        await new Promise(r => setTimeout(r, 7000));

        const trackRes = await axios.get(`https://api.fabdl.com/youtube/mp3/track-info?id=\( {video.id}&tid= \){taskId}`);
        const downloadUrl = trackRes.data.result?.download_url;

        if (downloadUrl) {
          const media = await MessageMedia.fromUrl(downloadUrl);
          await msg.reply(media, { sendMediaAsDocument: true });
        }
      } catch (e) {
        console.error(e);
        await msg.reply('❌ Download failed. Try again later.');
      }
    }

  } catch (error) {
    console.error('Message Error:', error.message);
  }
});

client.on('group_join', async (notification) => {
  try {
    const chat = await notification.getChat();
    await chat.sendMessage(`👋 Welcome to *${chat.name}*!\nType *!menu* for commands.`);
  } catch (e) {}
});

client.initialize();

// Health Check for Render
const PORT = process.env.PORT || 3000;
http.createServer((req, res) => {
  res.end('✅ WhatsApp Bot is running on Render!');
}).listen(PORT, () => {
  console.log(`🌐 Health server running on port ${PORT}`);
});
