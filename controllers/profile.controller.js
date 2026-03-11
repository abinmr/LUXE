import bcrypt from "bcrypt";
import User from "../models/user.model.js";
import Address from "../models/address.model.js";

export const getProfile = async (req, res) => {
    try {
        const currentSection = req.query.section || "profile";
        let addresses = [];
        if (currentSection === "address") {
            addresses = await Address.find({ user: req.user._id });
        }
        res.render("profile", { section: currentSection, addresses: addresses });
    } catch (err) {
        console.error("Error rendering profile.", err);
        return res.redirect("/profile?section=address");
    }
};

export const changePassword = async (req, res) => {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    if (newPassword !== confirmPassword) {
        return res.redirect("/profile?section=password");
    }
    try {
        const user = await User.findOne({ _id: req.user._id });
        console.log("User: ", user);
        if (user) {
            const match = await bcrypt.compare(currentPassword, user.password);
            if (!match) {
                console.log("Password is wrong");
                return res.redirect("/profile?section=password");
            }

            const newHashPassword = await bcrypt.hash(newPassword, 10);
            const updateResult = await User.findByIdAndUpdate(req.user._id, { password: newHashPassword });
            console.log("user: ", req.user);
            console.log("update success:", updateResult);
            return res.redirect("/profile?section=password");
        } else {
            return res.redirect("/profile?section=password?error=NoUser");
        }
    } catch (err) {
        console.error("Error in changing password", err);
        return res.redirect("/profile?section=password");
    }
};

export const updateProfile = async (req, res) => {
    try {
        for (let key in req.body) {
            if (typeof req.body[key] === "string") req.body[key] = req.body[key].trim();
        }

        const { fullname, email, phone } = req.body;

        const updateDetails = await User.updateOne({ _id: req.user._id }, { fullname: fullname, email: email, phone: phone });
        console.log(updateDetails);

        return res.redirect("/profile?section=profile");
    } catch (err) {
        console.err("Error updating user profile:", err);
    }
};

export const addAddress = async (req, res) => {
    try {
        for (let key in req.body) {
            if (typeof req.body[key] === "string") req.body[key] = req.body[key].trim();
        }
        const { fullName, phone, pincode, house, street, city, state, isDefault } = req.body;

        const makeDefault = isDefault === "on" || isDefault === "true";

        if (makeDefault) {
            await Address.updateMany({ user: req.user._id }, { isDefault: false });
        }

        const newAddress = await Address.create({
            user: req.user._id,
            fullName: fullName,
            phone: phone,
            pincode: pincode,
            houseNumber: house,
            street: street,
            city: city,
            state: state,
            isDefault: isDefault === "on" ? true : false,
        });

        await newAddress.save();

        res.redirect("/profile?section=address");
    } catch (err) {
        console.error("Error saving address:", err);
        return res.redirect("/profile?section=address");
    }
};

export const editAddress = async (req, res) => {
    const addressId = req.params.id;
    try {
        for (let key in req.body) {
            if (typeof req.body[key] === "string") req.body[key] = req.body[key].trim();
        }
        const { fullName, phone, pincode, house, street, city, state, isDefault } = req.body;

        const makeDefault = isDefault === "on" || isDefault === "true";

        if (makeDefault) {
            await Address.updateMany({ user: req.user._id }, { isDefault: false });
        }

        const updateResult = await Address.findByIdAndUpdate(addressId, {
            fullName: fullName,
            phone: phone,
            pincode: pincode,
            houseNumber: house,
            street: street,
            city: city,
            isDefault: makeDefault,
        });
        return res.redirect("/profile?section=address");
    } catch (err) {
        console.error("Error updating address:", err);
        return res.redirect("/profile?section=address");
    }
};

export const deleteAddress = async (req, res) => {
    try {
        const addressId = req.params.id;
        const deleteResult = await Address.deleteOne({ _id: addressId });
        console.log(deleteResult);
        return res.redirect("/profile?section=address", { success: true });
    } catch (err) {
        console.error("Address delete error", err);
        return res.redirect("/profile?section=address");
    }
};

export const logout = (req, res) => {
    res.clearCookie("token", { httpOnly: true });
    return res.redirect("/home");
};
