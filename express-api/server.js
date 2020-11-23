const express = require("express");
const app = express();

const PORT = process.env.PORT || 5000;

app.get("/", (req, res) =>
  res.status(200).send("Welcome to the Express API Server")
);

app.listen(PORT, () => console.info(`App running on PORT: ${PORT}`));
