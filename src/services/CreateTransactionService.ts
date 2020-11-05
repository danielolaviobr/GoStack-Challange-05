import { getRepository } from 'typeorm';
import AppError from '../errors/AppError';
// import AppError from '../errors/AppError';

import Category from '../models/Category';
import Transaction from '../models/Transaction';
import TransactionsRepository from '../repositories/TransactionsRepository';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category,
  }: Request): Promise<Transaction> {
    const transactionsRepository = getRepository(TransactionsRepository);

    let categoryOnDB;

    if (category) {
      const categoriesRepository = getRepository(Category);
      categoryOnDB = await categoriesRepository.findOne({
        where: { title: category },
      });
      if (!categoryOnDB) {
        categoryOnDB = categoriesRepository.create({ title: category });

        await categoriesRepository.save(categoryOnDB);
      }
    } else {
      throw new AppError('Category field is required', 400);
    }

    const transaction = transactionsRepository.create({
      title,
      value,
      type,
      category_id: categoryOnDB.id,
    });

    await transactionsRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
