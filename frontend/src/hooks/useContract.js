import { useWallet } from './useWallet';

export function useContract() {
  const { contribute, triggerStorm, poolState, loadingAction } = useWallet();

  return {
    poolState,
    contractBusy: loadingAction === 'contribute' || loadingAction === 'storm',
    contributeToContract: contribute,
    triggerStormOnContract: triggerStorm,
  };
}
