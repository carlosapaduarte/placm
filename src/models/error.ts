interface IError extends Error {
    code: number;
    message: string;
    type: string;
    errors: any;
    result: any;
  
    isSerious(): boolean;
    showMessage(): void;
  }
  
  export class PLACMError implements IError {
    name: string;
    code: number;
    message: string;
    type: string;
    errors: any;
    result: any;
  
    constructor(code: number, message: string, type: string = 'NORMAL', errors: any = null, result: any = null) {
      this.code = code;
      this.message = message;
      this.type = type;
      this.errors = errors;
      this.result = result;
    }
  
    isSerious(): boolean {
      return this.type === 'SERIOUS';
    }
  
    showMessage(): void {
      alert('Error');
    }
  }