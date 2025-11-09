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
  searchParams: Promise<SearchParams>;
}): Promise<React.JSX.Element> {
  const params = await searchParams;
  const parsedPage = parseInt(params.page || '1', 10);
  const page = isNaN(parsedPage) || parsedPage < 1 ? 1 : parsedPage;
  const searchTerm = params.search;
  const orderBy = params.orderBy || 'lastEdit';

  const filters: PatientFilters = {};

  if (params.hasId !== undefined) {
    filters.hasId = params.hasId === 'true';
  }

  if (params.hasDob !== undefined) {
    filters.hasDob = params.hasDob === 'true';
  }

  if (params.dobFrom) {
    filters.dobFrom = params.dobFrom;
  }

  if (params.dobTo) {
    filters.dobTo = params.dobTo;
  }

  if (params.gender) {
    filters.gender = params.gender;
  }

  const paginatedData = await getPatients(page, searchTerm, filters, orderBy);

  return (
    <div className="container mx-auto py-8">
      <PatientsClient initialData={paginatedData} />
    </div>
  );
}
