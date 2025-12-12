import React, { useMemo } from 'react';
import Modal from '../Modal';
import Button from '../Button';
import Icon from '../Icon';
import { Input, NumberInput } from '../Inputs';
import SmartSelect from '../SmartSelect'; // El componente maestro
import ImageUploader from '../ImageUploader';
import SafeImg from '../SafeImg';
import { formatCurrency } from '../../lib/utils';

const OrderFormModal = ({
    isOpen,
    onClose,
    isEditing,
    client, setClient, cart, setCart,
    orderDate, setOrderDate,
    onSave,
    clientHistory, shippingOptions, handleCityChange,
    toggleInternal,
    productsList, providersList,
    addToCart, updateCartItem, removeFromCart,
    isCustomMode, setIsCustomMode, itemSearch, setItemSearch,
    customItem, setCustomItem, saveToInventory, setSaveToInventory,
    handleCustomFile, handleCustomProvider, createCustom, uploadingCustom,
    swappingIndex, setSwappingIndex
}) => {
    
    const handleClose = () => {
        if (setSwappingIndex) setSwappingIndex(null);
        onClose();
    };

    // --- 1. PREPARAR DATOS DE CLIENTES ---
    const clientOptions = useMemo(() => {
        return Object.values(clientHistory || {}).map(c => ({
            id: c.telefono,
            nombre: c.nombre,
            telefono: c.telefono,
            ciudad: c.ciudad_entrega,
            direccion: c.direccion
        }));
    }, [clientHistory]);

    // Manejador unificado para selección de clientes
    const handleClientSelect = (e) => {
        const c = e.target.object; // SmartSelect devuelve el objeto completo
        if (c) {
            setClient(prev => ({
                ...prev,
                nombre: c.nombre || prev.nombre,
                telefono: c.telefono || prev.telefono,
                ciudad_entrega: c.ciudad || prev.ciudad_entrega,
                direccion: c.direccion || prev.direccion
            }));
        } else {
            // Si escribió algo nuevo manualmente
            setClient(prev => ({ ...prev, [e.target.name]: e.target.value }));
        }
    };

    // --- 2. MANEJADOR DE PRODUCTOS ---
    const handleProductSelect = (e) => {
        const p = e.target.object;
        if (p) {
            addToCart(p);
            // El SmartSelect limpia su valor interno automáticamente si no se controla externamente,
            // pero aquí usamos itemSearch solo para limpiar si es necesario.
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title={isEditing ? "Editar Pedido" : "Nuevo Pedido"}>
            <div className="flex flex-col gap-6">
                
                {/* SECCIÓN A: DATOS DEL CLIENTE (Solo si no estamos sustituyendo producto) */}
                {swappingIndex === null && (
                    <div className="space-y-4 animate-fade-in">
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input type="date" label="Fecha" value={orderDate || ''} onChange={e => setOrderDate(e.target.value)} />
                            
                            {/* Buscador de Nombre (Con SmartSelect) */}
                            <div>
                                <SmartSelect 
                                    label="Nombre Cliente"
                                    placeholder="Buscar o escribir..."
                                    options={clientOptions}
                                    value={client.nombre || ''}
                                    onChange={(e) => { e.target.name = 'nombre'; handleClientSelect(e); }}
                                    searchFields={['nombre', 'telefono']}
                                    displayProp="nombre"
                                    valueProp="nombre"
                                    onCreate={(val) => setClient(prev => ({...prev, nombre: val}))}
                                    renderItem={(c, isSelected) => (
                                        <div className={`px-4 py-2 text-sm ${isSelected ? 'text-brand-red font-bold' : 'text-gray-700'}`}>
                                            <div>{c.nombre}</div>
                                            <div className="text-xs text-gray-400">{c.ciudad}</div>
                                        </div>
                                    )}
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-2 px-2">
                            <input type="checkbox" id="intOrder" checked={!!client.is_internal} onChange={toggleInternal} className="w-5 h-5 accent-brand-red cursor-pointer"/>
                            <label htmlFor="intOrder" className="text-sm font-bold text-gray-700 cursor-pointer select-none">¿Es Pedido Interno (Mío)?</label>
                        </div>

                        {!client.is_internal && (
                            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Buscador de Teléfono (Con SmartSelect) */}
                                <div>
                                    <SmartSelect 
                                        label="Teléfono"
                                        placeholder="Buscar..."
                                        options={clientOptions}
                                        value={client.telefono || ''}
                                        onChange={(e) => { e.target.name = 'telefono'; handleClientSelect(e); }}
                                        searchFields={['telefono', 'nombre']}
                                        displayProp="telefono"
                                        valueProp="telefono"
                                        onCreate={(val) => setClient(prev => ({...prev, telefono: val}))}
                                        renderItem={(c, isSelected) => (
                                            <div className={`px-4 py-2 text-sm ${isSelected ? 'text-brand-red' : 'text-gray-700'}`}>
                                                <div className="font-mono font-bold">{c.telefono}</div>
                                                <div className="text-xs text-gray-500">{c.nombre}</div>
                                            </div>
                                        )}
                                    />
                                </div>

                                <Input label="Ciudad Cliente" value={client.ciudad || ''} onChange={e => setClient({...client, ciudad: e.target.value})} />
                                <Input label="Dirección" value={client.direccion || ''} onChange={e => setClient({...client, direccion: e.target.value})} />
                                
                                {/* Ciudad Entrega (Lista simple estandarizada) */}
                                <div>
                                    <SmartSelect 
                                        label="Ciudad Entrega" 
                                        value={client.ciudad_entrega || ''} 
                                        onChange={handleCityChange} 
                                        options={shippingOptions} 
                                        displayProp="ciudad" 
                                        valueProp="ciudad" 
                                        placeholder="Seleccionar..." 
                                    />
                                </div>
                            </div>
                        )}

                        {client.es_acopio && (
                            <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-200 flex flex-col gap-2">
                                <div className="flex items-center gap-2 text-indigo-800 font-bold text-sm">
                                    <Icon name="Truck" size={16}/> 
                                    <span>Ciudad con Acopio Detectada</span>
                                </div>
                                {/* ESTANDARIZACIÓN: Adiós select nativo, hola SmartSelect */}
                                <SmartSelect 
                                    value={client.estrategia || 'Directo'} 
                                    onChange={e => setClient({...client, estrategia: e.target.value})}
                                    options={['Acopio', 'Directo']}
                                    placeholder="Seleccionar estrategia..."
                                />
                            </div>
                        )}
                        <div className="border-t border-gray-100 my-2"></div>
                    </div>
                )}

                {/* SECCIÓN B: BUSCADOR DE PRODUCTOS */}
                <div className="space-y-3 sticky top-0 bg-white z-20 pb-2">
                    {swappingIndex !== null && (
                        <div className="bg-amber-100 text-amber-800 p-3 rounded-lg flex justify-between items-center border border-amber-300 shadow-sm animate-pulse">
                            <span className="font-bold text-sm flex items-center gap-2">
                                <Icon name="RefreshCw" size={18}/> SELECCIONA EL PRODUCTO CORRECTO
                            </span>
                            <button onClick={() => setSwappingIndex(null)} className="text-xs underline font-bold">Cancelar Cambio</button>
                        </div>
                    )}

                    <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
                        <button onClick={() => setIsCustomMode(false)} className={`flex-1 text-xs font-bold py-2 rounded-md transition-all ${!isCustomMode ? 'bg-white text-brand-red shadow-sm' : 'text-gray-500'}`}>Buscar en Catálogo</button>
                        <button onClick={() => setIsCustomMode(true)} className={`flex-1 text-xs font-bold py-2 rounded-md transition-all ${isCustomMode ? 'bg-white text-brand-red shadow-sm' : 'text-gray-500'}`}>Crear Manual</button>
                    </div>

                    {!isCustomMode ? (
                        /* BUSCADOR DE PRODUCTOS (MODO RICO) */
                        <div className="relative z-20">
                            <SmartSelect
                                placeholder={swappingIndex !== null ? "Busca el producto correcto..." : "Buscar SKU, Marca o Modelo..."}
                                options={productsList}
                                onChange={handleProductSelect}
                                searchFields={['sku', 'modelo', 'marca']}
                                displayProp="modelo"
                                valueProp="id"
                                // DISEÑO PERSONALIZADO (FOTO + DETALLES)
                                renderItem={(p, isSelected) => (
                                    <div className={`flex items-center gap-3 p-2 border-b border-gray-50 last:border-0 ${isSelected ? 'bg-red-50' : ''}`}>
                                        <SafeImg src={p.imagen} className="w-10 h-10 rounded bg-gray-100 object-cover" />
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-bold text-gray-800 truncate">{p.modelo}</div>
                                            <div className="text-xs text-gray-500 flex gap-1">
                                                <span>{p.marca}</span> • <span className="font-mono">{p.sku}</span>
                                            </div>
                                        </div>
                                        <div className="text-xs font-bold text-brand-red">{formatCurrency(p.precio)}</div>
                                    </div>
                                )}
                            />
                        </div>
                    ) : (
                        /* FORMULARIO MANUAL */
                        <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 space-y-3 relative">
                            <div className="flex justify-between items-center mb-2">
                                <h4 className="text-xs font-bold text-amber-800 uppercase">Producto Manual</h4>
                                <div className="flex items-center gap-2 text-xs">
                                    <input type="checkbox" checked={saveToInventory} onChange={e => setSaveToInventory(e.target.checked)} className="cursor-pointer accent-amber-600"/>
                                    <label onClick={() => setSaveToInventory(!saveToInventory)} className="cursor-pointer text-amber-900 select-none">Guardar en catálogo</label>
                                </div>
                            </div>
                            
                            <ImageUploader image={customItem.imagen || ''} onFileSelect={handleCustomFile} loading={uploadingCustom} onClear={() => setCustomItem({...customItem, imagen: ''})} />
                            
                            <div className="grid grid-cols-2 gap-2">
                                <Input label="Marca" value={customItem.marca || ''} onChange={e => setCustomItem({...customItem, marca: e.target.value})} />
                                <Input label="Modelo" value={customItem.modelo || ''} onChange={e => setCustomItem({...customItem, modelo: e.target.value})} />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2">
                                {/* AQUÍ AGREGAMOS EL GÉNERO QUE FALTABA */}
                                <SmartSelect 
                                    label="Género" 
                                    value={customItem.genero || 'Unisex'} 
                                    onChange={e => setCustomItem({...customItem, genero: e.target.value})} 
                                    options={['Unisex', 'Hombre', 'Mujer', 'Niños']} 
                                    placeholder="Seleccionar..." 
                                />
                                <Input label="Talla" value={customItem.talla || ''} onChange={e => setCustomItem({...customItem, talla: e.target.value})} />
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <NumberInput label="Precio" value={customItem.precio || ''} onChange={e => setCustomItem({...customItem, precio: e.target.value})} />
                                <NumberInput label="Costo" value={customItem.costo || ''} onChange={e => setCustomItem({...customItem, costo: e.target.value})} />
                            </div>
                            
                            {/* Proveedor en Manual también estandarizado */}
                            <SmartSelect 
                                label="Proveedor" 
                                value={customItem.proveedor_uid || ''} 
                                onChange={handleCustomProvider} 
                                options={providersList} 
                                displayProp="nombre" 
                                valueProp="id" 
                                placeholder="Buscar Prov..." 
                            />
                            
                            <Button onClick={createCustom} className="w-full bg-amber-600 hover:bg-amber-700 text-white shadow-none" disabled={uploadingCustom}>
                                {swappingIndex !== null ? 'Sustituir Producto' : 'Agregar al Pedido'}
                            </Button>
                        </div>
                    )}
                </div>

                {/* SECCIÓN C: CARRITO */}
                <div className={`bg-white border rounded-xl overflow-hidden shadow-sm transition-colors ${swappingIndex !== null ? 'opacity-50 pointer-events-none border-amber-200' : 'border-gray-200'}`}>
                    <div className="bg-gray-50 px-4 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider">Resumen del Pedido</div>
                    <table className="w-full text-sm text-left">
                        <tbody className="divide-y divide-gray-100">
                            {cart.map((it, i) => (
                                <tr key={i} className={`group hover:bg-gray-50 ${swappingIndex === i ? 'bg-amber-100' : ''}`}>
                                    <td className="p-3 w-12">
                                        <img src={it.imagen || 'https://via.placeholder.com/40'} className="w-10 h-10 rounded-lg bg-gray-100 object-cover border border-gray-200"/>
                                    </td>
                                    <td className="p-3">
                                        <div className="font-bold text-gray-800">{it.modelo}</div>
                                        {(Number(it.pago_proveedor) > 0) && (
                                            <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 rounded font-bold">
                                                Pagado: {formatCurrency(it.pago_proveedor)}
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-3 w-20">
                                        <input className="w-full border border-gray-300 rounded-md px-1 py-1 text-center text-sm outline-none" value={it.talla || ''} onChange={e => updateCartItem(i, 'talla', e.target.value)} placeholder="Talla"/>
                                    </td>
                                    <td className="p-3 text-right font-bold text-gray-700">{formatCurrency(it.total)}</td>
                                    <td className="p-3 text-right w-16">
                                        <div className="flex gap-1 justify-end">
                                            <button onClick={() => setSwappingIndex(i)} className="text-gray-400 hover:text-amber-600 transition-colors p-1" title="Cambiar producto">
                                                <Icon name="RefreshCw" size={16}/>
                                            </button>
                                            <button onClick={() => removeFromCart(i)} className="text-gray-300 hover:text-brand-red transition-colors p-1">
                                                <Icon name="X" size={16}/>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {cart.length === 0 && <tr><td colSpan="5" className="p-8 text-center text-gray-400 italic">El carrito está vacío.</td></tr>}
                        </tbody>
                    </table>
                    {cart.length > 0 && (
                        <div className="bg-gray-50 p-3 text-right border-t border-gray-200">
                            <span className="text-xs text-gray-500 uppercase mr-2">Total Pedido:</span>
                            <span className="text-lg font-black text-brand-red">{formatCurrency(cart.reduce((s, i) => s + (Number(i.total)||0), 0))}</span>
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-3 pt-2">
                    <Button variant="secondary" onClick={handleClose} className="h-12 px-6">Cancelar</Button>
                    <Button onClick={onSave} className="h-12 px-8 bg-brand-dark hover:bg-black shadow-lg" disabled={swappingIndex !== null}>
                        {isEditing ? 'Actualizar Pedido' : 'Crear Pedido'}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default OrderFormModal;