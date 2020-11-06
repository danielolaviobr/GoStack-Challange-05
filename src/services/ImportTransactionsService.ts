import csvParse from 'csv-parse';
import fs from 'fs';
import path from 'path';
import { getCustomRepository, getRepository, In } from 'typeorm';

import Transaction from '../models/Transaction';
import uploadConfig from '../config/upload';
import Category from '../models/Category';
import TransactionsRepository from '../repositories/TransactionsRepository';

interface Request {
  filename: string;
}

interface CSVTransaction {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class ImportTransactionsService {
  async execute({ filename }: Request): Promise<Transaction[]> {
    const categories: string[] = [];
    const transactions: CSVTransaction[] = [];

    const csvFileDir = uploadConfig.directory;

    const csvFilePath = path.join(csvFileDir, filename);

    const readCSVStream = fs.createReadStream(csvFilePath);

    const parseCSV = readCSVStream.pipe(
      csvParse({
        from_line: 2,
        ltrim: true,
        rtrim: true,
        delimiter: ',',
      }),
    );

    parseCSV.on('data', async dataRow => {
      const [title, type, value, category] = dataRow.map((cell: string) =>
        cell.trim(),
      );

      if (!title || !value || !type) return;

      categories.push(category);

      transactions.push({ title, value, type, category });
    });

    await new Promise(resolve => parseCSV.on('end', resolve));

    const categoriesRepository = getRepository(Category);

    const existingCategories = await categoriesRepository.find({
      where: { title: In(categories) },
    });

    const existingCategoriesTitles = existingCategories.map(
      category => category.title,
    );

    const categoriesTitlesToAdd = categories
      .filter(category => !existingCategoriesTitles.includes(category))
      .filter((value, index, self) => self.indexOf(value) === index);

    const newCategories = categoriesRepository.create(
      categoriesTitlesToAdd.map(title => ({ title })),
    );

    await categoriesRepository.save(newCategories);

    const transactionsRepository = getCustomRepository(TransactionsRepository);

    const allCategories = [...newCategories, ...existingCategories];

    const newTransactions = transactionsRepository.create(
      transactions.map(transaction => ({
        title: transaction.title,
        type: transaction.type,
        value: transaction.value,
        category: allCategories.find(category => category.title),
      })),
    );

    await transactionsRepository.save(newTransactions);

    return newTransactions;
  }
}

export default ImportTransactionsService;
