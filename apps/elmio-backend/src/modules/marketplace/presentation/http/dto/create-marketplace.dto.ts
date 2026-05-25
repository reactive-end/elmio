/**
 * DTO para crear un marketplace.
 */
export class CreateMarketplaceDto {
  name!: string;
  slug?: string;
  description!: string;
  owner!: string;
  logo!: string;
}
