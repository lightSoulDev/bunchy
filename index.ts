import RadixRouter, { RouteHandlers } from "./src/router/router";
import bunchy from "./src/server/server";

const router = new RadixRouter();

router.use((req, res, next) => {
  console.log("middleware 1");
  next!();
});
router.use((req, res, next) => {
  console.log("middleware 2");
  next!();
});
router.use((req, res, next) => {
  console.log("middleware 3");
  next!();
});

router.get("/", (req, res) => {
  return res!.setStatus(200).json({ message: "[GET] /" });
});
router.post("/", (req, res) => {
  return res!.setStatus(200).json({ message: "[POST] /" });
});

router.use("/test", (req, res) => {
  console.log("middleware test 1");
});
router.use("/test", (req, res) => {
  console.log("middleware test 2");
});
router.get("/test", (req, res) => {
  console.log("[GET]", "/test");
});
router.post("/test", (req, res) => {
  console.log("[POST]", "/test");
});

router.use("/test/handle", (req, res) => {
  console.log("middleware test/handle 1");
});
router.use("/test/handle", (req, res) => {
  console.log("middleware test/handle 2");
});
router.get("/test/handle", (req, res) => {
  console.log("[GET]", "/test/handle");
});

router.use("/test/:id/handle", (req, res) => {
  console.log("middleware test/id/handle 1");
});
router.get("/test/:id/handle", (req, res) => {
  console.log("[GET]", "/test/:id/handle");
});

router.get("/test/:id/handle/:name", (req, res) => {
  console.log("[GET]", "/test/:id/handle/:name");
});

router.get("/static/*", (req, res) => {
  console.log("[GET]", "/static/*");
  console.log(req);
});

// console.log(router.resolve("GET", "/test/1/handle/lightsoul"));
// console.log(router.resolve("GET", "/test/1/handle/lightsoul/test"));

const fooRouter = new RadixRouter();
fooRouter.use((req, res) => {
  console.log("middleware foo 1");
});

fooRouter.use((req, res) => {
  console.log("middleware foo 2");
});

fooRouter.get("/", (req, res) => {
  console.log("[GET]", "/foo");
});

fooRouter.post("/", (req, res) => {
  console.log("[POST]", "/foo");
});

fooRouter.get("/bar", (req, res) => {
  console.log("[GET]", "/foo/bar");
});

fooRouter.post("/bar", (req, res) => {
  console.log("[POST]", "/foo/bar");
});

router.use("/foo", fooRouter);

const server = bunchy();
server.use("/test", router);

server.serve(3001, {});

// test("/");
// test("/test");
// test("/test/1/handle");
// test("/test/handle");
// test("/test/1/handle");
// test("/test/1/handle/lightsoul");
// test("/static/index.html");
// tree.print();

// console.log(tree);

// tree.add("/");
// tree.add("/test");
// tree.add("/test/bar");
// tree.add("/test/foo");

// let a = tree.get("/");
// if (a) {
//   a.middlewares = [];
//   a.middlewares.push((req, res) => {
//     console.log("middleware 1");
//   });
//   a.requestHandlers = {};
//   a.requestHandlers.GET = (req, res) => {
//     res.setStatus(200).json({ message: "Hello World" });
//   };
//   a.requestHandlers.POST = (req, res) => {
//     res.setStatus(200).json({ message: "Hello World" });
//   };
// }

// tree.print();

// const router = new RadixRouter();

// router.get("/test", (req, res) => {
//   const { searchParams, pathname } = new URL(req!.url);
//   res.setStatus(200).json({ message: searchParams, pathname });
// });

// router.get("/test/:id/info", (req, res) => {
//   const { searchParams, pathname } = new URL(req!.url);
//   res.setStatus(200).json({ message: searchParams, pathname });
// });

// router.put("/test/:id", (req, res) => {
//   const { searchParams, pathname } = new URL(req!.url);
//   res.setStatus(200).json({ message: searchParams, pathname });
// });

// router.post("/test/:id/:name", (req, res) => {
//   const { searchParams, pathname } = new URL(req!.url);
//   res.setStatus(200).json({ message: searchParams, pathname });
// });

// router.use("/", (req, res, next) => {
//   console.log("middleware 1");
//   // to call next middlewares
//   next!();
// });

// router.use("/", (req, res, next) => {
//   console.log("middleware 2");
//   // to call next middlewares
//   next!();
// });

// router.use("/", (req, res, next) => {
//   console.log("middleware 3");
//   // to call next middlewares
//   next!();
// });

// router.use("/test", (req, res, next) => {
//   console.log("middleware test 1");
//   // to call next middlewares
//   next!();
// });

// router.use("/test", (req, res, next) => {
//   console.log("middleware test 2");
//   // to call next middlewares
//   next!();
// });

// console.log(router.resolve("/test/1/info"));
