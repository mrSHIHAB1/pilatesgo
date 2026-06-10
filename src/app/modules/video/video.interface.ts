import { DifficultyLevel, Visibility } from '../../../../prisma/generated/prisma/enums';

export interface ICreateVideoRequest {
  title: string;
  description?: string;
  url: string;
  difficulty: DifficultyLevel;
  visibility: Visibility;
  duration?: number;
  categoriesId?: string;
}

export interface IUpdateVideoRequest {
  id: string;
  title?: string;
  description?: string;
  url?: string;
  difficulty?: DifficultyLevel;
  visibility?: Visibility;
  duration?: number;
  categoriesId?: string;
}

export interface IVideoResponse {
  id: string;
  title: string;
  description?: string | null;
  url: string;
  difficulty: DifficultyLevel;
  visibility: Visibility;
  duration: number | null;
  categoriesId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IVideoListResponse {
  data: IVideoResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
