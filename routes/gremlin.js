const express = require("express");
const GremlinClient = require("../drivers/gremlin-client");

var router = express.Router();

var endpoint = "ws://localhost:3002/gremlin";
var username = "seth";
var password = "passwd";

router.post("/", function (req, res, next) {
  // res.send('respond with a resource');
  const client = new GremlinClient(endpoint, username, password);
  client
    .run(req.body.gremlin)
    .then((data) => {
      console.log(data);
      res.json(data);
    })
    .catch(function (error) {
      console.log(error);
      res.json({ error: error });
    });
});

module.exports = router;
