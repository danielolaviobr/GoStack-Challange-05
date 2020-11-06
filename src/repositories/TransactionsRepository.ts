import { EntityRepository, Repository } from 'typeorm';

import Transaction from '../models/Transaction';

interface Balance {
  income: number;
  outcome: number;
  total: number;
}

@EntityRepository(Transaction)
class TransactionsRepository extends Repository<Transaction> {
  public async getBalance(): Promise<Balance> {
    const incomeTransactions = await this.find({ where: { type: 'income' } });
    const outcomeTransactions = await this.find({ where: { type: 'outcome' } });

    const incomeTransactionsValue = incomeTransactions.map(transaction =>
      Number(transaction.value),
    );
    const outcomeTransactionsValue = outcomeTransactions.map(transaction =>
      Number(transaction.value),
    );

    const income: number = incomeTransactionsValue.reduce(
      (sum, incomeValue) => sum + incomeValue,
      0,
    );
    const outcome: number = outcomeTransactionsValue.reduce(
      (sum: number, outcomeValue: number) => sum + outcomeValue,
      0,
    );

    const balance: Balance = {
      income,
      outcome,
      total: income - outcome,
    };

    return balance;
  }
}

export default TransactionsRepository;
