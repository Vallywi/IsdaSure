import { apiContribute, apiPrepareContribute, apiPrepareTriggerStorm, apiTriggerStorm } from './api';

const CONTRACT_ID =
  import.meta.env.VITE_SOROBAN_CONTRACT_ID ||
  '';

export async function invokeContribute({ user, identifier, walletAddress, amount, groupName, signedTxXdr, networkPassphrase, contractId, contractMethod, nonce }) {
  return apiContribute({
    user,
    identifier,
    walletAddress,
    amount,
    groupName,
    nonce,
    signedTxXdr,
    contractCall: {
      contractId: contractId || CONTRACT_ID,
      method: contractMethod || 'contribute',
      args: {
        user,
        amount,
      },
      networkPassphrase,
    },
  });
}

export async function prepareContributeInvocation({ user, identifier, walletAddress, amount, groupName, contractId }) {
  return apiPrepareContribute({
    user,
    identifier,
    walletAddress,
    amount,
    groupName,
    contractCall: {
      contractId: contractId || CONTRACT_ID,
      method: 'contribute',
      args: [user, amount],
    },
  });
}

export async function invokeTriggerStorm({ admin, walletAddress, signedTxXdr, networkPassphrase, contractId, contractMethod, nonce }) {
  return apiTriggerStorm({
    admin,
    walletAddress,
    nonce,
    signedTxXdr,
    contractCall: {
      contractId: contractId || CONTRACT_ID,
      method: contractMethod || 'trigger_storm',
      followUpMethod: 'distribute',
      networkPassphrase,
    },
  });
}

export async function prepareTriggerStormInvocation({ admin, walletAddress, contractId }) {
  return apiPrepareTriggerStorm({
    admin,
    walletAddress,
    contractCall: {
      contractId: contractId || CONTRACT_ID,
      method: 'trigger_storm',
      args: [],
    },
  });
}
