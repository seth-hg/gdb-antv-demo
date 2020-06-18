const express = require("express");
const CypherClient = require("../drivers/cypher-client");
const GremlinClient = require("../drivers/gremlin-client");
const servers = require("./config");

var router = express.Router();

router.post("/", function (req, res, next) {
  var client = null;
  if (req.body.type == "cypher") {
    client = new CypherClient(
      servers.cypher.endpoint,
      servers.cypher.username,
      servers.cypher.password
    );
  } else {
    client = new GremlinClient(
      servers.gremlin.endpoint,
      servers.gremlin.username,
      servers.gremlin.password
    );
  }
  client
    .run(req.body.dsl)
    .then((data) => {
      res.json(data);
    })
    .catch((error) => {
      res.status(500).json({ error: error });
    })
    .finally(() => {
      client.close();
    });
});

module.exports = router;
