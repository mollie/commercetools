import _ from 'lodash'
import app from './app'

// TODO: Get port from config once the gpc-function feature is merged (reworked config export)
const port = process.env.PORT || 3000

const _exit = _.once(() => {
  console.log('\nClosing http server.')
  server.close(() => {
    console.log('Http server closed.')
  })
})

const signals = ['SIGTERM', 'SIGINT', 'SIGUSR2']

const server = app.listen(port, () => {
  console.log(`🚀 Server started on port: ${port} 🚀`)
  signals.forEach(signal => process.once(signal, _exit))
})
