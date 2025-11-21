import { getPracticeTypes } from "@/app/actions/practice-types";
import { AuthSkeleton } from "@/app/components/ui/skeletons";
import { Suspense } from "react";
import RegistrationClient from "./RegistrationClient";

export default async function RegistrationPage() {
	const practiceTypes = await getPracticeTypes();
	return (
		<Suspense fallback={<AuthSkeleton />}>
			<RegistrationClient practiceTypes={practiceTypes} />
		</Suspense>
	);
}
