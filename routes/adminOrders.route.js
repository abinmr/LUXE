import express from "express";

const router = express.Router();

router.get("/details", (req, res) => {
    return res.render("orderProcessing");
});

export default router;
