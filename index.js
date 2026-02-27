import express from "express";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import dotevn from "dotenv";
import adminRouter from "./routes/admin.route.js";
import { connectDB } from "./lib/db.js";

dotevn.config({ quiet: true });

const app = express();
const PORT = process.env.PORT || 3000;

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(express.static("public"));

app.use("/api/admin", adminRouter);

app.use((req, res, next) => {
    res.locals.currentPage = req.path.split("/")[1];
    next();
});

app.listen(PORT, () => {
    console.log(`Server running at port ${PORT}`);
    connectDB();
});
