export interface ICreateProgramRequest {
  title: string;
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  description?: string;
  thumbnail?: string;
  creatorId?: string;
  categoryId?: string;
  durationWeeks?: number;
  coverImage?: string;
}

export interface IUpdateProgramRequest {
  id: string;
  title?: string;
  difficulty?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  description?: string;
  thumbnail?: string;
  creatorId?: string;
  categoryId?: string;
  durationWeeks?: number;
  coverImage?: string;
}

export interface IProgramResponse {
  id: string;
  title: string;
  description: string | null;
  thumbnail: string | null;
  difficulty: string;
  creatorId: string | null;
  categoryId: string | null;
  durationWeeks: number | null;
  coverImage: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IProgramListResponse {
  data: IProgramResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
