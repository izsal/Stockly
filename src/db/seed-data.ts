export type DemoProductSeed = {
  sku: string
  barcode: string | null
  name: string
  categoryName: string
  unit: string
  costPrice: string
  sellingPrice: string
  minimumStock: number
  movements: Array<{
    type: 'IN' | 'OUT' | 'ADJUSTMENT'
    quantity: number
    reason: string
    supplierName?: string
    referenceNumber?: string
    notes?: string
  }>
}

export const DEMO_WORKSPACE = {
  name: 'Toko Berkah Jaya (Demo)',
  slug: 'demo-toko-berkah-jaya',
  warehouseName: 'Gudang Utama',
  warehouseCode: 'GDG-01',
  warehouseAddress: 'Jl. Melati No. 18, Jakarta Selatan',
} as const

export const DEMO_USERS = {
  owner: {
    name: 'Andi Wijaya (Owner)',
    email: 'owner@demo.stockly.id',
    role: 'OWNER' as const,
  },
  staff: {
    name: 'Siti Rahma (Staf)',
    email: 'staff@demo.stockly.id',
    role: 'STAFF' as const,
  },
} as const

export const DEMO_CATEGORIES = [
  { name: 'Minuman', description: 'Produk minuman siap saji, kopi, dan teh' },
  { name: 'Sembako', description: 'Bahan pokok harian seperti beras, gula, dan minyak' },
  { name: 'Makanan Ringan', description: 'Camilan kemasan dan biskuit' },
] as const

export const DEMO_SUPPLIERS = [
  {
    name: 'PT Sumber Makmur',
    phone: '021-5550101',
    email: 'order@sumbermakmur.co.id',
    address: 'Kawasan Pergudangan Cikarang Blok A4',
    notes: 'Supplier utama sembako dan minuman kemasan',
  },
  {
    name: 'CV Nusantara Jaya',
    phone: '021-5550202',
    email: 'sales@nusantarajaya.id',
    address: 'Jl. Industri Raya No. 22, Tangerang',
    notes: 'Pengiriman setiap Selasa dan Kamis',
  },
] as const

export const DEMO_PRODUCTS: readonly DemoProductSeed[] = [
  {
    sku: 'KOPI-01',
    barcode: '8991001000011',
    name: 'Kopi Arabika Gayo 250g',
    categoryName: 'Minuman',
    unit: 'pack',
    costPrice: '45000.00',
    sellingPrice: '65000.00',
    minimumStock: 10,
    movements: [
      {
        type: 'IN',
        quantity: 35,
        reason: 'PURCHASE',
        supplierName: 'CV Nusantara Jaya',
        referenceNumber: 'PO-DEMO-001',
        notes: 'Stok awal pembukaan toko demo',
      },
      {
        type: 'OUT',
        quantity: 11,
        reason: 'SALE',
        referenceNumber: 'INV-DEMO-001',
        notes: 'Penjualan minggu pertama',
      },
    ],
  },
  {
    sku: 'TEH-01',
    barcode: '8991001000028',
    name: 'Teh Melati Premium 500ml',
    categoryName: 'Minuman',
    unit: 'botol',
    costPrice: '4500.00',
    sellingPrice: '7000.00',
    minimumStock: 15,
    movements: [
      {
        type: 'IN',
        quantity: 30,
        reason: 'PURCHASE',
        supplierName: 'PT Sumber Makmur',
        referenceNumber: 'PO-DEMO-002',
      },
      {
        type: 'OUT',
        quantity: 22,
        reason: 'SALE',
        referenceNumber: 'INV-DEMO-002',
        notes: 'Pesanan katering kantor (stok menjadi menipis)',
      },
    ],
  },
  {
    sku: 'GULA-01',
    barcode: '8991001000035',
    name: 'Gula Pasir Putih 1kg',
    categoryName: 'Sembako',
    unit: 'kg',
    costPrice: '14500.00',
    sellingPrice: '17500.00',
    minimumStock: 12,
    movements: [
      {
        type: 'IN',
        quantity: 20,
        reason: 'PURCHASE',
        supplierName: 'PT Sumber Makmur',
        referenceNumber: 'PO-DEMO-003',
      },
      {
        type: 'OUT',
        quantity: 20,
        reason: 'SALE',
        referenceNumber: 'INV-DEMO-003',
        notes: 'Terjual habis pada promo akhir pekan',
      },
    ],
  },
  {
    sku: 'MINYAK-01',
    barcode: '8991001000042',
    name: 'Minyak Goreng Kelapa Sawit 2L',
    categoryName: 'Sembako',
    unit: 'pouch',
    costPrice: '31000.00',
    sellingPrice: '36500.00',
    minimumStock: 8,
    movements: [
      {
        type: 'IN',
        quantity: 24,
        reason: 'PURCHASE',
        supplierName: 'PT Sumber Makmur',
        referenceNumber: 'PO-DEMO-004',
      },
      {
        type: 'ADJUSTMENT',
        quantity: 22,
        reason: 'Stok opname mingguan',
        notes: 'Selisih 2 pouch kemasan bocor saat pengecekan rak',
      },
    ],
  },
  {
    sku: 'BISKUIT-01',
    barcode: null,
    name: 'Biskuit Cokelat Kelapa 180g',
    categoryName: 'Makanan Ringan',
    unit: 'bungkus',
    costPrice: '8500.00',
    sellingPrice: '12000.00',
    minimumStock: 10,
    movements: [
      {
        type: 'IN',
        quantity: 40,
        reason: 'PURCHASE',
        supplierName: 'CV Nusantara Jaya',
        referenceNumber: 'PO-DEMO-005',
      },
      {
        type: 'OUT',
        quantity: 35,
        reason: 'SALE',
        referenceNumber: 'INV-DEMO-004',
      },
    ],
  },
] as const

export function buildDemoMovementsForProduct(product: DemoProductSeed) {
  let runningQuantity = 0

  return product.movements.map((step) => {
    const quantityBefore = runningQuantity
    let quantityAfter = runningQuantity
    let quantityDelta = 0

    if (step.type === 'IN') {
      quantityDelta = step.quantity
      quantityAfter = quantityBefore + quantityDelta
    } else if (step.type === 'OUT') {
      quantityDelta = -step.quantity
      quantityAfter = quantityBefore + quantityDelta
    } else {
      quantityAfter = step.quantity
      quantityDelta = quantityAfter - quantityBefore
    }

    if (quantityAfter < 0) {
      throw new Error(`Seed fixture ${product.sku} produced negative stock`)
    }

    runningQuantity = quantityAfter

    return {
      ...step,
      quantityBefore,
      quantityDelta,
      quantityAfter,
    }
  })
}

