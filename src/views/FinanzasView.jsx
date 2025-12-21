import React, { useState, useMemo, useEffect } from 'react';
import useCollection from '../hooks/useCollection';
import { useUI } from '../context/UIContext';
import { db, doc, writeBatch, collection, addDoc, updateDoc, deleteDoc, getDoc } from '../lib/firebase';
import { formatCurrency, uploadToCloudinary } from '../lib/utils';
import Button from '../components/ui/Button';
import Icon, { Spinner } from '../components/ui/Icon';
import Modal from '../components/ui/Modal';
import { Input, NumberInput } from '../components/ui/Inputs';
import SmartSelect from '../components/ui/SmartSelect';
import ImageUploader from '../components/ui/ImageUploader';
import BulkActions from '../components/BulkActions';

const FinanzasView = () => {
    const { data: orders } = useCollection('pedidos');
    const { data: finanzas } = useCollection('finanzas');
    const { data: config } = useCollection('config_finanzas');
    const { data: products } = useCollection('productos');
    const { data: generalConfig } = useCollection('config_general');
    const { notify, confirmAction } = useUI();

    const [modalOpen, setModalOpen] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [filterType, setFilterType] = useState('Todos');
    const [selectedIds, setSelectedIds] = useState([]);
    
    // --- ESTADO DEL BUSCADOR ---
    const [globalSearch, setGlobalSearch] = useState('');

    const [form, setForm] = useState({ tipo: 'Gasto', categoria: '', metodo: '', monto: '', concepto: '', transaction_id: '', imagen: '' });

    const [searchOrder, setSearchOrder] = useState('');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [selectedItemsVals, setSelectedItemsVals] = useState([]);

    const [finConfig, setFinConfig] = useState({ ingresos: [], gastos: [], methods: [] });
    const [cloudConfig, setCloudConfig] = useState({});

    useEffect(() => { if (config.length) setFinConfig(config[0]); }, [config]);
    useEffect(() => { if (generalConfig.length) setCloudConfig(generalConfig[0]); }, [generalConfig]);
    useEffect(() => { if (!editingId) setForm(f => ({ ...f, categoria: '' })); }, [form.tipo, editingId]);

    // --- LÓGICA DE FILTRADO AVANZADA ---
    const filteredFinanzas = useMemo(() => { 
        let res = finanzas.sort((a, b) => new Date(b.fecha) - new Date(a.fecha)); 
        
        if (filterType !== 'Todos') res = res.filter(f => f.tipo === filterType); 
        
        if (globalSearch) {
            const lower = globalSearch.toLowerCase();
            res = res.filter(f => {
                if (
                    (f.concepto || '').toLowerCase().includes(lower) ||
                    (f.categoria || '').toLowerCase().includes(lower) ||
                    (f.metodo || '').toLowerCase().includes(lower) ||
                    (f.transaction_id || '').toLowerCase().includes(lower) ||
                    (f.monto || '').toString().includes(lower) ||
                    (f.fecha || '').includes(lower)
                ) return true;

                if (f.allocations && f.allocations.some(a => (a.item_name || '').toLowerCase().includes(lower))) return true;

                if (f.allocations && f.allocations.length > 0) {
                    const orderId = f.allocations[0].order_doc_id;
                    const linkedOrder = orders.find(o => o.id === orderId);
                    if (linkedOrder && linkedOrder.cliente?.nombre?.toLowerCase().includes(lower)) return true;
                }
                if (f.pedido_id) {
                    const linkedOrder = orders.find(o => o.id_visual === f.pedido_id);
                    if (linkedOrder && linkedOrder.cliente?.nombre?.toLowerCase().includes(lower)) return true;
                }
                return false;
            });
        }
        return res; 
    }, [finanzas, filterType, globalSearch, orders]);

    const filteredOrders = useMemo(() => { if (!searchOrder || !orders.length) return []; const lower = searchOrder.toLowerCase(); return orders.filter(o => o.id_visual.includes(lower) || o.cliente.nombre.toLowerCase().includes(lower)); }, [searchOrder, orders]);

    // --- SELECCIÓN ---
    const toggleSelectAll = () => { if (selectedIds.length === filteredFinanzas.length) setSelectedIds([]); else setSelectedIds(filteredFinanzas.map(f => f.id)); };
    const toggleSelectRow = (id) => { if (selectedIds.includes(id)) setSelectedIds(prev => prev.filter(x => x !== id)); else setSelectedIds(prev => [...prev, id]); };
    const handleSelectOrder = (order) => { setSelectedOrder(order); setSearchOrder(''); setSelectedItemsVals([]); };
    const toggleItemSelection = (uniqueId) => { if (selectedItemsVals.includes(uniqueId)) { setSelectedItemsVals(prev => prev.filter(id => id !== uniqueId)); } else { setSelectedItemsVals(prev => [...prev, uniqueId]); } };
    const handleSelectAllItems = () => { if (!selectedOrder) return; const allIds = selectedOrder.items.map(i => i.unique_id); setSelectedItemsVals(allIds); };

    useEffect(() => { if (!selectedOrder || selectedItemsVals.length === 0 || editingId) return; let totalDebt = 0; selectedOrder.items.forEach(item => { if (selectedItemsVals.includes(item.unique_id)) { totalDebt += (Number(item.costo) || 0) - (Number(item.pago_proveedor) || 0); } }); if (totalDebt > 0) setForm(prev => ({ ...prev, monto: totalDebt })); }, [selectedItemsVals, selectedOrder]);
    
    const handleFile = async (file) => { if (!file || !cloudConfig.cloud_name) return notify("Falta config Cloudinary", "error"); setUploading(true); try { const res = await uploadToCloudinary(file, cloudConfig, `TX-${Date.now()}`, cloudConfig.cloudinary_transaction_folder || 'pagos'); setForm(prev => ({ ...prev, imagen: res.secure_url })); } catch (e) { notify(e.message, "error"); } setUploading(false); };

    const openEditModal = (item) => { setEditingId(item.id); setForm(item); if (item.allocations && item.allocations.length > 0) { const linkedOrder = orders.find(o => o.id === item.allocations[0].order_doc_id); if (linkedOrder) { setSelectedOrder(linkedOrder); setSelectedItemsVals(item.allocations.map(a => a.item_unique_id)); } } else { setSelectedOrder(null); setSelectedItemsVals([]); } setModalOpen(true); };
    
    // --- LÓGICA DE REVERSIÓN ---
    const revertAllocations = async (txData, batch) => { 
        if (!txData.allocations || !Array.isArray(txData.allocations)) return; 
        const affectedOrders = [...new Set(txData.allocations.map(a => a.order_doc_id))]; 
        for (const orderId of affectedOrders) { 
            const orderRef = doc(db, 'pedidos', orderId); 
            const orderSnap = await getDoc(orderRef); 
            if (!orderSnap.exists()) continue; 
            const orderData = orderSnap.data(); 
            const updatedItems = [...orderData.items]; 
            txData.allocations.filter(a => a.order_doc_id === orderId).forEach(alloc => { 
                const idx = updatedItems.findIndex(i => i.unique_id === alloc.item_unique_id); 
                if (idx !== -1) { 
                    const currentPaid = Number(updatedItems[idx].pago_proveedor) || 0; 
                    updatedItems[idx].pago_proveedor = Math.max(0, currentPaid - alloc.amount); 
                } 
            }); 
            // Recalcular estado con la nueva lógica (incluyendo costo_envio_asignado)
            const allPaid = updatedItems.every(it => (Number(it.pago_proveedor) || 0) >= ((Number(it.costo) || 0) + (Number(it.costo_envio_asignado) || 0))); 
            const hasGuide = updatedItems.some(it => it.guia && it.guia.numero); 
            let newStatus = orderData.estado; 
            
            if (txData.categoria === 'Envío' || txData.categoria === 'Pago Proveedor') { 
                if (hasGuide) newStatus = 'Enviado'; 
                else if (allPaid) newStatus = 'En Despacho'; 
                else newStatus = 'Pendiente'; 
            } 
            batch.update(orderRef, { items: updatedItems, estado: newStatus }); 
        } 
    };

    const deleteTransaction = () => { if (!editingId) return; confirmAction({ title: "Eliminar y Reversar", message: "Se eliminará el pago y la deuda volverá a los productos. ¿Seguro?", onConfirm: async () => { try { const txRef = doc(db, 'finanzas', editingId); const txSnap = await getDoc(txRef); const txData = txSnap.data(); const batch = writeBatch(db); await revertAllocations(txData, batch); batch.delete(txRef); await batch.commit(); notify("Pago eliminado y saldos ajustados"); setModalOpen(false); } catch (e) { notify("Error: " + e.message, "error"); } } }); };
    
    const handleBulkDelete = () => { if (selectedIds.length === 0) return; confirmAction({ title: `Eliminar ${selectedIds.length} registros`, message: "Se reversarán los saldos. ¿Seguro?", onConfirm: async () => { try { const batch = writeBatch(db); for (const id of selectedIds) { const txData = finanzas.find(f => f.id === id); if (txData) { await revertAllocations(txData, batch); const ref = doc(db, 'finanzas', id); batch.delete(ref); } } await batch.commit(); notify("Eliminados"); setSelectedIds([]); } catch (e) { notify("Error: " + e.message, "error"); } } }); };

    const submitTransaction = async () => { if (!form.monto || !form.categoria || !form.metodo) return notify("Faltan datos", "error"); try { const batch = writeBatch(db); if (editingId) { const oldTx = finanzas.find(f => f.id === editingId); if (oldTx) await revertAllocations(oldTx, batch); } let newAllocations = []; let conceptoAutomatico = form.concepto; if (selectedOrder && selectedItemsVals.length > 0 && form.tipo === 'Gasto') { const amountPerItem = Number(form.monto) / selectedItemsVals.length; let productNames = []; selectedOrder.items.forEach(item => { if (selectedItemsVals.includes(item.unique_id)) { newAllocations.push({ order_doc_id: selectedOrder.id, order_visual_id: selectedOrder.id_visual, item_unique_id: item.unique_id, item_name: item.modelo, amount: amountPerItem }); productNames.push(item.modelo); } }); if (!form.concepto) { conceptoAutomatico = `Pago Pedido #${selectedOrder.id_visual}: ${productNames.join(', ')}`; } } const transactionData = { tipo: form.tipo || 'Ingreso', categoria: form.categoria || '', metodo: form.metodo || '', concepto: conceptoAutomatico, transaction_id: form.transaction_id || '', imagen: form.imagen || '', monto: Number(form.monto) || 0, ...(editingId ? {} : { fecha: new Date().toISOString() }), allocations: newAllocations }; if (editingId) { const txRef = doc(db, 'finanzas', editingId); batch.update(txRef, transactionData); } else { const newTxRef = doc(collection(db, 'finanzas')); batch.set(newTxRef, transactionData); } if (newAllocations.length > 0) { const orderRef = doc(db, 'pedidos', selectedOrder.id); const updatedItems = [...selectedOrder.items]; if (editingId) { const oldTx = finanzas.find(f => f.id === editingId); if (oldTx && oldTx.allocations) { oldTx.allocations.forEach(oldAlloc => { const idx = updatedItems.findIndex(i => i.unique_id === oldAlloc.item_unique_id); if (idx !== -1) updatedItems[idx].pago_proveedor = (updatedItems[idx].pago_proveedor || 0) - oldAlloc.amount; }); } } newAllocations.forEach(alloc => { const idx = updatedItems.findIndex(i => i.unique_id === alloc.item_unique_id); if (idx !== -1) { updatedItems[idx].pago_proveedor = (updatedItems[idx].pago_proveedor || 0) + alloc.amount; if (!updatedItems[idx].costo && products.length > 0) { const pBase = products.find(p => p.sku === updatedItems[idx].sku); if (pBase) updatedItems[idx].costo = pBase.costo; } } }); const allPaid = updatedItems.every(it => (Number(it.pago_proveedor) || 0) >= ((Number(it.costo) || 0) + (Number(it.costo_envio_asignado) || 0))); let newStatus = selectedOrder.estado; if (allPaid && selectedOrder.estado === 'Pendiente') newStatus = 'En Despacho'; else if (!allPaid && selectedOrder.estado === 'En Despacho') newStatus = 'Pendiente'; batch.update(orderRef, { items: updatedItems, estado: newStatus }); } await batch.commit(); notify(editingId ? "Actualizado correctamente" : "Registrado correctamente"); setModalOpen(false); setEditingId(null); setSelectedOrder(null); setSelectedItemsVals([]); setForm({ tipo: 'Gasto', categoria: '', metodo: '', monto: '', concepto: '', transaction_id: '', imagen: '' }); } catch (e) { notify("Error crítico: " + e.message, "error"); } };
    
    const isBank = finConfig.methods?.find(m => m.name === form.metodo)?.isBank;
    const getItemDebt = (item) => Math.max(0, ((Number(item.costo) || 0) + (Number(item.costo_envio_asignado) || 0)) - (Number(item.pago_proveedor) || 0));

    return (
        <div className="h-full flex flex-col fade-in pb-20 md:pb-0">
            {/* HEADER */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <div className="flex bg-white p-1 rounded-xl shadow-sm border border-gray-200">
                    {['Todos', 'Ingreso', 'Gasto'].map(type => (
                        <button key={type} onClick={() => setFilterType(type)} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${filterType === type ? 'bg-brand-dark text-white shadow-md' : 'text-gray-500 hover:text-brand-red'}`}>
                            {type}
                        </button>
                    ))}
                </div>
                
                {/* BUSCADOR */}
                <div className="relative w-full md:w-80">
                    <div className="absolute left-3 top-3 text-gray-400"><Icon name="Search" size={18}/></div>
                    <input 
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white shadow-sm focus:ring-2 focus:ring-brand-red focus:border-transparent outline-none transition-all placeholder:text-gray-400" 
                        placeholder="Buscar movimiento, cliente, fecha..." 
                        value={globalSearch} 
                        onChange={e => setGlobalSearch(e.target.value)} 
                    />
                </div>

                <div className="flex gap-2 items-center">
                    {selectedIds.length > 0 && (<Button variant="danger" onClick={handleBulkDelete} icon="Trash2" className="h-10 px-4 animate-pulse">Eliminar ({selectedIds.length})</Button>)}
                    <BulkActions type="Finanzas" data={finanzas} onImport={() => { }} sampleData={[]} />
                    <Button onClick={() => { setEditingId(null); setForm({ tipo: 'Gasto', categoria: 'Pago Proveedor', metodo: '', monto: '', concepto: '', transaction_id: '', imagen: '' }); setSelectedOrder(null); setSelectedItemsVals([]); setModalOpen(true); }} icon="Plus" className="bg-brand-red hover:bg-red-700 h-10 shadow-md">Registrar</Button>
                </div>
            </div>

            {/* TABLA DE FINANZAS */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex-1 overflow-hidden flex flex-col">
                <div className="overflow-auto flex-1 h-full">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 font-bold text-gray-500 sticky top-0 z-10 shadow-sm uppercase text-xs tracking-wider">
                            <tr>
                                <th className="p-4 w-10 text-center"><input type="checkbox" checked={selectedIds.length === filteredFinanzas.length && filteredFinanzas.length > 0} onChange={toggleSelectAll} className="w-4 h-4 cursor-pointer accent-brand-red" /></th>
                                <th className="p-4">Fecha</th>
                                <th className="p-4">Tipo</th>
                                <th className="p-4">Categoría</th>
                                <th className="p-4">Concepto / Detalle</th>
                                <th className="p-4">Método</th>
                                <th className="p-4 text-right">Monto</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredFinanzas.map(f => (
                                <tr key={f.id} onClick={() => openEditModal(f)} className={`hover:bg-gray-50 cursor-pointer transition-colors group ${selectedIds.includes(f.id) ? 'bg-red-50' : ''}`}>
                                    <td className="p-4 text-center" onClick={e => e.stopPropagation()}>
                                        <input type="checkbox" checked={selectedIds.includes(f.id)} onChange={() => toggleSelectRow(f.id)} className="w-4 h-4 cursor-pointer accent-brand-red" />
                                    </td>
                                    <td className="p-4 whitespace-nowrap text-gray-600">{new Date(f.fecha).toLocaleDateString()}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-[10px] font-bold border uppercase tracking-wider ${f.tipo === 'Ingreso' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-brand-red border-red-200'}`}>
                                            {f.tipo === 'Ingreso' ? 'INGRESO' : 'GASTO'}
                                        </span>
                                    </td>
                                    <td className="p-4 text-gray-700 font-medium">{f.categoria}</td>
                                    <td className="p-4">
                                        <div className="flex flex-col">
                                            <span className="font-medium text-gray-800 group-hover:text-brand-red transition-colors">{f.concepto}</span>
                                            {f.allocations && f.allocations.length > 0 && (
                                                <div className="flex gap-1 flex-wrap mt-1">
                                                    {f.allocations.map((alloc, i) => (
                                                        <span key={i} className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-500 border border-gray-200 truncate max-w-[150px]">{alloc.item_name}</span>
                                                    ))}
                                                </div>
                                            )}
                                            {f.transaction_id && <span className="text-[10px] text-gray-400 font-mono mt-0.5">Tx: {f.transaction_id}</span>}
                                        </div>
                                    </td>
                                    <td className="p-4 text-gray-600">{f.metodo}</td>
                                    <td className={`p-4 text-right font-bold font-mono text-sm ${f.tipo === 'Ingreso' ? 'text-emerald-600' : 'text-brand-red'}`}>
                                        {f.tipo === 'Ingreso' ? '+' : '-'}{formatCurrency(f.monto)}
                                    </td>
                                </tr>
                            ))}
                            {filteredFinanzas.length === 0 && <tr><td colSpan="7" className="p-12 text-center text-gray-400 italic flex flex-col items-center justify-center"><Icon name="Banknote" size={32} className="mb-2 opacity-50"/>No hay movimientos registrados.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODAL CREAR/EDITAR MOVIMIENTO */}
            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? "Editar Movimiento" : "Registrar Movimiento"}>
                <div className="space-y-5">
                    {!editingId && (
                        <div className="flex gap-4 p-1.5 bg-gray-100 rounded-xl">
                            <button onClick={() => setForm({ ...form, tipo: 'Ingreso' })} className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${form.tipo === 'Ingreso' ? 'bg-white shadow text-emerald-600' : 'text-gray-500 hover:text-gray-700'}`}>Ingreso</button>
                            <button onClick={() => setForm({ ...form, tipo: 'Gasto' })} className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${form.tipo === 'Gasto' ? 'bg-white shadow text-brand-red' : 'text-gray-500 hover:text-gray-700'}`}>Gasto</button>
                        </div>
                    )}

                    {/* VINCULACIÓN A PEDIDOS (SOLO PARA GASTOS) */}
                    {(form.tipo === 'Gasto' || (editingId && selectedOrder)) && (
                        <div className={`bg-gray-50 p-4 rounded-xl border transition-colors ${selectedOrder ? 'border-indigo-200 bg-indigo-50/30' : 'border-gray-200'}`}>
                            <label className="text-xs font-bold text-indigo-800 uppercase flex items-center gap-2 mb-3">
                                <Icon name="Link" size={14} /> {editingId ? 'Productos Asignados (Edición Bloqueada)' : 'Vincular a Pedido (Opcional)'}
                            </label>
                            
                            {!selectedOrder ? (
                                <div className="relative">
                                    <div className="absolute left-3 top-2.5 text-gray-400"><Icon name="Search" size={16} /></div>
                                    <input 
                                        className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-100" 
                                        placeholder="Buscar pedido o cliente..." 
                                        value={searchOrder} 
                                        onChange={e => setSearchOrder(e.target.value)} 
                                    />
                                    {searchOrder && filteredOrders.length > 0 && (
                                        <div className="absolute top-full left-0 right-0 bg-white shadow-xl rounded-b-xl border border-gray-100 z-20 max-h-48 overflow-auto mt-1">
                                            {filteredOrders.map(o => (
                                                <div key={o.id} onClick={() => handleSelectOrder(o)} className="p-3 hover:bg-indigo-50 cursor-pointer border-b border-gray-50 text-sm flex justify-between items-center transition-colors">
                                                    <div><span className="font-bold text-indigo-700">#{o.id_visual}</span> <span className="text-gray-700">{o.cliente.nombre}</span></div>
                                                    <span className="text-xs text-gray-400">{o.items.length} items</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-3 animate-fade-in">
                                    <div className="flex justify-between items-center bg-white p-3 rounded-lg border border-indigo-100 shadow-sm">
                                        <span className="text-sm font-bold text-indigo-900 flex items-center gap-2"><Icon name="User" size={14}/> #{selectedOrder.id_visual} - {selectedOrder.cliente.nombre}</span>
                                        {!editingId && <button onClick={() => { setSelectedOrder(null); setSelectedItemsVals([]) }} className="text-brand-red p-1.5 hover:bg-red-50 rounded-lg transition-colors"><Icon name="X" size={16} /></button>}
                                    </div>
                                    
                                    <div className="max-h-48 overflow-y-auto border rounded-lg bg-white divide-y divide-gray-50 scrollbar-hide">
                                        <div className="p-2 bg-gray-50 text-xs font-bold text-gray-500 flex justify-between items-center sticky top-0 border-b border-gray-100">
                                            <span>Selecciona los productos a pagar:</span>
                                            {!editingId && <button onClick={handleSelectAllItems} className="text-indigo-600 hover:underline">Todos</button>}
                                        </div>
                                        {selectedOrder.items.map((it, i) => { 
                                            const debt = getItemDebt(it); 
                                            const isSelected = selectedItemsVals.includes(it.unique_id); 
                                            return (
                                                <div key={i} onClick={() => !editingId && toggleItemSelection(it.unique_id)} className={`p-2.5 flex items-center gap-3 text-sm transition-colors ${!editingId ? 'cursor-pointer hover:bg-gray-50' : ''}`}>
                                                    <div className={`w-4 h-4 border rounded flex items-center justify-center transition-colors ${isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-gray-300'}`}>
                                                        {isSelected && <Icon name="Check" size={10} />}
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="font-medium text-gray-800">{it.modelo}</div>
                                                        <div className="text-[10px] text-gray-500">{it.proveedor_nombre}</div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-[10px] text-gray-400">Deuda: {formatCurrency(debt)}</div>
                                                        {isSelected && editingId && <span className="text-[10px] text-emerald-600 font-bold block">Vinculado</span>}
                                                    </div>
                                                </div>
                                            ); 
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Categoría</label>
                            <SmartSelect label="" value={form.categoria} onChange={e => setForm({ ...form, categoria: e.target.value })} options={(form.tipo === 'Ingreso' ? finConfig.ingresos : finConfig.gastos) || []} placeholder="Buscar..." />
                        </div>
                        <NumberInput 
                            label="Monto Total" 
                            value={form.monto} 
                            onChange={e => setForm({ ...form, monto: e.target.value })} 
                            className={selectedItemsVals.length > 0 ? "border-indigo-500 ring-2 ring-indigo-100 font-bold text-indigo-700" : "font-bold text-gray-800"} 
                        />
                    </div>
                    
                    <Input label="Concepto / Detalle" value={form.concepto} onChange={e => setForm({ ...form, concepto: e.target.value })} />
                    
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Método de Pago</label>
                        <SmartSelect label="" value={form.metodo} onChange={e => setForm({ ...form, metodo: e.target.value })} options={finConfig.methods?.map(m => m.name) || []} placeholder="Buscar método..." />
                    </div>

                    {isBank && (
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3">
                            <Input label="Número de Transacción" value={form.transaction_id} onChange={e => setForm({ ...form, transaction_id: e.target.value })} placeholder="Ej: 098213" />
                            <ImageUploader image={form.imagen} onFileSelect={handleFile} loading={uploading} onClear={() => setForm({ ...form, imagen: '' })} />
                        </div>
                    )}

                    <div className="pt-4 flex justify-between gap-3 border-t border-gray-100 mt-2">
                        {editingId ? (
                            <Button variant="danger" onClick={deleteTransaction} icon="Trash2">Eliminar</Button>
                        ) : (<div></div>)}
                        <div className="flex gap-2">
                            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</Button>
                            <Button onClick={submitTransaction} disabled={uploading} className={form.tipo === 'Ingreso' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-brand-red hover:bg-red-700'}>
                                {editingId ? 'Actualizar' : 'Registrar'}
                            </Button>
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default FinanzasView;