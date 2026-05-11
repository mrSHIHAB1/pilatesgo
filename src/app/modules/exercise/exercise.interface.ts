export interface ICreateExerciseRequest {
  name: string;
  targetArea: string;
  description?: string;
  instructions?: string;
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  categoryId?: string;
}

export interface IUpdateExerciseRequest {
  id: string;
  name?: string;
  targetArea?: string;
  description?: string;
  instructions?: string;
  difficulty?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  categoryId?: string;
}

export interface IExerciseResponse {
  id: string;
  name: string;
  targetArea: string;
  description: string | null;
  instructions: string | null;
  difficulty: string;
  categoryId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IExerciseListResponse {
  data: IExerciseResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
