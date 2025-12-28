export const SCHEMA = {
    PRODUCTS: {
        SKU: 'sku',
        BRAND: 'marca',
        VERSION: 'modelo',
        REF: 'nombre',
        COST: 'costo',
        PRICE: 'precio',
        STOCK: 'stock_actual',
        PROVIDER: 'proveedor_nombre',
        PROVIDER_ID: 'proveedor_uid',
        IMAGE: 'imagen'
    },
    ORDERS: {
        ARCHIVED: 'is_archived',
        STATUS: 'estado',
        STRATEGY: 'estrategia',
        DATE: 'fecha',
        ID_ORDER: 'id_visual',
        SHIPPING_COST: 'envio_precio',
        TOTAL: 'total',
        PAYMENT_CLIENT: 'pago_cliente',
        ITEMS: 'items',
        CLIENT: {
            ROOT: 'cliente',
            NAME: 'nombre',
            TEL: 'telefono',
            CITY: 'ciudad',
            CITY_DELIVERY: 'ciudad_entrega',
            ADDRESS: 'direccion',
            IS_ACOPIO: 'es_acopio'
        },
        ITEM: {
            SKU: 'sku',
            MODEL: 'modelo',
            QTY: 'cantidad',
            COST: 'costo',
            PRICE: 'precio',
            TOTAL: 'total',
            TALLA: 'talla',
            PROVIDER: 'proveedor_nombre',
            PROVIDER_ID: 'proveedor_uid',
            IMAGE: 'imagen',
            UNIQUE_ID: 'unique_id',
            GUIDE: 'guia',
            PAGO_PROVEEDOR: 'pago_proveedor',
            PAGO_PARCIAL: 'pago_parcial'
        }
    },

    COVERAGE: {
        CITY: 'ciudad',
        CODE: 'codigo',
        TARIFF: 'tarifa',
        IS_ACOPIO: 'isAcopio',
        CARRIER: 'paqueteria'
    }
};