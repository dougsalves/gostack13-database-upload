import { getCustomRepository, getRepository } from 'typeorm';
import AppError from '../errors/AppError';

import Transaction from '../models/Transaction';
import Category from '../models/Category';

import TransactionRepository from '../repositories/TransactionsRepository';

interface Request {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}

class CreateTransactionService {
  // Retorna o uuid da categoria informada
  private async getCategoryId(categoryName: string): Promise<string> {
    const category = getRepository(Category);
    let category_id = '';

    const chekCategoryExists = await category.findOne({
      where: { title: categoryName },
    });

    if (!chekCategoryExists) {
      const newCategory = category.create({
        title: categoryName,
      });

      await category.save(newCategory);

      category_id = newCategory.id;
    } else {
      category_id = chekCategoryExists.id;
    }
    return category_id;
  }

  // Cria os dados da transação em si
  public async execute({
    title,
    category,
    type,
    value,
  }: Request): Promise<Transaction> {
    const transactionRepository = getCustomRepository(TransactionRepository);

    const { total } = await transactionRepository.getBalance();

    if (type === 'outcome' && total < value) {
      throw new AppError('Value for this transaction exceed your balance');
    }

    const category_id = await this.getCategoryId(category);

    const transaction = transactionRepository.create({
      title,
      value,
      type,
      category_id,
    });

    await transactionRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
