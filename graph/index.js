const { glData, shipments } = require('../load');
const Graph = require('graphology');
const fs = require("fs");
const { performance } = require('perf_hooks');

const graph = new Graph();

const addGLCodeToGraph = (glCode, parameters) => {
  parameters.forEach(param => {
    const fromNode = `${param.parameter}:${param.value}`;
    if (!graph.hasNode(fromNode)) {
      graph.addNode(fromNode);
    }
    if (!graph.hasNode(glCode)) {
      graph.addNode(glCode);
    }
    graph.addEdge(fromNode, glCode, { weight: parseFloat(param.weight) });
  });
};

const findBestGLCode = (query) => {
  let bestGLCode = null;
  let maxWeight = -1;

  graph.nodes().forEach((node) => {
    if (node.startsWith('gl_code')) {
      let totalWeight = 0;
      let allMatch = true;

      graph.inboundNeighbors(node).forEach((neighbor) => {
        const [param, value] = neighbor.split(':');
        if (query[param] === value) {
          totalWeight += graph.getEdgeAttribute(neighbor, node, 'weight');
        } else {
          allMatch = false;
        }
      });

      if (allMatch && totalWeight > maxWeight) {
        maxWeight = totalWeight;
        bestGLCode = node;
      }
    }
  });

  return bestGLCode;
};


Object.entries(glData).forEach(([glCode, parameters]) => {
  addGLCodeToGraph(glCode, parameters);
});


const response = [];
Object.entries(shipments).forEach(([queryName, query]) => {
  const startTime = performance.now();
  const result = findBestGLCode(query);
  const endTime = performance.now();
  response.push({
    queryName,
    result,
    executionTime: endTime - startTime
  });
});

fs.writeFileSync('shipment_result.json', JSON.stringify(response, null, 2));