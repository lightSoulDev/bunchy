import { ServerResponse } from "http";
import RadixRouter, { RouteHandlers } from "./src/router/router";
import { RouteTreeNode } from "./src/tree/tree";

const tree = new RouteTreeNode();

tree.set("/", {
  middlewares: [
    (req, res) => {
      console.log("middleware 1");
    },
    (req, res) => {
      console.log("middleware 2");
    },
    (req, res) => {
      console.log("middleware 3");
    },
  ],
  requestHandlers: {
    GET: (req, res) => {
      // res.setStatus(200).json({ message: "Hello World" });
      console.log("[GET]", "/");
    },
    POST: (req, res) => {
      // res.setStatus(200).json({ message: "Hello World" });
      console.log("[POST]", "/");
    },
  },
});

tree.set("/test", {
  middlewares: [
    (req, res) => {
      console.log("middleware test 1");
    },
    (req, res) => {
      console.log("middleware test 2");
    },
  ],
  requestHandlers: {
    GET: (req, res) => {
      // res.setStatus(200).json({ message: "Test World" });
      console.log("[GET]", "/test");
    },
    POST: (req, res) => {
      // res.setStatus(200).json({ message: "Test World" });
      console.log("[POST]", "/test");
    },
  },
});

tree.set("/test/handle", {
  middlewares: [
    (req, res) => {
      console.log("middleware test/handle 1");
    },
    (req, res) => {
      console.log("middleware test/handle 2");
    },
  ],
  requestHandlers: {
    GET: (req, res) => {
      // res.setStatus(200).json({ message: "Test World" });
      console.log("[GET]", "/test/handle");
    },
  },
});

tree.set("/test/:id/handle", {
  middlewares: [
    (req, res) => {
      console.log("middleware test/id/handle 1");
    },
  ],
  requestHandlers: {
    GET: (req, res) => {
      // res.setStatus(200).json({ message: "Test World" });
      console.log("[GET]", "/test/:id/handle");
    },
  },
});

tree.set("/test/:id/handle/:id", {
  middlewares: [],
  requestHandlers: {
    GET: (req, res) => {
      // res.setStatus(200).json({ message: "Test World" });
      console.log("[GET]", "/test/:id/handle/:id");
    },
  },
});

tree.set("/static/*", {
  middlewares: [],
  requestHandlers: {
    GET: (req, res) => {
      // res.setStatus(200).json({ message: "Test World" });
      console.log("[GET]", "/static/*");
    },
  },
});

function test(path: string) {
  let a = tree.get(path);
  for (const middleware of a.value?.middlewares ?? []) {
    // call middleware
    middleware(null, null);
  }
  const requestHandler = a.value?.requestHandlers.GET;
  requestHandler!(null, null);
  console.log(a);
}

const router = new RadixRouter();

router.use((req, res) => {
  console.log("middleware 1");
});
router.use((req, res) => {
  console.log("middleware 2");
});
router.use((req, res) => {
  console.log("middleware 3");
});

router.get("/", (req, res) => {
  console.log("[GET]", "/");
});
router.post("/", (req, res) => {
  console.log("[POST]", "/");
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

router.get("/test/:id/handle/:id", (req, res) => {
  console.log("[GET]", "/test/:id/handle/:id");
});

router.get("/static/*", (req, res) => {
  console.log("[GET]", "/static/*");
});

router.attach();
router.print();

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
