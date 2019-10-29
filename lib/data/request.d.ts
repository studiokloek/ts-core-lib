export declare const ResponseErrorTypes: {
    DEFAULT: string;
    TIMEOUT: string;
    TERMINATED: string;
    NOT_FOUND: string;
    OFFLINE: string;
};
export interface ResponseError {
    type: string;
    message: string;
    code: number;
}
export interface ResponseResult {
    error?: ResponseError;
    body?: {} | string;
}
export declare function getLocalUrlContents(_url: string): Promise<ResponseResult>;
export declare function getAPIRequest(_url: string): Promise<ResponseResult>;
export declare function postAPIRequest(_url: string, _body?: {}): Promise<ResponseResult>;
