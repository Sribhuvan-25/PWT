import { MemberBalance, SettleUpTransaction } from '@/types';

/**
 * Calculate optimal settle-up transactions using greedy algorithm
 * Minimizes the number of transactions needed to settle all debts
 */
export function calculateSettleUpTransactions(
  balances: MemberBalance[]
): SettleUpTransaction[] {
  const balancesCopy = balances.map((b) => ({
    ...b,
    totalCents: b.totalCents,
  }));

  const creditors = balancesCopy
    .filter((b) => b.totalCents > 0)
    .sort((a, b) => b.totalCents - a.totalCents);

  const debtors = balancesCopy
    .filter((b) => b.totalCents < 0)
    .sort((a, b) => a.totalCents - b.totalCents);

  const transactions: SettleUpTransaction[] = [];

  let i = 0; // creditor index
  let j = 0; // debtor index

  while (i < creditors.length && j < debtors.length) {
    const creditor = creditors[i];
    const debtor = debtors[j];

    const debtAmount = Math.abs(debtor.totalCents);

    const creditAmount = creditor.totalCents;

    const transactionAmount = Math.min(debtAmount, creditAmount);

    transactions.push({
      fromMemberId: debtor.memberId,
      fromMemberName: debtor.memberName,
      toMemberId: creditor.memberId,
      toMemberName: creditor.memberName,
      amountCents: transactionAmount,
    });

    creditor.totalCents -= transactionAmount;
    debtor.totalCents += transactionAmount;

    if (creditor.totalCents === 0) i++;
    if (debtor.totalCents === 0) j++;
  }

  return transactions;
}

export function formatCents(cents: number): string {
  const dollars = Math.abs(cents) / 100;
  return `$${dollars.toFixed(2)}`;
}

export function formatCentsWithSign(cents: number): string {
  if (cents === 0) return '$0.00';
  const sign = cents > 0 ? '+' : '-';
  return `${sign}${formatCents(cents)}`;
}

export function parseDollarsToCents(dollars: string): number {
  const cleaned = dollars.replace(/[^0-9.-]/g, '');
  const amount = parseFloat(cleaned);
  return Math.round(amount * 100);
}
