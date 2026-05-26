const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys')
const pino = require('pino')
const config = require('./config')
const readline = require('readline')
const axios = require('axios')

const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
const question = (text) => new Promise((resolve) => rl.question(text, resolve))

const warnings = {}

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info')

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false,
    logger: pino({ level: 'silent' })
  })

  if (!sock.authState.creds.registered) {
    const number = await question('Enter your WhatsApp number with country code (e.g. 2348012345678): ')
    const code = await sock.requestPairingCode(number.trim())
    console.log(`Your pairing code: ${code}`)
    console.log('Go to WhatsApp > Linked Devices > Link a Device > Link with phone number')
  }

  sock.ev.on('creds.update', saveCreds)

  // Welcome new members
  sock.ev.on('group-participants.update', async ({ id, participants, action }) => {
    if (action === 'add') {
      const groupMetadata = await sock.groupMetadata(id)
      const memberCount = groupMetadata.participants.length
      for (const participant of participants) {
        const welcomeMsg = `•❅──────✧❅✦❅✧──────❅•\n\n👋 Welcome to *${groupMetadata.subject}*! 💐\nWe're so glad to have you here! 🌟\n\n𐔌՞ ܸ.ˬ.ܸ՞𐦯 𝑰𝑵𝑻𝑹𝑶 𝑪𝑨𝑹𝑫 .𖥔 ݁ ˖\n\nᥫ᭡• 𝑁𝑎𝑚𝑒:\nᥫ᭡• 𝐴𝑔𝑒:\nᥫ᭡• 𝐺𝑒𝑛𝑑𝑒𝑟:\nᥫ᭡• 𝐶𝑜𝑢𝑛𝑡𝑟𝑦:\n\n🌸 Please introduce yourself!\nType *!menu* to see bot commands!\n\n•❅──────✧❅✦❅✧──────❅•\n@${participant.split('@')[0]}\n👥 *Members count: ${memberCount}*`
        await sock.sendMessage(id, { text: welcomeMsg, mentions: [participant] })
      }
    }
  })

  sock.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0]
    if (!msg.message) return

    const from = msg.key.remoteJid
    const sender = msg.key.participant || msg.key.remoteJid
    const body = msg.message?.conversation || msg.message?.extendedTextMessage?.text || ''
    const isCmd = body.startsWith(config.prefix)
    const args = body.slice(1).trim().split(' ')
    const cmd = isCmd ? args[0].toLowerCase() : ''
    const isGroup = from.endsWith('@g.us')
    const isDM = !isGroup

    // Auto reply only in DMs
    if (!isCmd && isDM) {
      const senderNumber = sender.split('@')[0]
      await sock.sendMessage(from, {
        text: `👋 Hey @${senderNumber}! The owner is currently unavailable. I'll let them know you messaged! 😊\nType *!menu* to see what I can do!`,
        mentions: [sender]
      })
      // Notify owner
      await sock.sendMessage(config.ownerNumber, {
        text: `📩 *New DM Alert!*\n\n@${senderNumber} just messaged you!\n\n💬 "${body}"`,
        mentions: [sender]
      })
      return
    }

    if (!isCmd) return

    // MENU
    if (cmd === 'menu') {
      await sock.sendMessage(from, { text: `╭━━『 *${config.botName}* 』━━╮\n\n🎮 *GAMES*\n│ ➜ !math easy/hard/insane/impossible\n│ ➜ !trivia\n│ ➜ !dice\n│ ➜ !guess\n│ ➜ !truth\n│ ➜ !dare\n│ ➜ !joke\n\n💯 *RATINGS*\n│ ➜ !ship name1 name2\n│ ➜ !gayrate name\n│ ➜ !foolishrate name\n│ ➜ !intelligencerate name\n│ ➜ !luckrate name\n│ ➜ !bossrate name\n│ ➜ !crazyrate name\n│ ➜ !hotrate name\n\n🛡️ *ADMIN*\n│ ➜ !warn @person reason\n│ ➜ !roast @person\n\n🎵 *MEDIA*\n│ ➜ !download song name\n\n⚙️ *GENERAL*\n│ ➜ !menu\n│ ➜ !ping\n\n╰━━━━━━━━━━━━━━━━━` })
    }

    // PING
    if (cmd === 'ping') {
      await sock.sendMessage(from, { text: '🏓 Pong! Bot is alive!' })
    }

    // MATH LEVELS
    if (cmd === 'math') {
      const level = args[1]?.toLowerCase()
      let mathQuestion, answer

      if (level === 'easy') {
        const a = Math.floor(Math.random() * 10) + 1
        const b = Math.floor(Math.random() * 10) + 1
        const ops = ['+', '-']
        const op = ops[Math.floor(Math.random() * ops.length)]
        answer = op === '+' ? a + b : a - b
        mathQuestion = `${a} ${op} ${b}`
      } else if (level === 'hard') {
        const a = Math.floor(Math.random() * 12) + 2
        const b = Math.floor(Math.random() * 12) + 2
        const ops = ['×', '÷']
        const op = ops[Math.floor(Math.random() * ops.length)]
        answer = op === '×' ? a * b : Math.floor(a * b / b)
        mathQuestion = op === '×' ? `${a} × ${b}` : `${a * b} ÷ ${b}`
      } else if (level === 'insane') {
        const a = Math.floor(Math.random() * 20) + 10
        const b = Math.floor(Math.random() * 10) + 2
        const c = Math.floor(Math.random() * 20) + 5
        answer = a * b + c
        mathQuestion = `${a} × ${b} + ${c}`
      } else if (level === 'impossible') {
        const a = Math.floor(Math.random() * 50) + 20
        const b = Math.floor(Math.random() * 20) + 5
        const c = Math.floor(Math.random() * 30) + 10
        const d = Math.floor(Math.random() * 5) + 2
        answer = a * b - c * d
        mathQuestion = `${a} × ${b} - ${c} × ${d}`
      } else {
        await sock.sendMessage(from, { text: '🧮 Usage: *!math easy* | *!math hard* | *!math insane* | *!math impossible*' })
        return
      }
      await sock.sendMessage(from, { text: `🧮 *Math Challenge - ${level?.toUpperCase()}*\n\nWhat is *${mathQuestion}*?\n\nReply with *!answer ${answer}*` })
    }

    // ANSWER
    if (cmd === 'answer') {
      await sock.sendMessage(from, { text: `✅ Correct! Well done! Use *!math easy/hard/insane/impossible* to play again.` })
    }

    // JOKE
    if (cmd === 'joke') {
      const jokes = [
        "Why don't scientists trust atoms? Because they make up everything!",
        "Why did the math book look sad? It had too many problems!",
        "What do you call a fake noodle? An impasta!",
        "I told my wife she was drawing her eyebrows too high. She looked surprised.",
        "Why don't eggs tell jokes? They'd crack each other up!",
        "What do you call cheese that isn't yours? Nacho cheese!",
        "Why did the scarecrow win an award? Because he was outstanding in his field!"
      ]
      await sock.sendMessage(from, { text: `😂 ${jokes[Math.floor(Math.random() * jokes.length)]}` })
    }

    // DICE
    if (cmd === 'dice') {
      await sock.sendMessage(from, { text: `🎲 You rolled: *${Math.floor(Math.random() * 6) + 1}*` })
    }

    // TRUTH
    if (cmd === 'truth') {
      const truths = [
        "What is your biggest fear?",
        "What is the most embarrassing thing you've ever done?",
        "Who was your first crush?",
        "What is your biggest secret?",
        "Have you ever lied to your best friend?",
        "What is the most childish thing you still do?"
      ]
      await sock.sendMessage(from, { text: `🤔 *Truth:* ${truths[Math.floor(Math.random() * truths.length)]}` })
    }

    // DARE
    if (cmd === 'dare') {
      const dares = [
        "Send a funny selfie right now!",
        "Text someone you haven't talked to in a year!",
        "Change your status to something embarrassing for 1 hour!",
        "Do 10 pushups right now and send proof!",
        "Send a voice note singing your favorite song!",
        "Let someone in this group post anything on your status!"
      ]
      await sock.sendMessage(from, { text: `😈 *Dare:* ${dares[Math.floor(Math.random() * dares.length)]}` })
    }

    // GUESS
    if (cmd === 'guess') {
      const num = Math.floor(Math.random() * 10) + 1
      await sock.sendMessage(from, { text: `🔢 Guess a number between *1-10*!\nType your guess with *!answer (number)*\n\n*(Answer: ${num})*` })
    }

    // TRIVIA
    if (cmd === 'trivia') {
      const questions = [
        { q: "What is the capital of France?", a: "Paris" },
        { q: "How many legs does a spider have?", a: "8" },
        { q: "What is 12 × 12?", a: "144" },
        { q: "What planet is closest to the sun?", a: "Mercury" },
        { q: "What is the largest ocean on Earth?", a: "Pacific Ocean" },
        { q: "How many continents are there?", a: "7" },
        { q: "What is the fastest land animal?", a: "Cheetah" }
      ]
      const q = questions[Math.floor(Math.random() * questions.length)]
      await sock.sendMessage(from, { text: `❓ *Trivia Time!*\n\n${q.q}\n\nReply with *!answer (your answer)*\n||Answer: ${q.a}||` })
    }

    // RATINGS
    const rateCmd = ['gayrate', 'foolishrate', 'intelligencerate', 'luckrate', 'bossrate', 'crazyrate', 'hotrate']
    if (rateCmd.includes(cmd)) {
      const target = args.slice(1).join(' ') || 'you'
      const percent = Math.floor(Math.random() * 101)
      const emojis = { gayrate: '🌈', foolishrate: '🤪', intelligencerate: '🧠', luckrate: '🍀', bossrate: '👑', crazyrate: '🤯', hotrate: '🔥' }
      const labels = { gayrate: 'gay', foolishrate: 'foolish', intelligencerate: 'intelligent', luckrate: 'lucky', bossrate: 'a boss', crazyrate: 'crazy', hotrate: 'hot' }
      await sock.sendMessage(from, { text: `${emojis[cmd]} *${target}* is *${percent}%* ${labels[cmd]}!\n\n${'█'.repeat(Math.floor(percent / 10))}${'░'.repeat(10 - Math.floor(percent / 10))} ${percent}%` })
    }

    // SHIP
    if (cmd === 'ship') {
      const name1 = args[1] || 'Person 1'
      const name2 = args[2] || 'Person 2'
      const percent = Math.floor(Math.random() * 101)
      let shipMsg = percent >= 80 ? '🔥 Soulmates! Perfect match!' : percent >= 60 ? '💕 Great chemistry!' : percent >= 40 ? '🙂 Could work with effort!' : percent >= 20 ? '😬 It\'s complicated...' : '💔 Not meant to be!'
      await sock.sendMessage(from, { text: `💕 *Ship Rate*\n\n*${name1}* + *${name2}*\n\n${'█'.repeat(Math.floor(percent / 10))}${'░'.repeat(10 - Math.floor(percent / 10))} ${percent}%\n\n${shipMsg}` })
    }

    // ROAST
    if (cmd === 'roast') {
      const target = args.slice(1).join(' ') || 'you'
      const roasts = [
        "is the reason they put instructions on shampoo bottles! 😂",
        "could be used as a human alarm clock — just annoying enough to wake everyone up! 😴",
        "has the personality of a wet sock. 🧦",
        "is proof that even mistakes can walk and talk! 🚶",
        "is like a cloud — when they disappear, it's a beautiful day! ☁️",
        "reminds me of a software update — nobody wants you but you keep showing up! 💻",
        "is so boring, their shadow falls asleep! 😴"
      ]
      await sock.sendMessage(from, { text: `🔥 *Roast Alert!*\n\n*${target}* ${roasts[Math.floor(Math.random() * roasts.length)]}` })
    }

    // WARN
    if (cmd === 'warn') {
      const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]
      const reason = args.slice(2).join(' ') || 'No reason given'
      if (!mentioned) {
        await sock.sendMessage(from, { text: '⚠️ Please mention someone to warn!\nExample: *!warn @person reason*' })
        return
      }
      const num = mentioned.split('@')[0]
      if (!warnings[num]) warnings[num] = 0
      warnings[num]++
      await sock.sendMessage(from, {
        text: `⚠️ *Warning ${warnings[num]}/3*\n\n@${num} has been warned!\n📋 *Reason:* ${reason}\n\n${warnings[num] >= 3 ? '🚨 Final warning! Next action will be a kick!' : `⚠️ ${3 - warnings[num]} warning(s) remaining!`}`,
        mentions: [mentioned]
      })
    }

    // DOWNLOAD
    if (cmd === 'download') {
      const songName = args.slice(1).join(' ')
      if (!songName) {
        await sock.sendMessage(from, { text: '🎵 Please provide a song name!\nExample: *!download Lonely At The Top*' })
        return
      }
      await sock.sendMessage(from, { text: `🎵 Searching for *${songName}*...\n⏳ Please wait...` })
      try {
        const searchRes = await axios.get(`https://api.fabdl.com/youtube/search?q=${encodeURIComponent(songName)}`)
        const video = searchRes.data.result?.[0]
        if (!video) {
          await sock.sendMessage(from, { text: `❌ Could not find *${songName}*. Try a different name!` })
          return
        }
        const dlRes = await axios.get(`https://api.fabdl.com/youtube/mp3?id=${video.id}`)
        const taskId = dlRes.data.result?.id
        await new Promise(r => setTimeout(r, 5000))
        const trackRes = await axios.get(`https://api.fabdl.com/youtube/mp3/track-info?id=${video.id}&tid=${taskId}`)
        const downloadUrl = trackRes.data.result?.download_url
        if (!downloadUrl) {
          await sock.sendMessage(from, { text: `❌ Download failed for *${songName}*. Try again!` })
          return
        }
        await sock.sendMessage(from, {
          audio: { url: downloadUrl },
          mimetype: 'audio/mpeg',
          fileName: `${songName}.mp3`
        })
      } catch (e) {
        await sock.sendMessage(from, { text: `❌ Download failed. Try again later!` })
      }
    }

  })
}

startBot()
