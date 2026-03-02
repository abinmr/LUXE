import express from "express";

const userRouter = express.Router();

userRouter.get("/register", (req, res) => {
    res.render("register");
});

export default userRouter;
