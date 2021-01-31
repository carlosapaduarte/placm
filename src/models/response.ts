interface IResponse {
    success: number;
    message: string;
    errors: any;
    result: any;
  
    hasError(): boolean;
  }
  
  export class Response implements IResponse {
    success: number;
    message: string;
    errors: any;
    result: any;
  
    constructor(response: IResponse) {
      this.success = response.success;
      this.message = response.message;
      this.errors = response.errors;
      this.result = response.result;
    }
  
    hasError(): boolean {
      return this.success !== 1;
    }
  }
  