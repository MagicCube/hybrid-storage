import type { Serializable } from '../serializing';

export interface BaseSyncCommit<T extends string> {
  type: T;
  target: 'local' | 'remote';
  key: string;
  reason:
    | 'local-updated'
    | 'local-removed'
    | 'remote-added'
    | 'remote-updated'
    | 'remote-removed';
  staging: 'queued' | 'patching';
  [key: string]: Serializable;
}

export type SetSyncCommit = BaseSyncCommit<'set'> & {
  value: Serializable;
};
export type UpdateSyncCommit = BaseSyncCommit<'update'>;
export type RemoveSyncCommit = BaseSyncCommit<'remove'>;
export type SyncCommit = SetSyncCommit | UpdateSyncCommit | RemoveSyncCommit;
