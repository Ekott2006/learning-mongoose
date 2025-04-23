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
  recurrenceDuration: { type: Number },
  history: [{ type: Schema.Types.ObjectId, ref: "ExpenseHistory" }],
});
const Expense = model("Expense", schema);
export type ExpenseSchema = InferSchemaType<typeof schema>;

export default Expense;
