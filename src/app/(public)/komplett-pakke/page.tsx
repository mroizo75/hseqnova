import { permanentRedirect } from "next/navigation";

/**
 * Komplett pakke er flyttet til /bedriftshelsetjeneste
 */
export default function KomplettPakkePage() {
  permanentRedirect("/bedriftshelsetjeneste");
}
