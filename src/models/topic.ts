import { model, Schema, type InferSchemaType } from "mongoose";

const schema = new Schema({
  name: { type: String, required: true, minlength: 3 },
  description: { type: String },
  group: { type: Schema.Types.ObjectId, required: true, ref: "Group" },
  creator: { type: Schema.Types.ObjectId, required: true, ref: "User" },
  expenses: [{ type: Schema.Types.ObjectId, ref: "Expense" }],
});

const Topic = model("Topic", schema);
export type TopicSchema = InferSchemaType<typeof schema>;

export default Topic;
