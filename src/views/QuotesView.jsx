import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { useUI } from '../context/UIContext';
import { db, collection, addDoc, deleteDoc, updateDoc, doc } from '../lib/firebase';
import { formatCurrency } from '../lib/utils';
import Button from '../components/Button';
import Icon from '../components/Icon';
import SafeImg from '../components/SafeImg';
import QuoteModal from '../components/modals/QuoteModal';
import Modal from '../components/Modal';
import SmartSelect from '../components/SmartSelect';

const QuotesView = () => {
    const { quotes, products, shipping, providers, generalConfig, orders } = useData();
    const { notify, confirmAction } = useUI();
    const cloudConfig = generalConfig?.[0] || {};

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    
    // Estados para Modales
    const [convertModalOpen, setConvertModalOpen] = useState(false);
    const [changeProviderModalOpen, setChangeProviderModalOpen] = useState(false); // <--- NUEVO
    const [selectedQuote, setSelectedQuote] = useState(null);
    const [selectedProviderId, setSelectedProviderId] = useState('');

    const clientHistory = useMemo(() => {
        const history = {};
        orders.forEach(o => { 
            if (o.cliente?.telefono?.length > 5) history[o.cliente.telefono.trim()] = o.cliente; 
        });
        return history;
    }, [orders]);

    const handleSaveQuote = async (data) => {
        try {
            await addDoc(collection(db, 'cotizaciones'), data);
            notify("Cotización agregada");
            setIsCreateOpen(false);
        } catch (e) { notify(e.message, "error"); }
    };

    // --- ACCIÓN: "NO LO TIENE / DESCARTAR" ---
    const handleNegativeAction = (quote) => {
        confirmAction({
            title: "¿Qué pasó?",
            message: `El proveedor ${quote.producto.proveedor_nombre} no tiene el producto. ¿Qué quieres hacer?`,
            confirmText: "Cambiar Proveedor",
            cancelText: "Eliminar Cotización",
            onConfirm: () => {
                // Opción A: Cambiar Proveedor
                setSelectedQuote(quote);
                setSelectedProviderId('');
                setChangeProviderModalOpen(true);
            },
            onCancel: async () => {
                // Opción B: Eliminar (Realmente es onCancel del confirmAction personalizado, 
                // pero si tu confirmAction no soporta callback de cancelar, tendrías que hacer un modal propio.
                // Asumiremos que si cierra o cancela, no hace nada, y el usuario debe usar un botón de basura explícito).
                // Haremos algo mejor: Dos botones separados en la tarjeta.
            }
        });
    };
    
    // Mejor estrategia: Funciones directas para botones separados
    const handleDelete = (id) => {
        confirmAction({
            title: "Eliminar", 
            message: "¿Borrar esta cotización definitivamente?", 
            onConfirm: async () => await deleteDoc(doc(db, 'cotizaciones', id))
        });
    };

    const openChangeProvider = (quote) => {
        setSelectedQuote(quote);
        setSelectedProviderId('');
        setChangeProviderModalOpen(true);
    };

    const handleSubmitChangeProvider = async () => {
        if (!selectedProviderId) return notify("Selecciona un proveedor", "error");
        try {
            const providerName = providers.find(p => p.id === selectedProviderId)?.nombre || 'Externo';
            const quoteRef = doc(db, 'cotizaciones', selectedQuote.id);
            
            await updateDoc(quoteRef, {
                'producto.proveedor_uid': selectedProviderId,
                'producto.proveedor_nombre': providerName
            });
            
            notify("Proveedor actualizado. ¡Intenta de nuevo!");
            setChangeProviderModalOpen(false);
        } catch (e) { notify(e.message, "error"); }
    };

    const openConvert = (quote) => {
        setSelectedQuote(quote);
        // Si ya tiene proveedor asignado, pre-seleccionarlo
        setSelectedProviderId(quote.producto.proveedor_uid || '');
        setConvertModalOpen(true);
    };

    const handleConvert = async () => {
        if (!selectedProviderId) return notify("Selecciona un proveedor", "error");
        try {
            const providerName = providers.find(p => p.id === selectedProviderId)?.nombre || 'Externo';
            
            const newOrder = {
                cliente: {
                    nombre: selectedQuote.cliente.nombre,
                    telefono: selectedQuote.cliente.telefono,
                    ciudad_entrega: selectedQuote.cliente.ciudad_entrega,
                    direccion: '', 
                    es_acopio: false,
                    estrategia: 'Directo'
                },
                items: [{
                    sku: selectedQuote.producto.sku || 'COT-AUTO',
                    modelo: selectedQuote.producto.modelo,
                    imagen: selectedQuote.producto.imagen,
                    precio: Number(selectedQuote.producto.precio),
                    costo: Number(selectedQuote.producto.costo),
                    talla: selectedQuote.producto.talla || '', // <--- PASAMOS LA TALLA
                    proveedor_uid: selectedProviderId,
                    proveedor_nombre: providerName,
                    cantidad: 1,
                    total: Number(selectedQuote.producto.precio),
                    unique_id: crypto.randomUUID(),
                    pago_proveedor: 0,
                    costo_envio_asignado: 0
                }],
                total: Number(selectedQuote.producto.precio),
                pago_cliente: 0,
                estado: 'Pendiente',
                fecha: new Date().toISOString(),
                id_visual: Date.now().toString().slice(-6)
            };

            await addDoc(collection(db, 'pedidos'), newOrder);
            await deleteDoc(doc(db, 'cotizaciones', selectedQuote.id));

            notify("¡Pedido Creado! Ve a la sección Pedidos.");
            setConvertModalOpen(false);
        } catch (e) { notify(e.message, "error"); }
    };

    return (
        <div className="h-full flex flex-col fade-in pb-20 md:pb-0">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-800">Cotizaciones Pendientes</h2>
                <Button onClick={() => setIsCreateOpen(true)} icon="Plus" className="bg-brand-red text-white">Nueva Solicitud</Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto pb-4">
                {quotes.map(q => (
                    <div key={q.id} className="bg-white p-4 rounded-xl shadow-card border border-gray-200 flex flex-col gap-3 group hover:shadow-lg transition-shadow relative">
                        {/* Botón Borrar (Esquina) */}
                        <button onClick={() => handleDelete(q.id)} className="absolute top-2 right-2 text-gray-300 hover:text-red-500 p-1">
                            <Icon name="Trash2" size={16}/>
                        </button>

                        <div className="flex gap-4">
                            <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden shrink-0 border border-gray-200">
                                <SafeImg src={q.producto.imagen} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 min-w-0 pr-6">
                                <h3 className="font-bold text-gray-800 truncate">{q.producto.modelo}</h3>
                                <div className="text-xs text-gray-500 mb-1 flex items-center gap-2">
                                    <span>{q.producto.marca}</span>
                                    {q.producto.talla && <span className="bg-gray-100 px-1.5 rounded font-bold text-gray-700">T{q.producto.talla}</span>}
                                </div>
                                <div className="flex justify-between items-center mt-1">
                                    <div className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded w-fit font-mono font-bold">
                                        {formatCurrency(q.producto.precio)}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Proveedor Actual */}
                        <div className="bg-amber-50 border border-amber-100 px-3 py-2 rounded-lg flex justify-between items-center">
                            <div className="text-xs text-amber-800">
                                <span className="font-bold block">Preguntar a:</span>
                                {q.producto.proveedor_nombre || 'Sin Asignar'}
                            </div>
                            <button onClick={() => openChangeProvider(q)} className="text-[10px] font-bold bg-white border border-amber-200 text-amber-700 px-2 py-1 rounded hover:bg-amber-100 transition-colors">
                                Cambiar
                            </button>
                        </div>

                        <div className="border-t border-gray-100 pt-2 flex flex-col gap-1">
                            <div className="text-xs text-gray-500 flex items-center gap-1"><Icon name="User" size={12}/> {q.cliente.nombre}</div>
                            <div className="text-xs text-gray-500 flex items-center gap-1"><Icon name="MapPin" size={12}/> {q.cliente.ciudad_entrega}</div>
                        </div>

                        {/* Botón Principal */}
                        <button onClick={() => openConvert(q)} className="w-full py-2.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-colors text-sm font-bold flex items-center justify-center gap-2 shadow-md shadow-emerald-200">
                            <Icon name="Check" size={18}/> ¡Lo conseguí!
                        </button>
                    </div>
                ))}
                
                {quotes.length === 0 && (
                    <div className="col-span-full flex flex-col items-center justify-center text-gray-400 py-12">
                        <Icon name="Inbox" size={48} className="mb-2 opacity-50"/>
                        <p>No tienes cotizaciones pendientes.</p>
                    </div>
                )}
            </div>

            {/* MODAL CREAR */}
            <QuoteModal 
                isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)}
                productsList={products} shippingOptions={shipping} cloudConfig={cloudConfig}
                onSave={handleSaveQuote} clientHistory={clientHistory} providersList={providers}
            />

            {/* MODAL CONVERTIR */}
            <Modal isOpen={convertModalOpen} onClose={() => setConvertModalOpen(false)} title="¡Producto Conseguido!">
                <div className="space-y-4">
                    <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-center">
                        <h4 className="font-bold text-emerald-800 text-lg">Confirmar Proveedor</h4>
                        <p className="text-xs text-emerald-600">Se creará el pedido a nombre de este proveedor.</p>
                    </div>
                    <SmartSelect 
                        label="Proveedor Final"
                        options={providers} 
                        value={selectedProviderId} 
                        onChange={e => setSelectedProviderId(e.target.value)} 
                        placeholder="Buscar proveedor..."
                    />
                    <div className="flex justify-end gap-2 pt-4">
                        <Button variant="secondary" onClick={() => setConvertModalOpen(false)}>Cancelar</Button>
                        <Button onClick={handleConvert} className="bg-emerald-600 hover:bg-emerald-700">Crear Pedido</Button>
                    </div>
                </div>
            </Modal>

            {/* MODAL CAMBIAR PROVEEDOR */}
            <Modal isOpen={changeProviderModalOpen} onClose={() => setChangeProviderModalOpen(false)} title="Intentar con otro">
                <div className="space-y-4">
                    <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-center">
                        <div className="text-amber-600 mb-2"><Icon name="AlertCircle" size={32} className="mx-auto"/></div>
                        <h4 className="font-bold text-amber-800">¿Quién más podría tenerlo?</h4>
                        <p className="text-xs text-amber-700">Selecciona otro proveedor para actualizar la tarjeta.</p>
                    </div>
                    <SmartSelect 
                        label="Nuevo Proveedor"
                        options={providers} 
                        value={selectedProviderId} 
                        onChange={e => setSelectedProviderId(e.target.value)} 
                        placeholder="Buscar otro proveedor..."
                    />
                    <div className="flex justify-end gap-2 pt-4">
                        <Button variant="secondary" onClick={() => setChangeProviderModalOpen(false)}>Cancelar</Button>
                        <Button onClick={handleSubmitChangeProvider} className="bg-amber-600 hover:bg-amber-700 text-white">Actualizar Cotización</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default QuotesView;