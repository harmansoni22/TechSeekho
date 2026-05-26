import { redirect } from "next/navigation";

const TechLabRedirectPage = async ({ params }) => {
    const { techId } = await params;
    redirect(`/dashboard/student/skill-labs/${techId}`);
};

export default TechLabRedirectPage;
