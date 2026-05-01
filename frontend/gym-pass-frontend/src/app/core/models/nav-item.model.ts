import { RolUsuario } from './auth.model';

export interface NavItem {
  label: string;
  route: string;
  roles?: RolUsuario[];
}
