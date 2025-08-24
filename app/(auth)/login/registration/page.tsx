import { getPracticeTypes } from '@/app/actions/practice-types';
import RegistrationClient from './RegistrationClient';

export default async function RegistrationPage() {
  const practiceTypes = await getPracticeTypes();
  return <RegistrationClient practiceTypes={practiceTypes} />;
}
