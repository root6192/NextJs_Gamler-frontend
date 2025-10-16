import { Skeleton } from '@/components/ui/skeleton';
import { useTon } from '@/shared/hooks/api/useTon';
import { Button } from '@components/ui/button';
import { useAccount } from '@shared/hooks/api/useAccount';
import { useTonAddress } from '@tonconnect/ui-react';
import { toast } from 'sonner';
import { usePay } from '../../table-statistics/hooks/api/usePay';
import { usePayAllOrders } from '../../table-statistics/hooks/api/usePayOrder';
import { usePaymentOrder } from '../../table-statistics/hooks/api/usePaymentOrders';
import { hasEnoughForComission } from '../helpers/calc-comission';

export const PayAllOrdersBtn = () => {
  const { data: account } = useAccount();
  const address = useTonAddress();
  const { data: userTonBalance } = useTon(address);
  const {
    data: paymentOrders,
    isLoading: isLoadingPaymentOrders,
    isError: isErrorPaymentOrders,
    isSuccess: isSuccessPaymentOrders,
  } = usePaymentOrder(account?.user_id ?? 0);

  const debt_arr = paymentOrders
    ? paymentOrders.map((order) => ({
        amount: Number(order.total_amount),
        reffererId: order.referrer_id,
      }))
    : [];

  const { mutateAsync: createCell, isPending: isPendingPayAllOrders, isSuccess: isSuccessPayAllOrders } = usePayAllOrders();

  const { payAllOrders } = usePay(account?.user_id ?? 0);

  const isBalanceSufficient = hasEnoughForComission(Number(userTonBalance?.balance ?? 0), debt_arr.length);
  const handlePayAllOrders = () => (isBalanceSufficient ? payAllOrders(createCell, debt_arr) : toast('Недостаточно средств'));

  const isNullDebt = debt_arr.length > 0;
  return (
    <>
      {isSuccessPaymentOrders && isNullDebt && (
        <Button intent='primary' onClick={handlePayAllOrders}>
          {isPendingPayAllOrders ? 'Ожидание...' : isSuccessPayAllOrders ? 'Выполнено' : 'Погасить'}
        </Button>
      )}
      {isSuccessPaymentOrders && !isNullDebt && (
        <Button intent='primary' isDisabled>
          Погашено
        </Button>
      )}
      {(isLoadingPaymentOrders || isErrorPaymentOrders) && <Skeleton className='h-9 w-[100px]' />}
    </>
  );
};
