export interface ITestRequest {
  name: string;
  email: string;
}

export interface ITestResponse {
  id: string;
  name: string;
  email: string;
  createdAt?: Date;
}
