const http = require('http')

console.log('Bot starting...')

setTimeout(() => {
  console.log('Bot is running!')
}, 2000)

http.createServer((req, res) => res.end('OK')).listen(process.env.PORT || 3000, () => {
  console.log('Server started!')
})
