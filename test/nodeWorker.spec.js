import { describe, it } from 'node:test';
import assert from 'node:assert';
import { Worker } from 'node:worker_threads';
import path from 'path';
import { fileURLToPath } from 'url';
import { NodeWorkerMessenger, connect } from '../dist/penpal.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('NodeWorkerMessenger', () => {
  it('connects to Node.js worker', async () => {
    const worker = new Worker(
      path.join(__dirname, 'childFixtures/workers/nodeWorker.js')
    );

    const messenger = new NodeWorkerMessenger({
      worker,
    });

    const connection = connect({
      messenger,
      methods: {
        add(num1, num2) {
          return num1 + num2;
        },
      },
    });

    const remote = await connection.promise;

    // Test calling remote methods
    const multiplicationResult = await remote.multiply(2, 6);
    assert.strictEqual(multiplicationResult, 12);

    const divisionResult = await remote.divide(12, 4);
    assert.strictEqual(divisionResult, 3);

    const callParentResult = await remote.testCallParent(2, 6);
    assert.strictEqual(callParentResult, 8);

    connection.destroy();
    worker.terminate();
  });
});
