export interface CreateUiCategoryInput {
  name: string;
  avatar?: string; // optional
}


export interface UpdateUiCategoryInput {
  name?: string;
  avatar?: string | null;
}