import { fromNano } from '@ton/core';

const MIN_TONS_FOR_STORAGE = 20000000;
const TONS_FOR_COMMISSION = 50000000;

export const hasEnoughForComission = (tons: number, iter: number) => tons >= MIN_TONS_FOR_STORAGE + TONS_FOR_COMMISSION * iter;
export const calcComission = (iter: number) => Number(fromNano(MIN_TONS_FOR_STORAGE)) + Number(fromNano(TONS_FOR_COMMISSION)) * iter;
