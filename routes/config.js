// 配置GDB地址

const servers = {
  cypher : {
    endpoint : "bolt://HOST:PORT",
    username : "USER",
    password : "PASSWORD",
  },
  gremlin : {
    endpoint : "ws://HOST:PORT/gremlin",
    username : "USER",
    password : "PASSWORD",
  },
};

module.exports = servers;
