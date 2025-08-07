import { type Prisma } from '@prisma/client';
import { db } from '~/server/db';
import { PLATFORM_TREASURY_ADDRESS, PLATFORM_CHAINS } from '~/lib/config';
import { createPublicClient, http, parseAbiItem, type Log } from 'viem'
import { optimism } from 'viem/chains'

let isMonitoring = false;
let stopRequested = false;
let retryCount = 0; // 全局重试计数器
let lastProcessedBlock: bigint | null = null; // 缓存最后处理的区块号

// 监控配置
const MONITOR_CONFIG = {
  POLL_INTERVAL: 10000, // 10秒轮询间隔
  MAX_RETRIES: 10, // 最大重试次数
  RETRY_DELAY: 5000, // 5秒重试延迟
} as const;

// 创建 viem 公共客户端
const publicClient = createPublicClient({
  chain: optimism,
  // transport: http()
  transport: http(PLATFORM_CHAINS[optimism.id]?.RPCS[0])
});

// USDT Transfer 事件 ABI
const transferEventAbi = parseAbiItem('event Transfer(address indexed from, address indexed to, uint256 value)');

// 延迟函数
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 获取下一个要查询的区块号
async function getNextBlockNumber(): Promise<bigint> {
  // 如果有缓存的区块号，直接使用
  if (lastProcessedBlock !== null) {
    const nextBlock = lastProcessedBlock + 1n;
    console.log(`📊 使用缓存区块号: ${nextBlock}`);
    return nextBlock;
  }

  // 首次启动时从数据库获取
  try {
    const latestTransaction = await db.transaction.findFirst({
      where: {
        metadata: { path: ['chainId'], equals: optimism.id }
      },
      orderBy: { blockNumber: 'desc' },
      select: { blockNumber: true }
    });

    if (latestTransaction) {
      const nextBlock = BigInt(latestTransaction.blockNumber) + 1n;
      console.log(`📊 从数据库最新区块的下一个区块开始: ${nextBlock}`);
      return nextBlock;
    }

    const defaultStartBlock = PLATFORM_CHAINS[optimism.id]?.START_BLOCK_NUMBER || 0n;
    console.log(`📊 数据库无记录，使用默认起始区块号: ${defaultStartBlock}`);
    return defaultStartBlock;
  } catch (error) {
    console.error('❌ 获取下一个区块号时出错:', error);
    return PLATFORM_CHAINS[optimism.id]?.START_BLOCK_NUMBER || 0n;
  }
}

// 写入交易记录到数据库
async function saveTransaction(txData: Prisma.TransactionCreateInput) {
  try {
    await db.transaction.create({ data: txData });
    console.log('✅ 写入交易记录:', txData.txHash);
  } catch (error) {
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      console.log('ℹ️ 交易记录已存在，跳过:', txData.txHash);
    } else {
      console.error('❌ 写入交易记录失败:', error);
      throw error;
    }
  }
}


// 处理 USDT Transfer 事件
async function processUSDTTransfer(log: Log & {args: any}) {
  try {
    const { transactionHash, blockNumber, blockHash, args } = log;
    const { from, to, value } = args as { from: string; to: string; value: bigint };

    if (!transactionHash || !blockNumber) return;

    const block = await publicClient.getBlock({ blockNumber });
    
    console.log(`🔍 USDT 转账: ${from} -> ${to}, ${(Number(value) / 1_000_000).toFixed(6)} USDT`);
    
    const txData: Prisma.TransactionCreateInput = {
      amount: value.toString(),
      txHash: transactionHash,
      fromAddress: from,
      toAddress: to,
      currency: 'USDT',
      blockNumber: Number(blockNumber),
      blockTimestamp: new Date(Number(block.timestamp) * 1000),
      metadata: {
        chainId: optimism.id,
        blockHash: blockHash || '',
        contractAddress: PLATFORM_CHAINS[optimism.id]?.TOKENS.USDT.address,
        direction: to.toLowerCase() === PLATFORM_TREASURY_ADDRESS.toLowerCase() ? 'incoming' : 'outgoing',
        amountInUSDT: (Number(value) / 1_000_000).toString()
      }
    };

    await saveTransaction(txData);
  } catch (error) {
    console.error('❌ 处理转账事件失败:', error);
  }
}

// 监控 USDT 转账到平台国库
async function monitorUSDTTransfers() {
  const fromBlock = await getNextBlockNumber();
  const currentBlock = await publicClient.getBlockNumber();
  
  if (currentBlock <= fromBlock) {
    console.log('ℹ️ 没有新区块需要处理');
    return;
  }

  console.log(`🔍 扫描区块 ${fromBlock} 到 ${currentBlock}`);

  const logs = await publicClient.getLogs({
    address: PLATFORM_CHAINS[optimism.id]?.TOKENS.USDT.address,
    event: transferEventAbi,
    fromBlock,
    toBlock: currentBlock,
    args: { to: PLATFORM_TREASURY_ADDRESS as `0x${string}` }
  });
  
  if (logs.length > 0) {
    console.log(`📦 发现 ${logs.length} 条转账记录`);
    for (const log of logs) {
      await processUSDTTransfer(log);
    }
  }

  // 更新缓存的最后处理区块号
  lastProcessedBlock = currentBlock;
  console.log(`📈 更新缓存区块号为: ${lastProcessedBlock}`);
}

// 监控任务
async function monitorTask(): Promise<void> {
  if (stopRequested) return;

  try {
    const retryInfo = retryCount > 0 ? ` (重试 ${retryCount}/${MONITOR_CONFIG.MAX_RETRIES})` : '';
    console.log(`⏰ 执行监控任务${retryInfo}...`, new Date().toISOString());
    
    await monitorUSDTTransfers();
    
    // 成功后清零重试计数
    if (retryCount > 0) {
      console.log('✅ 重试成功，恢复正常监控');
      retryCount = 0;
    }
    
  } catch (error) {
    retryCount++;
    console.error(`❌ 监控任务执行出错 (第 ${retryCount} 次失败):`, error);
    
    if (retryCount >= MONITOR_CONFIG.MAX_RETRIES) {
      console.error(`❌ 已达到最大重试次数 (${MONITOR_CONFIG.MAX_RETRIES})，停止监控`);
      stopRequested = true;
      return;
    }
  }
  
  // 根据是否重试来决定等待时间
  const waitTime = retryCount > 0 ? MONITOR_CONFIG.RETRY_DELAY : MONITOR_CONFIG.POLL_INTERVAL;
  const waitType = retryCount > 0 ? '重试' : '正常轮询';
  
  console.log(`⏳ 等待 ${waitTime / 1000} 秒后进行${waitType}...`);
  await delay(waitTime);
  
  // 递归调用下一次监控
  return monitorTask();
}

// 启动监控
async function startMonitor() {
  if (isMonitoring) {
    console.log('ℹ️ 监控服务已在运行中');
    return;
  }
  
  isMonitoring = true;
  stopRequested = false;
  retryCount = 0; // 重置重试计数
  lastProcessedBlock = null; // 重置区块缓存，首次启动从数据库获取
  console.log('🚀 启动 USDT 转账监控服务...');
  
  try {
    await monitorTask();
  } catch (error) {
    console.error('❌ 监控服务异常终止:', error);
  } finally {
    isMonitoring = false;
  }
}

// 停止监控
function stopMonitor() {
  if (!isMonitoring) {
    console.log('ℹ️ 监控服务未在运行');
    return;
  }
  
  stopRequested = true;
  console.log('🛑 正在停止监控服务...');
}

// 导出用于测试的函数
// export { startMonitor, stopMonitor, monitorTask };

// 自动启动监控（仅在服务器端）
if (typeof window === 'undefined') {
  startMonitor();
  
  // 注册退出事件
  ['SIGTERM', 'SIGINT'].forEach(signal => {
    process.on(signal, async () => {
      console.log(`🔄 收到 ${signal} 信号，正在优雅关闭...`);
      stopMonitor();
      
      // 等待最多 5 秒让监控任务完成
      let waitCount = 0;
      while (isMonitoring && waitCount < 50) {
        await delay(100);
        waitCount++;
      }
      
      if (isMonitoring) {
        console.log('⚠️ 监控任务未能及时停止，强制退出');
      } else {
        console.log('✅ 监控服务已优雅关闭');
      }
      
      process.exit(0);
    });
  });
}