import { apiContribute, apiPrepareContribute, apiPrepareTriggerStorm, apiTriggerStorm } from './api';

const CONTRACT_ID =
  import.meta.env.VITE_SOROBAN_CONTRACT_ID ||
  '';

export async function invokeContribute({
  user,
  identifier,
  walletAddress,
  amount,
  groupId,
  groupName,
  signedTxXdr,
  networkPassphrase,
  contractId,
  contractMethod,
  nonce,
}) {
  return apiContribute({
    user,
    identifier,
    walletAddress,
    amount,
    groupId,
    groupName,
    nonce,
    signedTxXdr,
    contractCall: {
      contractId: contractId || CONTRACT_ID,
      method: contractMethod || 'contribute',
      args: [user, groupId, amount],
      networkPassphrase,
    },
  });
}

export async function prepareContributeInvocation({ user, identifier, walletAddress, amount, groupId, groupName, contractId }) {
  return apiPrepareContribute({
    user,
    identifier,
    walletAddress,
    amount,
    groupId,
    groupName,
    contractCall: {
      contractId: contractId || CONTRACT_ID,
      method: 'contribute',
      args: [user, groupId, amount],
    },
  });
}

export async function invokeTriggerStorm({
  admin,
  walletAddress,
  groupId,
  groupName,
  signedTxXdr,
  networkPassphrase,
  contractId,
  contractMethod,
  nonce,
}) {
  return apiTriggerStorm({
    admin,
    walletAddress,
    groupId,
    groupName,
    nonce,
    signedTxXdr,
    contractCall: {
      contractId: contractId || CONTRACT_ID,
      method: contractMethod || 'trigger_storm',
      followUpMethod: 'distribute',
      args: [groupId],
      networkPassphrase,
    },
  });
}

export async function prepareTriggerStormInvocation({ admin, walletAddress, groupId, groupName, contractId }) {
  return apiPrepareTriggerStorm({
    admin,
    walletAddress,
    groupId,
    groupName,
    contractCall: {
      contractId: contractId || CONTRACT_ID,
      method: 'trigger_storm',
      args: [groupId],
    },
  });
}
