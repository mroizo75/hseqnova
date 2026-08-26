import { redirect } from "next/navigation";

export const metadata = { title: "Get started with HSEQ Nova" };

/** Industry pickers are not used. Core HSEQ is the same for every employer. */
export default function WelcomePage() {
  redirect("/dashboard");
}
