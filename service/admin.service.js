import Admin from "../models/admin.model.js";

export async function findOne(query) {
    return await Admin.findOne(query);
}
