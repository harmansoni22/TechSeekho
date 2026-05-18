import { PRODUCTS } from "../data/products.data.js";

export async function getAllProducts() {
	return PRODUCTS;
}

export async function getProductBySlug(slug) {
	return PRODUCTS.find((product) => product.slug === slug) ?? null;
}
