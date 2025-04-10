import { model, Schema, type InferSchemaType } from "mongoose";

const schema = new Schema({
  username: { type: String, required: true, unique: true, minlength: 3 },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, minlength: 6 },
  groups: [{type: Schema.Types.ObjectId, ref: "Group"}]
});

const User = model("User", schema)
export type UserSchema = InferSchemaType<typeof schema>;

export default User
