import { parentPort } from 'node:worker_threads';
import { PortMessenger, connect } from '../../../dist/penpal.mjs';

const messenger = new PortMessenger({
  port: parentPort,
});

const connection = connect({
  messenger,
  methods: {
    multiply(num1, num2) {
      return num1 * num2;
    },
    divide(num1, num2) {
      return num1 / num2;
    },
    async testCallParent(num1, num2) {
      const remote = await connection.promise;
      return await remote.add(num1, num2);
    },
  },
});

connection.promise.then(() => {
  // Connection established
});
