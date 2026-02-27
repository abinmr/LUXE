import mongoose from "mongoose";

const AdminModel = new mongoose.Schema({
    email: {
        type: String,
        unique: true,
        required: [true, "Email is required"],
    },
    password: {
        type: String,
        required: [true, "Password is required"],
    },
});

export default mongoose.model("Admin", AdminModel);
