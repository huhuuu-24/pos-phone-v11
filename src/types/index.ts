export type ProductCategory = 'phone' | 'accessory' | 'service';

export interface Product {
id?: number;
sku?: string;
category: ProductCategory;
brand: string;
model: string;
color: string;
config: string;
barcode: string;
costPrice: number;
sellingPrice: number;
stockQty: number;
createdAt: string;
}

export interface ProductWithStock extends Product {
stock: number;
}

export interface IMEIRecord {
id?: number;
imei: string;
productId: number;
status: 'available' | 'sold';
orderId?: number;
soldAt?: string;
}

export interface OrderItem {
productId: number;
category: ProductCategory;
imeiId: number | null;
imei: string;
brand: string;
model: string;
color: string;
config: string;
quantity: number;
sellingPrice: number;
costPrice: number;

// 一次性开单项目标记（可选）
isOneTimeItem?: boolean;
}

export interface Order {
id?: number;
items: OrderItem[];
paymentMethod: 'cash' | 'duitnow' | 'card';
totalAmount: number;
totalProfit: number;
createdAt: string;
showWarranty?: boolean;
warrantyText?: string;

// 订单类型：原收银台订单或一次性开单
orderType?: 'pos' | 'one-time';
}

export type View =
| 'pos'
| 'inventory'
| 'reports'
| 'backup'
| 'settings'
| 'one-time';

export type PaymentMethod =
| 'cash'
| 'duitnow'
| 'card';
