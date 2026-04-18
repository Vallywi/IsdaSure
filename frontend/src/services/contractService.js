import { apiContribute, apiGetStatus, apiTriggerStorm } from './api';

export async function getContractStatus() {
  const response = await apiGetStatus();
  return response.status;
}

export async function contributeToPool(payload) {
  const response = await apiContribute(payload);
  return response.status;
}

export async function triggerStormDay(payload) {
  const response = await apiTriggerStorm(payload);
  return response.status;
}