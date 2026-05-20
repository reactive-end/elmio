export class CreateCategoryDto {
  name!: string;
  description!: string;
  active?: boolean;
}

export class UpdateCategoryDto {
  name!: string;
  description!: string;
  active!: boolean;
}
