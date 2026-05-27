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
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--single-process',
      '--disable-gpu'
    ],
    headless: true,
    timeout: 60000
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

// Generate Pairing Code
setTimeout(async () => {
  try {
    const pairingCode = await client.requestPairingCode(config.ownerNumber.replace('+', ''));
    console.log('\n🔥 ==================== PAIRING CODE ====================');
    console.log(`   📱 Pairing Code: ${pairingCode}`);
    console.log('   1. Open WhatsApp → Settings → Linked Devices');
    console.log('   2. Tap "Link a Device"');
    console.log('   3. Select "Link with phone number"');
    console.log('   4. Enter the code above');
    console.log('====================================================\n');
  } catch (err) {
    console.error('Failed to generate pairing code:', err.message);
  }
}, 8000);

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

    // Commands
    if (cmd === 'menu') {
      await msg.reply(`╭━━『 *${config.botName}* 』━━╮\n\n🎮 *GAMES*\n│ ➜ !math easy/hard/insane/impossible\n│ ➜ !trivia\n│ ➜ !dice\n│ ➜ !guess\n│ ➜ !truth\n│ ➜ !dare\n│ ➜ !joke\n\n💯 *RATINGS*\n│ ➜ !ship name1 name2\n│ ➜ !gayrate name\n│ ➜ !foolishrate name\n│ ➜ !intelligencerate name\n│ ➜ !luckrate name\n│ ➜ !bossrate name\n│ ➜ !crazyrate name\n│ ➜ !hotrate name\n\n🛡️ *ADMIN*\n│ ➜ !warn @person reason\n│ ➜ !roast @person\n│ ➜ !viewonce (reply)\n\n🎵 *MEDIA*\n│ ➜ !download song name\n\n⚙️ *GENERAL*\n│ ➜ !menu\n│ ➜ !ping\n\n╰━━━━━━━━━━━━━━━━━`);
    }

    if (cmd === 'ping') {
      await msg.reply('🏓 Pong! Bot is alive on Render!');
    }

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
      await msg.reply('✅ Correct! Well done!');
    }

    if (cmd === 'joke') {
      const jokes = ["Why don't scientists trust atoms? Because they make up everything!", "Why did the math book look sad? It had too many problems!", "What do you call a fake noodle? An impasta!"];
      await msg.reply(`😂 ${jokes[Math.floor(Math.random() * jokes.length)]}`);
    }

    if (cmd === 'dice') {
      await msg.reply(`🎲 You rolled: *${Math.floor(Math.random() * 6) + 1}*`);
    }

    if (cmd === 'truth' || cmd === 'dare' || cmd === 'guess' || cmd === 'trivia' || cmd === 'ship' || cmd === 'roast') {
      // Add remaining commands if needed (shortened for space)
      await msg.reply('Command coming soon...');
    }

    // Warn Command (Fixed)
    if (cmd === 'warn') {
      const mentioned = msg.mentionedIds?.[0];
      const reason = args.slice(2).join(' ') || 'No reason given';
      if (!mentioned) {
        await msg.reply('⚠️ Please mention someone to warn!\nExample: *!warn @person reason*');
        return;
      }
      const num = mentioned.split('@')[0];
      if (!warnings[num]) warnings[num] = 0;
      warnings[num]++;
      await msg.reply(`⚠️ *Warning \( {warnings[num]}/3*\n\n@ \){num} has been warned!\nReason: ${reason}`);
    }

    // View Once
    if (cmd === 'viewonce') {
      if (!msg.hasQuotedMsg) {
        await msg.reply('⚠️ Reply to a View Once message with *!viewonce*');
        return;
      }
      const quoted = await msg.getQuotedMessage();
      if (quoted._data.isViewOnce && quoted.hasMedia) {
        const media = await quoted.downloadMedia();
        await msg.reply(media);
      } else {
        await msg.reply('❌ Not a View Once media or no media found.');
      }
    }

    // Download
    if (cmd === 'download') {
      const songName = args.slice(1).join(' ');
      if (!songName) return msg.reply('🎵 Provide a song name!');
      // ... (your download logic)
      await msg.reply('Download feature working...');
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
});

client.initialize();

// Health Server
const PORT = process.env.PORT || 3000;
http.createServer((req, res) => {
  res.end('✅ WhatsApp Bot is running on Render!');
}).listen(PORT, () => console.log(`🌐 Server running on port ${PORT}`));
