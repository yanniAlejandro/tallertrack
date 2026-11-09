/**
 * Catálogo de datos realistas para la demo de "TecnoFix, reparación de
 * celulares, Cerro". Precios en USD orientativos del mercado habanero.
 */
import type { CategoriaPieza } from '@/domain/inventario';
import type { TipoEquipo } from '@/domain/esquemas';

export const CONTRASENA_DEMO = 'demo1234';

export const USUARIOS_DEMO = [
  { email: 'admin@demo.cu', nombre: 'Ernesto Valdés Carrillo', rol: 'admin', telefono: '52345678' },
  { email: 'raul@demo.cu', nombre: 'Raúl Echevarría Soto', rol: 'tecnico', telefono: '53817264' },
  { email: 'dayron@demo.cu', nombre: 'Dayron Castillo Mena', rol: 'tecnico', telefono: '58124590' },
  {
    email: 'yusniel@demo.cu',
    nombre: 'Yusniel Herrera Ponce',
    rol: 'tecnico',
    telefono: '54471023',
  },
  {
    email: 'lisandra@demo.cu',
    nombre: 'Lisandra Morales Díaz',
    rol: 'tecnico',
    telefono: '56338817',
  },
] as const;

export const AJUSTES_DEMO = {
  nombre_negocio: 'TecnoFix',
  direccion: 'Calzada del Cerro No. 1520, e/ Tulipán y Palatino, Cerro, La Habana',
  whatsapp: '52345678',
  dias_garantia_default: 30,
  pie_ticket:
    'La garantía cubre solo la reparación realizada; no cubre golpes, humedad ni manipulación por terceros. Equipos no recogidos en 60 días se consideran abandonados.',
};

/** Historial de la tasa informal (CUP por 1 USD) en los últimos 90 días. */
export const TASAS_DEMO: Array<{ haceDias: number; cup: number }> = [
  { haceDias: 92, cup: 335 },
  { haceDias: 61, cup: 345 },
  { haceDias: 33, cup: 355 },
  { haceDias: 6, cup: 360 },
];

export interface PiezaCatalogo {
  sku: string;
  nombre: string;
  categoria: CategoriaPieza;
  compatible_con: string;
  costo_usd: number;
  precio_usd: number;
  stock: number;
  stock_minimo: number;
}

export const PIEZAS_DEMO: PiezaCatalogo[] = [
  // Pantallas
  {
    sku: 'PAN-IP11',
    nombre: 'Pantalla iPhone 11 (incell)',
    categoria: 'pantalla',
    compatible_con: 'iPhone 11',
    costo_usd: 28,
    precio_usd: 45,
    stock: 4,
    stock_minimo: 2,
  },
  {
    sku: 'PAN-IP12',
    nombre: 'Pantalla iPhone 12 / 12 Pro (OLED)',
    categoria: 'pantalla',
    compatible_con: 'iPhone 12, iPhone 12 Pro',
    costo_usd: 45,
    precio_usd: 70,
    stock: 2,
    stock_minimo: 1,
  },
  {
    sku: 'PAN-IP13',
    nombre: 'Pantalla iPhone 13 (OLED)',
    categoria: 'pantalla',
    compatible_con: 'iPhone 13',
    costo_usd: 60,
    precio_usd: 90,
    stock: 1,
    stock_minimo: 1,
  },
  {
    sku: 'PAN-IPXR',
    nombre: 'Pantalla iPhone XR',
    categoria: 'pantalla',
    compatible_con: 'iPhone XR',
    costo_usd: 25,
    precio_usd: 40,
    stock: 3,
    stock_minimo: 1,
  },
  {
    sku: 'PAN-SA12',
    nombre: 'Pantalla Samsung Galaxy A12 con marco',
    categoria: 'pantalla',
    compatible_con: 'Galaxy A12',
    costo_usd: 14,
    precio_usd: 25,
    stock: 6,
    stock_minimo: 3,
  },
  {
    sku: 'PAN-SA32',
    nombre: 'Pantalla Samsung Galaxy A32 (OLED)',
    categoria: 'pantalla',
    compatible_con: 'Galaxy A32',
    costo_usd: 22,
    precio_usd: 38,
    stock: 2,
    stock_minimo: 2,
  },
  {
    sku: 'PAN-SA54',
    nombre: 'Pantalla Samsung Galaxy A54 (OLED)',
    categoria: 'pantalla',
    compatible_con: 'Galaxy A54',
    costo_usd: 40,
    precio_usd: 65,
    stock: 1,
    stock_minimo: 1,
  },
  {
    sku: 'PAN-SA04S',
    nombre: 'Pantalla Samsung Galaxy A04s',
    categoria: 'pantalla',
    compatible_con: 'Galaxy A04s',
    costo_usd: 13,
    precio_usd: 24,
    stock: 5,
    stock_minimo: 2,
  },
  {
    sku: 'PAN-RN10',
    nombre: 'Pantalla Xiaomi Redmi Note 10 (AMOLED)',
    categoria: 'pantalla',
    compatible_con: 'Redmi Note 10',
    costo_usd: 18,
    precio_usd: 32,
    stock: 3,
    stock_minimo: 2,
  },
  {
    sku: 'PAN-RN11',
    nombre: 'Pantalla Xiaomi Redmi Note 11',
    categoria: 'pantalla',
    compatible_con: 'Redmi Note 11',
    costo_usd: 19,
    precio_usd: 34,
    stock: 4,
    stock_minimo: 2,
  },
  {
    sku: 'PAN-RN12',
    nombre: 'Pantalla Xiaomi Redmi Note 12',
    categoria: 'pantalla',
    compatible_con: 'Redmi Note 12',
    costo_usd: 22,
    precio_usd: 38,
    stock: 0,
    stock_minimo: 2,
  },
  {
    sku: 'PAN-R9A',
    nombre: 'Pantalla Xiaomi Redmi 9A / 9C',
    categoria: 'pantalla',
    compatible_con: 'Redmi 9A, Redmi 9C',
    costo_usd: 11,
    precio_usd: 20,
    stock: 7,
    stock_minimo: 3,
  },
  {
    sku: 'PAN-MG22',
    nombre: 'Pantalla Motorola Moto G22',
    categoria: 'pantalla',
    compatible_con: 'Moto G22',
    costo_usd: 15,
    precio_usd: 28,
    stock: 2,
    stock_minimo: 1,
  },
  {
    sku: 'PAN-ME13',
    nombre: 'Pantalla Motorola Moto E13',
    categoria: 'pantalla',
    compatible_con: 'Moto E13',
    costo_usd: 12,
    precio_usd: 22,
    stock: 3,
    stock_minimo: 1,
  },
  // Baterías
  {
    sku: 'BAT-IP11',
    nombre: 'Batería iPhone 11 (3110 mAh)',
    categoria: 'bateria',
    compatible_con: 'iPhone 11',
    costo_usd: 12,
    precio_usd: 22,
    stock: 5,
    stock_minimo: 2,
  },
  {
    sku: 'BAT-IPXR',
    nombre: 'Batería iPhone XR (2942 mAh)',
    categoria: 'bateria',
    compatible_con: 'iPhone XR',
    costo_usd: 11,
    precio_usd: 20,
    stock: 2,
    stock_minimo: 2,
  },
  {
    sku: 'BAT-SA12',
    nombre: 'Batería Samsung A12 / A32 (5000 mAh)',
    categoria: 'bateria',
    compatible_con: 'Galaxy A12, Galaxy A32',
    costo_usd: 8,
    precio_usd: 15,
    stock: 8,
    stock_minimo: 3,
  },
  {
    sku: 'BAT-SA04S',
    nombre: 'Batería Samsung A04s (5000 mAh)',
    categoria: 'bateria',
    compatible_con: 'Galaxy A04s',
    costo_usd: 8,
    precio_usd: 15,
    stock: 4,
    stock_minimo: 2,
  },
  {
    sku: 'BAT-BN59',
    nombre: 'Batería Xiaomi BN59 (Redmi Note 10)',
    categoria: 'bateria',
    compatible_con: 'Redmi Note 10',
    costo_usd: 8,
    precio_usd: 15,
    stock: 6,
    stock_minimo: 2,
  },
  {
    sku: 'BAT-BN56',
    nombre: 'Batería Xiaomi BN56 (Redmi 9A / 9C)',
    categoria: 'bateria',
    compatible_con: 'Redmi 9A, Redmi 9C',
    costo_usd: 7,
    precio_usd: 13,
    stock: 9,
    stock_minimo: 3,
  },
  {
    sku: 'BAT-MG22',
    nombre: 'Batería Motorola Moto G22 / E13',
    categoria: 'bateria',
    compatible_con: 'Moto G22, Moto E13',
    costo_usd: 8,
    precio_usd: 15,
    stock: 1,
    stock_minimo: 2,
  },
  // Puertos de carga
  {
    sku: 'PUE-SA12',
    nombre: 'Placa de carga USB-C Samsung A12',
    categoria: 'puerto_carga',
    compatible_con: 'Galaxy A12',
    costo_usd: 4,
    precio_usd: 10,
    stock: 10,
    stock_minimo: 3,
  },
  {
    sku: 'PUE-SA32',
    nombre: 'Placa de carga USB-C Samsung A32',
    categoria: 'puerto_carga',
    compatible_con: 'Galaxy A32',
    costo_usd: 5,
    precio_usd: 12,
    stock: 4,
    stock_minimo: 2,
  },
  {
    sku: 'PUE-RN10',
    nombre: 'Placa de carga USB-C Redmi Note 10 / 11',
    categoria: 'puerto_carga',
    compatible_con: 'Redmi Note 10, Redmi Note 11',
    costo_usd: 4,
    precio_usd: 10,
    stock: 6,
    stock_minimo: 2,
  },
  {
    sku: 'PUE-R9A',
    nombre: 'Placa de carga micro-USB Redmi 9A',
    categoria: 'puerto_carga',
    compatible_con: 'Redmi 9A',
    costo_usd: 3,
    precio_usd: 8,
    stock: 12,
    stock_minimo: 3,
  },
  {
    sku: 'PUE-IP11',
    nombre: 'Flex de carga Lightning iPhone 11',
    categoria: 'puerto_carga',
    compatible_con: 'iPhone 11',
    costo_usd: 7,
    precio_usd: 15,
    stock: 2,
    stock_minimo: 1,
  },
  // Otros
  {
    sku: 'CAM-IP11',
    nombre: 'Cámara trasera iPhone 11',
    categoria: 'camara',
    compatible_con: 'iPhone 11',
    costo_usd: 18,
    precio_usd: 32,
    stock: 1,
    stock_minimo: 1,
  },
  {
    sku: 'FLX-SA32',
    nombre: 'Flex botón de encendido y volumen Samsung A32',
    categoria: 'flex',
    compatible_con: 'Galaxy A32',
    costo_usd: 2.5,
    precio_usd: 7,
    stock: 5,
    stock_minimo: 2,
  },
  {
    sku: 'OTR-RN11',
    nombre: 'Auricular (altavoz de llamada) Redmi Note 11',
    categoria: 'otro',
    compatible_con: 'Redmi Note 11',
    costo_usd: 3,
    precio_usd: 8,
    stock: 4,
    stock_minimo: 1,
  },
  {
    sku: 'OTR-IP11T',
    nombre: 'Tapa trasera de cristal iPhone 11',
    categoria: 'otro',
    compatible_con: 'iPhone 11',
    costo_usd: 6,
    precio_usd: 14,
    stock: 3,
    stock_minimo: 1,
  },
];

export interface ModeloCatalogo {
  tipo: TipoEquipo;
  marca: string;
  modelo: string;
  /** Peso relativo: lo más común en la calle sale más. */
  peso: number;
  colores: string[];
}

export const MODELOS_DEMO: ModeloCatalogo[] = [
  {
    tipo: 'celular',
    marca: 'Samsung',
    modelo: 'Galaxy A12',
    peso: 8,
    colores: ['Negro', 'Azul', 'Blanco'],
  },
  {
    tipo: 'celular',
    marca: 'Samsung',
    modelo: 'Galaxy A32',
    peso: 6,
    colores: ['Negro', 'Violeta', 'Azul'],
  },
  {
    tipo: 'celular',
    marca: 'Samsung',
    modelo: 'Galaxy A04s',
    peso: 4,
    colores: ['Negro', 'Verde'],
  },
  {
    tipo: 'celular',
    marca: 'Samsung',
    modelo: 'Galaxy A54',
    peso: 2,
    colores: ['Grafito', 'Lima'],
  },
  {
    tipo: 'celular',
    marca: 'Xiaomi',
    modelo: 'Redmi Note 10',
    peso: 6,
    colores: ['Gris', 'Blanco'],
  },
  {
    tipo: 'celular',
    marca: 'Xiaomi',
    modelo: 'Redmi Note 11',
    peso: 6,
    colores: ['Gris grafito', 'Azul'],
  },
  {
    tipo: 'celular',
    marca: 'Xiaomi',
    modelo: 'Redmi Note 12',
    peso: 4,
    colores: ['Gris', 'Verde menta'],
  },
  {
    tipo: 'celular',
    marca: 'Xiaomi',
    modelo: 'Redmi 9A',
    peso: 7,
    colores: ['Gris', 'Verde', 'Azul'],
  },
  {
    tipo: 'celular',
    marca: 'Apple',
    modelo: 'iPhone 11',
    peso: 5,
    colores: ['Negro', 'Blanco', 'Rojo'],
  },
  {
    tipo: 'celular',
    marca: 'Apple',
    modelo: 'iPhone XR',
    peso: 3,
    colores: ['Negro', 'Azul', 'Coral'],
  },
  { tipo: 'celular', marca: 'Apple', modelo: 'iPhone 12', peso: 2, colores: ['Negro', 'Azul'] },
  {
    tipo: 'celular',
    marca: 'Apple',
    modelo: 'iPhone 13',
    peso: 1,
    colores: ['Medianoche', 'Rosa'],
  },
  {
    tipo: 'celular',
    marca: 'Motorola',
    modelo: 'Moto G22',
    peso: 3,
    colores: ['Negro cósmico', 'Azul'],
  },
  { tipo: 'celular', marca: 'Motorola', modelo: 'Moto E13', peso: 2, colores: ['Negro', 'Verde'] },
  {
    tipo: 'celular',
    marca: 'Huawei',
    modelo: 'Y9 2019',
    peso: 2,
    colores: ['Negro', 'Azul aurora'],
  },
  { tipo: 'tablet', marca: 'Samsung', modelo: 'Galaxy Tab A7', peso: 1, colores: ['Gris'] },
  { tipo: 'laptop', marca: 'Lenovo', modelo: 'IdeaPad 3', peso: 1, colores: ['Gris'] },
];

export interface FallaCatalogo {
  texto: string;
  categoria: CategoriaPieza | null;
  manoObra: [number, number];
  /** Probabilidad de que no tenga arreglo. */
  riesgo: number;
}

export const FALLAS_DEMO: FallaCatalogo[] = [
  {
    texto: 'Pantalla rota tras una caída, el táctil responde a medias',
    categoria: 'pantalla',
    manoObra: [5, 10],
    riesgo: 0,
  },
  {
    texto: 'Pantalla con líneas verdes y manchas negras',
    categoria: 'pantalla',
    manoObra: [5, 10],
    riesgo: 0.05,
  },
  {
    texto: 'Cristal partido, la imagen se ve bien',
    categoria: 'pantalla',
    manoObra: [5, 8],
    riesgo: 0,
  },
  {
    texto: 'La batería se descarga muy rápido y se apaga al 20 %',
    categoria: 'bateria',
    manoObra: [3, 6],
    riesgo: 0,
  },
  {
    texto: 'Batería hinchada, la pantalla se está despegando',
    categoria: 'bateria',
    manoObra: [4, 8],
    riesgo: 0,
  },
  {
    texto: 'No carga, hay que mover el cable para que coja corriente',
    categoria: 'puerto_carga',
    manoObra: [4, 8],
    riesgo: 0,
  },
  {
    texto: 'El puerto de carga está flojo y no reconoce el cable',
    categoria: 'puerto_carga',
    manoObra: [4, 8],
    riesgo: 0,
  },
  {
    texto: 'Se mojó con agua de lluvia y no enciende',
    categoria: null,
    manoObra: [10, 25],
    riesgo: 0.45,
  },
  { texto: 'No enciende, ni siquiera vibra', categoria: null, manoObra: [10, 30], riesgo: 0.35 },
  {
    texto: 'Se reinicia solo cada pocos minutos',
    categoria: null,
    manoObra: [8, 15],
    riesgo: 0.15,
  },
  { texto: 'Cámara trasera borrosa, no enfoca', categoria: 'camara', manoObra: [5, 10], riesgo: 0 },
  { texto: 'El botón de encendido no responde', categoria: 'flex', manoObra: [5, 8], riesgo: 0 },
  {
    texto: 'No se escucha a la otra persona en las llamadas',
    categoria: 'otro',
    manoObra: [4, 6],
    riesgo: 0,
  },
  { texto: 'Tapa trasera de cristal rota', categoria: 'otro', manoObra: [4, 8], riesgo: 0 },
  {
    texto: 'Olvidó el patrón y el equipo está bloqueado; quiere conservar las fotos',
    categoria: null,
    manoObra: [10, 15],
    riesgo: 0.3,
  },
  {
    texto: 'No da señal de cobertura, dice "Sin servicio"',
    categoria: null,
    manoObra: [8, 20],
    riesgo: 0.25,
  },
];

export const ESTADOS_FISICOS = [
  'Rayones leves en el marco',
  'Esquina superior izquierda abollada',
  'Tapa trasera con fisura',
  'Buen estado general',
  'Protector de pantalla roto',
  'Le falta el tornillo inferior',
  'Marco despegado por un lado',
  'Desgaste normal de uso',
];

export const NOMBRES = {
  femeninos: [
    'Yanelis',
    'Dayana',
    'Yusleidy',
    'Marisleidys',
    'Odalys',
    'Yaimara',
    'Liset',
    'Arianna',
    'Daylin',
    'Mayelín',
    'Yamilé',
    'Lianet',
    'Niurka',
    'Yudith',
    'Annia',
    'Claudia',
  ],
  masculinos: [
    'Yoandry',
    'Alexei',
    'Osmany',
    'Yordanis',
    'Reinier',
    'Yasmany',
    'Adrián',
    'Ernesto',
    'Lázaro',
    'Dariel',
    'Yunior',
    'Orlando',
    'Maikel',
    'Raidel',
    'Jorge Luis',
    'Leandro',
  ],
  apellidos: [
    'Rodríguez',
    'González',
    'Hernández',
    'Pérez',
    'García',
    'Martínez',
    'Díaz',
    'Fernández',
    'Álvarez',
    'Sánchez',
    'Ramírez',
    'Cruz',
    'Gómez',
    'Reyes',
    'Morales',
    'Torres',
    'Castillo',
    'Ortiz',
    'Valdés',
    'Suárez',
    'Cabrera',
    'Fonseca',
    'Pupo',
    'Leyva',
    'Batista',
    'Sosa',
  ],
};

/** Municipios con más clientes cerca de un taller en el Cerro. */
export const MUNICIPIOS_PONDERADOS: Array<[string, number]> = [
  ['Cerro', 10],
  ['Plaza de la Revolución', 5],
  ['Centro Habana', 5],
  ['Diez de Octubre', 4],
  ['Playa', 2],
  ['Habana Vieja', 2],
  ['Boyeros', 2],
  ['Marianao', 1],
  ['La Lisa', 1],
  ['Arroyo Naranjo', 1],
];

export const NOTAS_INTERNAS = [
  'Cliente pide que se le avise antes de cambiar cualquier pieza.',
  'Se probó con otra batería y el fallo persiste: revisar placa.',
  'Pieza pedida al proveedor de la calle Monte, llega en 2-3 días.',
  'Equipo con reparación previa en otro taller (tornillos cambiados).',
  'Limpieza por humedad hecha; esperar 24 h antes de probar.',
  'Cliente pagó la mitad por adelantado.',
];

export const NOTAS_PUBLICAS = [
  'Ya tenemos la pieza; empezamos la reparación hoy.',
  'Estamos haciendo las pruebas finales de su equipo.',
  'La pieza llegó con defecto, pedimos otra. Disculpe la demora.',
];
