import mongoose from "mongoose";

const AddressModel = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },
        fullName: {
            type: String,
            required: true,
        },
        phone: {
            type: Number,
            required: true,
        },
        pincode: {
            type: Number,
            required: true,
        },
        houseNumber: {
            type: String,
            required: true,
        },
        street: {
            type: String,
        },
        city: {
            type: String,
            required: true,
        },
        state: {
            type: String,
            required: true,
        },
        isDefault: {
            type: Boolean,
        },
    },
    {
        timestamps: true,
    },
);

const Address = mongoose.model("Address", AddressModel);

export default Address;
