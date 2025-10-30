const NETWORK_BASE_FEE = 0.05;
const SERVICE_FEE = 0.2;
const SMART_CONTRACT_FEE_PER_ITER = 0.5;
const MIN_STORAGE_FEE = 0.01;
const GAS_CONSUMPTION = 0.03; // 2 * 0.015

export const hasEnoughForComission = (tons: number, iter: number = 1): boolean => {
  const totalCommission = calcComission(iter);
  return tons >= totalCommission;
};

export const calcComission = (iter: number = 1): number => {
  const baseFees = NETWORK_BASE_FEE + SERVICE_FEE + MIN_STORAGE_FEE + GAS_CONSUMPTION;
  const smartContractFees = SMART_CONTRACT_FEE_PER_ITER * iter;

  return baseFees + smartContractFees;
};
