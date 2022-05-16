/**
 * 用于描述同步状态的枚举。
 */
export enum SyncState {
  /**
   * 已初始化。
   */
  Initialized,

  /**
   * 同步中。
   */
  Synchronizing,

  /**
   * 已同步。
   */
  Synchronized,

  /**
   * 同步过程中发生异常而失败。
   */
  Failed,
}
