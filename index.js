const express = require("express");
// const mongoose = require("mongoose");
const cors = require("cors");
const app = express();
const { MongoClient } = require("mongodb");
const dns = require("dns");
const urlParser = require("url");
require("dotenv").config();

const client = new MongoClient(process.env.MONGODB_URL);
const db = client.db("shortUrl");
const urls = db.collection("urls");

// Basic Configuration
const port = process.env.PORT || 3000;

// middlewares
app.use(
  express.urlencoded({
    extended: true,
  }),
);

app.use(cors());

app.use(express.json());

app.use("/public", express.static(`${process.cwd()}/public`));

app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

// Your first API endpoint
// post to url from the original url to the database,
app.post("/api/shorturl", async (req, res) => {
  const url = req.body.url;
  const dnslookup = dns.lookup(
    urlParser.parse(url).hostname,
    async (err, address) => {
      if (!address) {
        res.json({ error: "invalid url" });
      } else {
        const urlCount = await urls.countDocuments({});
        const urlDoc = {
          url,
          short_url: urlCount,
        };

        const result = await urls.insertOne(urlDoc);

        res.json({
          original_url: url,
          short_url: urlCount,
        });
      }
    },
  );
});

// getting the url and redirecting to the main website

app.get("/api/shorturl/:short_url", async function (req, res) {
  const { short_url } = req.params;

  const urlDoc = await urls.findOne({ short_url: +short_url });

  if (!urlDoc) {
    res.ststus(500).json("Short URL not found");
    return;
  }
  res.redirect(urlDoc.url);
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
