import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { useUI } from '../context/UIContext';
import { db, collection, addDoc, deleteDoc, doc } from '../lib/firebase';
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
    
    // Estado para "Convertir a Pedido"
    const [convertModalOpen, setConvertModalOpen] = useState(false);
    const [selectedQuote, setSelectedQuote] = useState(null);
    const [selectedProviderId, setSelectedProviderId] = useState('');

    // --- NUEVO: MEMORIA DE CLIENTES (Igual que en Pedidos) ---
    const clientHistory = useMemo(() => {
        const history = {};
        orders.forEach(o => { 
            if (o.cliente?.telefono?.length > 5) {
                // Guardamos por teléfono y también preparamos búsqueda por nombre
                history[o.cliente.telefono.trim()] = o.cliente; 
            }
        });
        return history;
    }, [orders]);

    // 1. GUARDAR NUEVA COTIZACIÓN
    const handleSaveQuote = async (data) => {
        try {
            await addDoc(collection(db, 'cotizaciones'), data);
            notify("Cotización agregada");
            setIsCreateOpen(false);
        } catch (e) { notify(e.message, "error"); }
    };

    // 2. DESCARTAR
    const handleDiscard = (id) => {
        confirmAction({
            title: "Descartar Cotización",
            message: "¿El cliente ya no quiere o no se consiguió? Se borrará de la lista.",
            onConfirm: async () => {
                await deleteDoc(doc(db, 'cotizaciones', id));
                notify("Descartado");
            }
        });
    };

    // 3. ABRIR CONVERSIÓN
    const openConvert = (quote) => {
        setSelectedQuote(quote);
        setSelectedProviderId(''); 
        setConvertModalOpen(true);
    };

    // 4. CONVERTIR A PEDIDO REAL
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

            {/* LISTA DE COTIZACIONES */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto pb-4">
                {quotes.map(q => (
                    <div key={q.id} className="bg-white p-4 rounded-xl shadow-card border border-gray-200 flex flex-col gap-3 group hover:shadow-lg transition-shadow">
                        <div className="flex gap-4">
                            <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden shrink-0 border border-gray-200">
                                <SafeImg src={q.producto.imagen} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-gray-800 truncate">{q.producto.modelo}</h3>
                                <p className="text-xs text-gray-500 mb-1">{q.producto.marca}</p>
                                <div className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded w-fit font-mono font-bold">
                                    {formatCurrency(q.producto.precio)}
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-gray-100 pt-3 flex flex-col gap-1">
                            <div className="text-xs text-gray-500 flex items-center gap-1"><Icon name="User" size={12}/> {q.cliente.nombre}</div>
                            <div className="text-xs text-gray-500 flex items-center gap-1"><Icon name="Phone" size={12}/> {q.cliente.telefono}</div>
                            <div className="text-xs text-gray-500 flex items-center gap-1"><Icon name="MapPin" size={12}/> {q.cliente.ciudad_entrega}</div>
                        </div>

                        <div className="flex gap-2 mt-2">
                            <button onClick={() => handleDiscard(q.id)} className="flex-1 py-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors text-xs font-bold flex items-center justify-center gap-1">
                                <Icon name="X" size={14}/> No hay
                            </button>
                            <button onClick={() => openConvert(q)} className="flex-1 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors text-xs font-bold flex items-center justify-center gap-1 shadow-md">
                                <Icon name="Check" size={14}/> Conseguido
                            </button>
                        </div>
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
                productsList={products} 
                shippingOptions={shipping} 
                cloudConfig={cloudConfig}
                onSave={handleSaveQuote}
                clientHistory={clientHistory} // <-- PASAMOS LA MEMORIA AQUÍ
            />

            {/* MODAL CONVERTIR A PEDIDO */}
            <Modal isOpen={convertModalOpen} onClose={() => setConvertModalOpen(false)} title="¡Producto Conseguido!">
                <div className="space-y-4">
                    <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-center">
                        <h4 className="font-bold text-emerald-800 text-lg">¿Quién lo tiene?</h4>
                        <p className="text-xs text-emerald-600">Selecciona el proveedor para crear el pedido inmediatamente.</p>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase block mb-2">Proveedor</label>
                        <SmartSelect options={providers} value={selectedProviderId} onChange={e => setSelectedProviderId(e.target.value)} placeholder="Buscar proveedor..." />
                    </div>
                    <div className="flex justify-end gap-2 pt-4">
                        <Button variant="secondary" onClick={() => setConvertModalOpen(false)}>Cancelar</Button>
                        <Button onClick={handleConvert} className="bg-emerald-600 hover:bg-emerald-700">Crear Pedido</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default QuotesView;