import type { Serializable } from './Serializable';

export interface BaseSyncOperation<T extends string> {
  type: T;
  target: 'local' | 'remote';
  key: string;
}

export type SetSyncOperation = BaseSyncOperation<'set'> & {
  value: Serializable;
};
export type UpdateSyncOperation = BaseSyncOperation<'update'>;
export type RemoveSyncOperation = BaseSyncOperation<'remove'>;
export type SyncOperation =
  | SetSyncOperation
  | UpdateSyncOperation
  | RemoveSyncOperation;
