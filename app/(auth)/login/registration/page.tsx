import { Suspense } from 'react';
import { getPracticeTypes } from '@/app/actions/practice-types';
import RegistrationClient from './RegistrationClient';
import { AuthSkeleton } from '@/app/components/ui/skeletons';

export default async function RegistrationPage() {
  const practiceTypes = await getPracticeTypes();
  return (
    <Suspense fallback={<AuthSkeleton />}>
      <RegistrationClient practiceTypes={practiceTypes} />
    </Suspense>
  );
}
