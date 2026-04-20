import type { Vehicle } from '@/types';

export type VehicleLookupResult = Omit<Vehicle, 'id' | 'customerId'>;

export class SurepassLookupError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SurepassLookupError';
  }
}

// TODO: replace with real Surepass RC verification call once credentials are provisioned.
// Endpoint: POST https://kyc-api.surepass.io/api/v1/rc/rc-full
// Headers: { Authorization: `Bearer ${process.env.SUREPASS_API_TOKEN}` }
// Body: { id_number: registrationNumber }
export async function lookupVehicleByRegistration(
  registrationNumber: string
): Promise<VehicleLookupResult> {
  const plate = registrationNumber.trim().toUpperCase();
  if (!plate) throw new SurepassLookupError('Registration number is required');

  await new Promise((resolve) => setTimeout(resolve, 900));

  throw new SurepassLookupError(
    'Surepass API is not configured yet. Enter vehicle details manually for now.'
  );
}
