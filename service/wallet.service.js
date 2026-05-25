import Wallet from "../models/wallet.model.js";
import WalletTransaction from "../models/walletTransation.model.js";

/** @typedef {import("mongoose").ObjectId} ObjectId */
/** @typedef {import('../types.d.ts').WalletTransaction} WalletTransaction 

/**
 * @param {ObjectId} userId -
 */
export async function getUserWallet(userId) {
    let userWallet = Wallet.findOne({ userId: userId });
    if (!userWallet) {
        userWallet = Wallet.create({ userId: userId, balance: 0 });
    }

    return userWallet;
}

/**
 * @param {WalletTransaction} query -
 */
export async function getWalletTransactions(query) {
    return await WalletTransaction.find(query).populate("referenceId").sort({ createdAt: -1 });
}

/**
 * @param {Partial<WalletTransaction>} data -
 * @returns {Promise<WalletTransaction>}
 */
export async function createWalletTransaction(data) {
    return await WalletTransaction.create(data);
}
