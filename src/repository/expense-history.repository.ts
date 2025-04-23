import type { Id } from "../lib/types.ts";
import ExpenseHistory from "../models/expense-history";
import Expense from "../models/expense.ts";

export async function createExpenseHistory(expenseId: Id) {
  const history = await ExpenseHistory.create({ expense: expenseId });
  await Expense.findByIdAndUpdate(expenseId, {
    $addToSet: { history: [history.id] },
  });
}

export async function manageExpenseHistory(id: Id) {
  const expense = await Expense.findById(id).lean();
  if (!expense?.dueDate || !expense.recurrenceDuration) return;

  await ExpenseHistory.findOneAndUpdate(
    { expense: id, endDate: null },
    {
      participants: expense.participants,
      totalAmount: expense.totalAmount,
      endDate: expense.dueDate,
    }
  );

  const participants = expense.participants.map((p) => ({
    user: p.user,
    allocationType: p.allocationType,
    amount: p.amount,
  }));

  await Expense.findByIdAndUpdate(id, {
    dueDate: new Date(expense.dueDate.valueOf() + expense.recurrenceDuration),
    $set: {
      participants,
    },
  });
}

