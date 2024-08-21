const fs = require('fs');
const { glData, shipments } = require('../load');
const { performance } = require('perf_hooks');

class Node {
  constructor() {
    this.children = {};
    this.glCode = null;
    this.weight = 0;
  }
}

class GLCodeLib {
  constructor() {
    this.root = new Node();
  }

  insert(parameterObjects, glCode) {
    let node = this.root;
    let totalWeight = 0;

    for (let paramObj of parameterObjects) {
      const key = `${paramObj.parameter}:${paramObj.value}`;
      if (!node.children[key]) {
        node.children[key] = new Node();
      }
      node = node.children[key];
      totalWeight += parseInt(paramObj.weight, 10);
    }
    node.glCode = glCode;
    node.weight = totalWeight;

  }

  search(queryObjects) {
    let node = this.root;
    let bestMatch = null;
    let maxWeight = -1;

    const traverse = (node, weight) => {
      if (node.glCode && weight > maxWeight) {
        maxWeight = weight;
        bestMatch = node.glCode;
      }
      for (let queryObj of queryObjects) {
        const key = `${queryObj.parameter}:${queryObj.value}`;
        if (node.children[key]) {
          traverse(node.children[key], node.children[key].weight);
        }
      }
    };

    traverse(node, 0);

    return bestMatch;
  }

  visualize(node = this.root, level = 0) {
    const indent = ' '.repeat(level * 4);
    if (node.glCode) {
      console.log(`${indent}└── ${node.glCode} (weight: ${node.weight})`);
    }
    for (const key in node.children) {
      console.log(`${indent}└── ${key}`);
      this.visualize(node.children[key], level + 1);
    }
  }
}

const glcode = new GLCodeLib();

const data = glData;

for (let glCode in data) {
  glcode.insert(data[glCode], glCode);
}

const response = [];
for (let i = 0; i < Object.keys(shipments).length; i += 1) {
  const queryName = Object.keys(shipments)[i];
  const query = Object.entries(shipments[queryName]).map(([key, value]) => ({
    parameter: key,
    value: value
  }));
  const startTime = performance.now();
  const result = glcode.search(query);
  const endTime = performance.now();
  response.push({
    queryName,
    result,
    executionTime: endTime - startTime
  });
}
fs.writeFileSync('shipment_result.json', JSON.stringify(response, null, 2));