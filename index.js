const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js')
const axios = require('axios')
const http = require('http')

// Configuration
const config = {
  botName: process.env.BOT_NAME || 'Admin Bot',
  prefix: process.env.PREFIX || '!',
  ownerNumber: process.env.OWNER_NUMBER || '2349016105277', // without +
}

const warnings = {}

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
})

// New: Pairing Code (instead of QR)
client.on('remote_session_saved', () => {
  console.log('✅ Session saved successfully!')
})

client.on('ready', () => {
  console.log('✅ Bot is successfully connected and ready!')
  console.log(`🤖 Bot Name: ${config.botName}`)
})

client.on('auth_failure', (msg) => {
  console.error('❌ Authentication failed:', msg)
})

// === IMPORTANT: Request Pairing Code ===
client.on('loading_screen', async (percent, message) => {
  console.log(`Loading: ${percent}% - ${message}`)
})

client.initialize()

// Request pairing code after initialization starts
setTimeout(async () => {
  try {
    if (!client.info) {
      const pairingCode = await client.requestPairingCode(config.ownerNumber)
      console.log('\n🔥 ==================== PAIRING CODE ====================')
      console.log(`   📱 Your Pairing Code: ${pairingCode}`)
      console.log('   1. Open WhatsApp on your phone')
      console.log('   2. Go to Settings → Linked Devices')
      console.log('   3. Tap "Link a Device"')
      console.log('   4. Choose "Link with phone number"')
      console.log('   5. Enter the code above')
      console.log('====================================================\n')
    }
  } catch (err) {
    console.error('Failed to generate pairing code:', err.message)
  }
}, 8000)

// Message Handler (rest of your commands)
client.on('message', async (msg) => {
  try {
    const body = msg.body || ''
    const from = msg.from
    const isGroup = from.endsWith('@g.us')
    const isDM = !isGroup
    const isCmd = body.startsWith(config.prefix)
    const args = body.slice(1).trim().split(/\s+/)
    const cmd = isCmd ? args[0].toLowerCase() : ''

    if (!isCmd && isDM) {
      await msg.reply(`👋 Hey! The owner is currently unavailable.\nType *!menu* for commands.`)
      await client.sendMessage(`${config.ownerNumber}@c.us`, `📩 New DM from \( {from}\n\n" \){body}"`)
      return
    }

    if (!isCmd) return

    if (cmd === 'menu') {
      await msg.reply(`╭━━『 *${config.botName}* 』━━╮\n\n... (your full menu here) ...`)
    }

    if (cmd === 'ping') {
      await msg.reply('🏓 Pong! Bot is alive on Render!')
    }

    // Add all your other commands here (math, joke, download, warn, etc.)
    // ... paste the rest of your command handlers from previous version ...

    if (cmd === 'download') {
      // Your download code (same as before)
      const songName = args.slice(1).join(' ')
      if (!songName) return msg.reply('Please provide a song name!')
      
      await msg.reply(`🎵 Searching for *${songName}*...`)
      try {
        const searchRes = await axios.get(`https://api.fabdl.com/youtube/search?q=${encodeURIComponent(songName)}`)
        const video = searchRes.data.result?.[0]
        if (!video) return msg.reply('❌ Song not found.')

        const dlRes = await axios.get(`https://api.fabdl.com/youtube/mp3?id=${video.id}`)
        const taskId = dlRes.data.result?.id
        await new Promise(r => setTimeout(r, 6000))

        const trackRes = await axios.get(`https://api.fabdl.com/youtube/mp3/track-info?id=\( {video.id}&tid= \){taskId}`)
        const downloadUrl = trackRes.data.result?.download_url

        if (downloadUrl) {
          const media = await MessageMedia.fromUrl(downloadUrl)
          await msg.reply(media)
        }
      } catch (e) {
        console.error(e)
        await msg.reply('❌ Download failed.')
      }
    }

  } catch (error) {
    console.error('Error handling message:', error)
  }
})

// Group welcome message
client.on('group_join', async (notification) => {
  try {
    const chat = await notification.getChat()
    await chat.sendMessage(`👋 Welcome to *${chat.name}*!\nType *!menu* to see commands.`)
  } catch (e) {}
})

const PORT = process.env.PORT || 3000
http.createServer((req, res) => {
  res.end('WhatsApp Bot is running! 🚀')
}).listen(PORT, () => {
  console.log(`🌐 Health server running on port ${PORT}`)
})
