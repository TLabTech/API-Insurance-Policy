export interface PaginatedResponse<T> {
  total_data: number;
  current_page: number;
  total_page: number;
  limit: number;
  data: T[];
}
