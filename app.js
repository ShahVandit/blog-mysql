const express = require("express");
require('dotenv').config();
const mysql = require("mysql");
const bodyParser = require("body-parser");
const userRoute = require("./routes/users");
const { urlencoded } = require("body-parser");
const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use("/", userRoute);

app.listen(3000, () => {
  console.log("Listening on port 3000");
});
