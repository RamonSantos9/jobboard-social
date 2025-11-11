import { redirect } from "next/navigation";

export default function Page() {
  // Redirecionar para o feed principal
  redirect("/feed");
}
