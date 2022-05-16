import { AliOSS, AsyncLocalStorage, HybridStorage } from '@/index';
import { logger } from '@/logging';
import { AliOSSStorage } from '@/storing';

logger.enabled = true;

const oss = new AliOSS({
  region: 'oss-cn-nanjing',
  /**
   * 警告：永远不要将 AccessKeyId 和 AccessKeySecret 保存在源码中。
   * 请参考 `/.env.template`，并在 `/.env` 文件中进行配置。
   */
  accessKeyId: import.meta.env.VITE_OSS_ACCESS_KEY_ID,
  accessKeySecret: import.meta.env.VITE_OSS_ACCESS_KEY_SECRET,
  bucket: 'trip-way',
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const localStore = new AsyncLocalStorage('example');
const ossStore = new AliOSSStorage('example', oss);
const hybridStore = new HybridStorage('example', oss);

Object.assign(window, { localStore, ossStore, hybridStore });
