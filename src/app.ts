import express, { Application } from 'express'

const app: Application = express()

app.get('/health', (req, res) => {
  res.send('Ok')
})
// app.get('/', (req: Request, res: Response) => {
//   // handleRequest(req)
// })

export default app