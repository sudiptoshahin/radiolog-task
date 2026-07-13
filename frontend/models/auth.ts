

export interface LoginPayload {
    email: string;
    password: string;
}

export interface LoginFormValues extends LoginPayload{};

export interface IRegisterPayload {
    username: string;
    email: string;
    password: string;
    password2: string;
}