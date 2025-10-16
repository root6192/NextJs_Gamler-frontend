import { useJettonWallet } from '@hooks/api/useJettonWallet';
import { Address, Cell, toNano } from '@ton/core';
import { CHAIN, useTonAddress, useTonConnectUI, type SendTransactionRequest } from '@tonconnect/ui-react';
import { useAddTransactionHash } from './useAddTransactionHash';
import type { ValidatorOrder } from './useDeletePaymentOrder';
import { useDeletePaymentOrder } from './useDeletePaymentOrder';
import { calcComission } from '@/modules/partner-balance/helpers/calc-comission';

type CreateCellFn<T> = (id: T) => Promise<{ cell: string }>;

type ModalDisclosureControl = {
  onOpen: () => void;
  onClose: () => void;
};

const usePay = (authorId: number, modalDisclosureControl?: ModalDisclosureControl) => {
  const [tonConnectUI] = useTonConnectUI();
  const address = useTonAddress();
  const { data: jettonWallets, isError: isErrorJettonWallet } = useJettonWallet({ address });
  if (isErrorJettonWallet) throw new Error('Error fetching jetton wallet');
  const jettonWallet = jettonWallets?.balances.find((b) => b.jetton.symbol === 'GMLR');
  const { mutate: deleteOrder } = useDeletePaymentOrder(authorId, modalDisclosureControl?.onClose);
  const { mutate: addTransactionHash } = useAddTransactionHash(authorId);

  const payProcess = async (cell: string, commission_count: number) => {
    if (!jettonWallet) return;
    try {
      const validUntil = Date.now() + 300000; // 3 minutes
      const message: SendTransactionRequest = {
        validUntil,
        network: CHAIN.MAINNET,
        messages: [
          {
            address: Address.parse(jettonWallet.wallet_address.address).toString(),
            amount: toNano(commission_count).toString(),
            payload: cell,
          },
        ],
      };
      const { boc } = await tonConnectUI.sendTransaction(message);
      const trHash = Cell.fromBase64(boc).hash().toString('hex');

      console.log(boc, 'boc');
      console.log(trHash, 'trHash');

      if (trHash) modalDisclosureControl?.onOpen();
      return { trHash, validUntil, cell };
    } catch (error) {
      throw new Error((error as Error).message || 'Error sending transaction');
    }
  };

  const payAllOrders = async (createCell: CreateCellFn<number>, array: Array<{ amount: number; reffererId: number }>) => {
    if (!jettonWallet) return;
    const { cell } = await createCell(authorId);
    const trCost = calcComission(array.length);
    const trRes = await payProcess(cell, trCost);
    if (!trRes) return;
    const { trHash, validUntil } = trRes;
    const validData: ValidatorOrder = {
      tx_hash: trHash,
      tx_query_id: validUntil,
      target_address: address,
      status: 'pending',
    };
    deleteOrder([validData, { type: 'all', array }]);
  };

  const payOrder = async (createCell: CreateCellFn<string>, orderId: string, obj: { amount: number; reffererId: number }) => {
    if (!jettonWallet) return;
    const { cell } = await createCell(orderId);

    const trCost = calcComission(1);
    const trRes = await payProcess(cell, trCost);
    console.log(trRes, 'trRes');

    if (!trRes) return;
    const { trHash, validUntil } = trRes;
    const validData: ValidatorOrder = {
      tx_hash: trHash,
      tx_query_id: validUntil,
      target_address: address,
      payment_order_id: orderId,
      status: 'pending',
    };

    console.log(validData, 'validData');

    addTransactionHash({ orderId, trHash });
    deleteOrder([validData, { type: 'single', orderId, array: [obj] }]);
  };

  return { payAllOrders, payOrder };
};

export { usePay };
export type { CreateCellFn };
