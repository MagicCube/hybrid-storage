import type { Serializable } from '@/serializing';
import { AsyncLocalStorage } from '@/storing';

/**
 * 表示一个接受异步回调的队列。
 *
 * 该队列支持当某一个任务项失败后离线存储，并在有条件时重试。
 */
export class AsyncQueue<T extends Serializable> {
  private _isRunning = false;
  private _internal: T[] = [];
  private _localStorage: AsyncLocalStorage;

  /**
   * 创建 `AsyncQueue` 类的新实例。
   * @param instanceName 指定存储实例的名称。
   * @param _callback 一个回调函数，用于异步处理队列中的每一个任务项。
   * @param _errorCallback 一个回调函数，用于异步处理任务执行的错误。
   * @param autoRun 指定是否在创建实例后立即开始执行队列。
   */
  constructor(
    readonly instanceName: string,
    private readonly _callback: (task: T) => Promise<void>,
    private readonly _errorCallback?:
      | ((task: T, error: Error) => Promise<void>)
      | null,
  ) {
    this._localStorage = new AsyncLocalStorage(`@queue/${instanceName}`);
    this._internal = this._localStorage.getItemSync('tasks', []) as T[];
  }

  /**
   * 获取队列中的任务数量。
   */
  get length() {
    return this._internal.length;
  }

  /**
   * 获取一个 `Boolean` 值，`true` 表示队列中已没有任务项。
   */
  get isEmpty() {
    return this.length === 0;
  }

  /**
   * 获取队列中的第一个任务项，即即将被下一个执行的任务项。
   */
  get peak(): T | undefined {
    return this._internal[0];
  }

  /**
   * 获取此队列是否正在执行任务中。
   */
  get isRunning() {
    return this._isRunning;
  }

  /**
   * 将指定的任务项添加到队列的末尾。
   * @param task 指定的任务项。
   * @param autoRunAfterEnqueue 指定是否在添加任务项后立即执行队列。
   */
  async enqueue(task: T, autoRunAfterEnqueue = true) {
    this._internal.push(task);
    await this._save();
    if (autoRunAfterEnqueue) {
      this.run(); // 无需等待，因为 _run() 实际是在 requestIdleCallback() 中被调用
    }
  }

  /**
   * 从队列中移除第一个任务项。
   */
  async dequeue() {
    this._internal.shift();
    await this._save();
  }

  /**
   * 尝试在较空闲时，执行下一个任务项（如果存在）直到对列为空。
   */
  async run(): Promise<void> {
    if (this._isRunning || this.isEmpty) return;

    this._isRunning = true;
    return new Promise((resolve, reject) => {
      requestIdleCallback(async (deadline: IdleDeadline) => {
        if (deadline.didTimeout) {
          this._isRunning = false;
          resolve(this.run());
          return;
        }
        if (!this.isEmpty) {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          const task = this.peak!;
          try {
            await this._callback(task);
          } catch (e) {
            this._isRunning = false;
            if (this._errorCallback) {
              await this._errorCallback(task, e as Error);
            }
            reject(e);
            return;
          }
          await this.dequeue();
        }
        this._isRunning = false;

        if (!this.isEmpty) {
          await this.run();
        }

        resolve();
      });
    });
  }

  private async _save() {
    await this._localStorage.setItem('tasks', this._internal);
  }
}
