"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import ErrorScreen from "@/app/components/error/ErrorScreen";
import { MOCK_PRODUCTS } from "../../products.mock";
import { getProductBySlug } from "../../products.service";

function formatPrice(amount, currency = "INR") {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency,
        maximumFractionDigits: 0,
    }).format(amount);
}

function ProductDetailSkeleton() {
    return (
        <div className="space-y-6 p-6 md:p-8">
            <div className="h-4 w-40 animate-pulse rounded bg-[var(--dashboard-surface)]" />
            <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
                <div className="h-[420px] animate-pulse rounded-3xl border bg-[var(--dashboard-surface)] border-[var(--dashboard-border)]" />
                <div className="space-y-4">
                    <div className="h-6 w-24 animate-pulse rounded bg-[var(--dashboard-surface)]" />
                    <div className="h-10 w-3/4 animate-pulse rounded bg-[var(--dashboard-surface)]" />
                    <div className="h-5 w-32 animate-pulse rounded bg-[var(--dashboard-surface)]" />
                    <div className="h-20 w-full animate-pulse rounded bg-[var(--dashboard-surface)]" />
                    <div className="h-10 w-40 animate-pulse rounded bg-[var(--dashboard-surface)]" />
                    <div className="h-24 w-full animate-pulse rounded-2xl bg-[var(--dashboard-surface)]" />
                    <div className="flex gap-3">
                        <div className="h-11 w-36 animate-pulse rounded-xl bg-[var(--dashboard-surface)]" />
                        <div className="h-11 w-36 animate-pulse rounded-xl bg-[var(--dashboard-surface)]" />
                    </div>
                </div>
            </div>
        </div>
    );
}

function InfoPill({ children, tone = "default" }) {
    const styles = {
        default: {
            background:
                "color-mix(in srgb, var(--dashboard-surface) 86%, var(--dashboard-primary) 14%)",
            color: "var(--dashboard-fg)",
            borderColor: "var(--dashboard-border)",
        },
        success: {
            background:
                "color-mix(in srgb, var(--dashboard-primary) 16%, var(--dashboard-surface) 84%)",
            color: "var(--dashboard-primary)",
            borderColor:
                "color-mix(in srgb, var(--dashboard-primary) 30%, var(--dashboard-border) 70%)",
        },
        muted: {
            background: "var(--dashboard-surface)",
            color: "var(--dashboard-muted)",
            borderColor: "var(--dashboard-border)",
        },
    };

    return (
        <span
            className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium"
            style={styles[tone]}
        >
            {children}
        </span>
    );
}

export default function ProductDetailPage() {
    const params = useParams();
    const slug = Array.isArray(params?.slug) ? params.slug[0] : params?.slug;

    const [product, setProduct] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isUsingMockData, setIsUsingMockData] = useState(false);
    const [quantity, setQuantity] = useState(1);

    useEffect(() => {
        if (!slug) return;
        let isMounted = true;

        async function loadProduct() {
            setIsLoading(true);
            try {
                const data = await getProductBySlug(slug);
                if (!isMounted) return;
                setProduct(data);
                setIsUsingMockData(false);
            } catch (_error) {
                if (!isMounted) return;
                const mockProduct =
                    MOCK_PRODUCTS.find((item) => item.slug === slug) ?? null;
                setProduct(mockProduct);
                setIsUsingMockData(true);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        }

        loadProduct();
        return () => {
            isMounted = false;
        };
    }, [slug]);

    const priceText = useMemo(() => {
        if (!product) return "";
        return formatPrice(product.price, product.currency);
    }, [product]);

    if (isLoading) return <ProductDetailSkeleton />;

    if (!product) {
        return (
            <ErrorScreen
                dashboard
                type="empty"
                title="Product not found."
                description="This product is not available in the catalog right now."
                backHref="/dashboard/store/products"
                backLabel="Back to products"
                homeHref="/dashboard/store"
                homeLabel="Store home"
            />
        );
    }

    return (
        <div
            className="space-y-6 p-6 md:space-y-8 md:p-8"
            style={{ color: "var(--dashboard-fg)" }}
        >
            <nav
                className="flex flex-wrap items-center gap-2 text-sm"
                style={{ color: "var(--dashboard-muted)" }}
                aria-label="Breadcrumb"
            >
                <Link
                    href="/dashboard/store"
                    className="transition hover:opacity-80"
                >
                    Store
                </Link>
                <span>/</span>
                <Link
                    href="/dashboard/store/products"
                    className="transition hover:opacity-80"
                >
                    Products
                </Link>
                <span>/</span>
                <span style={{ color: "var(--dashboard-fg)" }}>
                    {product.name}
                </span>
            </nav>

            <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
                <div className="space-y-4 lg:sticky lg:top-6">
                    <div
                        className="overflow-hidden rounded-3xl border"
                        style={{
                            borderColor: "var(--dashboard-border)",
                            background: "var(--dashboard-surface)",
                        }}
                    >
                        <img
                            src={product.image}
                            alt={product.name}
                            className="h-[320px] w-full object-cover md:h-[420px]"
                        />
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        {[1, 2, 3].map((item) => (
                            <div
                                key={item}
                                className="overflow-hidden rounded-2xl border"
                                style={{
                                    borderColor: "var(--dashboard-border)",
                                    background: "var(--dashboard-surface)",
                                }}
                            >
                                <img
                                    src={product.image}
                                    alt={`${product.name} preview ${item}`}
                                    className="h-24 w-full object-cover opacity-90"
                                />
                            </div>
                        ))}
                    </div>
                </div>

                <div className="space-y-5">
                    <div className="flex flex-wrap items-center gap-2">
                        <InfoPill>{product.category}</InfoPill>

                        <InfoPill tone={product.inStock ? "success" : "muted"}>
                            {product.inStock ? "In stock" : "Out of stock"}
                        </InfoPill>

                        {isUsingMockData && (
                            <InfoPill tone="muted">Showing mock data</InfoPill>
                        )}
                    </div>

                    <div className="space-y-3">
                        <h1
                            className="text-3xl font-semibold md:text-4xl"
                            style={{ color: "var(--dashboard-fg)" }}
                        >
                            {product.name}
                        </h1>

                        <div
                            className="flex flex-wrap items-center gap-3 text-sm"
                            style={{ color: "var(--dashboard-muted)" }}
                        >
                            <span>⭐ {product.rating}/5 rating</span>
                            <span>•</span>
                            <span>{product.category} kit</span>
                            <span>•</span>
                            <span>Beginner friendly</span>
                        </div>

                        <p
                            className="max-w-2xl leading-7"
                            style={{ color: "var(--dashboard-muted)" }}
                        >
                            {product.description}
                        </p>
                    </div>

                    <div
                        className="rounded-3xl border p-5"
                        style={{
                            borderColor: "var(--dashboard-border)",
                            background: "var(--dashboard-surface)",
                        }}
                    >
                        <div className="flex flex-wrap items-end justify-between gap-4">
                            <div className="space-y-1">
                                <p
                                    className="text-sm"
                                    style={{ color: "var(--dashboard-muted)" }}
                                >
                                    Price
                                </p>
                                <p className="text-3xl font-semibold">
                                    {priceText}
                                </p>
                            </div>

                            <div
                                className="rounded-2xl px-3 py-2 text-sm"
                                style={{
                                    background:
                                        "color-mix(in srgb, var(--dashboard-primary) 10%, var(--dashboard-surface) 90%)",
                                    color: "var(--dashboard-primary)",
                                }}
                            >
                                Free shipping on prepaid orders
                            </div>
                        </div>

                        <div className="mt-5 flex flex-wrap items-center gap-3">
                            <div
                                className="inline-flex items-center overflow-hidden rounded-xl border"
                                style={{
                                    borderColor: "var(--dashboard-border)",
                                }}
                            >
                                <button
                                    type="button"
                                    className="h-11 w-11 text-lg"
                                    onClick={() =>
                                        setQuantity((prev) =>
                                            Math.max(1, prev - 1),
                                        )
                                    }
                                >
                                    −
                                </button>
                                <span
                                    className="flex h-11 min-w-12 items-center justify-center border-x px-4 text-sm font-medium"
                                    style={{
                                        borderColor: "var(--dashboard-border)",
                                    }}
                                >
                                    {quantity}
                                </span>
                                <button
                                    type="button"
                                    className="h-11 w-11 text-lg"
                                    onClick={() =>
                                        setQuantity((prev) => prev + 1)
                                    }
                                >
                                    +
                                </button>
                            </div>

                            <button
                                type="button"
                                disabled={!product.inStock}
                                className="inline-flex h-11 items-center justify-center rounded-xl px-5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50"
                                style={{
                                    background: "var(--dashboard-primary)",
                                    color: "white",
                                }}
                            >
                                Add to cart
                            </button>

                            <button
                                type="button"
                                disabled={!product.inStock}
                                className="inline-flex h-11 items-center justify-center rounded-xl border px-5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50"
                                style={{
                                    borderColor: "var(--dashboard-border)",
                                    background: "var(--dashboard-bg)",
                                    color: "var(--dashboard-fg)",
                                }}
                            >
                                Buy now
                            </button>
                        </div>

                        <div
                            className="mt-5 grid gap-3 text-sm md:grid-cols-3"
                            style={{ color: "var(--dashboard-muted)" }}
                        >
                            <div
                                className="rounded-2xl p-3"
                                style={{ background: "var(--dashboard-bg)" }}
                            >
                                Secure checkout
                            </div>
                            <div
                                className="rounded-2xl p-3"
                                style={{ background: "var(--dashboard-bg)" }}
                            >
                                7-day replacement
                            </div>
                            <div
                                className="rounded-2xl p-3"
                                style={{ background: "var(--dashboard-bg)" }}
                            >
                                Guided setup included
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-1 xl:grid-cols-2">
                        <section
                            className="rounded-3xl border p-5"
                            style={{
                                borderColor: "var(--dashboard-border)",
                                background: "var(--dashboard-surface)",
                            }}
                        >
                            <h2 className="text-base font-semibold">
                                What you get
                            </h2>
                            <ul
                                className="mt-3 space-y-2 text-sm"
                                style={{ color: "var(--dashboard-muted)" }}
                            >
                                <li>Hands-on hardware kit</li>
                                <li>Step-by-step guided projects</li>
                                <li>Setup and safety instructions</li>
                                <li>Beginner-friendly learning path</li>
                            </ul>
                        </section>

                        <section
                            className="rounded-3xl border p-5"
                            style={{
                                borderColor: "var(--dashboard-border)",
                                background: "var(--dashboard-surface)",
                            }}
                        >
                            <h2 className="text-base font-semibold">
                                Why this product
                            </h2>
                            <ul
                                className="mt-3 space-y-2 text-sm"
                                style={{ color: "var(--dashboard-muted)" }}
                            >
                                <li>Designed for school learners</li>
                                <li>Practical projects over theory</li>
                                <li>Great for self-learning and labs</li>
                                <li>Ideal for portfolio-style experiments</li>
                            </ul>
                        </section>
                    </div>

                    <Link
                        href="/dashboard/store/products"
                        className="inline-flex items-center text-sm font-medium transition hover:opacity-80"
                        style={{ color: "var(--dashboard-primary)" }}
                    >
                        ← Back to products
                    </Link>
                </div>
            </div>
        </div>
    );
}
