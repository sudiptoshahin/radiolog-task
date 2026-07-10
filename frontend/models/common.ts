export interface ApiErrorResponse {
    message: string;
    code: number | string,
    error_type: string,
}

export interface IApiResponse<T = unknown> {
    success: boolean;
    message: string;
    code: number;
    data?: T;
}