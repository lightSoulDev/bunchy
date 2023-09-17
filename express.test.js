const express = require('express')
const app = express()

const server = express();

server.use((req, res, next) => {
  console.log("middleware 1");
  next();
});

server.get("/test", (req, res) => {
  res.json({ message: "Hello World" });
});

server.listen(3001);