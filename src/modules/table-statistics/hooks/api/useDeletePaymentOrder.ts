import { proxy } from '@/shared/lib/proxy';
import type { UseMutateAsyncFunction } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod/v4';

type DeletePaymentOrderResponse = {
  message: string;
};

type ValidatorOrder = {
  tx_hash: string;
  tx_query_id: number;
  target_address: string;
  payment_order_id?: string;
  status: 'pending';
};

type Options = {
  orderId?: string;
  type: 'all' | 'single';
  array: Array<{
    amount: number;
    reffererId: number;
  }>;
};

const ValidationStatus = z.enum(['pending', 'waiting', 'running', 'success', 'failed']);

const ValidatorOrderSchema = z.object({
  message: z.string(),
  tx_hash: z.string(),
  tx_id: z.string(),
  status: ValidationStatus,
});

type ValidatorOrderResponse = z.infer<typeof ValidatorOrderSchema>;

const UpdateEarningBalanceSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  newBalance: z.number(),
  amount: z.number(),
});

type UpdateEarningBalanceResponse = z.infer<typeof UpdateEarningBalanceSchema>;

const updateEarningBalance = async (userId: number, amount: number) => {
  const balance = await proxy.patch<UpdateEarningBalanceResponse>(
    `/api/web2/referral/user/${userId}/balance`,
    {
      amount: amount,
    },
    {
      schema: UpdateEarningBalanceSchema,
    },
  );
  return balance;
};

type OnClose = () => void;
type DeletePaymentOrderFn = UseMutateAsyncFunction<
  {
    result: {
      message: string;
      tx_hash: string;
      tx_id: string;
      status: 'success' | 'pending' | 'waiting' | 'running' | 'failed';
    };
    options: Options;
  },
  Error,
  [ValidatorOrder, Options],
  unknown
>;

const useDeletePaymentOrder = (authorId: number, onClose?: OnClose) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['delete-payment-order', authorId],
    mutationFn: async ([order, options]: [ValidatorOrder, Options]) => {
      await new Promise((resolve) => setTimeout(resolve, 1000)); //1000 * 10 * 6 * 1.5

      console.log('start validation process');
      console.log('order', order);
      const result = await proxy.post<ValidatorOrderResponse>('/api/web3/validation/validate', order, {
        schema: ValidatorOrderSchema,
      });

      return { result, options };
    },
    onSuccess: async ({ result: ValidData, options: { type, orderId, array } }) => {
      console.log('validation process completed');
      console.log('start delete process');
      console.log({ result: ValidData, options: { type, orderId, array } });
      switch (true) {
        case ValidData.status === 'success' && type === 'all':
          array.forEach(async (item) => {
            await updateEarningBalance(item.reffererId, item.amount);
          });
          await proxy.delete<DeletePaymentOrderResponse>('/api/web3/referral/payment-orders/all', {
            params: {
              author_id: authorId,
            },
            schema: z.object({
              message: z.string(),
            }),
          });
          break;
        case ValidData.status === 'success' && type === 'single':
          if (!orderId) throw new Error('Order ID is required');
          await updateEarningBalance(array[0].reffererId, array[0].amount);
          await proxy.delete<DeletePaymentOrderResponse>(`/api/web3/referral/payment-orders`, {
            schema: z.object({
              message: z.string(),
            }),
            params: {
              order_id: orderId,
            },
          });
          break;
        default:
          throw new Error('Invalid delete type');
      }

      onClose?.();
      queryClient.invalidateQueries({ queryKey: ['debt', authorId] });
      queryClient.invalidateQueries({ queryKey: ['payment-orders', authorId] });
    },
  });
};

export { useDeletePaymentOrder };
export type { DeletePaymentOrderFn, Options, ValidatorOrder };

// {
//     "tx_hash": "9763b214b5d8adb1eb8bdf1774c24faa87039daa7f915a8c85692225ac856158",
//     "tx_query_id": 1760611901,
//     "target_address": "UQDU879TifAZNdUt1v60VWNaEXUX3jHgBFR6zfjSMj5TDwcM",
//     "payment_order_id": "68f0c60adc2f40efdabed5a0",
//     "status": "pending"
// }
