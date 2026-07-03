/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type AppointmentStatus = 'Pendiente' | 'Confirmado' | 'Completado' | 'Cancelado';

export interface ColorTheme {
  primary: string;
  primaryHover: string;
  accent: string;
  bgMain: string;
  bgCard: string;
  textPrimary: string;
  textAccent: string;
  borderColor: string;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  durationMinutes: number;
  category: 'Nuevos' | 'Elegidos' | 'Galería' | 'Productos' | 'Promos' | 'Ofertas' | 'Servicios';
  image: string;
  isNew?: boolean;
  components?: string[]; // Extra details or features (campos extras)
}

export interface Staff {
  id: string;
  name: string;
  role: string;
  image: string;
  rating: number;
  reviewsCount: number;
  specialty: string;
}

export interface Salon {
  id: string;
  name: string;
  slogan: string;
  logo: string;
  address: string;
  phone: string;
  email: string;
  rating: number;
  reviewsCount: number;
  colorTheme: ColorTheme;
  services: Service[];
  staff: Staff[];
  instagramUrl?: string;
  whatsappUrl?: string;
  fontFamily?: 'font-sans' | 'font-serif' | 'font-mono' | 'font-poppins' | 'font-quicksand' | 'font-montserrat' | 'font-playfair' | 'font-cormorant' | 'font-dancing';
  designPreset?: 'boutique-rosa' | 'spa-dorado' | 'floral-neon';
  interfaceStyle?: 'sleek' | 'minimalism';
  coverImage?: string;
  collaborators?: Array<{ id: string; name: string; username: string; password: string }>;
  products?: ProductItem[];
  orders?: ProductOrder[];
}

export interface ProductItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: 'Promo' | 'Destacados' | 'Lo más vistos' | 'Productos';
  components?: string[]; // "compos" (sub-items or specifications)
}

export interface ProductOrder {
  id: string;
  salonId: string;
  clientName: string;
  clientPhone: string;
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
  }>;
  totalPrice: number;
  status: 'Pendiente' | 'Entregado' | 'Cancelado';
  pickupCode: string;
  createdAt: string;
}

export interface Appointment {
  id: string;
  salonId: string;
  salonName?: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  serviceId: string;
  serviceName: string;
  price: number;
  date: string;
  time: string;
  staffId: string;
  staffName: string;
  status: AppointmentStatus;
  notes?: string;
  createdAt: string;
}

export interface ClientProfile {
  id: string;
  name: string;
  phone: string;
  email: string;
  preferences: string;
  totalSpent: number;
  visitsCount: number;
  lastVisitDate: string;
}

export interface FinancialSummary {
  totalRevenue?: number;
  totalBookings?: number;
  pendingBookings?: number;
  averageTicket?: number;
  recentTransactions?: Array<{
    date: string;
    clientName: string;
    serviceName: string;
    price: number;
    type: 'Servicio' | 'Producto' | 'Otros';
  }>;
  period?: string;
  revenue?: number;
  appointmentsCount?: number;
  completedCount?: number;
}
