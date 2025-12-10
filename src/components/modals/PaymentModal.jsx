import React from 'react';
import Modal from '../Modal';
import Button from '../Button';
import Icon from '../Icon';
import { Input, NumberInput } from '../Inputs';
import SmartSelect from '../SmartSelect';
import ImageUploader from '../ImageUploader';
import { formatCurrency } from '../../lib/utils';

const PaymentModal = ({ 
    isOpen, 
    onClose, 
    candidates, // batchItemsCandidates
    selectedIds, // selectedBatchIds
    toggleSelectAll, 
    toggleSelection, 
    searchText, 
    setSearchText, 
    individualAmounts, 
    onAmountChange, 
    form, 
    setForm, 
    financeMethods, 
    isBank, 
    onFileSelect, 
    uploading, 
    onSave 
}) => {
    
    // Filtrado visual
    const visibleItems = candidates.filter(it => 
        `${it.modelo} ${it.clientName} ${it.sku}`.toLowerCase().includes(searchText.toLowerCase())
    );

    // Lógica para el botón de "Seleccionar Visibles"
    const areAllVisibleSelected = visibleItems.length > 0 && visibleItems.every(it => selectedIds.includes(it.unique_id));

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Registrar Pago Proveedor">
            <div className="space-y-5">
                
                {/* SECCIÓN 1: SELECCIÓN DE DEUDAS */}
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 shadow-inner">
                    <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-200">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Detalle de Deuda</label>
                        <button 
                            onClick={toggleSelectAll} 
                            className="text-xs text-indigo-600 font-bold hover:text-indigo-800 transition-colors"
                        >
                            {areAllVisibleSelected ? 'Deseleccionar Visibles' : 'Seleccionar Visibles'}
                        </button>
                    </div>
                    
                    {/* Buscador interno */}
                    <div className="relative mb-3">
                        <div className="absolute left-3 top-2.5 text-gray-400"><Icon name="Search" size={14}/></div>
                        <input 
                            className="w-full pl-9 pr-3 py-2 text-xs border border-gray-300 rounded-lg outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 bg-white" 
                            placeholder="Filtrar por modelo, SKU..." 
                            value={searchText} 
                            onChange={e => setSearchText(e.target.value)} 
                        />
                    </div>

                    {/* Lista con Scroll */}
                    <div className="max-h-56 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                        {visibleItems.map((it, i) => { 
                            const isSelected = selectedIds.includes(it.unique_id); 
                            const debt = Math.max(0, (Number(it.costo)||0) - (Number(it.pago_proveedor)||0)); 
                            
                            // Ocultar si no hay deuda y no está seleccionado
                            if(debt <= 0 && !isSelected) return null; 
                            
                            return (
                                <div 
                                    key={i} 
                                    onClick={() => toggleSelection(it.unique_id)} 
                                    className={`
                                        flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer
                                        ${isSelected 
                                            ? 'bg-white border-indigo-500 shadow-sm ring-1 ring-indigo-50' 
                                            : 'bg-white/50 border-gray-200 opacity-70 hover:opacity-100'
                                        }
                                    `}
                                >
                                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-gray-300'}`}>
                                        {isSelected && <Icon name="Check" size={12}/>}
                                    </div>
                                    
                                    <div className="flex-1 min-w-0">
                                        <div className="font-bold text-sm text-gray-800 truncate">{it.modelo}</div>
                                        <div className="text-[10px] text-gray-500 flex items-center gap-1">
                                            <span className="font-mono">#{it.orderVisualId}</span>
                                            {it.talla && <span className="bg-gray-100 px-1 rounded text-gray-600">T{it.talla}</span>}
                                            <span className="truncate max-w-[100px]">• {it.clientName}</span>
                                        </div>
                                    </div>

                                    {/* Input de monto individual */}
                                    {isSelected ? (
                                        <input 
                                            type="text" 
                                            inputMode="numeric" 
                                            className="w-24 text-right text-sm font-mono font-bold border border-indigo-300 rounded px-2 py-1 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-200 outline-none text-indigo-700 bg-indigo-50" 
                                            placeholder={formatCurrency(debt)} 
                                            value={individualAmounts[it.unique_id] || ''} 
                                            onChange={(e) => onAmountChange(it.unique_id, e.target.value)} 
                                            onClick={(e)=>e.stopPropagation()} 
                                        />
                                    ) : (
                                        <span className="text-xs font-mono text-gray-400 font-medium">{formatCurrency(debt)}</span>
                                    )}
                                </div>
                            ) 
                        })}
                        {visibleItems.length === 0 && <p className="text-center text-xs text-gray-400 py-4">No hay ítems con deuda.</p>}
                    </div>
                </div>

                {/* SECCIÓN 2: TOTALES Y MÉTODO */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-900 text-white p-4 rounded-xl text-center shadow-lg">
                        <label className="text-[10px] font-bold uppercase opacity-70 block mb-1">Total a Pagar</label>
                        <div className="text-2xl font-black tracking-tight">{formatCurrency(form.monto)}</div>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Método de Pago</label>
                        <SmartSelect 
                            label="" 
                            value={form.metodo} 
                            onChange={e => setForm({ ...form, metodo: e.target.value })} 
                            options={financeMethods} 
                            placeholder="Seleccionar..." 
                        />
                    </div>
                </div>

                {/* SECCIÓN 3: COMPROBANTE BANCARIO */}
                {isBank && (
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3 animate-fade-in">
                        <Input 
                            label="Número de Transacción" 
                            value={form.transaction_id} 
                            onChange={e => setForm({ ...form, transaction_id: e.target.value })} 
                            placeholder="Ej: 098213" 
                        />
                        <ImageUploader 
                            image={form.imagen} 
                            onFileSelect={onFileSelect} 
                            loading={uploading} 
                            onClear={() => setForm({ ...form, imagen: '' })} 
                        />
                    </div>
                )}

                {/* BOTONES */}
                <div className="pt-2 flex justify-end gap-3 border-t border-gray-100">
                    <Button variant="secondary" onClick={onClose}>Cancelar</Button>
                    <Button onClick={onSave} disabled={uploading || selectedIds.length === 0} className="bg-indigo-600 hover:bg-indigo-700 shadow-lg">
                        Confirmar Pago
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default PaymentModal;