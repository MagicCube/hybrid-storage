import md5 from 'md5';

/**
 * 返回给定字符串的 MD5 哈希值。
 * @param str 给定的字符串。
 */
export function hash(str: string) {
  return md5(str).toUpperCase();
}
