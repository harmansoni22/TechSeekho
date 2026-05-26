import { api } from "@/lib/api";

export async function getAllProducts() {
    return api("/products");
}

export async function getProductBySlug(slug) {
    return api(`/products/${slug}`);
}
