import { InertiaLinkProps } from '@inertiajs/react';
import { LucideIcon } from 'lucide-react';

export interface Auth {
    user: User;
}

export interface BreadcrumbItem {
    title: string;
    href: string;
}

export interface NavGroup {
    title: string;
    items: NavItem[];
}

export interface NavItem {
    title: string;
    href: NonNullable<InertiaLinkProps['href']>;
    icon?: LucideIcon | null;
    isActive?: boolean;
}

export interface Flash{
    success:string;
    error:string;
    warning:string;
    info:string;
}

export interface SharedData {
    name: string;
    quote: { message: string; author: string };
    auth: Auth;
    sidebarOpen: boolean;
    flash:Flash;
    [key: string]: unknown;
}

export type UserType = 'super_admin' | 'owner' | 'driver' | 'warehouse_man' | 'manager';

export interface User {
    id: number;
    name: string;
    email?: string|null;
    type: UserType;
    avatar?: string;
    email_verified_at: string | null;
    two_factor_enabled?: boolean;
    phone?:string|null;
    username?:string | null;
    created_at: string;
    updated_at: string;
    deleted_at:string;
    [key: string]: unknown; // This allows for additional properties...
}

export interface CustomNavItem {
    title: string;
    href: NonNullable<InertiaLinkProps['href']>;
    icon?: LucideIcon | null;
    isActive?: boolean;
    type: string|string[];
}

// types/index.ts (o donde tengas tus tipos)

export interface HorarioDia {
  cerrado: boolean;
  hora_apertura: string;
  hora_cierre: string;
}

export interface Horarios {
  lunes: HorarioDia;
  martes: HorarioDia;
  miercoles: HorarioDia;
  jueves: HorarioDia;
  viernes: HorarioDia;
  sabado: HorarioDia;
  domingo: HorarioDia;
}

export interface SucursalItem {
  id: number;
  nombre: string;
  direccion_completa: string | null;
  telefono: string | null;
  activo: boolean;
  horarios: Horarios | null;
  codigo_postal: string | null;
  updated_at: Date; // Laravel envía fechas como string ISO
  latitud: number | null;
  longitud: number | null;
}


export interface BaseModel {
    id: number;
    created_at: string;
    updated_at: string;
}

export interface SoftDeletableModel extends BaseModel {
    deleted_at: string | null;
    active: boolean;
}

export interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

export interface PaginatedResponse<T> {
    data: T[];
    current_page: number;
    first_page_url: string;
    from: number;
    last_page: number;
    last_page_url: string;
    links: PaginationLink[];
    next_page_url: string | null;
    path: string;
    per_page: number;
    prev_page_url: string | null;
    to: number;
    total: number;
}

export interface Filters {
    search?: string;
    trashed?: '' | 'with' | 'only';
    sort?: string;
    direction?: 'asc' | 'desc';
}

// Tu modelo específico
export interface Empleado extends SoftDeletableModel {
    id:number;
    nombre: string;
    apellidos:string;
    edad:string;
    telefono:string;
    activo:boolean;
    negocio_id:number;
}

export interface SucursalSelect{
    id:string|number,
    nombre:string
}

export interface Almacen{
    id:number|string;
    nombre:string;
    descripcion:string;
    ubicacion:string;
    sucursal_id:string|number;
    created_at:string;
    deleted_at:string;
    updated_at:string;
    activo:boolean;
}

export interface AlmacenForm{
    nombre:string;
    descripcion:string;
    ubicacion:string;
    sucursal_id:string|number;
    activo?:boolean | null;
}
export interface Vehiculo {
  id: number|string
  placa: string
  marca: string
  modelo: string
  color?: string
  tipo: 'camioneta' | 'camion' | 'pickup' | 'furgoneta' | 'trailer' | 'van'
  kilometros_por_litro?: number
  precio_litro_combustible?: number
  capacidad_carga_kg?: number
  estado: 'activo' | 'mantenimiento' | 'inactivo'
  sucursal_id: number
  created_at: string
  updated_at: string
  deleted_at:string
}


export interface VehiculoForm {
  placa: string
  marca: string
  modelo: string
  color?: string
  tipo: 'camioneta' | 'camion' | 'pickup' | 'furgoneta' | 'trailer' | 'van'
  kilometros_por_litro?: number
  precio_litro_combustible?: number
  capacidad_carga_kg?: number
  estado: 'activo' | 'mantenimiento' | 'inactivo'
}

export interface Cliente{
    id:string|number,
    nombre:string,
    apellidos:string,
    telefono:string,
    fecha_registro:string,
    created_at:string,
    updated_at:string,
    deleted_at:string,
    activo:boolean
}

export interface ClienteForm{
    nombre:string,
    apellidos:string,
    telefono:string,
    activo:boolean
}
