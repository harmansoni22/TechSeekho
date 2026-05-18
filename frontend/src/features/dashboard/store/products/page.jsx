"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { StoreGridSkeleton } from "../../components/skeletons/DashboardSkeletons";
import { MOCK_PRODUCTS } from "./products.mock";
import { getAllProducts } from "./products.service";

function formatPrice(amount, currency = "INR") {
	return new Intl.NumberFormat("en-IN", {
		style: "currency",
		currency,
		maximumFractionDigits: 0,
	}).format(amount);
}

export default function ProductsStorePage() {
	const [products, setProducts] = useState([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isUsingMockData, setIsUsingMockData] = useState(false);

	useEffect(() => {
		let isMounted = true;

		async function loadProducts() {
			try {
				const data = await getAllProducts();
				if (!isMounted) return;
				setProducts(Array.isArray(data) ? data : []);
				setIsUsingMockData(false);
			} catch (_error) {
				if (!isMounted) return;
				setProducts(MOCK_PRODUCTS);
				setIsUsingMockData(true);
			} finally {
				if (isMounted) setIsLoading(false);
			}
		}

		loadProducts();
		return () => {
			isMounted = false;
		};
	}, []);

	const visibleProducts = useMemo(() => products ?? [], [products]);

	return (
		<div className="space-y-6 p-6 md:p-8" style={{ color: "var(--dashboard-fg)" }}>
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-semibold" style={{ color: "var(--dashboard-fg)" }}>
						Products
					</h1>
					<p className="mt-2 text-sm" style={{ color: "var(--dashboard-muted)" }}>
						Product catalog fetched from backend.
					</p>
				</div>
				{isUsingMockData && (
					<span
						className="rounded-full border px-3 py-1 text-xs"
						style={{
							borderColor: "var(--dashboard-border)",
							backgroundColor:
								"color-mix(in srgb, var(--dashboard-surface) 78%, var(--dashboard-primary) 22%)",
							color: "var(--dashboard-fg)",
						}}
					>
						Showing mock data
					</span>
				)}
			</div>

			{isLoading ? (
				<StoreGridSkeleton />
			) : (
				<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
					{visibleProducts.map((product) => (
						<Link
							key={product.id}
							href={`/dashboard/store/products/product/${product.slug}`}
							className="overflow-hidden rounded-2xl border transition"
							style={{
								borderColor: "var(--dashboard-border)",
								backgroundColor:
									"color-mix(in srgb, var(--dashboard-surface) 94%, var(--dashboard-primary) 6%)",
							}}
						>
							<img
								src={product.image}
								alt={product.name}
								className="h-44 w-full object-cover"
							/>
							<div className="space-y-2 p-4">
								<p
									className="text-xs uppercase tracking-wide"
									style={{ color: "var(--dashboard-primary)" }}
								>
									{product.category}
								</p>
								<h2 className="text-lg font-semibold" style={{ color: "var(--dashboard-fg)" }}>
									{product.name}
								</h2>
								<p className="line-clamp-2 text-sm" style={{ color: "var(--dashboard-muted)" }}>
									{product.shortDescription}
								</p>
								<div className="flex items-center justify-between pt-1">
									<span className="font-semibold" style={{ color: "var(--dashboard-fg)" }}>
										{formatPrice(product.price, product.currency)}
									</span>
									<span
										className="text-xs"
										style={{
											color: product.inStock
												? "var(--dashboard-primary)"
												: "var(--dashboard-muted)",
										}}
									>
										{product.inStock ? "In stock" : "Out of stock"}
									</span>
								</div>
							</div>
						</Link>
					))}
				</div>
			)}
		</div>
	);
}
