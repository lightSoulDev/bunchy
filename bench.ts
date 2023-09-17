import bunchy from ".";

const app = bunchy();
app.get("/", (req, res) => {
  res.send("Hi");
});

app.post("/json", async (req, res) => {
  res.json(req.body);
});

app.get("/id/:id", async (req, res) => {
  let name = req.searchParams.get("name");
  res.withHeader("x-powered-by", "benchmark").send(`${req.params.id} ${name}`);
});

app.serve(3000);
