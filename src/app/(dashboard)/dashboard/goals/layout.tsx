import { redirect } from "next/navigation";

/** ISO 6.2 objectives — not a GB HSEQ duty. Not offered in the UK product. */
export default function GoalsNotInUkProduct({
  children: _children,
}: {
  children: React.ReactNode;
}) {
  redirect("/dashboard");
}

