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

const Admin = mongoose.model("Admin", AdminModel);
export default Admin;
