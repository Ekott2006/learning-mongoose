import { Types } from "mongoose";
import { z } from "zod";
import { ZodObjectId } from "../lib/utils";
import Expense from "../models/expense";
import Group from "../models/group";
import ParticipantDetail from "../models/participant-detail";
import Topic from "../models/topic";

export const insertParticipantDetailSchema = z.object({
  userId: ZodObjectId,
  allocationType: z.enum(["equal", "percentage", "fixed-value"]),
  amount: z.number().min(0),
  paidAt: z.date().optional()
});
const insertExpenseSchema = z.object({
  name: z.string().min(3),
  groupId: ZodObjectId,
  topicId: ZodObjectId.optional(),
  creatorId: ZodObjectId,
  totalAmount: z.number().positive(),
  dueDate: z.date().optional(),
  recurrence: z.object({
    duration: z.number(),
    startDate: z.date()
  }).optional()
});
type InsertExpense = z.infer<typeof insertExpenseSchema>;
type InsertParticipantDetail = z.infer<typeof insertParticipantDetailSchema>;

export async function createExpense(data: InsertExpense) {
  const group = await Expense.findOne({ name: data.name, group: data.groupId });
  if (group) return undefined;

  const newGroup = await Expense.create({
    name: data.name,
    creator: data.creatorId,
    topic: data.topicId,
    group: data.groupId,
    participants: [data.creatorId],
    totalAmount: data.totalAmount,
    dueDate: data.dueDate,
    recurrence: data.recurrence
  });
  await Group.findByIdAndUpdate(data.groupId, {
    $addToSet: { expenses: [newGroup.id] },
  });
  await Topic.findByIdAndUpdate(data.topicId, {
    $addToSet: { expenses: [newGroup.id] },
  });
  return newGroup;
}

/**
 * Upsert expense participants, ensuring they belong to the group.
 */
export async function upsertExpenseParticipants(
  expenseId: Types.ObjectId,
  groupId: Types.ObjectId,
  data: InsertParticipantDetail[]
) {
  if (!data.length) return true

  const userIds = data.map(p => p.userId);

  // DB-level check to make sure ALL users are part of the group
  const group = await Group.findOne({

    _id: groupId,
    participants: { $all: userIds },
    expenses: {$ }
  }).select('_id');

  if (!group) return false

  // All are valid → bulk upsert
  const bulkOps = data.map(({ userId, allocationType, amount, paidAt }) => ({
    updateOne: {
      filter: { user: userId, expense: expenseId },
      update: {
        $set: { allocationType, amount, paidAt, expense: expenseId, user: userId },
      },
      upsert: true,
    }
  }));

  const result = await ParticipantDetail.bulkWrite(bulkOps);
  await Expense.findByIdAndUpdate(expenseId, {$addToSet: {participants: Object.values(result.upsertedIds)}})
  return true
}
