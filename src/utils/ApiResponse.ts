export class ApiResponse<T> {
  public success: boolean;
  public data: T;

  constructor(data: T) {
    this.success = true;
    this.data = data;
  }
}
export default ApiResponse;
