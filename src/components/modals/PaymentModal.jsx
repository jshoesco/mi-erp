import React, { useEffect } from 'react';
import Modal from '../Modal';
import Button from '../Button';
import Icon from '../Icon';
import { formatCurrency } from '../../lib/utils';
// IMPORTAMOS EL COMPONENTE MAESTRO
import PaymentSection from '../PaymentSection';

// Helpers locales
const cleanNumber = (val) => {
    if (!val) return 0;
    return Number(val.toString().replace(/\./g, '').replace(/\D/g, '')) || 0;
};

const formatRaw = (val) => {
    if (!val) return '';
    return val.toString().replace(/\D/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

const PaymentModal = ({ 
    isOpen, 
    onClose, 
    candidates, 
    selectedIds, 
    toggleSelectAll, 
    toggleSelection, 
    searchText, 
    setSearchText, 
    individualAmounts, 
    onAmountChange, 
    form, 
    setForm, 
    financeMethods, 
    // isBank ya no se necesita aquí porque PaymentSection lo calcula solo
    onFileSelect, 
    uploading, 
    onSave 
}) => {
    
    // Calculadora automática
    useEffect(() => {
        if (!isOpen) return;
        let total = 0;
        selectedIds.forEach(id => {
            total += cleanNumber(individualAmounts[id]);
        });
        setForm(prev => ({ ...prev, monto: total }));
    }, [selectedIds, individualAmounts, isOpen, setForm]);

    const visibleItems = candidates.filter(it => 
        `${it.modelo} ${it.clientName} ${it.sku}`.toLowerCase().includes(searchText.toLowerCase())
    );

    const areAllVisibleSelected = visibleItems.length > 0 && visibleItems.every(it => selectedIds.includes(it.unique_id));

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Registrar Pago Proveedor">
            <div className="space-y-5">
                
                {/* SECCIÓN 1: SELECCIÓN (Sin cambios) */}
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 shadow-inner">
                    <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-200">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Detalle de Deuda</label>
                        <button onClick={toggleSelectAll} className="text-xs text-indigo-600 font-bold hover:text-indigo-800 transition-colors">
                            {areAllVisibleSelected ? 'Deseleccionar Visibles' : 'Seleccionar Visibles'}
                        </button>
                    </div>
                    
                    <div className="relative mb-3">
                        <div className="absolute left-3 top-2.5 text-gray-400"><Icon name="Search" size={14}/></div>
                        <input className="w-full pl-9 pr-3 py-2 text-xs border border-gray-300 rounded-lg outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 bg-white" placeholder="Filtrar por modelo, SKU..." value={searchText} onChange={e => setSearchText(e.target.value)} />
                    </div>

                    <div className="max-h-56 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                        {visibleItems.map((it, i) => { 
                            const isSelected = selectedIds.includes(it.unique_id); 
                            const debt = Math.max(0, (Number(it.costo)||0) - (Number(it.pago_proveedor)||0)); 
                            if(debt <= 0 && !isSelected) return null; 
                            return (
                                <div key={i} onClick={() => toggleSelection(it.unique_id)} className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer ${isSelected ? 'bg-white border-indigo-500 shadow-sm ring-1 ring-indigo-50' : 'bg-white/50 border-gray-200 opacity-70 hover:opacity-100'}`}>
                                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-gray-300'}`}>
                                        {isSelected && <Icon name="Check" size={12}/>}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-bold text-sm text-gray-800 truncate">{it.modelo}</div>
                                        <div className="text-[10px] text-gray-500 flex items-center gap-1">
                                            <span className="bg-orange-100 text-orange-800 px-1 rounded font-bold uppercase">{it.proveedor_nombre}</span>
                                            <span className="font-mono">#{it.orderVisualId}</span>
                                        </div>
                                    </div>
                                    {isSelected ? (
                                        <input type="text" inputMode="numeric" className="w-24 text-right text-sm font-mono font-bold border border-indigo-300 rounded px-2 py-1 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-200 outline-none text-indigo-700 bg-indigo-50" placeholder="$0" value={individualAmounts[it.unique_id] ? formatRaw(individualAmounts[it.unique_id]) : ''} onChange={(e) => onAmountChange(it.unique_id, e.target.value)} onClick={(e)=>e.stopPropagation()} />
                                    ) : (
                                        <span className="text-xs font-mono text-gray-400 font-medium">{formatCurrency(debt)}</span>
                                    )}
                                </div>
                            ) 
                        })}
                        {visibleItems.length === 0 && <p className="text-center text-xs text-gray-400 py-4">No hay ítems con deuda.</p>}
                    </div>
                </div>

                {/* SECCIÓN 2: TOTALES Y COMPONENTE DE PAGO UNIFICADO */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-900 text-white p-4 rounded-xl text-center shadow-lg h-fit">
                        <label className="text-[10px] font-bold uppercase opacity-70 block mb-1">Total a Pagar</label>
                        <div className="text-2xl font-black tracking-tight">{formatCurrency(form.monto)}</div>
                    </div>
                    
                    {/* AQUÍ ESTÁ LA MAGIA: Usamos el componente maestro */}
                    <div>
                        <PaymentSection 
                            form={form}
                            setForm={setForm}
                            financeMethods={financeMethods}
                            uploading={uploading}
                            onFileSelect={onFileSelect}
                        />
                    </div>
                </div>

                <div className="pt-2 flex justify-end gap-3 border-t border-gray-100">
                    <Button variant="secondary" onClick={onClose}>Cancelar</Button>
                    <Button onClick={onSave} disabled={uploading || selectedIds.length === 0} className="bg-indigo-600 hover:bg-indigo-700 shadow-lg">Confirmar Pago</Button>
                </div>
            </div>
        </Modal>
    );
};

export default PaymentModal;