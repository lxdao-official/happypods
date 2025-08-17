import dayjs from "dayjs";
import { PLATFORM_CHAINS } from "./config";
import { optimism } from "viem/chains";
import type Decimal from "decimal.js";
import { formatUnits } from "viem";

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

// dayjs时间格式为指定格式
export const formatDate = (date: string|Date, format: string = 'MMM DD, YYYY') => {
  return dayjs(date).format(format);
};

// 定一个promise的延迟函数
export const delay_s = (ms: number=300) => new Promise((resolve) => setTimeout(resolve, ms));

// 解析传入的 safe 交易 hash, 并验证是否合法
export const parseSafeTransactionHash = async(hash: string, {from,to,amount}:{from:string,to:string,amount:string}) => {
  const safeTransaction = await PLATFORM_CHAINS[optimism.id]?.safeApiKit.getTransaction(hash);
  if(
    safeTransaction && 
    safeTransaction.dataDecoded?.method === 'transfer' && 
    safeTransaction.to.toLocaleLowerCase()===PLATFORM_CHAINS[optimism.id]?.TOKENS.USDT.address.toLocaleLowerCase() &&
    safeTransaction.dataDecoded.parameters[1] &&
    safeTransaction.dataDecoded.parameters[0]
  ){
    const result = {
      from: safeTransaction.safe,
      to: safeTransaction.dataDecoded.parameters[0].value,
      amount: safeTransaction.dataDecoded.parameters[1].value,
      hash: safeTransaction.safeTxHash
    }
    if(
      result.from.toLocaleLowerCase()===from.toLocaleLowerCase() &&
      result.to.toLocaleLowerCase()===to.toLocaleLowerCase() &&
      Number(result.amount)===Number(amount)
    ){
      return result;
    }else{
      throw new Error("Transaction data does not match!");
    }
  }else{
    throw new Error("Invalid TransactionHash");
  }
};

// 数字格式化
export function toFixed(
  value: number | string,
  fixed: number = 6,
  type: 'floor' | 'round' = 'floor',
  localFormat: boolean = true
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
export const formatToken = (amount: string|number|BigInt|Decimal, decimals: number = 6) => {
  try {
    if(!amount) return '0';
    amount = formatUnits(BigInt(Number(amount)), decimals);
    return toFixed(Number(amount), decimals, 'round', true);
  } catch (error) {
    return '0';
  }
}