import { model, Schema, type InferSchemaType } from "mongoose";

const schema = new Schema({
  name: { type: String, required: true },
  group: { type: Schema.Types.ObjectId, ref: "Group" },
  topic: { type: Schema.Types.ObjectId, ref: "Topic" },
  creator: { type: Schema.Types.ObjectId, required: true, ref: "User" },
  totalAmount: { type: Number, required: true },
  dueDate: Date,
  participants: [
    {
      user: { type: Schema.Types.ObjectId, required: true, ref: "User" },
      allocationType: { type: String, required: true },
      amount: { type: Number, required: true },
      paidAt: Date,
    },
  ],
  recurrence: {
    type: new Schema(
      {
        duration: { type: Number, required: true },
        startDate: { type: Date, required: true },
      },
      { _id: false }
    ),
    required: false,
  },
});
const Expense = model("Expense", schema);
export type ExpenseSchema = InferSchemaType<typeof schema>;

export default Expense;
