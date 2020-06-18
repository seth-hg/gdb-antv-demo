require("file-loader?name=[name].[ext]!./index.html");

const $ = require("jquery");
const jQuery = require("jquery");
import "bootstrap";
import "bootstrap/dist/css/bootstrap.css";
import "./style.css";

import { Graph } from "@antv/g6";
import axios from "axios";

const displayOptions = {
  nodeText: "id",
  nodeColor: "label",
  edgeText: "id",
  edgeColor: "label",
};

// layout参数，参考：
//   https://antv-g6.gitee.io/zh/docs/api/layout/Graph
const defaultLayoutOptions = {
  random: { type: "random" },
  force: {
    type: "force",
    linkDistance: 120,
    preventOverlap: true,
    nodeSize: 40,
    nodeSpacing: 20,
  },
  circlar: { type: "circular", radius: 200 },
  radial: {
    type: "radial",
    nodeSpacing: 30,
    preventOverlap: true,
    nodeSize: 40,
    linkDistance: 100,
  },
  dagre: { type: "dagre", rankdir: "TB", nodesep: 5 },
  concentric: {
    type: "concentric",
    preventOverlap: true,
    nodeSize: 40,
    minNodeSpacing: 30,
  },
  grid: {
    type: "grid",
    preventOverlap: true,
    nodeSize: 40,
    preventOverlapPadding: 20,
  },
};

class Painter {
  constructor(preset) {
    this.allocated = {};
    // 预设颜色
    this.preset = preset;
  }

  reset() {
    this.allocated = {};
  }

  getRandomColor() {
    const letters = "0123456789ABCDEF";
    var color = "#";
    for (var i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }

  getColor(label) {
    var color = this.allocated[label];
    if (color != undefined) {
      return color;
    }
    const offset = Object.keys(this.allocated).length;
    if (offset < this.preset.length) {
      color = this.preset[offset];
    } else {
      color = getRandomColor();
    }
    this.allocated[label] = color;
    return color;
  }
}

const painter = new Painter([
  "lightsalmon",
  "lightgreen",
  "orange",
  "darkturquoise",
  "firebrick",
  "lightskyblue",
  "plum",
  "royalblue",
  "sienna",
  "azure",
]);

function initGraph() {
  const width = document.getElementById("mountNode").scrollWidth;
  const height = document.getElementById("mountNode").scrollHeight || 800;
  window.graph = new Graph({
    container: "mountNode", // 必须，String | HTMLElement，容器 id 或容器本身
    width: width, // 必须，图的宽度
    height: height, // 必须，图的高度
    groupByTypes: false,
    defaultNode: {
      type: "node",
      labelCfg: {
        style: {
          fill: "#000000A6",
          fontSize: 10,
        },
      },
      size: 40,
      color: "#5B8FF9",
      style: {
        lineWidth: 2,
        fill: "#C6E5FF",
      },
    },
    nodeStateStyles: {
      // 鼠标 hover 上节点，即 hover 状态为 true 时的样式
      hover: {
        fill: "lightsteelblue",
      },
      // 鼠标点击节点，即 click 状态为 true 时的样式
      click: {
        stroke: "steelblue",
        lineWidth: 3,
      },
    },
    defaultEdge: {
      type: "line",
      size: 1,
      style: {
        stroke: "slategray",
        endArrow: {
          path: "M 0,0 L 8,4 L 8,-4 Z",
        },
      },
    },
    edgeStateStyles: {
      // 鼠标 hover 上节点，即 hover 状态为 true 时的样式
      hover: {
        stroke: "gray",
      },
      // 鼠标点击节点，即 click 状态为 true 时的样式
      click: {
        stroke: "darkgrey",
        lineWidth: 2,
      },
    },
    layout: defaultLayoutOptions["force"],
    modes: {
      default: ["drag-canvas", "zoom-canvas", "drag-node"],
    },
  });

  setEvents(window.graph);
}

function fillElementDetail(element) {
  $("tr#id").html("<td>ID</td><td>" + element.id + "</td>");
  var propsHtml =
    "<tr><td>标签</td><td>" + element.originalLabel + "</td></tr>";
  element.properties.forEach((p) => {
    propsHtml += "<tr><td>";
    propsHtml += p.name + "</td><td>" + p.value;
    propsHtml += "</td></tr>";
  });
  $("tbody#props").html(propsHtml);
}

function clearElementDetail() {
  $("tr#id").html("");
  $("tbody#props").html("");
}

function refreshDragedNodePosition(e) {
  const model = e.item.get("model");
  model.fx = e.x;
  model.fy = e.y;
}

function setEvents(graph) {
  // 鼠标进入节点
  graph.on("node:mouseenter", (e) => {
    const nodeItem = e.item; // 获取鼠标进入的节点元素对象
    graph.setItemState(nodeItem, "hover", true); // 设置当前节点的 hover 状态为 true
  });

  // 鼠标离开节点
  graph.on("node:mouseleave", (e) => {
    const nodeItem = e.item; // 获取鼠标离开的节点元素对象
    graph.setItemState(nodeItem, "hover", false); // 设置当前节点的 hover 状态为 false
  });

  const clearSelected = () => {
    // 先将所有当前是 click 状态的节点置为非 click 状态
    const clickNodes = graph.findAllByState("node", "click");
    clickNodes.forEach((cn) => {
      graph.setItemState(cn, "click", false);
    });
    const clickEdges = graph.findAllByState("edge", "click");
    clickEdges.forEach((cn) => {
      graph.setItemState(cn, "click", false);
    });
  };

  // 节点点击
  graph.on("node:click", (e) => {
    clearSelected();
    const nodeItem = e.item; // 获取被点击的节点元素对象
    graph.setItemState(nodeItem, "click", true); // 设置当前节点的 click 状态为 true
    // 在侧边栏显示详细信息
    fillElementDetail(nodeItem._cfg.model);
  });

  // 节点拖拽
  graph.on("node:dragstart", function (e) {
    refreshDragedNodePosition(e);
  });
  graph.on("node:drag", function (e) {
    if ("force" == graph.get("layout").type) {
      const forceLayout = graph.get("layoutController").layoutMethod;
      forceLayout.execute();
    }
    refreshDragedNodePosition(e);
  });
  graph.on("node:dragend", function (e) {
    e.item.get("model").fx = null;
    e.item.get("model").fy = null;
  });

  // 边事件
  graph.on("edge:mouseenter", (e) => {
    const edgeItem = e.item; // 获取鼠标进入的节点元素对象
    graph.setItemState(edgeItem, "hover", true); // 设置当前节点的 hover 状态为 true
  });

  graph.on("edge:mouseleave", (e) => {
    const edgeItem = e.item; // 获取鼠标离开的节点元素对象
    graph.setItemState(edgeItem, "hover", false); // 设置当前节点的 hover 状态为 false
  });

  graph.on("edge:click", (e) => {
    clearSelected();
    const edgeItem = e.item; // 获取被点击的节点元素对象
    graph.setItemState(edgeItem, "click", true); // 设置当前节点的 click 状态为 true
    // 在侧边栏显示详细信息
    fillElementDetail(edgeItem._cfg.model);
  });

  // TODO: 右键点击显示上下文菜单
  graph.on("node:contextmenu", (evt) => {
    evt.preventDefault();
    evt.stopPropagation();
  });
}

function getPropertyByName(element, propertyName) {
  for (var i = 0; i < element.properties.length; ++i) {
    if (element.properties[i].name == propertyName) {
      return element.properties[i].value;
    }
  }
  return "";
}

function renderGraph(graph) {
  painter.reset();
  // get display options
  displayOptions.nodeText = $("#nodeText").val();
  displayOptions.nodeColor = $("#nodeColor").val();
  displayOptions.edgeText = $("#edgeText").val();
  displayOptions.edgeColor = $("#edgeColor").val();

  // fill nodes with text & color
  for (var i = 0; i < graph.nodes.length; ++i) {
    if (displayOptions.nodeText == "label") {
      // 显示标签
      graph.nodes[i].label = graph.nodes[i].originalLabel;
    } else if (displayOptions.nodeText == "id") {
      // 显示ID
      graph.nodes[i].label = graph.nodes[i].id;
    } else {
      // 显示指定属性
      graph.nodes[i].label = getPropertyByName(
        graph.nodes[i],
        displayOptions.nodeText
      );
    }
    var colorLabel = "";
    if (displayOptions.nodeColor == "label") {
      colorLabel = graph.nodes[i].originalLabel;
    } else {
      colorLabel = getPropertyByName(graph.nodes[i], displayOptions.nodeColor);
    }
    graph.nodes[i].style = { fill: painter.getColor(colorLabel) };
  }

  // fill edges with text & color
  for (var i = 0; i < graph.edges.length; ++i) {
    if (displayOptions.edgeText == "label") {
      // 显示标签
      graph.edges[i].label = graph.edges[i].originalLabel;
    } else if (displayOptions.edgeText == "id") {
      // 显示ID
      graph.edges[i].label = graph.edges[i].id;
    } else {
      // 显示指定属性
      graph.edges[i].label = getPropertyByName(
        graph.edges[i],
        displayOptions.edgeText
      );
    }
    var colorLabel = "";
    if (displayOptions.edgeColor == "label") {
      colorLabel = graph.edges[i].originalLabel;
    } else {
      colorLabel = getPropertyByName(graph.edges[i], displayOptions.edgeColor);
    }
    graph.edges[i].style = {
      stroke: painter.getColor(colorLabel),
      endArrow: {
        path: "M 0,0 L 8,4 L 8,-4 Z",
      },
    };
  }

  window.graph.data(graph);
  window.graph.render();
}

function doQuery(dsl) {
  var type = "cypher";
  if (dsl.startsWith("g.")) {
    type = "gremlin";
  }
  axios
    .post("/query", { type: type, dsl: dsl })
    .then(function (response) {
      console.log(response);
      if (response.data.error != undefined) {
        console.log("error:", response.data.error);
        alert("查询失败");
      } else {
        clearElementDetail();
        renderGraph(response.data.graph);
      }
    })
    .catch(function (error) {
      console.log(error);
      alert("查询失败");
    });
}

function changeLayout(layout) {
  window.graph.updateLayout(defaultLayoutOptions[layout]);
}

$(() => {
  initGraph();
});

$("div.input-group-btn ul.dropdown-menu li a").click(function (event) {
  event.preventDefault();
  var newLayout = $(this).parent().attr("value");
  var $div = $(this).parent().parent().parent();
  var $btn = $div.find("#btnLayout");
  $btn.html('<span class="caret"></span> ' + $(this).text());
  $div.removeClass("open");
  changeLayout(newLayout);
  return false;
});

$("#btn-go").on("click", function (event) {
  event.preventDefault();
  var dsl = $("#input-dsl").val();
  doQuery(dsl);
});

$("#nodeText").val(displayOptions.nodeText);
$("#nodeColor").val(displayOptions.nodeColor);
$("#edgeText").val(displayOptions.edgeText);
$("#edgeColor").val(displayOptions.edgeColor);

$("#input-dsl").on("keypress", function (event) {
  if (event.keyCode == 13) {
    // 回车执行
    doQuery(this.value);
    return false;
  }
});
