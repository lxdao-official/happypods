import { TransactionType } from '@prisma/client';
import { db } from '~/server/db';

let intervalId: NodeJS.Timeout | null = null;

// 生成随机钱包地址
function generateMockAddress(): string {
  return '0x' + Math.random().toString(16).substring(2, 42).padEnd(40, '0');
}

// 生成随机交易哈希
function generateMockTxHash(): string {
  return '0x' + Math.random().toString(16).substring(2, 66).padEnd(64, '0');
}

// 监控任务 - 写入 mock 交易数据
async function monitorTask() {
  try {
    console.log('执行监控任务...', new Date().toISOString());
    
    // 生成 mock 交易数据
    const mockTransaction = {
      type: TransactionType.MILESTONE_PAYMENT,
      amount: Math.floor(Math.random() * 1000) + 100, // 100-1100 的随机金额
      txHash: generateMockTxHash(),
      senderId: Math.floor(Math.random() * 10) + 1, // 1-10 的随机用户ID
      receiverId: Math.floor(Math.random() * 10) + 1, // 1-10 的随机用户ID
      fromAddress: generateMockAddress(),
      toAddress: generateMockAddress(),
      metadata: {
        description: `Mock transaction at ${new Date().toISOString()}`,
        milestoneId: Math.floor(Math.random() * 100) + 1
      }
    };

    // 写入数据库
    const result = await db.transaction.create({
      data: mockTransaction
    });

    console.log('成功写入 mock 交易数据:', {
      id: result.id,
      amount: result.amount,
      txHash: result.txHash.substring(0, 10) + '...'
    });

  } catch (error) {
    console.error('写入 mock 数据时出错:', error);
  }
}

// 启动监控
function startMonitor() {
  if (intervalId) return;
  console.log('启动监控服务...');
  intervalId = setInterval(monitorTask, 5000); // 5秒执行一次
  monitorTask(); // 立即执行一次
}

// 停止监控
function stopMonitor() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    console.log('监控服务已停止');
  }
}

// 服务启动时自动开始
if (typeof window === 'undefined') {
  startMonitor();
}

// 进程退出时停止
if (process.env.NODE_ENV === 'production') {
    // 生产环境才注册退出事件（或打印退出日志）
    process.on('SIGTERM', () => {
      stopMonitor();
      console.log('生产环境：服务器正常退出');
    });
    process.on('SIGINT', () => {
      stopMonitor();
      console.log('生产环境：服务器被中断');
    });
  } else {
    // 开发环境下，仅在真正退出时打印（可选）
    process.on('SIGTERM', () => {
      stopMonitor();
      console.log('开发环境：服务器重启中...');
    });
    process.on('SIGINT', () => {
      stopMonitor();
      console.log('开发环境：手动终止服务器');
    });
  }
  
  