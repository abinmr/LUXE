import Razorpay from "razorpay";

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_API_KEY_ID,
    key_secret: process.env.RAZORPAY_API_SECRET,
});

const createRazorpayOrder = async (amount) => {
    return await razorpay.orders.create({
        amount: amount * 100,
        currency: "INR",
        receipt: "rcpt_" + Date.now(),
    });
};

export default createRazorpayOrder;
