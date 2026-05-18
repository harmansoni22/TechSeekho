import {
	getAllProducts,
	getProductBySlug,
} from "../services/products.service.js";
import { AppError } from "../utils/appError.js";

export async function listProducts(_req, res) {
	const products = await getAllProducts();
	return res.status(200).json(products);
}

export async function getProduct(req, res, next) {
	const { slug } = req.params;
	const product = await getProductBySlug(slug);

	if (!product) {
		return next(new AppError("Product not found.", 404, "PRODUCT_NOT_FOUND"));
	}

	return res.status(200).json(product);
}
