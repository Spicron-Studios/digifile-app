import { ClientHeader } from "@/app/components/ui/client-header";
import { auth } from "@/app/lib/auth";

export async function Header() {
	const session = await auth();

	return <ClientHeader session={session} />;
}
