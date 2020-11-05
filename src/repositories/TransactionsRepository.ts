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

    const incomeTransactionsValue = incomeTransactions.map(
      transaction => transaction.value,
    );
    const outcomeTransactionsValue = outcomeTransactions.map(
      transaction => transaction.value,
    );

    const income = incomeTransactionsValue.reduce(
      (sum, incomeValue) => sum + incomeValue,
    );
    const outcome = outcomeTransactionsValue.reduce(
      (sum, outcomeValue) => sum + outcomeValue,
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
