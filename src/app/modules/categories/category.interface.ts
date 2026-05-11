export interface ICreateCategoryRequest {
  name: string;
  description?: string;
}

export interface IUpdateCategoryRequest {
  id: string;
  name?: string;
  description?: string;
}

export interface ICategoryResponse {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
}

export interface ICategoryListResponse {
  data: ICategoryResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
