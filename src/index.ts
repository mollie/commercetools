import * as express from 'express'
import { Request, Response } from 'express'

const app = express()

app.get('/health', (req: Request, res: Response) => {
  res.send('Ok')
})
// app.get('/', (req: Request, res: Response) => {
//   // handleRequest(req)
// })

app.listen(3000, () => {
  console.log('Server started on port 3000!')
})