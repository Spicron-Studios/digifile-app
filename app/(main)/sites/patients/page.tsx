import { getPatients } from '@/app/actions/patients';
import PatientsClient from './PatientsClient';
import { PatientFilters } from '@/app/types/patient';

interface SearchParams {
  page?: string;
  search?: string;
  orderBy?: 'lastEdit' | 'name' | 'dateOfBirth';
  hasId?: string;
  hasDob?: string;
  dobFrom?: string;
  dobTo?: string;
  gender?: string;
}

export default async function PatientsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<React.JSX.Element> {
  const page = parseInt(searchParams.page || '1', 10);
  const searchTerm = searchParams.search;
  const orderBy = searchParams.orderBy || 'lastEdit';

  const filters: PatientFilters = {
    hasId: searchParams.hasId === 'true',
    hasDob: searchParams.hasDob === 'true',
    dobFrom: searchParams.dobFrom,
    dobTo: searchParams.dobTo,
    gender: searchParams.gender,
  };

  const paginatedData = await getPatients(page, searchTerm, filters, orderBy);

  return (
    <div className="container mx-auto py-8">
      <PatientsClient initialData={paginatedData} />
    </div>
  );
}
