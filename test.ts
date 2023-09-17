import bunchy, { Router } from ".";

const server = bunchy();

server.use((req, res, next) => {
  console.log("middleware 1");
  next!();
});

server.get("/test", (req, res) => {
  res.withStatus(200).json({ message: "Hello World" });
});

server.errorHandler((req, res, err) => {
  console.log(err);
  res.withStatus(err.code).json({ message: err.message });
});

server.serve(3001);
