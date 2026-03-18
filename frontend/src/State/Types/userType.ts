export interface Address {
  id?: number;
  name: string;
  street: string;
  locality: string;
  address: string;
  city: string;
  state: string;
  pinCode: string;
  mobileNumber: string;
}


export enum UserRole {
    ROLE_CUSTOMER = "ROLE_CUSTOMER",
    ROLE_ADMIN = "ROLE_ADMIN",
    ROLE_SELLER = "ROLE_SELLER"
}

export interface User {
  id?: number;
  fullName: string;
  email: string;
  mobileNumber?: string;
  accountStatus?: string;
  role?: UserRole;
  addresses?: Address[];
}
