import {connect, set, Types} from "mongoose";
import User from "./models/user.ts";
import {createUser} from "./repository/user.repository.ts";
import {faker} from "@faker-js/faker";

await connect("mongodb://127.0.0.1:27017/learning-mongoose");
set('debug', true);

await User.deleteMany();

const user = await createUser({
  username: faker.internet.username(),
  email: faker.internet.email(),
  password: faker.internet.password(),
});
// If you
const updatedUser1  = await User.updateOne({_id: new Types.ObjectId()}, {username: "Ekott2006"})
console.log(updatedUser1, updatedUser1.modifiedCount === 1)

const updatedUser2  = await User.findOneAndUpdate({_id: user.id}, {username: "Ekott2007"}, {new: true})
console.log(updatedUser2)