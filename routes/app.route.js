import express from "express";
import { protectedRoute } from "../middlewares/user.auth.middleware.js";

const router = express.Router();

router.get("/home", (req, res) => {
    res.render("home");
});

export default router;
