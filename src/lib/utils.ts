import dayjs from "dayjs";
import type Decimal from "decimal.js";
import { formatUnits } from "viem";
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { toast } from "sonner";
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
  prefixLength = 6,
  suffixLength = 6,
  separator = '...'
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

// dayjs时间格式为指定格式
export const formatDate = (date: string|Date, format = 'MMM DD, YYYY') => {
  return dayjs(date).format(format);
};

// 定一个promise的延迟函数
export const delay_s = (ms=300, reload=false) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(true);
      if(reload) window.location.reload();
    }, ms);
  });
};


// 数字格式化
export function toFixed(
  value: number | string,
  fixed = 6,
  type: 'floor' | 'round' = 'floor',
  localFormat = true
): string {
  value = Number(value);
  const minValue = 1 / Math.pow(10, fixed);
  if (value > 0 && value < minValue) {
    return `<${minValue}`;
  }

  let formattedValue: string;
  
  if (type === 'round') {
    formattedValue = value.toFixed(fixed);
  } else {
    const pow = Math.pow(10, fixed);
    formattedValue = `${Math.floor(value * pow) / pow}`;
  }

  // 如果需要本地格式化
  if (localFormat) {
    // 只去除小数点后的0，保留小数点前的0
    return new Intl.NumberFormat(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: fixed,
    }).format(Number(formattedValue)).replace(/(\.[0-9]*?)0+$/, '$1');
  }

  return formattedValue;
}

// token 的格式化
export const formatToken = (amount: string|number|bigint|Decimal, decimals = 6) => {
  try {
    if(!amount) return '0';
    amount = formatUnits(BigInt(Number(amount)), decimals);
    return toFixed(Number(amount), decimals, 'round', true);
  } catch (error) {
    return '0';
  }
}



export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 将换行文本替换为空字符
export const replaceNewLine = (text: string) => {
  return text.replace(/\n/g, ' ');
}

/**
 * 通用重试方法
 * @param fn 需要重试的异步方法
 * @param maxRetries 最大重试次数，默认4次
 * @param retryDelay 重试间隔时间（毫秒），默认2000ms
 * @param shouldRetry 可选的判断是否需要重试的函数，默认遇到任何错误都重试
 * @returns 返回方法执行的结果
 */
export const withRetry = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 4,
  retryDelay: number = 2000,
  shouldRetry?: (error: any) => boolean
): Promise<T> => {
  let lastError = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const result = await fn();
      return result;
    } catch (error) {
      lastError = error;
      
      // 如果提供了shouldRetry函数，并且返回false，则不再重试
      if (shouldRetry && !shouldRetry(error)) {
        throw error;
      }
      
      console.warn(`方法执行失败，第 ${attempt + 1} 次尝试:`, error);
      // toast.warning(`Method execution failed, attempt ${attempt + 1}`);
      
      if (attempt < maxRetries - 1) {
        console.log(`等待 ${retryDelay}ms 后重试...`);
        await delay_s(retryDelay);
      }
    }
  }

  toast.error(`Method execution failed, attempt ${maxRetries} times`);
  
  console.error(`方法执行失败，已重试 ${maxRetries} 次:`, lastError);
  throw lastError;
};

// 