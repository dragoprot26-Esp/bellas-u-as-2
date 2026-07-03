import { Salon, Appointment, ClientProfile } from './types';

export const INITIAL_SALONS: Salon[] = [
  {
    id: 'bellas-unas',
    name: 'Bellas Uñas',
    slogan: 'Tus manos, nuestra obra de arte 💅',
    logo: '🌸',
    address: 'Av. Siempreviva 742, Buenos Aires',
    phone: '11-2345-6789',
    email: 'hola@bellasunas.com',
    rating: 4.9,
    reviewsCount: 184,
    colorTheme: {
      primary: 'bg-[#E08297]',
      primaryHover: 'hover:bg-[#CC6F84]',
      accent: 'text-[#E08297]',
      bgMain: 'bg-[#FFF6F6]',
      bgCard: 'bg-white',
      textPrimary: 'text-[#5C2E37]',
      textAccent: 'text-[#A34E5F]',
      borderColor: 'border-[#FFDFE4]'
    },
    services: [
      {
        id: 'aurora-effect',
        name: 'Efecto aurora',
        description: 'El brillo tornasolado que es tendencia en todo el mundo. Cambia de color con el reflejo de la luz.',
        price: 10500,
        durationMinutes: 60,
        category: 'Nuevos',
        image: '✨',
        isNew: true
      },
      {
        id: 'soft-gel-largo',
        name: 'Soft Gel + Nail Art',
        description: 'Uñas esculpidas en gel con tips completos de cobertura total. Incluye esmaltado y un diseño minimalista.',
        price: 14500,
        durationMinutes: 90,
        category: 'Elegidos',
        image: '💎'
      },
      {
        id: 'manicuria-rusa',
        name: 'Manicuría Rusa + Kapping',
        description: 'Limpieza profunda de cutículas con torno y nivelación con gel base para dar fuerza a tus uñas naturales.',
        price: 9000,
        durationMinutes: 75,
        category: 'Elegidos',
        image: '💅'
      },
      {
        id: 'semipermanente-clasica',
        name: 'Esmaltado Semipermanente',
        description: 'Esmaltado de larga duración con secado en cabina. Brillo impecable por más de 15 días.',
        price: 6800,
        durationMinutes: 45,
        category: 'Galería',
        image: '🌸'
      },
      {
        id: 'promo-amigas',
        name: 'Promo Amigas: 2x1 Semi',
        description: 'Vengan de a dos y realicen un esmaltado semipermanente clásico con 50% de descuento para cada una.',
        price: 9500,
        durationMinutes: 90,
        category: 'Promos',
        image: '👭',
        isNew: true
      },
      {
        id: 'aceite-cuticulas',
        name: 'Aceite de Cutículas Coco-Almendra',
        description: 'Gotero hidratante formulado para nutrir tu piel y prolongar la vida útil de tus esculpidas. 15ml.',
        price: 3200,
        durationMinutes: 0,
        category: 'Productos',
        image: '🧴'
      }
    ],
    staff: [
      {
        id: 'sofia-ruiz',
        name: 'Sofía Ruiz',
        role: 'Nail Artist Senior',
        image: '👩‍🎨',
        rating: 4.9,
        reviewsCount: 94,
        specialty: 'Especialista en Efecto Aurora y Nail Art 3D'
      },
      {
        id: 'maria-g',
        name: 'María González',
        role: 'Experta en Esculpidas',
        image: '💅',
        rating: 4.8,
        reviewsCount: 72,
        specialty: 'Esculpidas en Soft Gel y Kapping'
      },
      {
        id: 'camila-l',
        name: 'Camila López',
        role: 'Manicurista',
        image: '👩‍🦰',
        rating: 4.9,
        reviewsCount: 18,
        specialty: 'Manicuría Rusa y Esmaltado Semipermanente'
      }
    ],
    coverImage: 'https://images.unsplash.com/photo-1632345031435-8797b2d58045?q=80&w=1000&auto=format&fit=crop',
    collaborators: [
      { id: 'col-1', name: 'Laura Gómez', username: 'laura', password: '123' },
      { id: 'col-2', name: 'Marta Pérez', username: 'marta', password: '123' }
    ]
  },
  {
    id: 'emerald-lounge',
    name: 'Emerald Lounge',
    slogan: 'Brillo y sofisticación para tus manos ✨',
    logo: '🟢',
    address: 'Av. Del Libertador 1200, Palermo',
    phone: '11-9876-5432',
    email: 'contacto@emeraldlounge.com',
    rating: 4.95,
    reviewsCount: 120,
    colorTheme: {
      primary: 'bg-[#1e4620]',
      primaryHover: 'hover:bg-[#153116]',
      accent: 'text-[#1e4620]',
      bgMain: 'bg-[#F4F7F4]',
      bgCard: 'bg-white',
      textPrimary: 'text-[#112412]',
      textAccent: 'text-[#2e5e31]',
      borderColor: 'border-[#E0EDE0]'
    },
    services: [
      {
        id: 'emerald-luxury',
        name: 'Royal Sculpting & Gold Art',
        description: 'Esculpidas de lujo en acrílico con incrustaciones de láminas de oro de 24k y terminación ultrabrillante.',
        price: 22000,
        durationMinutes: 120,
        category: 'Nuevos',
        image: '👑',
        isNew: true
      },
      {
        id: 'french-moderno',
        name: 'Frenchie Moderno',
        description: 'Manicuría francesa reinventada con líneas finas de colores de temporada, metalizados o neón.',
        price: 11000,
        durationMinutes: 75,
        category: 'Elegidos',
        image: '🤍'
      },
      {
        id: 'kapping-gel-premium',
        name: 'Kapping Gel + Tratamiento Nutritivo',
        description: 'Fortalecimiento de la uña biológica con base de keratina y calcio para un crecimiento sano y firme.',
        price: 10500,
        durationMinutes: 60,
        category: 'Elegidos',
        image: '🌱'
      },
      {
        id: 'spa-manos-premium',
        name: 'Spa de Manos Luxury',
        description: 'Exfoliación con sales marinas, mascarilla hidratante, masaje relajante y esmaltado de alta gama.',
        price: 8500,
        durationMinutes: 60,
        category: 'Promos',
        image: '🧖‍♀️'
      }
    ],
    staff: [
      {
        id: 'valeria-m',
        name: 'Valeria Marín',
        role: 'Master Nail Educator',
        image: '👩‍🏫',
        rating: 5.0,
        reviewsCount: 82,
        specialty: 'Esculpidas complejas y reconstrucción ungueal'
      },
      {
        id: 'ana-p',
        name: 'Ana Piazza',
        role: 'Especialista en Diseños',
        image: '👩‍🎨',
        rating: 4.8,
        reviewsCount: 38,
        specialty: 'Micro-pintura y esmaltado de precisión'
      }
    ],
    coverImage: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?q=80&w=1000&auto=format&fit=crop',
    collaborators: [
      { id: 'col-3', name: 'Valeria Staff', username: 'valestaff', password: '123' }
    ]
  },
  {
    id: 'boho-organic',
    name: 'Boho Organic Nail Spa',
    slogan: 'Estética minimalista y cuidado consciente 🌿',
    logo: '🪵',
    address: 'Calle Florida 450, Microcentro',
    phone: '11-5555-4444',
    email: 'info@bohoorganic.com',
    rating: 4.85,
    reviewsCount: 95,
    colorTheme: {
      primary: 'bg-[#A68064]',
      primaryHover: 'hover:bg-[#8F6C52]',
      accent: 'text-[#A68064]',
      bgMain: 'bg-[#FAF7F2]',
      bgCard: 'bg-white',
      textPrimary: 'text-[#4A3425]',
      textAccent: 'text-[#7D5F48]',
      borderColor: 'border-[#F0E6D8]'
    },
    services: [
      {
        id: 'vegan-classic',
        name: 'Manicuría 10-Free Cruelty-Free',
        description: 'Esmaltado tradicional premium utilizando lacas libres de los 10 químicos más tóxicos habituales.',
        price: 6000,
        durationMinutes: 45,
        category: 'Elegidos',
        image: '🍃'
      },
      {
        id: 'argan-spa',
        name: 'Terapia de Aceite de Argán',
        description: 'Inmersión tibia de aceites orgánicos prensados en frío para reparar manos extremadamente secas o castigadas.',
        price: 7500,
        durationMinutes: 50,
        category: 'Promos',
        image: '💧'
      },
      {
        id: 'boho-art',
        name: 'Nail Art Botánico',
        description: 'Diseños minimalistas inspirados en la naturaleza: hojas silvestres, flores sutiles y texturas mate.',
        price: 9800,
        durationMinutes: 80,
        category: 'Nuevos',
        image: '🌾',
        isNew: true
      }
    ],
    staff: [
      {
        id: 'florencia-b',
        name: 'Florencia B.',
        role: 'Nail Holistic Care',
        image: '🧘‍♀️',
        rating: 4.9,
        reviewsCount: 53,
        specialty: 'Tratamientos botánicos y masajes reflexógenos'
      },
      {
        id: 'luciana-s',
        name: 'Luciana Silva',
        role: 'Nail Designer',
        image: '👩‍🎤',
        rating: 4.8,
        reviewsCount: 42,
        specialty: 'Estilo Boho y acuarelas minimalistas'
      }
    ],
    coverImage: 'https://images.unsplash.com/photo-1519014816548-bf5fe059798b?q=80&w=1000&auto=format&fit=crop',
    collaborators: [
      { id: 'col-4', name: 'Luciana Staff', username: 'bohostaff', password: '123' }
    ]
  }
];

export const INITIAL_CLIENTS: ClientProfile[] = [
  {
    id: 'cli-1',
    name: 'Clara Domínguez',
    phone: '11-3004-9988',
    email: 'clara.dom@gmail.com',
    preferences: 'Uñas tipo Almond, prefiere efecto aurora en tonos rosas pálidos.',
    totalSpent: 35500,
    visitsCount: 3,
    lastVisitDate: '2026-06-20'
  },
  {
    id: 'cli-2',
    name: 'Belén Rodríguez',
    phone: '11-4433-2211',
    email: 'belu_rod@outlook.com',
    preferences: 'Soft gel extra largo tipo Coffin. Diseños neón y apliques de pedrería.',
    totalSpent: 58000,
    visitsCount: 4,
    lastVisitDate: '2026-06-28'
  },
  {
    id: 'cli-3',
    name: 'Jimena Castro',
    phone: '11-5050-6060',
    email: 'jime_castro@gmail.com',
    preferences: 'Kapping gel natural, largo corto. No le gustan las cutículas muy recortadas.',
    totalSpent: 18000,
    visitsCount: 2,
    lastVisitDate: '2026-06-15'
  },
  {
    id: 'cli-4',
    name: 'Sofía Martínez',
    phone: '11-6223-9991',
    email: 'sofiam@gmail.com',
    preferences: 'Esmaltado semipermanente negro brillante o rojo clásico.',
    totalSpent: 13600,
    visitsCount: 2,
    lastVisitDate: '2026-06-29'
  }
];

export const INITIAL_APPOINTMENTS: Appointment[] = [
  {
    id: 'apt-101',
    salonId: 'bellas-unas',
    salonName: 'Bellas Uñas',
    clientName: 'Clara Domínguez',
    clientPhone: '11-3004-9988',
    clientEmail: 'clara.dom@gmail.com',
    serviceId: 'aurora-effect',
    serviceName: 'Efecto aurora',
    price: 10500,
    staffId: 'sofia-ruiz',
    staffName: 'Sofía Ruiz',
    date: '2026-07-02',
    time: '16:30',
    status: 'Confirmado',
    notes: 'Viene por primera vez recomendada por Instagram. Quiere base rosa translúcido.',
    createdAt: '2026-06-30T10:15:00Z'
  },
  {
    id: 'apt-102',
    salonId: 'bellas-unas',
    salonName: 'Bellas Uñas',
    clientName: 'Belén Rodríguez',
    clientPhone: '11-4433-2211',
    clientEmail: 'belu_rod@outlook.com',
    serviceId: 'soft-gel-largo',
    serviceName: 'Soft Gel + Nail Art',
    price: 14500,
    staffId: 'maria-g',
    staffName: 'María González',
    date: '2026-07-02',
    time: '18:00',
    status: 'Pendiente',
    notes: 'Cambio de set completo. Quiere uñas súper esculpidas.',
    createdAt: '2026-07-01T15:20:00Z'
  },
  {
    id: 'apt-103',
    salonId: 'bellas-unas',
    salonName: 'Bellas Uñas',
    clientName: 'Jimena Castro',
    clientPhone: '11-5050-6060',
    clientEmail: 'jime_castro@gmail.com',
    serviceId: 'manicuria-rusa',
    serviceName: 'Manicuría Rusa + Kapping',
    price: 9000,
    staffId: 'camila-l',
    staffName: 'Camila López',
    date: '2026-07-03',
    time: '10:00',
    status: 'Confirmado',
    notes: 'Kapping gel mantenimiento mensual.',
    createdAt: '2026-06-29T11:40:00Z'
  },
  {
    id: 'apt-104',
    salonId: 'bellas-unas',
    salonName: 'Bellas Uñas',
    clientName: 'Sofía Martínez',
    clientPhone: '11-6223-9991',
    clientEmail: 'sofiam@gmail.com',
    serviceId: 'semipermanente-clasica',
    serviceName: 'Esmaltado Semipermanente',
    price: 6800,
    staffId: 'camila-l',
    staffName: 'Camila López',
    date: '2026-07-01',
    time: '15:00',
    status: 'Completado',
    notes: 'Color bordó clásico de invierno.',
    createdAt: '2026-06-28T09:30:00Z'
  },
  {
    id: 'apt-105',
    salonId: 'bellas-unas',
    salonName: 'Bellas Uñas',
    clientName: 'Mariana Flores',
    clientPhone: '11-3444-1234',
    clientEmail: 'marianita@gmail.com',
    serviceId: 'aurora-effect',
    serviceName: 'Efecto aurora',
    price: 10500,
    staffId: 'sofia-ruiz',
    staffName: 'Sofía Ruiz',
    date: '2026-06-30',
    time: '11:30',
    status: 'Completado',
    notes: '',
    createdAt: '2026-06-25T14:30:00Z'
  },
  {
    id: 'apt-106',
    salonId: 'bellas-unas',
    salonName: 'Bellas Uñas',
    clientName: 'Valeria S.',
    clientPhone: '11-9999-8888',
    clientEmail: 'vale@hotmail.com',
    serviceId: 'soft-gel-largo',
    serviceName: 'Soft Gel + Nail Art',
    price: 14500,
    staffId: 'maria-g',
    staffName: 'María González',
    date: '2026-06-29',
    time: '17:00',
    status: 'Completado',
    notes: '',
    createdAt: '2026-06-24T12:00:00Z'
  },
  // Emerald Lounge appointments to seed reports
  {
    id: 'apt-201',
    salonId: 'emerald-lounge',
    salonName: 'Emerald Lounge',
    clientName: 'Delfina Blaquier',
    clientPhone: '11-3322-1100',
    clientEmail: 'delfi@blaquier.com',
    serviceId: 'emerald-luxury',
    serviceName: 'Royal Sculpting & Gold Art',
    price: 22000,
    staffId: 'valeria-m',
    staffName: 'Valeria Marín',
    date: '2026-07-02',
    time: '14:00',
    status: 'Confirmado',
    notes: 'Quiere cristales Swarovski adicionales en las uñas anulares.',
    createdAt: '2026-06-28T16:00:00Z'
  },
  {
    id: 'apt-202',
    salonId: 'emerald-lounge',
    salonName: 'Emerald Lounge',
    clientName: 'Inés Peralta',
    clientPhone: '11-5555-7777',
    clientEmail: 'inesp@gmail.com',
    serviceId: 'french-moderno',
    serviceName: 'Frenchie Moderno',
    price: 11000,
    staffId: 'ana-p',
    staffName: 'Ana Piazza',
    date: '2026-07-02',
    time: '16:00',
    status: 'Confirmado',
    notes: 'Línea de francesita doble en oro rosa.',
    createdAt: '2026-07-01T09:15:00Z'
  }
];

export const INITIAL_FINANCIALS: Array<{ period: string; revenue: number; appointmentsCount: number; completedCount: number }> = [
  { period: 'Feb 2026', revenue: 210000, appointmentsCount: 22, completedCount: 21 },
  { period: 'Mar 2026', revenue: 285000, appointmentsCount: 30, completedCount: 28 },
  { period: 'Abr 2026', revenue: 320000, appointmentsCount: 34, completedCount: 33 },
  { period: 'May 2026', revenue: 410000, appointmentsCount: 45, completedCount: 42 },
  { period: 'Jun 2026', revenue: 485000, appointmentsCount: 52, completedCount: 50 },
  { period: 'Jul 2026', revenue: 145200, appointmentsCount: 16, completedCount: 12 } // Parcial
];
