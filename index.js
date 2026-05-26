const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys')
const pino = require('pino')
const config = require('./config')

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info')
  
  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true,
    logger: pino({ level: 'silent' })
  })

  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0]
    if (!msg.message) return
    
    const from = msg.key.remoteJid
    const body = msg.message?.conversation || msg.message?.extendedTextMessage?.text || ''
    const isCmd = body.startsWith(config.prefix)
    const cmd = isCmd ? body.slice(1).split(' ')[0].toLowerCase() : ''

    // Auto reply
    if (!isCmd) {
      await sock.sendMessage(from, { text: `👋 Hi! I am ${config.botName}. Type *!menu* to see commands.` })
      return
    }

    // Menu
    if (cmd === 'menu') {
      await sock.sendMessage(from, { text: `╭━━『 *${config.botName}* 』━━╮\n\n🎮 *GAMES*\n│ ➜ !guess\n│ ➜ !trivia\n│ ➜ !math\n│ ➜ !dice\n│ ➜ !word\n│ ➜ !tictactoe\n\n😂 *FUN*\n│ ➜ !joke\n│ ➜ !truth\n│ ➜ !dare\n\n⚙️ *GENERAL*\n│ ➜ !menu\n│ ➜ !ping\n│ ➜ !viewonce\n\n╰━━━━━━━━━━━━━━━━━` })
    }

    // Ping
    if (cmd === 'ping') {
      await sock.sendMessage(from, { text: '🏓 Pong! Bot is alive!' })
    }

    // Joke
    if (cmd === 'joke') {
      const jokes = [
        "Why don't scientists trust atoms? Because they make up everything!",
        "Why did the math book look sad? It had too many problems!",
        "What do you call a fake noodle? An impasta!",
        "Why can't your nose be 12 inches long? Because then it would be a foot!"
      ]
      const joke = jokes[Math.floor(Math.random() * jokes.length)]
      await sock.sendMessage(from, { text: `😂 ${joke}` })
    }

    // Dice
    if (cmd === 'dice') {
      const roll = Math.floor(Math.random() * 6) + 1
      await sock.sendMessage(from, { text: `🎲 You rolled: *${roll}*` })
    }

    // Math game
    if (cmd === 'math') {
      const a = Math.floor(Math.random() * 20) + 1
      const b = Math.floor(Math.random() * 20) + 1
      await sock.sendMessage(from, { text: `🧮 Quick! What is *${a} + ${b}*?\nReply with *!answer ${a + b}*` })
    }

    // Answer
    if (cmd === 'answer') {
      await sock.sendMessage(from, { text: `✅ Thanks for answering! Use *!math* to play again.` })
    }

    // Truth
    if (cmd === 'truth') {
      const truths = [
        "What is your biggest fear?",
        "What is the most embarrassing thing you've done?",
        "Who was your first crush?",
        "What is your biggest secret?"
      ]
      const truth = truths[Math.floor(Math.random() * truths.length)]
      await sock.sendMessage(from, { text: `🤔 *Truth:* ${truth}` })
    }

    // Dare
    if (cmd === 'dare') {
      const dares = [
        "Send a funny selfie!",
        "Text someone you haven't talked to in a year!",
        "Change your status to something embarrassing for 1 hour!",
        "Do 10 pushups right now!"
      ]
      const dare = dares[Math.floor(Math.random() * dares.length)]
      await sock.sendMessage(from, { text: `😈 *Dare:* ${dare}` })
    }

    // Guess game
    if (cmd === 'guess') {
      const num = Math.floor(Math.random() * 10) + 1
      await sock.sendMessage(from, { text: `🔢 Guess a number between 1-10!\nThe answer is *${num}*\n(This is just for fun — try !trivia for a real challenge!)` })
    }

    // Trivia
    if (cmd === 'trivia') {
      const questions = [
        { q: "What is the capital of France?", a: "Paris" },
        { q: "How many legs does a spider have?", a: "8" },
        { q: "What is 12 x 12?", a: "144" },
        { q: "What planet is closest to the sun?", a: "Mercury" }
      ]
      const q = questions[Math.floor(Math.random() * questions.length)]
      await sock.sendMessage(from, { text: `❓ *Trivia:* ${q.q}\n\nAnswer: ||${q.a}||` })
    }

  })
}

startBot()
