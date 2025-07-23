/**
 * 字符串省略方法
 * 默认显示前6个字符与后6个字符，中间显示省略号
 * 如果总字符不超过两个之和则完全显示
 * @param str 要处理的字符串
 * @param prefixLength 前缀长度，默认6
 * @param suffixLength 后缀长度，默认6
 * @param separator 分隔符，默认'...'
 * @returns 处理后的字符串
 */
export const truncateString = (
  str: string,
  prefixLength: number = 6,
  suffixLength: number = 6,
  separator: string = '...'
): string => {
  if (!str) return '';
  
  const totalLength = prefixLength + suffixLength;
  
  // 如果字符串长度不超过前缀+后缀长度，则完全显示
  if (str.length <= totalLength) {
    return str;
  }
  
  // 否则显示前缀+分隔符+后缀
  const prefix = str.slice(0, prefixLength);
  const suffix = str.slice(-suffixLength);
  
  return `${prefix}${separator}${suffix}`;
};