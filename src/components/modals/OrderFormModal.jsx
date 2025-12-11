import React from 'react';
import Modal from '../Modal';
import Button from '../Button';
import Icon from '../Icon';
import { Input, NumberInput } from '../Inputs';
import SmartSelect from '../SmartSelect';
import ImageUploader from '../ImageUploader';
import { formatCurrency } from '../../lib/utils';

const OrderFormModal = ({
    isOpen,
    onClose,
    isEditing,
    client, setClient, cart, setCart,
    orderDate, setOrderDate,
    onSave,
    handlePhoneChange, clientHistory, shippingOptions, handleCityChange,
    toggleInternal,
    productsList, providersList,
    addToCart, updateCartItem, removeFromCart,
    isCustomMode, setIsCustomMode, itemSearch, setItemSearch,
    customItem, setCustomItem, saveToInventory, setSaveToInventory,
    handleCustomFile, handleCustomProvider, createCustom, uploadingCustom,
    
    // NUEVOS PROPS PARA SUSTITUCIÓN
    swappingIndex,
    setSwappingIndex
}) => {
    
    // Cancelar modo sustitución si cierran el modal
    const handleClose = () => {
        if (setSwappingIndex) setSwappingIndex(null);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title={isEditing ? "Editar Pedido" : "Nuevo Pedido"}>
            <div className="flex flex-col gap-6">
                
                {/* DATOS CLIENTE (Ocultar si estamos sustituyendo para enfocar) */}
                {swappingIndex === null && (
                    <div className="space-y-4 animate-fade-in">
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input type="date" label="Fecha" value={orderDate} onChange={e => setOrderDate(e.target.value)} />
                            <div className="flex-1">
                                <Input label="Nombre Cliente" value={client.nombre} onChange={e => setClient({...client, nombre: e.target.value})} />
                            </div>
                        </div>

                        <div className="flex items-center gap-2 px-2">
                            <input type="checkbox" id="intOrder" checked={client.is_internal} onChange={toggleInternal} className="w-5 h-5 accent-brand-red cursor-pointer"/>
                            <label htmlFor="intOrder" className="text-sm font-bold text-gray-700 cursor-pointer select-none">¿Es Pedido Interno (Mío)?</label>
                        </div>

                        {!client.is_internal && (
                            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex flex-col gap-1.5 w-full">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Teléfono</label>
                                    <input 
                                        className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:border-brand-red focus:ring-2 focus:ring-red-100 outline-none transition-all" 
                                        list="phones-list" 
                                        value={client.telefono} 
                                        onChange={handlePhoneChange} 
                                        placeholder="Buscar o escribir..."
                                    />
                                    <datalist id="phones-list">
                                        {Object.values(clientHistory).map((c, i) => (<option key={i} value={c.telefono}>{c.nombre} - {c.ciudad}</option>))}
                                    </datalist>
                                </div>
                                <Input label="Ciudad Cliente" value={client.ciudad} onChange={e => setClient({...client, ciudad: e.target.value})} />
                                <Input label="Dirección" value={client.direccion} onChange={e => setClient({...client, direccion: e.target.value})} />
                                <div>
                                    <SmartSelect label="Ciudad Entrega" value={client.ciudad_entrega} onChange={handleCityChange} options={shippingOptions} displayProp="ciudad" valueProp="ciudad" placeholder="Buscar Ciudad..." />
                                </div>
                            </div>
                        )}

                        {client.es_acopio && (
                            <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-200 flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2 text-indigo-800 font-bold"><Icon name="Truck"/> <span>Ciudad con Acopio</span></div>
                                <select className="px-3 py-1.5 rounded border border-indigo-300 bg-white text-indigo-900 outline-none" value={client.estrategia} onChange={e => setClient({...client, estrategia: e.target.value})}>
                                    <option value="Acopio">Enviar a Acopio</option>
                                    <option value="Directo">Envío Directo</option>
                                </select>
                            </div>
                        )}
                        <div className="border-t border-gray-100 my-2"></div>
                    </div>
                )}

                {/* SECCIÓN BUSCADOR / REEMPLAZO */}
                <div className="space-y-3 sticky top-0 bg-white z-20 pb-2">
                    {/* AVISO DE MODO SUSTITUCIÓN */}
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
                        <div className="relative z-20">
                            <div className="absolute left-3 top-3 text-gray-400"><Icon name="Search" size={16}/></div>
                            <input 
                                className={`w-full pl-9 pr-4 py-2.5 border rounded-xl text-sm focus:ring-2 outline-none ${swappingIndex !== null ? 'border-amber-400 ring-2 ring-amber-100' : 'border-gray-300 focus:ring-brand-red'}`}
                                placeholder={swappingIndex !== null ? "Busca el producto correcto..." : "Escribe SKU o Modelo..."}
                                value={itemSearch} 
                                onChange={e => setItemSearch(e.target.value)} 
                                autoFocus={swappingIndex !== null}
                            />
                            {itemSearch && (
                                <div className="absolute top-full left-0 right-0 bg-white shadow-xl rounded-b-xl border border-gray-100 mt-1 max-h-48 overflow-auto">
                                    {productsList.filter(p => p.sku.toLowerCase().includes(itemSearch.toLowerCase()) || p.modelo.toLowerCase().includes(itemSearch.toLowerCase())).map(p => (
                                        <div key={p.id} onClick={() => addToCart(p)} className="p-3 hover:bg-red-50 cursor-pointer border-b border-gray-50 flex justify-between items-center transition-colors">
                                            <div>
                                                <span className="font-bold text-gray-800">{p.modelo}</span> 
                                                <span className="text-xs text-gray-400 ml-2">({p.sku})</span>
                                            </div>
                                            <span className="font-bold text-brand-red">{formatCurrency(p.precio)}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 space-y-3 relative">
                            {/* ... (Código de producto manual igual que antes) ... */}
                            <div className="flex justify-between items-center mb-2">
                                <h4 className="text-xs font-bold text-amber-800 uppercase">Producto Manual</h4>
                                <div className="flex items-center gap-2 text-xs">
                                    <input type="checkbox" checked={saveToInventory} onChange={e => setSaveToInventory(e.target.checked)} className="cursor-pointer accent-amber-600"/>
                                    <label onClick={() => setSaveToInventory(!saveToInventory)} className="cursor-pointer text-amber-900 select-none">Guardar en catálogo</label>
                                </div>
                            </div>
                            <ImageUploader image={customItem.imagen} onFileSelect={handleCustomFile} loading={uploadingCustom} onClear={() => setCustomItem({...customItem, imagen: ''})} />
                            <div className="grid grid-cols-2 gap-2">
                            {/* Agregamos || '' para evitar el error al escribir */}
                            <Input label="Marca" value={customItem.marca || ''} onChange={e => setCustomItem({...customItem, marca: e.target.value})} />
                            <Input label="Modelo" value={customItem.modelo || ''} onChange={e => setCustomItem({...customItem, modelo: e.target.value})} />
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            <NumberInput label="Precio" value={customItem.precio || ''} onChange={e => setCustomItem({...customItem, precio: e.target.value})} />
                            <NumberInput label="Costo" value={customItem.costo || ''} onChange={e => setCustomItem({...customItem, costo: e.target.value})} />
                            <Input label="Talla" value={customItem.talla || ''} onChange={e => setCustomItem({...customItem, talla: e.target.value})} />
                        </div>
                            <SmartSelect label="Proveedor" value={customItem.proveedor_uid} onChange={handleCustomProvider} options={providersList} displayProp="nombre" valueProp="id" placeholder="Buscar Prov..." />
                            <Button onClick={createCustom} className="w-full bg-amber-600 hover:bg-amber-700 text-white shadow-none" disabled={uploadingCustom}>
                                {swappingIndex !== null ? 'Sustituir Producto' : 'Agregar al Pedido'}
                            </Button>
                        </div>
                    )}
                </div>

                {/* SECCIÓN 3: CARRITO */}
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
                                        {/* Mostrar si tiene pago ya registrado */}
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
                                            {/* BOTÓN SUSTITUIR */}
                                            <button onClick={() => setSwappingIndex(i)} className="text-gray-400 hover:text-amber-600 transition-colors p-1" title="Cambiar producto (Mantener pago)">
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