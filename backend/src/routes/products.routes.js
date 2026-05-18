import { Router } from "express";
import {
	getProduct,
	listProducts,
} from "../controllers/products.controller.js";

const router = Router();

router.get("/", (req, res, next) => listProducts(req, res).catch(next));
router.get("/:slug", (req, res, next) =>
	getProduct(req, res, next).catch(next),
);

export default router;
