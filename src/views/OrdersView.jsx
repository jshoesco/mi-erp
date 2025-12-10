import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { useUI } from '../context/UIContext';
import { db, doc, writeBatch, collection, addDoc, updateDoc, deleteDoc } from '../lib/firebase';
import { formatCurrency, normalizeText, uploadToCloudinary } from '../lib/utils';

// Componentes UI
import Button from '../components/Button';
import Icon, { Spinner } from '../components/Icon';

// Modales Limpios
import GuideModal from '../components/modals/GuideModal';
import DeliveryModal from '../components/modals/DeliveryModal';
import PaymentModal from '../components/modals/PaymentModal';
import ClientPayModal from '../components/modals/ClientPayModal';
import AnomalyModal from '../components/modals/AnomalyModal';
import ResellModal from '../components/modals/ResellModal';
import OrderFormModal from '../components/modals/OrderFormModal';

const OrdersView = () => {
    // 1. DATOS GLOBALES (CORREGIDO: Usamos los nombres exactos del DataContext)
    const { 
        orders, 
        products, 
        shipping, 
        providers, 
        financeConfig, // Ya viene procesado, no usar [0]
        anomalyConfigData, 
        cloudConfig,   // Ya viene procesado, no usar [0]
        loading 
    } = useData();
    
    const { notify, confirmAction } = useUI();

    // 2. ESTADOS DE INTERFAZ
    const [tab, setTab] = useState('sales');
    const [searchText, setSearchText] = useState('');
    const [selectedOrderIds, setSelectedOrderIds] = useState([]); 

    // 3. ESTADOS DE MODALES Y FORMULARIOS
    // Edición Pedido
    const [orderModalOpen, setOrderModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [client, setClient] = useState({ nombre: '', telefono: '', direccion: '', ciudad: '', ciudad_entrega: '', es_acopio: false, estrategia: 'Directo', is_internal: false });
    const [cart, setCart] = useState([]);
    const [orderDate, setOrderDate] = useState(new Date().toISOString().slice(0, 10));
    
    // Logística
    const [guideModalOpen, setGuideModalOpen] = useState(false);
    const [guideForm, setGuideForm] = useState({ guide: '', date: new Date().toISOString().slice(0, 10), targetItems: [], costo: '', anticipado: false, metodo: '', transaction_id: '', imagen: '' });
    const [selectedGuideIds, setSelectedGuideIds] = useState([]);
    const [guideSearchText, setGuideSearchText] = useState('');
    
    const [deliveryModalOpen, setDeliveryModalOpen] = useState(false);
    const [deliveryForm, setDeliveryForm] = useState({ date: new Date().toISOString().slice(0, 10), items: [], costo_total: 0, ya_pagado: false, metodo: '', transaction_id: '', imagen: '' });
    
    // Pagos
    const [batchPayModalOpen, setBatchPayModalOpen] = useState(false);
    const [paymentForm, setPaymentForm] = useState({ metodo: '', monto: '', transaction_id: '', imagen: '' });
    const [batchItemsCandidates, setBatchItemsCandidates] = useState([]);
    const [selectedBatchIds, setSelectedBatchIds] = useState([]);
    const [individualAmounts, setIndividualAmounts] = useState({});
    const [paymentSearchText, setPaymentSearchText] = useState('');
    
    const [clientPayModalOpen, setClientPayModalOpen] = useState(false);
    const [clientPayForm, setClientPayForm] = useState({ metodo: '', monto: '', transaction_id: '', imagen: '' });
    const [currentOrder, setCurrentOrder] = useState(null);

    // Novedades
    const [anomalyModalOpen, setAnomalyModalOpen] = useState(false);
    const [anomalyItems, setAnomalyItems] = useState([]);
    const [selectedAnomalyIds, setSelectedAnomalyIds] = useState([]);
    const [anomalyDetails, setAnomalyDetails] = useState({});

    // Reventa
    const [resellModalOpen, setResellModalOpen] = useState(false);
    const [resellItem, setResellItem] = useState(null);
    const [resellForm, setResellForm] = useState({ precio: '', cliente: '', tipo_entrega: 'Personal', ciudad: '', metodo: '', transaction_id: '', imagen: '' });

    // Productos Manuales
    const [customItem, setCustomItem] = useState({ nombre: '', precio: '', costo: '', proveedor: '', talla: '', imagen: '', genero: 'Unisex' });
    const [isCustomMode, setIsCustomMode] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [itemSearch, setItemSearch] = useState('');
    const [saveToInventory, setSaveToInventory] = useState(true);

    // 4. MEMORIAS Y HELPERS
    // Validación de seguridad para financeConfig
    const safeMethods = financeConfig?.methods || [];
    
    const isBankProv = safeMethods.find(m => m.name === paymentForm.metodo)?.isBank;
    const isBankClient = safeMethods.find(m => m.name === clientPayForm.metodo)?.isBank;
    const isBankGuide = safeMethods.find(m => m.name === guideForm.metodo)?.isBank;
    const isBankResell = safeMethods.find(m => m.name === resellForm.metodo)?.isBank;

    const getToday = () => new Date().toISOString().slice(0, 10);
    
    const calculateItemDebt = (item) => Math.max(0, ((Number(item.costo)||0) + (Number(item.costo_envio_asignado)||0)) - (Number(item.pago_proveedor)||0));

    const clientHistory = useMemo(() => {
        const history = {};
        orders.forEach(o => { if (o.cliente?.telefono?.length > 5) history[o.cliente.telefono.trim()] = o.cliente; });
        return history;
    }, [orders]);

    const groupItemsByProvider = (items) => {
        const groups = {};
        items.forEach(item => {
            const pid = item.proveedor_uid || 'other';
            if (!groups[pid]) groups[pid] = { id: pid, name: item.proveedor_nombre || 'Externo', items: [], todosPagados: true };
            groups[pid].items.push(item);
            if (calculateItemDebt(item) > 0) groups[pid].todosPagados = false;
        });
        return Object.values(groups);
    };

    // 5. DATA FILTRADA (KANBAN)
    const filteredOrders = useMemo(() => {
        let res = orders;
        if (searchText) {
            const lower = searchText.toLowerCase();
            res = orders.filter(o => `${o.id_visual} ${o.cliente?.nombre}`.toLowerCase().includes(lower) || o.items.some(i => i.sku.toLowerCase().includes(lower)));
        }
        return res.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    }, [orders, searchText]);

    const salesKanban = useMemo(() => {
        const cols = { pendiente: [], despacho: [], enviado: [], completado: [], novedad: [] };
        filteredOrders.forEach(o => {
            const st = o.estado;
            const hasAnomaly = o.items.some(i => i.devolucion && i.devolucion.estado !== 'Resuelto' && i.devolucion.estado !== 'Revendido');
            if (hasAnomaly) cols.novedad.push(o);
            else if (['Devuelto', 'Rechazado'].includes(st)) cols.novedad.push(o);
            else if (st === 'Pendiente') cols.pendiente.push(o);
            else if (['En Despacho', 'Parcial'].includes(st)) cols.despacho.push(o);
            else if (st === 'Enviado') cols.enviado.push(o);
            else if (st === 'Completado') cols.completado.push(o);
            else cols.pendiente.push(o);
        });
        return cols;
    }, [filteredOrders]);

    const kanbanData = useMemo(() => {
        const columns = { pending: [], ready: [], shipped: [], delivered: [] };
        const grouped = {};
        filteredOrders.forEach(order => {
            if (order.estado === 'Devuelto') return;
            order.items.forEach((item, idx) => {
                if (item.devolucion) return;
                const provName = item.proveedor_nombre || 'Sin Prov';
                const normStrat = normalizeText(order.estrategia || 'Directo');
                const normCity = normalizeText(order.cliente?.ciudad_entrega || '');
                const targetId = item.linked_to_order_id || item.orderId || order.id;
                
                let key;
                if (item.fecha_entrega) key = `DELIVERED_${item.guia?.numero}_${item.fecha_entrega}`;
                else if (item.guia?.numero) key = `SHIPPED_${item.guia.numero}`;
                else key = normStrat.includes('acopio') ? `ACOPIO_${provName}_${normCity}` : `DIRECT_${provName}_${targetId}`;

                if (!grouped[key]) grouped[key] = { 
                    id: key, provName, city: order.cliente?.ciudad_entrega, estrategia: order.estrategia, 
                    items: [], totalDebt: 0, guideInfo: item.guia, isAcopio: normStrat.includes('acopio') 
                };
                
                grouped[key].items.push({ ...item, orderId: order.id, orderVisualId: order.id_visual, clientName: order.cliente?.nombre, itemIndex: idx, unique_id: item.unique_id || `temp-${idx}` });
                grouped[key].totalDebt += calculateItemDebt(item);
            });
        });
        Object.values(grouped).forEach(g => {
            if (g.guideInfo?.numero && g.items[0].fecha_entrega) columns.delivered.push(g);
            else if (g.guideInfo?.numero) columns.shipped.push(g);
            else if (g.totalDebt > 100) columns.pending.push(g);
            else columns.ready.push(g);
        });
        return columns;
    }, [filteredOrders]);

    const returnedItems = useMemo(() => {
        const list = [];
        orders.forEach(order => {
            order.items.forEach(item => {
                if (item.devolucion && item.devolucion.estado !== 'Revendido') {
                    list.push({ ...item, orderDate: order.fecha, clientName: order.cliente?.nombre, city: order.cliente?.ciudad_entrega, orderId: order.id });
                }
            });
        });
        return list.sort((a, b) => new Date(b.devolucion.fecha) - new Date(a.devolucion.fecha));
    }, [orders]);

    // 6. FUNCIONES DE MODALES Y LOGICA
    const handleNewOrder = () => { setEditingId(null); setClient({ nombre: '', telefono: '', direccion: '', ciudad: '', ciudad_entrega: '', es_acopio: false, estrategia: 'Directo', is_internal: false }); setCart([]); setOrderDate(getToday()); setOrderModalOpen(true); };
    const handleEditOrder = (order) => { setClient({ ...order.cliente, estrategia: order.estrategia || 'Directo' }); setCart(order.items); setOrderDate(order.fecha.slice(0, 10)); setEditingId(order.id); setOrderModalOpen(true); };
    const handlePhoneChange = (e) => { const val = e.target.value; const found = clientHistory[val]; if(found) { setClient(prev => ({...prev, telefono: val, nombre: found.nombre, direccion: found.direccion, ciudad: found.ciudad, ciudad_entrega: found.ciudad_entrega})); notify("Cliente encontrado", "info"); } else setClient({...client, telefono: val}); };
    const toggleInternalOrder = (e) => { const isInt = e.target.checked; setClient(prev => ({ ...prev, is_internal: isInt, nombre: isInt ? 'PEDIDO INTERNO' : '', telefono: isInt ? '0000000000' : '', direccion: isInt ? 'Bodega / Personal' : '' })); };
    const handleCityChange = (e) => { const val = e.target.value; const cityData = shipping.find(s => s.ciudad === val); if(cityData) setClient(prev => ({...prev, ciudad_entrega: val, es_acopio: cityData.tiene_acopio, estrategia: cityData.tiene_acopio ? 'Acopio' : 'Directo'})); else setClient(prev => ({...prev, ciudad_entrega: val})); };

    const submitOrder = async () => {
        if (!client.nombre || cart.length === 0) return notify("Faltan datos", "error");
        const cleanItems = cart.map(i => ({ ...i, precio: Number(i.precio), costo: Number(i.costo), cantidad: Number(i.cantidad), total: Number(i.total), costo_envio_asignado: 0 }));
        const payload = { cliente, items: cleanItems, total: cleanItems.reduce((s, i) => s + i.total, 0), pago_cliente: editingId ? (orders.find(o=>o.id===editingId)?.pago_cliente||0) : 0, estado: 'Pendiente', fecha: orderDate, id_visual: editingId ? (orders.find(o=>o.id===editingId)?.id_visual) : Date.now().toString().slice(-6), estrategia: client.estrategia };
        try { 
            if(editingId) await updateDoc(doc(db, 'pedidos', editingId), payload); 
            else await addDoc(collection(db, 'pedidos'), payload); 
            setOrderModalOpen(false); notify("Pedido guardado"); 
        } catch(e) { notify(e.message, "error"); }
    };

    const addToCart = (product, sizeOverride = '') => { setCart(prev => [...prev, { sku: product.sku, modelo: product.modelo, imagen: product.imagen, precio: product.precio, unique_id: crypto.randomUUID(), cantidad: 1, total: product.precio, proveedor_nombre: providers.find(p => p.id === product.proveedor_uid)?.nombre, proveedor_uid: product.proveedor_uid, pago_parcial: 0, costo: product.costo, pago_proveedor: 0, talla: sizeOverride }]); setItemSearch(''); };
    const updateCartItem = (index, field, value) => { setCart(prev => prev.map((item, i) => { if (i === index) { const updated = { ...item, [field]: value }; if (field === 'cantidad' || field === 'precio') { updated.total = (Number(updated.precio) || 0) * (Number(updated.cantidad) || 1); } return updated; } return item; })); };
    const handleDeleteOrder = async (id) => confirmAction({ title: "Eliminar Pedido", message: "¿Seguro?", onConfirm: async () => { await deleteDoc(doc(db, 'pedidos', id)); notify("Eliminado"); } });
    
    const handleCustomFile = async (file) => { if (!file || !cloudConfig.cloud_name) return notify("Falta config Cloudinary", "error"); setUploading(true); try { const res = await uploadToCloudinary(file, cloudConfig, `PROD-${Date.now()}`); setCustomItem(prev => ({ ...prev, imagen: res.secure_url })); } catch (e) { notify(e.message, "error"); } setUploading(false); };
    const handleCustomProviderChange = (e) => { const provId = e.target.value; const provData = providers.find(p => p.id === provId); if (provData) { const random = Math.floor(1000 + Math.random() * 9000); setCustomItem(prev => ({ ...prev, proveedor_uid: provId, sku: `${provData.id_custom}${random}` })); } else { setCustomItem(prev => ({ ...prev, proveedor_uid: provId })); } };
    const createAndAddProduct = async () => { if (!customItem.nombre && !customItem.modelo) return notify("Falta Nombre o Modelo", "error"); if (!customItem.precio) return notify("Falta Precio", "error"); setUploading(true); try { const newProduct = { sku: customItem.sku || `MANUAL-${Date.now().toString().slice(-4)}`, nombre: customItem.nombre || '', modelo: customItem.modelo || 'Generico', marca: customItem.marca || 'Generica', precio: Number(customItem.precio) || 0, costo: Number(customItem.costo) || 0, ganancia: (Number(customItem.precio) || 0) - (Number(customItem.costo) || 0), imagen: customItem.imagen || '', genero: customItem.genero || 'Unisex', proveedor_uid: customItem.proveedor_uid || '', compartido: false, status: 'Activo', fecha: getToday(), created_at: new Date().toISOString() }; let productToAdd = newProduct; if (saveToInventory) { const docRef = await addDoc(collection(db, 'productos'), newProduct); productToAdd = { ...newProduct, id: docRef.id }; notify("Producto creado y agregado"); } else { productToAdd = { ...newProduct, id: `GHOST-${Date.now()}` }; notify("Agregado al pedido (No guardado en catálogo)"); } addToCart(productToAdd, customItem.talla); setCustomItem({ sku: '', nombre: '', modelo: '', marca: '', precio: '', costo: '', proveedor_uid: '', imagen: '', genero: 'Unisex', talla: '' }); setIsCustomMode(false); } catch (e) { notify("Error: " + e.message, "error"); } setUploading(false); };

    // --- ACCIONES MASIVAS ---
    const toggleOrderSelection = (id) => { if (selectedOrderIds.includes(id)) setSelectedOrderIds(prev => prev.filter(x => x !== id)); else setSelectedOrderIds(prev => [...prev, id]); };
    const handleBulkOrderDelete = async () => { if (selectedOrderIds.length === 0) return; confirmAction({ title: `Eliminar ${selectedOrderIds.length} Pedidos`, message: "Esta acción es irreversible. ¿Seguro?", onConfirm: async () => { try { const batch = writeBatch(db); selectedOrderIds.forEach(id => { const ref = doc(db, 'pedidos', id); batch.delete(ref); }); await batch.commit(); notify(`${selectedOrderIds.length} pedidos eliminados`); setSelectedOrderIds([]); } catch (e) { notify("Error: " + e.message, "error"); } } }); };

    // --- LOGICA DE ENVÍO Y DEUDA ---
    const saveGuide = async () => {
        if (!guideForm.guide || selectedGuideIds.length === 0) return notify("Faltan datos", "error");
        try {
            const batch = writeBatch(db);
            const unitCost = Number(guideForm.costo) / selectedGuideIds.length;
            
            guideForm.targetItems.forEach(t => {
                if(selectedGuideIds.includes(t.unique_id)) {
                    const fullOrder = orders.find(o => o.id === t.orderId);
                    if(fullOrder) {
                        const newItems = fullOrder.items.map((item, idx) => {
                            if(idx === t.itemIndex) {
                                return {
                                    ...item,
                                    guia: { numero: guideForm.guide, fecha: guideForm.date, costo: unitCost, anticipado: guideForm.anticipado, metodo_pago: guideForm.metodo || '' },
                                    costo_envio_asignado: unitCost,
                                    pago_proveedor: guideForm.anticipado ? (Number(item.pago_proveedor)||0) + unitCost : item.pago_proveedor
                                };
                            }
                            return item;
                        });
                        const allShipped = newItems.every(it => it.guia && it.guia.numero);
                        batch.update(doc(db, 'pedidos', t.orderId), { items: newItems, estado: allShipped ? 'Enviado' : 'En Despacho' });
                    }
                }
            });
            if(guideForm.anticipado && Number(guideForm.costo) > 0) {
                batch.set(doc(collection(db, 'finanzas')), { tipo: 'Gasto', categoria: 'Envío', monto: Number(guideForm.costo), fecha: new Date().toISOString(), concepto: `Guía ${guideForm.guide}` });
            }
            await batch.commit(); notify("Guía guardada"); setGuideModalOpen(false);
        } catch(e) { notify(e.message, "error"); }
    };

    const deleteGuide = async () => {
        confirmAction({ title: "Borrar Guía", message: "Se eliminará la deuda de envío. ¿Seguro?", onConfirm: async () => {
            try {
                const batch = writeBatch(db);
                guideForm.targetItems.forEach(t => {
                    const fullOrder = orders.find(o => o.id === t.orderId);
                    if(fullOrder) {
                        const newItems = fullOrder.items.map((item, idx) => {
                            if(idx === t.itemIndex) {
                                const prevCost = Number(item.costo_envio_asignado) || 0;
                                return {
                                    ...item,
                                    guia: null,
                                    costo_envio_asignado: 0,
                                    pago_proveedor: item.guia?.anticipado ? Math.max(0, (Number(item.pago_proveedor)||0) - prevCost) : item.pago_proveedor
                                };
                            }
                            return item;
                        });
                        const allPaid = newItems.every(i => (Number(i.pago_proveedor)||0) >= ((Number(i.costo)||0) + (Number(i.costo_envio_asignado)||0)));
                        batch.update(doc(db, 'pedidos', t.orderId), { items: newItems, estado: allPaid ? 'En Despacho' : 'Pendiente' });
                    }
                });
                await batch.commit(); notify("Guía eliminada"); setGuideModalOpen(false);
            } catch(e) { notify(e.message, "error"); }
        }});
    };

    const saveDelivery = async () => {
        if (!deliveryForm.ya_pagado && Number(deliveryForm.costo_total) > 0 && !deliveryForm.metodo) return notify("Falta pago", "error");
        try {
            const batch = writeBatch(db);
            const amountPerItem = (!deliveryForm.ya_pagado && Number(deliveryForm.costo_total) > 0) ? (Number(deliveryForm.costo_total) / deliveryForm.items.length) : 0;
            
            if (amountPerItem > 0) {
                batch.set(doc(collection(db, 'finanzas')), { tipo: 'Gasto', categoria: 'Envío', monto: Number(deliveryForm.costo_total), fecha: new Date().toISOString(), concepto: `Contraentrega ${deliveryForm.items[0]?.guia?.numero}` });
            }

            const updates = {};
            deliveryForm.items.forEach(t => {
                if(!updates[t.orderId]) updates[t.orderId] = orders.find(o => o.id === t.orderId).items;
                const items = updates[t.orderId];
                if(items[t.itemIndex]) {
                    items[t.itemIndex] = {
                        ...items[t.itemIndex],
                        fecha_entrega: deliveryForm.date,
                        pago_proveedor: (Number(items[t.itemIndex].pago_proveedor)||0) + amountPerItem
                    };
                }
            });

            Object.keys(updates).forEach(oid => batch.update(doc(db, 'pedidos', oid), { items: updates[oid] }));
            await batch.commit(); notify("Entrega registrada"); setDeliveryModalOpen(false);
        } catch(e) { notify(e.message, "error"); }
    };

    // --- RENDERIZADORES ---
    const openGuide = (items) => {
        const total = items.reduce((sum, i) => sum + (Number(i.costo_envio_asignado) || 0), 0);
        setGuideForm({ guide: items[0].guia?.numero || '', date: getToday(), targetItems: items, costo: total || '', anticipado: !!items[0].guia?.anticipado });
        setSelectedGuideIds(items.map(i => i.unique_id));
        setGuideModalOpen(true);
    };

    const openDelivery = (items) => {
        const total = items.reduce((sum, i) => sum + (Number(i.guia?.costo) || 0), 0);
        setDeliveryForm({ date: getToday(), items, costo_total: total, ya_pagado: !!items[0].guia?.anticipado });
        setDeliveryModalOpen(true);
    };

    const openPayment = (items) => {
        setBatchItemsCandidates(items);
        setSelectedBatchIds(items.map(i => i.unique_id));
        setBatchPayModalOpen(true);
    };

    // --- VISTAS ---
    if (loading) return <div className="p-10 flex justify-center"><Spinner /></div>;

    return (
        <div className="h-full flex flex-col fade-in pb-20 md:pb-0">
            {/* Header */}
            <div className="flex justify-between items-center border-b border-gray-200 pb-3 mb-4">
                <div className="flex gap-2">
                    {['sales', 'logistics', 'returns'].map(t => (
                        <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${tab === t ? 'bg-brand-dark text-white shadow-lg' : 'text-gray-500 hover:text-brand-dark hover:bg-gray-100'}`}>
                            {t === 'sales' ? 'Ventas' : t === 'logistics' ? 'Logística' : 'Devoluciones'}
                        </button>
                    ))}
                </div>
                {tab === 'sales' && <Button onClick={handleNewOrder} icon="Plus" className="bg-brand-red text-white shadow-red-500/30">Nuevo Pedido</Button>}
                {selectedOrderIds.length > 0 && <Button onClick={handleBulkOrderDelete} variant="danger" icon="Trash2">Eliminar ({selectedOrderIds.length})</Button>}
            </div>

            {/* Search */}
            <div className="relative mb-4">
                <div className="absolute left-3 top-3 text-gray-400"><Icon name="Search" size={18}/></div>
                <input className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-red outline-none" placeholder="Buscar..." value={searchText} onChange={e=>setSearchText(e.target.value)} />
            </div>

            {/* TABLERO VENTAS */}
            {tab === 'sales' && (
                <div className="flex-1 overflow-x-auto pb-4">
                    <div className="flex h-full gap-4 min-w-[1200px]">
                        {[
                            { title: 'Pendiente', items: salesKanban.pendiente, color: 'border-l-amber-400' },
                            { title: 'En Despacho', items: salesKanban.despacho, color: 'border-l-indigo-500' },
                            { title: 'Enviado', items: salesKanban.enviado, color: 'border-l-purple-500' },
                            { title: 'Completado', items: salesKanban.completado, color: 'border-l-emerald-500' },
                            { title: 'Novedades', items: salesKanban.novedad, color: 'border-l-brand-red bg-red-50/50' }
                        ].map((col, i) => (
                            <div key={i} className={`min-w-[300px] bg-white rounded-xl border border-gray-200 flex flex-col shadow-sm ${col.color.includes('border-l') ? col.color.split(' ')[0] + ' border-l-4' : ''}`}>
                                <div className="p-3 font-bold text-gray-700 flex justify-between bg-gray-50 rounded-t-xl border-b border-gray-100">{col.title} <span className="bg-gray-200 px-2 rounded-full text-xs py-0.5">{col.items.length}</span></div>
                                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                                    {col.items.map(o => (
                                        <div key={o.id} onClick={() => handleEditOrder(o)} className={`bg-white p-3 rounded-lg shadow-card border border-gray-100 hover:border-brand-red cursor-pointer group relative ${selectedOrderIds.includes(o.id) ? 'ring-2 ring-brand-red' : ''}`}>
                                            <div className="absolute top-2 right-2 z-10" onClick={e => e.stopPropagation()}><input type="checkbox" checked={selectedOrderIds.includes(o.id)} onChange={() => toggleOrderSelection(o.id)} className="w-4 h-4 cursor-pointer accent-brand-red"/></div>
                                            <div className="flex justify-between mb-2 pr-6"><span className="font-bold text-sm">{o.cliente.nombre}</span><span className="text-xs bg-gray-100 px-1 rounded">#{o.id_visual}</span></div>
                                            <div className="text-xs text-gray-500 space-y-1">{o.items.map((it,idx) => <div key={idx}>{it.cantidad}x {it.modelo}</div>)}</div>
                                            <div className="mt-2 pt-2 border-t flex justify-between font-bold text-sm"><span>{formatCurrency(o.total)}</span><Icon name="ChevronRight" size={14} className="text-gray-300 group-hover:text-brand-red"/></div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* TABLERO LOGISTICA */}
            {tab === 'logistics' && (
                <div className="flex-1 overflow-x-auto pb-4">
                    <div className="flex h-full gap-4 min-w-[1000px]">
                        {[
                            { title: 'Por Pagar', items: kanbanData.pending, icon: 'DollarSign', color: 'text-rose-500' },
                            { title: 'Por Despachar', items: kanbanData.ready, icon: 'Box', color: 'text-indigo-500' },
                            { title: 'Enviado', items: kanbanData.shipped, icon: 'Truck', color: 'text-emerald-500' },
                            { title: 'Entregado', items: kanbanData.delivered, icon: 'CheckCircle', color: 'text-gray-500' }
                        ].map((col, i) => (
                            <div key={i} className="w-1/4 bg-gray-50 rounded-xl border border-gray-200 flex flex-col shadow-inner">
                                <div className={`p-3 font-bold flex justify-between items-center bg-white rounded-t-xl border-b ${col.color}`}><span className="flex items-center gap-2"><Icon name={col.icon} size={16}/> {col.title}</span><span className="bg-gray-100 px-2 rounded-full text-xs text-gray-600">{col.items.length}</span></div>
                                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                                    {col.items.map(g => (
                                        <div key={g.id} className="bg-white p-3 rounded-lg shadow-sm border border-gray-200">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="font-bold text-xs flex items-center gap-1"><Icon name="Truck" size={12}/> {g.provName}</span>
                                                {col.title === 'Enviado' && <span className="text-[10px] bg-emerald-50 text-emerald-600 px-1 rounded">{g.guideInfo?.numero}</span>}
                                            </div>
                                            <div className="space-y-1 mb-2">
                                                {g.items.map((it, idx) => (
                                                    <div key={idx} className="flex justify-between text-xs text-gray-600">
                                                        <span className="truncate w-24">{it.modelo}</span>
                                                        <span>{formatCurrency(calculateItemDebt(it))}</span>
                                                    </div>
                                                ))}
                                            </div>
                                            {col.title === 'Por Pagar' && <Button onClick={()=>openPayment(g.items)} className="w-full h-8 text-xs bg-slate-800">Pagar {formatCurrency(g.totalDebt)}</Button>}
                                            {col.title === 'Por Despachar' && <Button onClick={()=>openGuide(g.items)} className="w-full h-8 text-xs bg-indigo-600">Asignar Guía</Button>}
                                            {col.title === 'Enviado' && (
                                                <div className="flex gap-1">
                                                    <Button onClick={()=>openGuide(g.items)} variant="secondary" className="flex-1 h-7 text-[10px] px-0"><Icon name="Edit2" size={12}/></Button>
                                                    <Button onClick={()=>openDelivery(g.items)} className="flex-1 h-7 text-[10px] px-0 bg-emerald-600">Entregar</Button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* TABLA DEVOLUCIONES (Simplificada) */}
            {tab === 'returns' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex-1">
                    <div className="p-4 text-center text-gray-400 italic">Tabla de devoluciones (usa returnedItems)</div>
                </div>
            )}

            {/* --- MODALES --- */}
            <OrderFormModal 
                isOpen={orderModalOpen} onClose={()=>setOrderModalOpen(false)} isEditing={!!editingId}
                client={client} setClient={setClient} cart={cart} setCart={setCart}
                orderDate={orderDate} setOrderDate={setOrderDate}
                onSave={submitOrder}
                handlePhoneChange={handlePhoneChange} clientHistory={clientHistory} shippingOptions={shipping} handleCityChange={handleCityChange}
                toggleInternal={toggleInternalOrder}
                productsList={products} providersList={providers}
                addToCart={addToCart} updateCartItem={updateCartItem} removeFromCart={(i)=>setCart(cart.filter((_,idx)=>idx!==i))}
                isCustomMode={isCustomMode} setIsCustomMode={setIsCustomMode} itemSearch={itemSearch} setItemSearch={setItemSearch}
                customItem={customItem} setCustomItem={setCustomItem} saveToInventory={saveToInventory} setSaveToInventory={setSaveToInventory}
                handleCustomFile={handleCustomFile} handleCustomProvider={handleCustomProviderChange} createCustom={createAndAddProduct} uploadingCustom={uploading}
            />

            <GuideModal 
                isOpen={guideModalOpen} onClose={()=>setGuideModalOpen(false)}
                form={guideForm} setForm={setGuideForm}
                items={guideForm.targetItems} selectedIds={selectedGuideIds}
                toggleSelectAll={()=>{/* Lógica simple */}} toggleSelection={(id)=>{if(selectedGuideIds.includes(id)) setSelectedGuideIds(p=>p.filter(x=>x!==id)); else setSelectedGuideIds(p=>[...p,id])}}
                searchText={guideSearchText} setSearchText={setGuideSearchText}
                onSave={saveGuide} onDelete={deleteGuide}
                financeMethods={safeMethods} isBank={isBankGuide}
                onFileSelect={(f)=>uploadToCloudinary(f, cloudConfig, `GUIDE-${Date.now()}`).then(r=>setGuideForm(p=>({...p, imagen:r.secure_url})))}
                uploading={uploading}
            />

            <DeliveryModal 
                isOpen={deliveryModalOpen} onClose={()=>setDeliveryModalOpen(false)}
                form={deliveryForm} setForm={setDeliveryForm}
                onSave={saveDelivery}
                financeMethods={safeMethods} isBank={false}
                onFileSelect={()=>{}} uploading={false}
            />

            <PaymentModal 
                isOpen={batchPayModalOpen} onClose={()=>setBatchPayModalOpen(false)}
                candidates={batchItemsCandidates} selectedIds={selectedBatchIds}
                toggleSelectAll={()=>{/* Lógica */}} toggleSelection={(id)=>{if(selectedBatchIds.includes(id)) setSelectedBatchIds(p=>p.filter(x=>x!==id)); else setSelectedBatchIds(p=>[...p,id])}}
                searchText={paymentSearchText} setSearchText={setPaymentSearchText}
                individualAmounts={individualAmounts} onAmountChange={(id,val)=>setIndividualAmounts(p=>({...p,[id]:val}))}
                form={paymentForm} setForm={setPaymentForm}
                financeMethods={safeMethods} isBank={isBankProv}
                onSave={()=>{/* Lógica submitBatchPayment */}}
            />
        </div>
    );
};

export default OrdersView;