import express from "express";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import session from "express-session";
import passport from "passport";
import flash from "connect-flash";
import dotevn from "dotenv";
import adminRouter from "./routes/admin.route.js";
import userAuthRouter from "./routes/userAuth.route.js";
import appRouter from "./routes/app.route.js";
import profileRouter from "./routes/profile.route.js";
import cartRouter from "./routes/cart.route.js";
import adminCategoryRouter from "./routes/adminCategory.route.js";
import adminProductRouter from "./routes/adminProduct.route.js";
import adminCustomerRouter from "./routes/adminCustomer.route.js";
import { connectDB } from "./lib/db.js";

dotevn.config({ quiet: true });

const app = express();
const PORT = process.env.PORT || 3000;

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
    }),
);
app.use(express.json());
app.use(cookieParser());
app.use(express.static("public"));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

app.use("/admin", adminRouter);
app.use("/admin/categories", adminCategoryRouter);
app.use("/admin/products", adminProductRouter);
app.use("/admin/customers", adminCustomerRouter);
app.use("/auth", userAuthRouter);
app.use("/", appRouter);
app.use("/profile", profileRouter);
app.use("/cart", cartRouter);

app.use((req, res, next) => {
    res.locals.currentPage = req.path.split("/")[1];
    next();
});

app.listen(PORT, () => {
    console.log(`Server running at port ${PORT}`);
    connectDB();
});
