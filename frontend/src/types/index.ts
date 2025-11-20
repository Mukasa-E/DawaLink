export type UserRole = 'patient' | 'healthcare_provider' | 'admin' | 'customer' | 'pharmacy' | 'delivery_agent';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  facility?: string;
  department?: string;
  preferredFacility?: string; // Patient's preferred/trusted facility
  createdAt: string;
}

export interface Referral {
  id: string;
  patientId: string;
  patientName: string;
  providerId: string;
  providerName: string;
  facilityName: string;
  reason: string;
  diagnosis?: string;
  recommendations?: string;
  referringFacility: string;
  referredToFacility: string;
  status: 'pending' | 'accepted' | 'completed' | 'cancelled';
  createdAt: string;
  qrCode?: string;
  notes?: string;
}

export interface MedicalRecord {
  id: string;
  patientId: string;
  providerId: string;
  providerName: string;
  facilityName: string;
  recordType: 'consultation' | 'test_result' | 'prescription' | 'diagnosis' | 'other';
  title: string;
  description: string;
  date: string;
  attachments?: string[];
  isAuthorized: boolean;
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  role: UserRole;
  phone?: string;
  facility?: string;
  department?: string;
  preferredFacility?: string; // Patient's preferred/trusted facility
}

// Pharmacy Types
export interface Medicine {
  id: string;
  pharmacyId: string;
  name: string;
  description?: string;
  price: number;
  stock: number;
  category: string;
  requiresPrescription: boolean;
  manufacturer?: string;
  expiryDate?: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
  pharmacy?: Pharmacy;
}

// Facility Medicine Types (for hospitals/health facilities)
export interface FacilityMedicine {
  id: string;
  facilityName: string;
  name: string;
  genericName?: string;
  category: string;
  manufacturer?: string;
  dosageForm?: string;
  strength?: string;
  stock: number;
  reorderLevel: number;
  requiresPrescription: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Pharmacy {
  id: string;
  name: string;
  ownerId: string;
  licenseNumber: string;
  phone: string;
  email?: string;
  address: string;
  city: string;
  state?: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  operatingHours?: string;
  isVerified: boolean;
  rating?: number;
  createdAt: string;
  updatedAt: string;
  owner?: User;
  medicines?: Medicine[];
  _count?: {
    medicines: number;
    orders: number;
  };
}

export type OrderStatus = 'pending' | 'confirmed' | 'ready' | 'out_for_delivery' | 'delivered' | 'cancelled';
export type PaymentStatus = 'pending' | 'completed' | 'paid' | 'failed' | 'refunded';
export type PaymentMethod = 'mobile_money' | 'card' | 'cash';

export interface OrderItem {
  id: string;
  orderId: string;
  medicineId: string;
  quantity: number;
  price: number;
  subtotal: number;
  medicine?: Medicine;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  pharmacyId: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  totalAmount: number;
  deliveryAddress: string;
  prescriptionId?: string;
  createdAt: string;
  updatedAt: string;
  customer?: User;
  pharmacy?: Pharmacy;
  items?: OrderItem[];
  delivery?: DeliveryAssignment;
  payment?: Payment;
}

export type DeliveryStatus = 'pending' | 'assigned' | 'picked_up' | 'in_transit' | 'delivered' | 'failed';

export interface DeliveryAssignment {
  id: string;
  orderId: string;
  deliveryAgentId?: string;
  status: DeliveryStatus;
  pickupTime?: string;
  deliveryTime?: string;
  deliveredAt?: string;
  latitude?: number;
  longitude?: number;
  currentLatitude?: number;
  currentLongitude?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  order?: Order;
  deliveryAgent?: User;
}

export interface Payment {
  id: string;
  orderId: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  transactionId?: string;
  mobileNumber?: string;
  cardLast4?: string;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
  order?: Order;
}

export type NotificationType = 
  | 'order_update' 
  | 'payment_confirmed' 
  | 'delivery_assigned' 
  | 'order_delivered' 
  | 'new_order' 
  | 'low_stock' 
  | 'payment_refunded';

export type NotificationChannel = 'in_app' | 'sms' | 'email' | 'push';

export interface Notification {
  id: string;
  userId: string;
  orderId?: string;
  type: NotificationType;
  channel: NotificationChannel;
  title: string;
  message: string;
  read: boolean;
  readAt?: string;
  createdAt: string;
  order?: Order;
}

export interface Prescription {
  id: string;
  customerId: string;
  fileUrl: string;
  status: 'pending' | 'verified' | 'rejected';
  verifiedBy?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// API Response Types
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    limit: number;
    skip: number;
    hasMore: boolean;
  };
}

export interface MedicineSearchResponse {
  medicines: Medicine[];
  pagination: {
    total: number;
    limit: number;
    skip: number;
    hasMore: boolean;
  };
}

export interface OrdersResponse {
  orders: Order[];
  pagination: {
    total: number;
    limit: number;
    skip: number;
    hasMore: boolean;
  };
}

export interface NotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
  pagination: {
    total: number;
    limit: number;
    skip: number;
    hasMore: boolean;
  };
}

// Cart Types (client-side only)
export interface CartItem {
  medicine: Medicine;
  quantity: number;
}

export interface Cart {
  items: CartItem[];
  totalAmount: number;
  itemCount: number;
}

