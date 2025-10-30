import type { Level } from '@/modules/table-statistics/hooks/api/usePaymentOrders';

export const hasEnoughGamler = (gmlr: number, array: Array<Level>): boolean => {
  const totalAmount = array.reduce((sum, level) => {
    return sum + parseFloat(level.amount);
  }, 0);

  return gmlr >= totalAmount;
};
