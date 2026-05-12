export interface ICreateWorkoutRequest {
  title: string;
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  description?: string;
  duration?: number;
  categoryId?: string;
  creatorId?: string;
  programId?: string;
  exerciseIds?: string[];
}

export interface IUpdateWorkoutRequest {
  id: string;
  title?: string;
  difficulty?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  description?: string;
  duration?: number;
  categoryId?: string;
  creatorId?: string;
  programId?: string;
  exerciseIds?: string[];
}

export interface IWorkoutResponse {
  id: string;
  title: string;
  difficulty: string;
  description: string | null;
  duration: number | null;
  categoryId: string | null;
  creatorId: string | null;
  programId: string | null;
  exercises?: any[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IWorkoutListResponse {
  data: IWorkoutResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
