/**
 * 全局配置文件
 */

// 手续费相关配置
export const FEE_CONFIG = {
  // 手续费率 (10%)
  TRANSACTION_FEE_RATE: 0.01,
  // 最小手续费 (以防总额太小)
  MIN_TRANSACTION_FEE: 1,
} as const;


export type Status = 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED' | 'WAITLISTED' | 'SUBMITTED' | 'APPROVED' | 'REVIEWING' | 'TERMINATED' | 'PENDING_DELIVERY' | 'ACTIVE' | 'INACTIVE';

// @ts-ignore
export const STATUS_MAP: Record<Status, {label: string, color: string}> = {
  // Pod 状态
  'REVIEWING': {label: 'Reviewing', color: '#FFA500'},
  'APPROVED': {label: 'Approved', color: '#008000'},            
  'REJECTED': {label: 'Rejected', color: '#FF0000'},
  'IN_PROGRESS': {label: 'In Progress', color: '#008000'},
  'COMPLETED': {label: 'Completed', color: '#008000'},
  'TERMINATED': {label: 'Terminated', color: '#FF0000'},
  
  // Milestone 状态
  'ACTIVE': {label: 'Active', color: '#315ece'},
  'INACTIVE': {label: 'Inactive', color: '#FFA500'},
  
  // 自定义状态
  "PENDING_DELIVERY": {label: 'Delivery Pending', color: '#FF6B35'},
};  

// 其他配置
export const APP_CONFIG = {
  // 默认分页大小
  DEFAULT_PAGE_SIZE: 20,
  // 最大分页大小
  MAX_PAGE_SIZE: 100,
} as const;