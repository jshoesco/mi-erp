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
    },

    FINANCES: {
        ROOT: 'finanzas',
        FLOW: 'flujo',         // 'ENTRADA' o 'SALIDA'
        CATEGORY: 'categoria', // 'PAGO_PROVEEDOR', 'VENTA', 'ENVIO', 'APORTE_CAPITAL', 'GASTO_OPERATIVO'
        AMOUNT: 'monto',
        ORDER_ID: 'pedido_id',
        GROUP_ID: 'lote_id',
        PROVIDER_ID: 'proveedor_uid',
        DATE: 'fecha_registro',
        METHOD: 'metodo_pago', // 'TRANSFERENCIA', 'EFECTIVO'
        DESCRIPTION: 'descripcion'
    },
    LOGISTICS: {
        STATUS: {
            PENDING: 'pago-pendiente',
            READY: 'por-despachar',
            SHIPPED: 'enviado'
        },
        ACTIONS: {
            OPEN_JOIN: 'open_join',
            PAY: 'pay',
            GUIDE: 'guide',
            SPLIT_ITEM: 'split_item',
            UNVEIL_ORDER: 'unveiled_order',
            UNVEIL_GROUP: 'unveiled_group',
            OPEN_SWAP: 'OPEN_SWAP',
        },
        MODAL_KEYS: {
            JOIN: 'join',
            PAYMENT: 'payment',
            SHIPPING: 'shipping',
            SWAP: 'swap',
        },
        SWAP_FIELDS: {
            HISTORY: 'swap_history',
            PREVIOUS_SKU: 'previous_sku',
            PREVIOUS_COST: 'previous_cost',
            DATE: 'swap_date'
        }
    }
};