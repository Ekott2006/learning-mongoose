import {type InferSchemaType, model, Schema} from "mongoose";

const schema = new Schema({
    expense: { type: Schema.Types.ObjectId, ref: "Expense", required: true },
    participants: [
        {
            user: { type: Schema.Types.ObjectId, required: true, ref: "User" },
            amount: { type: Number, required: true },
            paidAt: Date,
        },
    ],
    endDate: { type: Date },
    totalAmount: { type: Number },
}, {timestamps: true});
const ExpenseHistory = model("ExpenseHistory", schema);
export type ExpenseHistorySchema = InferSchemaType<typeof schema>;
export default ExpenseHistory;
