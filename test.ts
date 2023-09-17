import bunchy, { Router } from ".";

const fooRouter = new Router();
fooRouter.use((req, res, next) => {
  console.log("middleware foo 1");
  next!();
});

fooRouter.use((req, res, next) => {
  console.log("middleware foo 2");
  next!();
});

fooRouter.get("/", (req, res) => {
  console.log("[GET]", "/foo");
  res.withStatus(200).json({ message: "/foo" });
});

fooRouter.post("/", (req, res) => {
  console.log("[POST]", "/foo");
  res.withStatus(200).json({ message: "/foo" });
});

fooRouter.get("/bar", (req, res) => {
  console.log("[GET]", "/foo/bar");
  res.withStatus(200).json({ message: "/foo/bar" });
});

fooRouter.post("/bar", (req, res) => {
  console.log("[POST]", "/foo/bar");
  res.withStatus(200).json({ message: "/foo/bar" });
});

const server = bunchy();

server.use((req, res, next) => {
  console.log("middleware 1");
  next!();
});

server.get("/test", (req, res) => {
  console.log(req.routePath, req.params, req.searchParams);
  res.withStatus(200).json({ message: "Hello World" });
});

server.errorHandler((req, res, err) => {
  console.log(err);
  res.withStatus(err.code).json({ message: err.message });
});

server.use("/foo", fooRouter);

server.serve(3001);
