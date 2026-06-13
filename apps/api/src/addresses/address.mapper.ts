import type { AddressDto } from '@marketplace/shared';
import type { Address } from '@prisma/client';

export function toAddressDto(a: Address): AddressDto {
  return {
    id: a.id,
    street: a.street,
    number: a.number,
    city: a.city,
    province: a.province,
    zipCode: a.zipCode,
    isDefault: a.isDefault,
  };
}
