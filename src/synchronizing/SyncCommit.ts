import type { Serializable } from '../serializing';

export interface BaseSyncCommit<T extends string> {
  type: T;
  target: 'local' | 'remote';
  key: string;
  [key: string]: Serializable;
}

export type SetSyncCommit = BaseSyncCommit<'set'> & {
  value: Serializable;
};
export type UpdateSyncCommit = BaseSyncCommit<'update'>;
export type RemoveSyncCommit = BaseSyncCommit<'remove'>;
export type SyncCommit = SetSyncCommit | UpdateSyncCommit | RemoveSyncCommit;
