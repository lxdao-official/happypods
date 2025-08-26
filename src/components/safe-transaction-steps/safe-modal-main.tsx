import { SafeTransactionModal } from "./safe-transaction-modal";
import useStore from '~/store';

// 整体重载，比较冲突情况
const SafeModalMain = () => {
    const { 
        safeTransactionHandler
    } = useStore();
    
  return (
    safeTransactionHandler && <SafeTransactionModal/>
  );
};

export default SafeModalMain;