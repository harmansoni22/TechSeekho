import { SERVICES } from "@/app/landingpage/config/servicesContent";

function toSlug(value) {
    return value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
}

export default function getServiceBySlug(slug) {
    if (!slug) return null;
    return SERVICES.find((item) => toSlug(item.title) === slug) ?? null;
}
