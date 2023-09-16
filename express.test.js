const express = require('express')
const app = express()
const port = 3001

app.use('/test', (req, res, next) => {
    console.log('Time:', Date.now())
    next()
})


// app.get('/test', (req, res) => {
//   res.send('Hello World!')
// })

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})