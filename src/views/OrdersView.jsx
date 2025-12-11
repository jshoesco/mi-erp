import React, { useState, useMemo, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { useUI } from '../context/UIContext';
import { db, doc, writeBatch, collection, addDoc, updateDoc, deleteDoc, getDoc } from '../lib/firebase';
import { formatCurrency, normalizeText, uploadToCloudinary } from '../lib/utils';

// Componentes UI
import Button from '../components/Button';
import Icon, { Spinner } from '../components/Icon';
import SafeImg from '../components/SafeImg';
import Modal from '../components/Modal';

// Modales
import GuideModal from '../components/modals/GuideModal';
import DeliveryModal from '../components/modals/DeliveryModal';
import PaymentModal from '../components/modals/PaymentModal';
import ClientPayModal from '../components/modals/ClientPayModal';
import AnomalyModal from '../components/modals/AnomalyModal';
import ResellModal from '../components/modals/ResellModal';
import OrderFormModal from '../components/modals/OrderFormModal';

const OrdersView = () => {
    // 1. DATOS GLOBALES
    const { orders, products, shipping, providers, financeConfig, anomalyConfigData, generalConfig, loading } = useData();
    const { notify, confirmAction } = useUI();
    
    const cloudConfig = generalConfig?.[0] || {};
    const financeMethods = financeConfig?.methods || [];

    // 2. ESTADOS
    const [tab, setTab] = useState('sales');
    const [searchText, setSearchText] = useState('');
    const [selectedOrderIds, setSelectedOrderIds] = useState([]);

    // Estados Modales
    const [modalOpen, setModalOpen] = useState(false);
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

    // Novedades y Reventa
    const [anomalyModalOpen, setAnomalyModalOpen] = useState(false);
    const [anomalyItems, setAnomalyItems] = useState([]);
    const [selectedAnomalyIds, setSelectedAnomalyIds] = useState([]);
    const [anomalyDetails, setAnomalyDetails] = useState({});

    const [resellModalOpen, setResellModalOpen] = useState(false);
    const [resellItem, setResellItem] = useState(null);
    const [resellForm, setResellForm] = useState({ precio: '', cliente: '', tipo_entrega: 'Personal', ciudad: '', metodo: '', transaction_id: '', imagen: '' });

    // Productos Manuales
    const [customItem, setCustomItem] = useState({ nombre: '', precio: '', costo: '', proveedor: '', talla: '', imagen: '', genero: 'Unisex' });
    const [isCustomMode, setIsCustomMode] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [itemSearch, setItemSearch] = useState('');
    const [saveToInventory, setSaveToInventory] = useState(true);

    // Unificación
    const [linkModalOpen, setLinkModalOpen] = useState(false);
    const [linkSourceGroup, setLinkSourceGroup] = useState(null);
    const [linkCandidates, setLinkCandidates] = useState([]);
    const [selectedTargetId, setSelectedTargetId] = useState('');

    // Helpers
    const getToday = () => new Date().toISOString().slice(0, 10);
    const isBankProv = financeMethods.find(m => m.name === paymentForm.metodo)?.isBank; 
    const isBankClient = financeMethods.find(m => m.name === clientPayForm.metodo)?.isBank;
    const isBankGuide = financeMethods.find(m => m.name === guideForm.metodo)?.isBank;
    const isBankResell = financeMethods.find(m => m.name === resellForm.metodo)?.isBank;

    // Cálculo de Deuda (Lógica Blindada: Costo + Envío Asignado - Pagado)
    const calculateItemDebt = (item) => Math.max(0, ((Number(item.costo)||0) + (Number(item.costo_envio_asignado)||0)) - (Number(item.pago_proveedor)||0));

    const clientHistory = useMemo(() => {
        const history = {};
        orders.forEach(o => { if (o.cliente?.telefono?.length > 5) history[o.cliente.telefono.trim()] = o.cliente; });
        return history;
    }, [orders]);

    const anomalyReasons = useMemo(() => {
        if (anomalyConfigData && anomalyConfigData.length > 0) return anomalyConfigData;
        return [{ motivo: 'Defecto de Fábrica' }, { motivo: 'Talla Incorrecta' }, { motivo: 'No le gustó' }, { motivo: 'Error Despacho' }];
    }, [anomalyConfigData]);

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
            res = orders.filter(o => `${o.id_visual} ${o.cliente?.nombre} ${o.cliente?.telefono}`.toLowerCase().includes(lower) || o.items.some(i => i.sku.toLowerCase().includes(lower)));
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
                    items: [], totalDebt: 0, guideInfo: item.guia, isAcopio: normStrat.includes('acopio'),
                    mainClientName: order.cliente?.nombre
                };
                
                grouped[key].items.push({ ...item, orderId: order.id, orderVisualId: order.id_visual, clientName: order.cliente?.nombre, itemIndex: idx, unique_id: item.unique_id || `temp-${idx}`, linkedTo: item.linked_to_order_id, isInternal: order.cliente?.is_internal, guia: item.guia, fecha_entrega: item.fecha_entrega, costo_envio_asignado: item.costo_envio_asignado });
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
    const handleNewOrder = () => { setEditingId(null); setClient({ nombre: '', telefono: '', direccion: '', ciudad: '', ciudad_entrega: '', es_acopio: false, estrategia: 'Directo', is_internal: false }); setCart([]); setOrderDate(getToday()); setModalOpen(true); };
    const handleEditOrder = (order) => { setClient({ ...order.cliente, estrategia: order.estrategia || 'Directo' }); setCart(order.items); setOrderDate(order.fecha.slice(0, 10)); setEditingId(order.id); setModalOpen(true); };
    const handlePhoneChange = (e) => { const val = e.target.value; const found = clientHistory[val]; if(found) { setClient(prev => ({...prev, telefono: val, nombre: found.nombre, direccion: found.direccion, ciudad: found.ciudad, ciudad_entrega: found.ciudad_entrega})); notify("Cliente encontrado", "info"); } else setClient({...client, telefono: val}); };
    const toggleInternalOrder = (e) => { const isInt = e.target.checked; setClient(prev => ({ ...prev, is_internal: isInt, nombre: isInt ? 'PEDIDO INTERNO' : '', telefono: isInt ? '0000000000' : '', direccion: isInt ? 'Bodega / Personal' : '' })); };
    const handleCityChange = (e) => { const val = e.target.value; const cityData = shipping.find(s => s.ciudad === val); if(cityData) setClient(prev => ({...prev, ciudad_entrega: val, es_acopio: cityData.tiene_acopio, estrategia: cityData.tiene_acopio ? 'Acopio' : 'Directo'})); else setClient(prev => ({...prev, ciudad_entrega: val})); };

    const submitOrder = async () => {
        if (!client.nombre || cart.length === 0) return notify("Faltan datos", "error");
        const cleanItems = cart.map(i => ({ sku: i.sku || 'GENERICO', modelo: i.modelo || 'Sin Modelo', imagen: i.imagen || '', precio: Number(i.precio) || 0, costo: Number(i.costo) || 0, cantidad: Number(i.cantidad) || 1, total: Number(i.total) || 0, proveedor_nombre: i.proveedor_nombre || 'Externo', proveedor_uid: i.proveedor_uid || 'externo', pago_parcial: Number(i.pago_parcial) || 0, pago_proveedor: Number(i.pago_proveedor) || 0, guia: i.guia || null, talla: i.talla || '', unique_id: i.unique_id || crypto.randomUUID(), costo_envio_asignado: 0 }));
        const payload = { cliente, items: cleanItems, total: cleanItems.reduce((s, i) => s + i.total, 0), pago_cliente: editingId ? (orders.find(o=>o.id===editingId)?.pago_cliente||0) : 0, estado: 'Pendiente', fecha: orderDate, id_visual: editingId ? (orders.find(o=>o.id===editingId)?.id_visual) : Date.now().toString().slice(-6), estrategia: client.estrategia };
        try { 
            if(editingId) await updateDoc(doc(db, 'pedidos', editingId), payload); 
            else await addDoc(collection(db, 'pedidos'), payload); 
            setModalOpen(false); setCart([]); setEditingId(null); notify("Pedido guardado"); 
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

    // --- LÓGICA DE PAGOS (LA QUE FALTABA) ---
    const handleIndividualAmountChange = (uniqueId, rawValue) => { 
        const clean = rawValue.replace(/\./g, ''); 
        if (!/^\d*$/.test(clean)) return; 
        setIndividualAmounts(prev => ({ ...prev, [uniqueId]: clean })); 
    };

    const handlePaymentFile = async (file) => { 
        if (!file || !cloudConfig.cloud_name) return notify("Falta config Cloudinary", "error"); 
        setUploading(true); 
        try { 
            const res = await uploadToCloudinary(file, cloudConfig, `PAY-TX-${Date.now()}`); 
            setPaymentForm(prev => ({ ...prev, imagen: res.secure_url })); 
        } catch (e) { notify(e.message, "error"); } 
        setUploading(false); 
    };

    const submitBatchPayment = async () => {
        if (!paymentForm.monto || !paymentForm.metodo) return notify("Faltan datos", "error");
        const totalAmount = Number(paymentForm.monto);
        try {
            const batch = writeBatch(db);
            const finRef = doc(collection(db, 'finanzas'));
            const allocations = [];
            const updatesByOrder = {};
            batchItemsCandidates.forEach(item => {
                if (selectedBatchIds.includes(item.unique_id)) {
                    const amountToPay = Number(individualAmounts[item.unique_id]) || 0;
                    if (amountToPay > 0) {
                        allocations.push({ order_doc_id: item.orderId, order_visual_id: item.orderVisualId, item_unique_id: item.unique_id, item_name: item.modelo, amount: amountToPay });
                        if (!updatesByOrder[item.orderId]) {
                            const fullOrder = orders.find(o => o.id === item.orderId);
                            if (fullOrder) updatesByOrder[item.orderId] = JSON.parse(JSON.stringify(fullOrder));
                        }
                    }
                }
            });
            if (allocations.length === 0) return notify("No hay montos asignados", "error");
            batch.set(finRef, { tipo: 'Gasto', categoria: 'Pago Proveedor', metodo: paymentForm.metodo, monto: totalAmount, concepto: `Pago Lote Logística (${selectedBatchIds.length} items)`, transaction_id: paymentForm.transaction_id || '', imagen: paymentForm.imagen || '', fecha: new Date().toISOString(), allocations });
            Object.keys(updatesByOrder).forEach(orderId => {
                const order = updatesByOrder[orderId];
                allocations.filter(a => a.order_doc_id === orderId).forEach(alloc => {
                    const idx = order.items.findIndex(i => i.unique_id === alloc.item_unique_id);
                    if (idx !== -1) {
                        order.items[idx].pago_proveedor = (Number(order.items[idx].pago_proveedor) || 0) + alloc.amount;
                        if (!order.items[idx].costo && products.length > 0) {
                            const pBase = products.find(p => p.sku === order.items[idx].sku);
                            if (pBase) order.items[idx].costo = pBase.costo;
                        }
                    }
                });
                const allPaid = order.items.every(it => (Number(it.pago_proveedor) || 0) >= ((Number(it.costo) || 0) + (Number(it.costo_envio_asignado) || 0)));
                let newStatus = order.estado;
                if (order.estado === 'Pendiente' && allPaid) newStatus = 'En Despacho';
                const ref = doc(db, 'pedidos', orderId);
                batch.update(ref, { items: order.items, estado: newStatus });
            });
            await batch.commit(); notify("Pago registrado correctamente"); setBatchPayModalOpen(false);
        } catch (e) { notify("Error: " + e.message, "error"); }
    };

    // --- LOGICA DE ENVÍO Y DEUDA ---
    const saveGuide = async () => {
        if (!guideForm.guide) return notify("Falta la guía", "error");
        if (selectedGuideIds.length === 0) return notify("Selecciona al menos un ítem", "error");
        if (guideForm.costo === '') return notify("Ingresa el costo (0 si es gratis)", "error");
        if (guideForm.anticipado && Number(guideForm.costo) > 0 && !guideForm.metodo) return notify("Falta método de pago", "error");

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
                batch.set(doc(collection(db, 'finanzas')), { tipo: 'Gasto', categoria: 'Envío', monto: Number(guideForm.costo), fecha: new Date().toISOString(), concepto: `Guía ${guideForm.guide}`, metodo: guideForm.metodo });
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
                // CORREGIDO: Se eliminó la duplicidad de 'metodo'
                batch.set(doc(collection(db, 'finanzas')), { 
                    tipo: 'Gasto', 
                    categoria: 'Envío', 
                    metodo: deliveryForm.metodo, 
                    monto: Number(deliveryForm.costo_total), 
                    fecha: new Date().toISOString(), 
                    concepto: `Contraentrega ${deliveryForm.items[0]?.guia?.numero}` 
                });
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

    // --- UNIFICACIÓN ---
    const openLinkModal = (sourceGroup) => { setLinkSourceGroup(sourceGroup); const candidates = []; const allActiveGroups = [...kanbanData.pending, ...kanbanData.ready]; allActiveGroups.forEach(g => { if (g.id !== sourceGroup.id && g.provName === sourceGroup.provName && g.city === sourceGroup.city) { candidates.push({ groupKey: g.id, targetOrderId: g.items[0].orderId, label: `${g.mainClientName} (${g.items.length} items)` }); } }); if (candidates.length === 0) return notify("No hay pedidos compatibles", "info"); setLinkCandidates(candidates); setSelectedTargetId(candidates[0].targetOrderId); setLinkModalOpen(true); };
    const submitLinkOrders = async () => { if (!linkSourceGroup || !selectedTargetId) return; try { const batch = writeBatch(db); linkSourceGroup.items.forEach(item => { const ref = doc(db, 'pedidos', item.orderId); const fullOrder = orders.find(o => o.id === item.orderId); if (fullOrder) { const newItems = fullOrder.items.map((it, idx) => { if (idx === item.itemIndex) return { ...it, linked_to_order_id: selectedTargetId }; return it; }); batch.update(ref, { items: newItems }); } }); await batch.commit(); notify("Unificado"); setLinkModalOpen(false); } catch (e) { notify("Error: " + e.message, "error"); } };

    // --- HELPERS MODALES ---
    const openGuide = (items) => { const total = items.reduce((sum, i) => sum + (Number(i.costo_envio_asignado) || 0), 0); setGuideForm({ guide: items[0].guia?.numero || '', date: getToday(), targetItems: items, costo: total || '', anticipado: !!items[0].guia?.anticipado }); setSelectedGuideIds(items.map(i => i.unique_id)); setGuideModalOpen(true); };
    const openDelivery = (items) => { const total = items.reduce((sum, i) => sum + (Number(i.guia?.costo) || 0), 0); setDeliveryForm({ date: getToday(), items, costo_total: total, ya_pagado: !!items[0].guia?.anticipado }); setDeliveryModalOpen(true); };
    const openPayment = (items) => { 
        setBatchItemsCandidates(items);
        
        // 1. Pre-seleccionar todos
        const allIds = items.map(i => i.unique_id);
        setSelectedBatchIds(allIds);
        
        // 2. CORRECCIÓN: Pre-cargar los montos con la deuda actual
        const initialAmounts = {};
        let initialTotal = 0;
        
        items.forEach(i => {
            const debt = calculateItemDebt(i);
            initialAmounts[i.unique_id] = debt; // Guardamos el número limpio
            initialTotal += debt;
        });

        setIndividualAmounts(initialAmounts);
        
        // 3. Actualizar el total del formulario visualmente de una vez
        setPaymentForm(prev => ({ ...prev, monto: initialTotal, metodo: '', transaction_id: '', imagen: '' }));
        
        setBatchPayModalOpen(true); 
    };

    // --- OTROS ---
    const submitClientPayment = async () => { if (!clientPayForm.monto || !clientPayForm.metodo) return notify("Faltan datos", "error"); const amount = Number(clientPayForm.monto); try { await addDoc(collection(db, 'finanzas'), { tipo: 'Ingreso', categoria: 'Venta', metodo: clientPayForm.metodo, monto: amount, concepto: `Cobro Pedido #${currentOrder.id_visual}`, fecha: new Date().toISOString(), pedido_id: currentOrder.id_visual }); const newTotalPaid = (currentOrder.pago_cliente || 0) + amount; const newStatus = newTotalPaid >= currentOrder.total ? 'Completado' : currentOrder.estado; await updateDoc(doc(db, 'pedidos', currentOrder.id), { pago_cliente: newTotalPaid, estado: newStatus }); notify("Cobro registrado"); setClientPayModalOpen(false); } catch (e) { notify("Error: " + e.message, "error"); } };
    const openClientPayModal = (order) => { setCurrentOrder(order); const remaining = (order.total || 0) - (order.pago_cliente || 0); setClientPayForm({ metodo: '', monto: remaining > 0 ? remaining : 0, transaction_id: '', imagen: '' }); setClientPayModalOpen(true); };
    const handleClientPayFile = async (file) => { if (!file || !cloudConfig.cloud_name) return notify("Falta config Cloudinary", "error"); setUploadingPayment(true); try { const res = await uploadToCloudinary(file, cloudConfig, `PAY-CLIENT-${Date.now()}`).then(r=>setClientPayForm(p=>({...p, imagen:r.secure_url})))} catch (e) { notify(e.message, "error"); } setUploadingPayment(false); };
    
    // Novedades y Reventa
    const openAnomalyModal = (order) => { setCurrentOrder(order); setAnomalyItems(order.items || []); setSelectedAnomalyIds([]); setAnomalyDetails({}); setAnomalyModalOpen(true); };
    const toggleAnomalySelection = (id) => { if(selectedAnomalyIds.includes(id)) { setSelectedAnomalyIds(prev => prev.filter(i => i !== id)); } else { setSelectedAnomalyIds(prev => [...prev, id]); const firstReason = anomalyReasons[0]; setAnomalyDetails(prev => ({ ...prev, [id]: { motivo: firstReason?.motivo || 'Defecto', accion: 'Devolver a Proveedor', ubicacion: currentOrder?.cliente?.ciudad_entrega || '', guia_retorno: '' } })); } };
    const updateAnomalyDetail = (id, field, val) => { setAnomalyDetails(prev => { const newState = { ...prev, [id]: { ...prev[id], [field]: val } }; if (field === 'motivo') { const config = anomalyReasons.find(r => r.motivo === val); if (config && config.accion) { newState[id].accion = config.accion; } } return newState; }); };
    const submitAnomaly = async () => { if (selectedAnomalyIds.length === 0) return notify("Selecciona productos", "error"); try { const batch = writeBatch(db); const updatedItems = currentOrder.items.map(item => { if (selectedAnomalyIds.includes(item.unique_id)) { const details = anomalyDetails[item.unique_id]; return { ...item, devolucion: { fecha: new Date().toISOString(), motivo: details.motivo, accion: details.accion, ubicacion: details.accion === 'Stock (Revender)' ? details.ubicacion : null, guia_retorno: details.guia_retorno || '', estado: details.accion === 'Stock (Revender)' ? 'En Retorno' : 'Pendiente' } }; } return item; }); const ref = doc(db, 'pedidos', currentOrder.id); batch.update(ref, { items: updatedItems }); await batch.commit(); notify("Novedad registrada"); setAnomalyModalOpen(false); } catch (e) { notify("Error: " + e.message, "error"); } };
    const confirmStockArrival = async (item) => { confirmAction({ title: "Confirmar Llegada", message: `¿El producto ya llegó físicamente a: ${item.devolucion.ubicacion}? Pasará a estar disponible.`, onConfirm: async () => { try { const batch = writeBatch(db); const orderRef = doc(db, 'pedidos', item.orderId); const orderSnap = await getDoc(orderRef); if(orderSnap.exists()){ const data = orderSnap.data(); const updatedItems = data.items.map(it => { if(it.unique_id === item.unique_id) { return { ...it, devolucion: { ...it.devolucion, estado: 'En Stock' } }; } return it; }); batch.update(orderRef, { items: updatedItems }); await batch.commit(); notify("Stock confirmado"); } } catch(e) { notify("Error: " + e.message, "error"); } } }); };
    const undoReturn = async (item) => { confirmAction({ title: "Deshacer Devolución", message: `El producto ${item.modelo} volverá a estar activo en el pedido. ¿Confirmar?`, onConfirm: async () => { try { const batch = writeBatch(db); const orderRef = doc(db, 'pedidos', item.orderId); const orderSnap = await getDoc(orderRef); if (orderSnap.exists()) { const orderData = orderSnap.data(); const updatedItems = orderData.items.map(it => { if (it.unique_id === item.unique_id) { const { devolucion, ...rest } = it; return rest; } return it; }); const hasGuide = updatedItems.some(it => it.guia && it.guia.numero); const newState = hasGuide ? 'Enviado' : 'En Despacho'; batch.update(orderRef, { items: updatedItems, estado: newState }); await batch.commit(); notify("Devolución reversada"); } } catch (e) { notify("Error: " + e.message, "error"); } } }); };

    const openResellModal = (item) => { setResellItem(item); setResellForm({ precio: '', cliente: '', tipo_entrega: 'Personal', ciudad: '', metodo: '', transaction_id: '', imagen: '' }); setResellModalOpen(true); };
    const handleResellFile = async (file) => { if (!file || !cloudConfig.cloud_name) return notify("Falta config Cloudinary", "error"); setUploadingGuide(true); try { const res = await uploadToCloudinary(file, cloudConfig, `REVENTA-${Date.now()}`).then(r=>setResellForm(p=>({...p, imagen:r.secure_url})))} catch (e) { notify(e.message, "error"); } setUploadingGuide(false); };
    const submitResell = async () => { if(!resellForm.precio || !resellForm.cliente) return notify("Faltan datos", "error"); try { const batch = writeBatch(db); const newOrder = { cliente: { nombre: resellForm.cliente, ciudad_entrega: resellForm.ciudad || 'Local', telefono: '0000000000', direccion: 'Reventa', es_acopio: false, estrategia: 'Directo', is_internal: false }, items: [{ ...resellItem, precio: Number(resellForm.precio), total: Number(resellForm.precio), devolucion: null, guia: null, unique_id: crypto.randomUUID(), pago_proveedor: 0, costo_envio_asignado: 0 }], total: Number(resellForm.precio), pago_cliente: resellForm.tipo_entrega === 'Personal' ? Number(resellForm.precio) : 0, estado: resellForm.tipo_entrega === 'Personal' ? 'Completado' : 'Pendiente', fecha: new Date().toISOString(), id_visual: Date.now().toString().slice(-6), estrategia: 'Directo' }; const newOrderRef = doc(collection(db, 'pedidos')); batch.set(newOrderRef, newOrder); if(resellForm.tipo_entrega === 'Personal') { const finRef = doc(collection(db, 'finanzas')); batch.set(finRef, { tipo: 'Ingreso', categoria: 'Reventa', metodo: resellForm.metodo, monto: Number(resellForm.precio), concepto: `Reventa Producto ${resellItem.modelo}`, transaction_id: resellForm.transaction_id || '', imagen: resellForm.imagen || '', fecha: new Date().toISOString(), pedido_id: newOrder.id_visual }); } const oldOrderRef = doc(db, 'pedidos', resellItem.orderId); const oldOrderSnap = await getDoc(oldOrderRef); if(oldOrderSnap.exists()){ const oldData = oldOrderSnap.data(); const updatedOldItems = oldData.items.map(it => { if(it.unique_id === resellItem.unique_id) { return { ...it, devolucion: { ...it.devolucion, estado: 'Revendido' } }; } return it; }); batch.update(oldOrderRef, { items: updatedOldItems }); } await batch.commit(); notify("Producto revendido"); setResellModalOpen(false); } catch(e) { notify("Error: " + e.message, "error"); } };
    const undoDelivery = async (groupItems) => { confirmAction({ title: "Reversar Entrega", message: "El pedido volverá a estado 'Enviado'. Si registraste un pago, elimínalo manualmente en Finanzas. ¿Continuar?", onConfirm: async () => { try { const batch = writeBatch(db); const updatesByOrder = {}; groupItems.forEach(item => { if (!updatesByOrder[item.orderId]) { const order = orders.find(o => o.id === item.orderId); if (order) updatesByOrder[item.orderId] = JSON.parse(JSON.stringify(order)); } const currentOrder = updatesByOrder[item.orderId]; if (currentOrder && currentOrder.items[item.itemIndex]) { delete currentOrder.items[item.itemIndex].fecha_entrega; } }); Object.keys(updatesByOrder).forEach(orderId => { const ref = doc(db, 'pedidos', orderId); batch.update(ref, { items: updatesByOrder[orderId].items }); }); await batch.commit(); notify("Entrega reversada"); } catch (e) { notify("Error: " + e.message, "error"); } } }); };

    // --- RENDERIZADORES ---
    // A. COLUMNA DE VENTAS (Diseño Premium)
    // Agregamos el parámetro 'key' al final
    const renderSalesColumn = (title, items, colorClass, key) => (
        <div key={key} className={`min-w-[320px] bg-white rounded-xl flex flex-col h-full border border-gray-200 shadow-sm ${colorClass}`}>
            <div className="p-4 font-bold text-gray-800 flex justify-between items-center bg-gray-50/90 backdrop-blur-sm rounded-t-xl sticky top-0 border-b border-gray-200 z-10">
                <span className="uppercase tracking-wide text-xs">{title}</span>
                <span className="bg-brand-dark text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-sm">{items.length}</span>
            </div>
            {/* ... el resto de la función sigue igual ... */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {items.map(order => {
                    const providerGroups = groupItemsByProvider(order.items || []);
                    return (
                        <div key={order.id} onClick={()=>handleEditOrder(order)} className={`bg-white p-4 rounded-xl shadow-card border border-transparent hover:border-brand-red/30 hover:shadow-lg transition-all cursor-pointer relative group ${selectedOrderIds.includes(order.id) ? 'ring-2 ring-brand-red bg-red-50' : ''}`}>
                            <div className="absolute top-3 right-3 z-10" onClick={(e) => e.stopPropagation()}>
                                <input type="checkbox" checked={selectedOrderIds.includes(order.id)} onChange={() => toggleOrderSelection(order.id)} className="w-4 h-4 cursor-pointer accent-brand-red rounded" />
                            </div>
                            <div className="flex justify-between mb-3 pb-3 border-b border-gray-100 pr-6">
                                <div><div className="font-bold text-gray-900">{order.cliente?.nombre}</div><div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5"><Icon name="MapPin" size={12}/> {order.cliente?.ciudad_entrega}</div></div>
                                <div className="text-right"><div className="text-[10px] font-bold bg-gray-100 text-gray-600 px-2 py-1 rounded-md">#{order.id_visual}</div></div>
                            </div>
                            <div className="space-y-2 mb-3">{providerGroups.map(g => (<div key={g.id} className="text-xs bg-gray-50 p-2 rounded-lg border border-gray-100"><div className="flex justify-between font-bold text-gray-700 mb-1"><span>{g.name}</span>{g.todosPagados && <Icon name="CheckCircle" size={12} className="text-emerald-500"/>}</div>{g.items.map((it, i) => <div key={i} className={`truncate flex items-center gap-1 ${it.devolucion ? 'text-brand-red line-through' : 'text-gray-500'}`}><span className="w-1 h-1 rounded-full bg-gray-300"></span> {it.cantidad}x {it.modelo} {it.devolucion && <span className="text-[9px] bg-red-100 text-brand-red px-1 rounded">NOV</span>}</div>)}</div>))}</div>
                            <div className="pt-2 border-t border-gray-100 flex justify-between items-center"><span className="text-sm font-bold text-brand-dark">{formatCurrency(order.total)}</span><div className="flex gap-1">{(order.items || []).some(i => i.fecha_entrega) && (<button onClick={(e)=>{e.stopPropagation(); openAnomalyModal(order)}} className="p-1.5 text-brand-red hover:bg-red-50 rounded-lg transition-colors" title="Reportar Devolución"><Icon name="AlertTriangle" size={14}/></button>)}<button onClick={(e)=>{e.stopPropagation(); handleDeleteOrder(order.id)}} className="p-1.5 text-gray-400 hover:text-brand-red hover:bg-red-50 rounded-lg transition-colors"><Icon name="Trash2" size={14}/></button></div></div>
                        </div>
                    );
                })}
            </div>
        </div>
    );

    // B. TARJETA KANBAN LOGÍSTICA (Agrupada)
    const renderKanbanCard = (group, columnType) => {
        const subOrders = {};
        group.items.forEach(item => {
            const key = item.orderVisualId;
            if(!subOrders[key]) subOrders[key] = { client: item.clientName, visualId: key, items: [], hasDebt: false, isInternal: item.isInternal };
            subOrders[key].items.push(item);
            if(calculateItemDebt(item) > 0) subOrders[key].hasDebt = true;
        });

        // Título dinámico
        const isGrouped = Object.keys(subOrders).length > 1;
        const cardTitle = isGrouped ? `${Object.keys(subOrders).length} Pedidos Unificados` : group.mainClientName;

        return (
            <div key={group.id} className={`bg-white p-3 rounded-xl shadow-sm border hover:shadow-md transition-shadow relative border-l-4 ${group.totalDebt > 100 ? 'border-l-brand-red border-gray-200' : 'border-l-emerald-500 border-gray-200'}`}>
                
                {/* Cabecera Enviado */}
                {columnType === 'shipped' && (
                    <div className="bg-emerald-50 -mx-3 -mt-3 mb-3 p-2 border-b border-emerald-100 rounded-t-lg flex justify-between items-center" onClick={(e)=>e.stopPropagation()}>
                        <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-1"><Icon name="Truck" size={10}/> {group.guideInfo?.numero || 'S/G'}</span>
                        <div className="flex items-center gap-2">
                            <button onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(group.guideInfo?.numero || ''); notify("Copiado", "info"); }} className="p-1 hover:bg-white rounded"><Icon name="Copy" size={12} className="text-emerald-700"/></button>
                            {/* CORREGIDO: openGuide en lugar de openGuideModalForItems */}
                            <button onClick={(e) => { e.stopPropagation(); openGuide(group.items); }} className="p-1 hover:bg-white rounded"><Icon name="Edit2" size={12} className="text-emerald-700"/></button>
                            {/* CORREGIDO: openDelivery en lugar de openDeliveryModal */}
                            <button onClick={(e) => { e.stopPropagation(); openDelivery(group.items); }} className="p-1 hover:bg-white rounded"><Icon name="CheckSquare" size={12} className="text-emerald-700"/></button>
                        </div>
                    </div>
                )}
                {/* Cabecera Entregado */}
                {columnType === 'delivered' && (
                    <div className="bg-gray-100 -mx-3 -mt-3 mb-3 p-2 border-b border-gray-200 rounded-t-lg flex justify-between items-center">
                        <span className="text-[10px] font-bold text-gray-600 flex items-center gap-1"><Icon name="CheckCircle" size={10}/> {group.items[0]?.fecha_entrega}</span>
                        <button onClick={(e)=>{e.stopPropagation(); undoDelivery(group.items)}} className="text-brand-red hover:bg-red-50 p-1 rounded" title="Reversar"><Icon name="RotateCcw" size={12}/></button>
                    </div>
                )}

                {/* Info Logística */}
                <div className="flex justify-between items-start mb-3">
                    <div>
                        <div className="font-bold text-sm text-gray-800 flex items-center gap-1">
                            {isGrouped ? <Icon name="Users" size={14} className="text-indigo-600"/> : <Icon name="User" size={14} className="text-gray-400"/>} 
                            {cardTitle}
                        </div>
                        <div className="text-xs text-gray-500 font-medium flex items-center gap-2 mt-1">
                            <span className="flex items-center gap-1"><Icon name="MapPin" size={10}/> {group.city}</span>
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${group.isAcopio ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'}`}>{group.estrategia}</span>
                        </div>
                    </div>
                    {!group.isAcopio && columnType !== 'shipped' && columnType !== 'delivered' && (<button onClick={(e)=>{e.stopPropagation(); openLinkModal(group)}} className="text-gray-300 hover:text-indigo-600 p-1 transition-colors" title="Unificar Envío"><Icon name="Link" size={14}/></button>)}
                </div>

                {/* Lista de Productos */}
                <div className="space-y-2">
                    {Object.values(subOrders).map((sub) => (
                        <div key={sub.visualId} className={`rounded-lg p-2 border ${sub.hasDebt ? 'bg-red-50/50 border-red-200 border-dashed' : 'bg-gray-50 border-gray-100'}`}>
                            {isGrouped && (
                                <div className="flex justify-between items-center mb-1 pb-1 border-b border-black/5">
                                    <div className="text-xs font-bold text-gray-700">{sub.client} <span className="font-normal opacity-50 ml-1">#{sub.visualId}</span></div>
                                    {sub.hasDebt && <span className="text-[9px] font-bold text-brand-red flex items-center gap-0.5"><Icon name="AlertCircle" size={10}/> Pagar</span>}
                                </div>
                            )}
                            <div className="space-y-1">
                                {sub.items.map((it, i) => (
                                    <div key={i} className="flex justify-between items-center text-xs py-1 border-b border-gray-50 last:border-0">
                                        <div className="flex-1 min-w-0">
                                            <div className="truncate font-bold text-gray-800">{it.modelo}</div>
                                            <div className="text-[10px] text-gray-500 flex flex-wrap gap-1 items-center">
                                                {/* --- NUEVO: ETIQUETA DE PROVEEDOR --- */}
                                                <span className="bg-orange-100 text-orange-800 px-1 rounded font-bold uppercase text-[9px]">{group.provName}</span>
                                                
                                                {it.talla && <span className="bg-white border border-gray-200 px-1 rounded text-gray-600">T{it.talla}</span>}
                                                <span>{it.sku}</span>
                                            </div>
                                        </div>
                                        {calculateItemDebt(it) > 0 ? (
                                            <span className="font-mono text-brand-red text-[10px] font-bold ml-2">
                                                ${formatCurrency(calculateItemDebt(it)).replace('$','')}
                                            </span>
                                        ) : (
                                            <Icon name="Check" size={14} className="text-emerald-500 ml-2"/>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Acciones */}
                <div className="mt-3 pt-3 border-t border-gray-100">
                    {columnType === 'pending' && (
                        <>
                            <div className="mb-2 flex justify-between items-center bg-red-50 px-2 py-1.5 rounded text-brand-red text-xs font-bold border border-red-100"><span>Deuda Total:</span><span>{formatCurrency(group.totalDebt)}</span></div>
                            {/* CORREGIDO: openPayment en lugar de openBatchPayModal */}
                            <button onClick={(e)=>{e.stopPropagation(); openPayment(group.items)}} className="w-full py-2 bg-brand-dark text-white text-xs font-bold rounded-lg hover:bg-gray-800 flex items-center justify-center gap-2 shadow-sm transition-all"><Icon name="DollarSign" size={14}/> Registrar Pago</button>
                        </>
                    )}
                    {/* CORREGIDO: openGuide en lugar de openGuideModalForItems */}
                    {columnType === 'ready' && <button onClick={(e)=>{e.stopPropagation(); openGuide(group.items)}} className="w-full py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 flex items-center justify-center gap-2 shadow-sm transition-all"><Icon name="Truck" size={14}/> Asignar Guía</button>}
                </div>
            </div>
        );
    };

    if (loading) return <div className="p-10 flex justify-center"><Spinner /></div>;

    return (
        <div className="h-full flex flex-col fade-in pb-20 md:pb-0">
            {/* Header */}
            <div className="flex justify-between items-center border-b border-gray-200 pb-3 mb-4">
                <div className="flex gap-2">
                    {['sales', 'logistics', 'pending', 'returns'].map(t => (
                        <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${tab === t ? 'bg-brand-dark text-white shadow-lg' : 'text-gray-500 hover:text-brand-dark hover:bg-gray-100'}`}>
                            {t === 'sales' ? 'Ventas' : t === 'logistics' ? 'Logística' : t === 'pending' ? 'Pendientes' : 'Devoluciones'}
                        </button>
                    ))}
                </div>
                <div className="flex gap-2">
                    {selectedOrderIds.length > 0 && <Button onClick={handleBulkOrderDelete} variant="danger" icon="Trash2">Eliminar ({selectedOrderIds.length})</Button>}
                    {tab === 'sales' && <Button onClick={handleNewOrder} icon="Plus" className="bg-brand-red text-white shadow-red-500/30">Nuevo Pedido</Button>}
                </div>
            </div>

            {/* Search */}
            <div className="relative mb-4">
                <div className="absolute left-3 top-3 text-gray-400"><Icon name="Search" size={18}/></div>
                <input className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-red outline-none shadow-sm" placeholder="Buscar..." value={searchText} onChange={e=>setSearchText(e.target.value)} />
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
                        ].map((col, i) => renderSalesColumn(col.title, col.items, col.color, i))}
                    </div>
                </div>
            )}

            {/* TABLERO LOGISTICA */}
            {tab === 'logistics' && (
                <div className="flex-1 overflow-x-auto pb-4">
                    <div className="flex h-full gap-4 min-w-[1000px]">
                        <div className="w-1/4 bg-gray-100 rounded-xl flex flex-col h-full border border-gray-200/60 shadow-inner">
                            <div className="p-4 border-b border-gray-200 font-bold text-gray-700 flex justify-between items-center sticky top-0 bg-gray-100 z-10"><span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-brand-red"></div> Por Pagar</span><span className="bg-white text-gray-600 text-xs px-2 py-0.5 rounded-full shadow-sm border border-gray-200">{kanbanData.pending.length}</span></div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-4">{kanbanData.pending.map(group => renderKanbanCard(group, 'pending'))}</div>
                        </div>
                        <div className="w-1/4 bg-indigo-50/50 rounded-xl flex flex-col h-full border border-indigo-100 shadow-inner">
                            <div className="p-4 border-b border-indigo-100 font-bold text-indigo-900 flex justify-between items-center sticky top-0 bg-indigo-50 z-10"><span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-indigo-500"></div> Por Despachar</span><span className="bg-white text-indigo-700 text-xs px-2 py-0.5 rounded-full shadow-sm border border-indigo-100">{kanbanData.ready.length}</span></div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-4">{kanbanData.ready.map(group => renderKanbanCard(group, 'ready'))}</div>
                        </div>
                        <div className="w-1/4 bg-emerald-50/50 rounded-xl flex flex-col h-full border border-emerald-100 shadow-inner">
                            <div className="p-4 border-b border-emerald-100 font-bold text-emerald-900 flex justify-between items-center sticky top-0 bg-emerald-50 z-10"><span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Enviado</span><span className="bg-white text-emerald-700 text-xs px-2 py-0.5 rounded-full shadow-sm border border-emerald-100">{kanbanData.shipped.length}</span></div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-4">{kanbanData.shipped.map(group => renderKanbanCard(group, 'shipped'))}</div>
                        </div>
                        <div className="w-1/4 bg-gray-50/50 rounded-xl flex flex-col h-full border border-gray-200 shadow-inner">
                            <div className="p-4 border-b border-gray-200 font-bold text-gray-600 flex justify-between items-center sticky top-0 bg-gray-50 z-10"><span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-gray-500"></div> Entregados</span><span className="bg-white text-gray-500 text-xs px-2 py-0.5 rounded-full shadow-sm border border-gray-200">{kanbanData.delivered.length}</span></div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-4">{kanbanData.delivered.map(group => renderKanbanCard(group, 'delivered'))}</div>
                        </div>
                    </div>
                </div>
            )}

            {/* VISTA PENDIENTES (NUEVA) */}
            {tab === 'pending' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex-1 flex flex-col">
                    <div className="p-4 bg-gray-50 border-b border-gray-200 font-bold text-gray-700 flex gap-2 items-center">
                        <Icon name="List" size={18}/> Lista Maestra de Pendientes
                    </div>
                    <div className="overflow-auto flex-1">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-white font-bold text-gray-500 sticky top-0 shadow-sm z-10 text-xs uppercase tracking-wider">
                                <tr>
                                    <th className="p-4">Pedido / Cliente</th>
                                    <th className="p-4">Producto</th>
                                    <th className="p-4">Destino</th>
                                    <th className="p-4">Estado Logístico</th>
                                    <th className="p-4 text-center">Deuda Prov.</th>
                                    <th className="p-4">Acción</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {[...kanbanData.pending, ...kanbanData.ready, ...kanbanData.shipped].map((group, i) => (
                                    group.items.map((it, idx) => (
                                        <tr key={`${group.id}-${idx}`} className="hover:bg-gray-50 group">
                                            <td className="p-4">
                                                <div className="font-bold text-gray-900">{it.clientName}</div>
                                                <div className="text-xs text-gray-500 font-mono">#{it.orderVisualId}</div>
                                            </td>
                                            <td className="p-4">
                                                <div className="font-bold text-gray-700">{it.modelo}</div>
                                                <div className="text-xs text-gray-500">{it.sku} (T{it.talla})</div>
                                            </td>
                                            <td className="p-4 text-xs text-gray-600">
                                                <div className="font-bold">{group.city}</div>
                                                <div>{group.estrategia}</div>
                                            </td>
                                            <td className="p-4">
                                                {group.guideInfo?.numero ? (
                                                    <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full text-xs font-bold">Enviado: {group.guideInfo.numero}</span>
                                                ) : group.totalDebt > 100 ? (
                                                    <span className="bg-red-100 text-brand-red px-2 py-1 rounded-full text-xs font-bold">Por Pagar</span>
                                                ) : (
                                                    <span className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full text-xs font-bold">Listo Despacho</span>
                                                )}
                                            </td>
                                            <td className="p-4 text-center font-mono text-gray-800 font-bold">
                                                {calculateItemDebt(it) > 0 ? (
                                                    <span className="text-brand-red">{formatCurrency(calculateItemDebt(it))}</span>
                                                ) : (
                                                    <span className="text-emerald-500"><Icon name="Check" size={14}/></span>
                                                )}
                                            </td>
                                            <td className="p-4">
                                                <button onClick={()=>handleEditOrder(orders.find(o=>o.id===it.orderId))} className="p-2 hover:bg-gray-100 rounded-lg text-indigo-600"><Icon name="Edit" size={16}/></button>
                                            </td>
                                        </tr>
                                    ))
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* VISTA DEVOLUCIONES */}
            {tab === 'returns' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex-1 flex flex-col">
                    <div className="overflow-auto flex-1">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 font-bold text-gray-500 sticky top-0 shadow-sm z-10 text-xs uppercase"><tr><th className="p-4">Fecha</th><th className="p-4">Producto</th><th className="p-4">Cliente</th><th className="p-4 text-center">Costo</th><th className="p-4">Motivo</th><th className="p-4">Acción</th><th className="p-4">Seguimiento</th><th className="p-4">Guía Retorno</th><th className="p-4"></th></tr></thead>
                            <tbody className="divide-y divide-gray-100">
                                {returnedItems.map((item, i) => (
                                    <tr key={i} className="hover:bg-slate-50">
                                        <td className="p-4 text-gray-500">{new Date(item.devolucion.fecha).toLocaleDateString()}</td>
                                        <td className="p-4"><div className="font-bold text-slate-800">{item.modelo}</div><div className="text-xs text-slate-500">{item.sku} {item.talla && `(T${item.talla})`}</div></td>
                                        <td className="p-4"><div className="font-bold text-slate-700">{item.clientName}</div><div className="text-xs text-slate-400">{item.city}</div></td>
                                        <td className="p-4 text-center font-mono text-slate-400 text-xs">{formatCurrency(item.costo)}</td>
                                        <td className="p-4"><span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs border">{item.devolucion.motivo}</span></td>
                                        <td className="p-4">
                                            <div className="flex flex-col gap-1">
                                                <span className={`px-2 py-1 rounded text-xs font-bold border w-fit ${item.devolucion.accion.includes('Stock') ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-red-50 text-brand-red border-red-200'}`}>{item.devolucion.accion}</span>
                                                {item.devolucion.estado === 'En Stock' && item.devolucion.accion.includes('Stock') && (<button onClick={() => openResellModal(item)} className="px-2 py-1 bg-emerald-600 text-white text-xs font-bold rounded hover:bg-emerald-700 shadow-sm flex items-center gap-1 w-fit"><Icon name="DollarSign" size={12}/> Vender</button>)}
                                            </div>
                                        </td>
                                        <td className="p-4 text-xs">
                                            {item.devolucion.accion.includes('Stock') ? (
                                                <div className="flex flex-col gap-1">
                                                    <span className="font-bold text-gray-700">{item.devolucion.ubicacion}</span>
                                                    {item.devolucion.estado !== 'En Stock' ? (
                                                        <button onClick={() => confirmStockArrival(item)} className="mt-1 px-2 py-1 bg-amber-100 text-amber-700 border border-amber-200 rounded text-[10px] font-bold hover:bg-amber-200 flex items-center gap-1 w-fit"><Icon name="Truck" size={10} /> Confirmar Llegada</button>
                                                    ) : (<span className="text-emerald-600 font-bold">✓ En Bodega</span>)}
                                                </div>
                                            ) : '-'}
                                        </td>
                                        <td className="p-4 text-xs font-mono text-gray-500">{item.devolucion.guia_retorno || '-'}</td>
                                        <td className="p-4"><button onClick={() => undoReturn(item)} className="p-1.5 text-brand-red bg-red-50 rounded-full hover:bg-red-100"><Icon name="RotateCcw" size={14}/></button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* --- MODALES INYECTADOS --- */}
            <OrderFormModal 
                isOpen={modalOpen} onClose={()=>setModalOpen(false)} isEditing={!!editingId}
                client={client} setClient={setClient} cart={cart} setCart={setCart}
                orderDate={orderDate} setOrderDate={setOrderDate} onSave={submitOrder}
                handlePhoneChange={handlePhoneChange} clientHistory={clientHistory} shippingOptions={shipping} handleCityChange={handleCityChange}
                toggleInternal={toggleInternalOrder} productsList={products} providersList={providers}
                addToCart={addToCart} updateCartItem={updateCartItem} removeFromCart={(i)=>setCart(cart.filter((_,idx)=>idx!==i))}
                isCustomMode={isCustomMode} setIsCustomMode={setIsCustomMode} itemSearch={itemSearch} setItemSearch={setItemSearch}
                customItem={customItem} setCustomItem={setCustomItem} saveToInventory={saveToInventory} setSaveToInventory={setSaveToInventory}
                handleCustomFile={handleCustomFile} handleCustomProvider={handleCustomProviderChange} createCustom={createAndAddProduct} uploadingCustom={uploading}
            />

            <GuideModal 
                isOpen={guideModalOpen} onClose={()=>setGuideModalOpen(false)}
                form={guideForm} setForm={setGuideForm}
                items={guideForm.targetItems} selectedIds={selectedGuideIds}
                toggleSelectAll={()=>{
                    const allIds = guideForm.targetItems.map(i => i.unique_id);
                    if(selectedGuideIds.length === allIds.length) setSelectedGuideIds([]); else setSelectedGuideIds(allIds);
                }} 
                toggleSelection={(id)=>{if(selectedGuideIds.includes(id)) setSelectedGuideIds(p=>p.filter(x=>x!==id)); else setSelectedGuideIds(p=>[...p,id])}}
                searchText={guideSearchText} setSearchText={setGuideSearchText}
                onSave={saveGuide} onDelete={deleteGuide}
                financeMethods={financeMethods} isBank={isBankGuide}
                onFileSelect={(f)=>uploadToCloudinary(f, cloudConfig, `GUIDE-${Date.now()}`).then(r=>setGuideForm(p=>({...p, imagen:r.secure_url})))}
                uploading={uploading}
            />

            <DeliveryModal 
                isOpen={deliveryModalOpen} 
                onClose={()=>setDeliveryModalOpen(false)}
                form={deliveryForm} 
                setForm={setDeliveryForm}
                onSave={saveDelivery}
                financeMethods={financeMethods} 
                // AQUÍ ESTABA EL ERROR: Ahora conectamos la función real
                onFileSelect={(f) => {
                    // Usamos la misma función de subida de guía o creamos una local rápida
                    setUploading(true); 
                    uploadToCloudinary(f, cloudConfig, `DELIVERY-${Date.now()}`)
                        .then(r => {
                            setDeliveryForm(p => ({...p, imagen: r.secure_url}));
                            setUploading(false);
                        })
                        .catch(() => setUploading(false));
                }} 
                uploading={uploading}
            />

            <PaymentModal 
                isOpen={batchPayModalOpen} onClose={()=>setBatchPayModalOpen(false)}
                candidates={batchItemsCandidates} selectedIds={selectedBatchIds}
                toggleSelectAll={()=>{
                    const allIds = batchItemsCandidates.map(i => i.unique_id);
                    if(selectedBatchIds.length === allIds.length) setSelectedBatchIds([]); else setSelectedBatchIds(allIds);
                }} 
                toggleSelection={(id)=>{if(selectedBatchIds.includes(id)) setSelectedBatchIds(p=>p.filter(x=>x!==id)); else setSelectedBatchIds(p=>[...p,id])}}
                searchText={paymentSearchText} setSearchText={setPaymentSearchText}
                individualAmounts={individualAmounts} onAmountChange={(id,val)=>setIndividualAmounts(p=>({...p,[id]:val}))}
                form={paymentForm} setForm={setPaymentForm}
                financeMethods={financeMethods} isBank={isBankProv}
                onSave={submitBatchPayment}
            />

            <ClientPayModal 
                isOpen={clientPayModalOpen} onClose={()=>setClientPayModalOpen(false)}
                order={currentOrder} form={clientPayForm} setForm={setClientPayForm}
                financeMethods={financeMethods} isBank={isBankClient}
                onFileSelect={(f)=>uploadToCloudinary(f, cloudConfig, `PAY-CLIENT-${Date.now()}`).then(r=>setClientPayForm(p=>({...p, imagen:r.secure_url})))}
                uploading={uploading} onSave={submitClientPayment}
            />

            <AnomalyModal 
                isOpen={anomalyModalOpen} onClose={()=>setAnomalyModalOpen(false)}
                items={anomalyItems} selectedIds={selectedAnomalyIds}
                toggleSelection={toggleAnomalySelection}
                details={anomalyDetails} updateDetail={updateAnomalyDetail}
                onSave={submitAnomaly} reasons={anomalyReasons} shipping={shipping} currentOrder={currentOrder}
            />

            <ResellModal 
                isOpen={resellModalOpen} onClose={()=>setResellModalOpen(false)}
                item={resellItem} form={resellForm} setForm={setResellForm}
                onSave={submitResell} financeMethods={financeMethods} isBank={isBankResell}
                onFileSelect={(f)=>uploadToCloudinary(f, cloudConfig, `RESELL-${Date.now()}`).then(r=>setResellForm(p=>({...p, imagen:r.secure_url})))}
                uploading={uploading}
            />

            <Modal isOpen={linkModalOpen} onClose={()=>setLinkModalOpen(false)} title="Unificar Envíos">
                <div className="space-y-4">
                    <p className="text-sm text-gray-600">Selecciona el pedido al cual quieres unir este envío:</p>
                    <div className="space-y-2">
                        {linkCandidates.map(c => (
                            <div key={c.targetOrderId} onClick={()=>setSelectedTargetId(c.targetOrderId)} className={`p-3 border rounded-lg cursor-pointer ${selectedTargetId === c.targetOrderId ? 'bg-indigo-50 border-indigo-500' : 'hover:bg-gray-50'}`}>
                                <div className="font-bold text-sm text-gray-800">{c.label}</div>
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <Button variant="secondary" onClick={()=>setLinkModalOpen(false)}>Cancelar</Button>
                        <Button onClick={submitLinkOrders} disabled={!selectedTargetId}>Confirmar Unión</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default OrdersView;