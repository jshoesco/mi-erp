import React from 'react';
import Modal from '../Modal';
import Button from '../Button';
import Icon from '../Icon';
import { Input, NumberInput } from '../Inputs';
import SmartSelect from '../SmartSelect';
import ImageUploader from '../ImageUploader';
import { formatCurrency } from '../../lib/utils'; // Asegúrate que la ruta sea correcta (../../lib/utils)

const GuideModal = ({ 
    isOpen, 
    onClose, 
    form, 
    setForm, 
    items, // Lista completa de items del pedido (targetItems)
    selectedIds, // IDs de los items seleccionados
    toggleSelectAll, 
    toggleSelection, 
    searchText, 
    setSearchText,
    onSave, 
    onDelete, 
    financeMethods, 
    isBank, 
    onFileSelect, 
    uploading 
}) => {
    
    // Filtrar visualmente los items
    const visibleItems = items.filter(it => 
        `${it.modelo} ${it.clientName} ${it.orderVisualId}`.toLowerCase().includes(searchText.toLowerCase())
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Registrar Despacho">
            <div className="space-y-5">
                
                {/* SECCIÓN 1: SELECCIÓN DE PRODUCTOS */}
                <div className="bg-gray-50 border border-gray-200 p-4 rounded-xl shadow-inner">
                    <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-200">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                            Productos a Despachar ({selectedIds.length})
                        </label>
                        <button 
                            onClick={toggleSelectAll} 
                            className="text-xs text-brand-red font-bold hover:underline transition-colors"
                        >
                            {selectedIds.length === visibleItems.length && visibleItems.length > 0 ? 'Deseleccionar Todos' : 'Seleccionar Todos'}
                        </button>
                    </div>

                    {/* Buscador interno */}
                    <div className="relative mb-3">
                        <div className="absolute left-3 top-2.5 text-gray-400"><Icon name="Search" size={14}/></div>
                        <input 
                            className="w-full pl-8 pr-3 py-2 text-xs border border-gray-300 rounded-lg outline-none focus:border-brand-red focus:ring-1 focus:ring-red-100 transition-all" 
                            placeholder="Buscar por modelo, cliente..." 
                            value={searchText} 
                            onChange={e => setSearchText(e.target.value)} 
                        />
                    </div>

                    {/* Lista con Scroll */}
                    <div className="max-h-48 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                        {visibleItems.map((it, i) => { 
                            const isSelected = selectedIds.includes(it.unique_id); 
                            return (
                                <div 
                                    key={i} 
                                    onClick={() => toggleSelection(it.unique_id)} 
                                    className={`
                                        flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-all duration-200
                                        ${isSelected 
                                            ? 'bg-white border-brand-red shadow-sm ring-1 ring-red-50' 
                                            : 'bg-white/50 border-gray-200 hover:border-gray-300 opacity-80 hover:opacity-100'
                                        }
                                    `}
                                >
                                    <div className={`
                                        w-5 h-5 rounded flex items-center justify-center border transition-colors
                                        ${isSelected ? 'bg-brand-red border-brand-red text-white' : 'bg-white border-gray-300'}
                                    `}>
                                        {isSelected && <Icon name="Check" size={12} />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-bold text-sm text-gray-800 truncate">{it.modelo}</div>
                                        <div className="text-[10px] text-gray-500 flex gap-2">
                                            <span>#{it.clientName}</span>
                                            {it.talla && <span className="bg-gray-100 px-1 rounded text-gray-600">T{it.talla}</span>}
                                        </div>
                                    </div>
                                </div>
                            ) 
                        })}
                        {visibleItems.length === 0 && <p className="text-center text-xs text-gray-400 py-4">No se encontraron productos.</p>}
                    </div>
                </div>

                {/* SECCIÓN 2: DATOS DE ENVÍO */}
                <div className="grid grid-cols-2 gap-4">
                    <Input type="date" label="Fecha de Envío" value={form.date} onChange={e => setForm({...form, date:e.target.value})} />
                    <Input label="Número de Guía" placeholder="Ej: 999000123" value={form.guide} onChange={e => setForm({...form, guide:e.target.value})} />
                </div>

                {/* SECCIÓN 3: COSTOS Y FINANZAS */}
                <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 space-y-4">
                    <div className="flex justify-between items-center">
                        <label className="text-xs font-bold text-indigo-900 uppercase flex items-center gap-1">
                            <Icon name="DollarSign" size={14}/> Costo del Envío
                        </label>
                        
                        <div 
                            className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-indigo-200 cursor-pointer hover:border-indigo-400 transition-colors"
                            onClick={() => setForm({...form, anticipado: !form.anticipado})}
                        >
                            <div className={`w-4 h-4 rounded border flex items-center justify-center ${form.anticipado ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-gray-300'}`}>
                                {form.anticipado && <Icon name="Check" size={10} />}
                            </div>
                            <span className="text-xs font-bold text-indigo-700 select-none">¿Pagado Anticipado?</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="md:col-span-1">
                            <NumberInput 
                                value={form.costo} 
                                onChange={e => setForm({...form, costo:e.target.value})} 
                                placeholder="$ 0" 
                                className="bg-white border-indigo-200 text-center font-bold text-indigo-900" 
                            />
                        </div>
                        
                        {/* Selector de Método (Solo si es anticipado y hay costo) */}
                        {form.anticipado && Number(form.costo) > 0 && (
                            <div className="md:col-span-2 animate-fade-in">
                                <SmartSelect 
                                    value={form.metodo} 
                                    onChange={e => setForm({...form, metodo:e.target.value})} 
                                    options={financeMethods} 
                                    placeholder="Método de Pago" 
                                />
                            </div>
                        )}
                    </div>

                    {/* Subida de Imagen (Solo si es Banco) */}
                    {form.anticipado && isBank && (
                        <div className="pt-2 animate-fade-in">
                            <ImageUploader 
                                image={form.imagen} 
                                onFileSelect={onFileSelect} 
                                loading={uploading} 
                                onClear={() => setForm({...form, imagen: ''})} 
                            />
                        </div>
                    )}
                </div>

                {/* BOTONES DE ACCIÓN */}
                <div className="flex justify-between gap-3 pt-2 border-t border-gray-100">
                    <Button variant="danger" onClick={onDelete} icon="Trash2" className="bg-white border-red-200 text-red-600 hover:bg-red-50">
                        Reversar
                    </Button>
                    <div className="flex gap-2">
                        <Button variant="secondary" onClick={onClose}>Cancelar</Button>
                        <Button onClick={onSave} disabled={uploading} className="bg-brand-dark hover:bg-black shadow-lg">
                            Confirmar Envío
                        </Button>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default GuideModal;