export interface CurrentUserContext {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  companyId: number;
  activeCompanyId: number;
  defaultBranchId: number | null;
  activeBranchId: number | null;
  branchIds: number[];
  hasCompanyWideAccess: boolean;
  permissions: string[];
  roles: string[];
}
