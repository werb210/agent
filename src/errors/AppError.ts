export class AppError extends Error {
  public readonly code: string;
  public readonly status: number;

  constructor(code: string, status: number, message?: string) {
    super(message || code);
    this.code = code;
    this.status = status;
  }
}
