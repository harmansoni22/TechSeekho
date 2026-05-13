import { notFound } from "next/navigation";
import { SERVICES } from "@/app/landingpage/config/servicesContent";
import ServiceDetailExperience from "./ServiceDetailExperience";

function toSlug(value) {
    return value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
}

function getServiceBySlug(slug) {
    return SERVICES.find((item) => toSlug(item.title) === slug);
}

export async function generateMetadata({ params }) {
    const { slug } = await Promise.resolve(params);
    const service = getServiceBySlug(slug);

    if (!service) {
        return {
            title: "Service Not Found | TechSeekho",
        };
    }

    return {
        title: `${service.title} | TechSeekho`,
        description: service.fullDesc,
    };
}

const ServiceDetailsPage = async ({ params }) => {
    const { slug } = await Promise.resolve(params);

    const service = getServiceBySlug(slug);
    if (!service) notFound();

    const otherServices = SERVICES.filter((item) => item.id !== service.id)
        .slice(0, 3)
        .map((item) => ({
            ...item,
            href: `/landingpage/Pages/services/service/${toSlug(item.title)}`,
        }));

    return (
        <ServiceDetailExperience
            service={service}
            otherServices={otherServices}
        />
    );
};

export default ServiceDetailsPage;
