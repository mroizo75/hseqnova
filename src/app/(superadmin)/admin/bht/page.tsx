import { redirect } from "next/navigation";

/** Not offered in the UK product. */
export default function Page() {
  redirect("/admin");
}
