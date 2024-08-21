const { glData, shipments } = require('../load');
const { v4: uuid } = require('uuid');
const fs = require("fs");
const { performance } = require('perf_hooks');

const glMap = {};
const response = {};
for (let i = 0; i < Object.keys(shipments).length; i += 1) {
  const shipment = shipments[Object.keys(shipments)[i]];
  shipment.id = uuid();
  const startTime = performance.now();
  for (let j = 0; j < Object.keys(glData).length; j += 1) {
    const glValues = glData[Object.keys(glData)[j]];
    const acc = glValues.reduce(((_acc, _itr) => {
      _acc.weight += parseFloat(_itr?.weight);
      return _acc;
    }), { weight: 0 });
    if (glValues.every((glValue) => glValue.value === shipment?.[glValue?.parameter])
      && ((acc.weight > glMap?.[shipment.id]?.weightage) || !glMap?.[shipment.id]?.weightage)) {
      glMap[shipment.id] = {
        gl_code_id: glValues?.[0]?.id,
        gl_code: Object.keys(glData)[j],
        gl_description: glValues?.[0]?.glCode?.description,
        weightage: acc.weight,
        split_percentage: 100,
        shipment,
      };
      const endTime = performance.now();
      response[Object.keys(shipments)[i]] = {
        queryName: Object.keys(shipments)[i],
        result: Object.keys(glData)[j],
        executionTime: endTime - startTime,
      };
    }
  }
}
fs.writeFileSync('shipment_result.json', JSON.stringify(response, null, 2));
