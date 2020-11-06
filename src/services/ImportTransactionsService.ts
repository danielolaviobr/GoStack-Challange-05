/* eslint-disable no-restricted-syntax */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-await-in-loop */
import csvParse from 'csv-parse';
import fs from 'fs';
import path from 'path';
import { getCustomRepository, getRepository } from 'typeorm';

import Transaction from '../models/Transaction';
import uploadConfig from '../config/upload';
import CreateTransactionService from './CreateTransactionService';
import Category from '../models/Category';
import TransactionsRepository from '../repositories/TransactionsRepository';
import AppError from '../errors/AppError';

interface Request {
  filename: string;
}

class ImportTransactionsService {
  async execute({ filename }: Request): Promise<Transaction[]> {
    const transactionsData: any[] = [];
    const createTransaction = new CreateTransactionService();

    let lines;

    const transactions: Transaction[] = [];

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
      // const [title, type, value, category] = dataRow;
      // transactionsData.push(dataRow);
      transactionsData.push(dataRow);
    });

    await new Promise(resolve => {
      parseCSV.on('end', resolve);
    });

    for (const data of transactionsData) {
      const [title, type, value, category] = data;

      await createTransaction.execute({
        title,
        type,
        value,
        category,
      });
    }

    return transactionsData;

    // let resolverdTransaction: Transaction[];

    // const values = new Promise<Transaction[]>((resolve, reject) => {
    //   parseCSV.on('end', async () => {
    //     resolverdTransaction = await Promise.all(
    //       transactionsData.map(async transactionData => {
    //         const [title, type, value, category] = transactionData;
    //         const transactionsFinal = await createTransaction.execute({
    //           title,
    //           value,
    //           type,
    //           category,
    //         });
    //         return transactionsFinal;
    //       }),
    //     );
    //     resolve(resolverdTransaction);
    //   });
    // });

    // await values;
    // console.log(values);
    // return values;
  }
}

export default ImportTransactionsService;
