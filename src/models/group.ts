import { model, Schema, type InferSchemaType } from "mongoose";
import { nanoid } from "nanoid";

const schema = new Schema({
  name: { type: String, required: true },
  creator: { type: Schema.Types.ObjectId, required: true, ref: "User" },
  participants: [{ type: Schema.Types.ObjectId, ref: "User" }],
  inviteCode: { type: String, default: () => nanoid(), required: true },
  expenses: [{ type: Schema.Types.ObjectId, ref: "Expense" }],
  topics: [{ type: Schema.Types.ObjectId, ref: "Topic" }],
});

const Group = model("Group", schema);
export type GroupSchema = InferSchemaType<typeof schema>;

export default Group;
