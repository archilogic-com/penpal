import { Message } from '../types.js';
import Messenger, {
  InitializeMessengerOptions,
  MessageHandler,
} from './Messenger.js';
import PenpalError from '../PenpalError.js';
import { TransferListItem, Worker } from 'node:worker_threads';

type Options = {
  /**
   * The Node.js worker receiving/sending communication from/to the parent thread.
   */
  worker: Worker;
};

/**
 * Handles the details of communicating with a child Node.js worker.
 */
class NodeWorkerMessenger implements Messenger {
  readonly #worker: Worker;
  #validateReceivedMessage?: (data: unknown) => data is Message;
  readonly #messageCallbacks = new Set<MessageHandler>();

  constructor({ worker }: Options) {
    if (!worker) {
      throw new PenpalError('INVALID_ARGUMENT', 'worker must be defined');
    }

    this.#worker = worker;
  }

  initialize = ({ validateReceivedMessage }: InitializeMessengerOptions) => {
    this.#validateReceivedMessage = validateReceivedMessage;
    this.#worker.addListener('message', this.#handleMessage);
  };

  sendMessage = (message: Message, transferables?: Transferable[]): void => {
    this.#worker.postMessage(message, transferables as TransferListItem[]);
  };

  addMessageHandler = (callback: MessageHandler): void => {
    this.#messageCallbacks.add(callback);
  };

  removeMessageHandler = (callback: MessageHandler): void => {
    this.#messageCallbacks.delete(callback);
  };

  destroy = () => {
    this.#worker.removeListener('message', this.#handleMessage);
    this.#messageCallbacks.clear();
  };

  readonly #handleMessage = (data: unknown): void => {
    if (!this.#validateReceivedMessage?.(data)) {
      return;
    }

    for (const callback of this.#messageCallbacks) {
      callback(data);
    }
  };
}

export default NodeWorkerMessenger;
