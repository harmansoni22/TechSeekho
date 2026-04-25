import { redirect } from "next/navigation";

export default async function Page({ searchParams }) {
  const params = await Promise.resolve(searchParams);

  // Accept both keys for backward compatibility.
  const authParam = params?.user_authenticated ?? params?.userAuthenticated;
  const isUserAuthenticated = authParam === "true";

  redirect(isUserAuthenticated ? "/dashboard" : "/landingpage");
}
