# GDB 可视化 demo

**已弃用，参考：https://github.com/aliyun/alibabacloud-gdb-console**

使用 [AntV G6](https://antv-g6.gitee.io/zh) 对 GDB 查询结果进行可视化。支持 Gremlin 和 Cypher。

## 运行

修改`routes/config.js`，替换`HOST`和`PORT`为 GDB 实例的地址和端口，填写对应的用户名和密码。

安装依赖库：

```
npm install
```

运行：

```
npm run build
npm start
```

浏览器中打开`http://localhost:3000`查看。

## 代码说明

后端使用 express 实现，提供 Gremlin 和 Cypher 的查询接口。前端使用 jQuery、Bootstrap 和 G6，用 webpack 打包。

- app.js：后端入口文件。
- drivers：Gremlin 和 Cypher driver 的封装。
- routes：查询接口的实现。
- ui：前端页面。
