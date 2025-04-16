import prisma from '@/app/lib/prisma';
import chalk from 'chalk';

// Helper function to fetch medical schemes
export async function fetchMedicalSchemes(orgId: string) {
  try {
    // Fetch active medical schemes for the organization
    const schemes = await prisma.medical_scheme.findMany({
      where: {
        active: true,
        orgid: orgId
      },
      select: {
        uid: true,
        scheme_name: true
      },
      orderBy: {
        scheme_name: 'asc'
      }
    });
    
    return schemes;
  } catch (error) {
    console.error(chalk.red('💥 API: Error fetching medical schemes:'), error);
    return [];
  }
}
