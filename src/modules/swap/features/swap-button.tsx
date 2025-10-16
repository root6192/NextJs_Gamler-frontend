/* eslint-disable @typescript-eslint/no-unused-vars */
import { Button, buttonStyles } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip } from '@/components/ui/tooltip';
import { useDebt } from '@/modules/partner-balance/hooks/api/usePaymentStats';
import { useTon } from '@/shared/hooks/api/useTon';
import { useAccount } from '@shared/hooks/api/useAccount';
import { fromNano } from '@ton/core';
import type { SendTransactionRequest } from '@tonconnect/ui-react';
import { useTonAddress, useTonConnectUI } from '@tonconnect/ui-react';
import { useAtom, useAtomValue } from 'jotai';
import { useEffect } from 'react';
import { getDistributionRoute } from '../helpers/helpers';
import { usePavingRoute } from '../hook/api/usePavingRoute';
import { useSwap } from '../hook/api/useSwap';
import { resetSwapRouteAtom, swapRouteAtom } from '../store/swap-route';
import { swapStateAtom } from '../store/swap-store';

export const SwapButton = () => {
  const address = useTonAddress();
  const [tonConnectUI] = useTonConnectUI();

  const { data: account } = useAccount();
  const { data: debt, isLoading: isLoadingDebt } = useDebt(account?.user_id ?? 0);
  const { data: balance } = useTon(address);

  const swapState = useAtomValue(swapStateAtom);
  const [_, setSwapRoute] = useAtom(swapRouteAtom);
  const [, resetSwapRoute] = useAtom(resetSwapRouteAtom);

  const { data: pavingRoute, isSuccess: isSuccessPavingRoute } = usePavingRoute(swapState.send, swapState.receive, swapState.amount);

  const { pathData } = getDistributionRoute(pavingRoute?.paths ?? []);
  const {
    data: cellSwap,
    isSuccess: isSuccessCellSwap,
    isLoading: isLoadingCellSwap,
    isError: isErrorCellSwap,
  } = useSwap(pathData.paths, 0.5, address ?? '');

  const isSendingTon = swapState.send === 'native';
  const isEnoughFunds = isSendingTon ? Number(fromNano(balance?.balance ?? 0)) >= swapState.amount : true;

  const hasDebt = Boolean(debt && debt > 0) && pavingRoute?.output_token.metadata.symbol !== 'GMLR';
  const canSwap = isSuccessCellSwap && cellSwap.transactions.length > 0;
  const showButton = canSwap && !hasDebt && isEnoughFunds;
  const showSkeleton = isLoadingCellSwap || isErrorCellSwap || isLoadingDebt || !address;

  const transaction = async () => {
    if (!canSwap || hasDebt) return;

    const message: SendTransactionRequest = {
      validUntil: Math.floor(Date.now() / 1000) + 60,
      messages: cellSwap.transactions.map((cell) => ({
        address: cell.address,
        amount: cell.value,
        payload: cell.cell,
      })),
    };
    await tonConnectUI.sendTransaction(message);
    resetSwapRoute();
  };

  useEffect(() => {
    if (!isSuccessPavingRoute) return;
    setSwapRoute({
      ...pavingRoute,
    });
  }, [isSuccessPavingRoute, pavingRoute, setSwapRoute]);

  return (
    <>
      {showButton && (
        <Button intent='primary' onClick={transaction} className='h-9 w-full' size='sm'>
          Обменять
        </Button>
      )}

      {hasDebt && (
        <Tooltip>
          <Tooltip.Trigger
            className={buttonStyles({
              className: 'h-9',
              isDisabled: true,
              intent: 'outline',
            })}>
            Вывести
          </Tooltip.Trigger>
          <Tooltip.Content>
            <p className='text-muted-fg mt-1 max-w-2xs text-sm text-pretty'>
              Вы пока не можете выводить гамлеры так как у вас есть задолженность.
            </p>
          </Tooltip.Content>
        </Tooltip>
      )}

      {showSkeleton && <Skeleton className='h-9 w-full' />}
      {!isEnoughFunds && (
        <Button intent='outline' isDisabled className='h-9 w-full' size='sm'>
          Недостаточно средств
        </Button>
      )}
    </>
  );
};
