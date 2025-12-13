import React, { useState, useEffect } from 'react';
import Modal from '../Modal';
import Button from '../Button';
import { Input } from '../Inputs';
import Icon from '../Icon';
import SafeImg from '../SafeImg';
import { useUI } from '../../context/UIContext';
import { db, doc, updateDoc } from '../../lib/firebase';

const ShippingLabelModal = ({ isOpen, onClose, items, defaultSender }) => {
    const { notify } = useUI();
    const [saving, setSaving] = useState(false);
    
    const mainItem = items[0];
    
    // Estados
    const [useDefaultSender, setUseDefaultSender] = useState(true);
    const [sender, setSender] = useState({ nombre: '', cedula: '', telefono: '' });
    
    // Datos Destinatario (Separados del Cliente)
    const [recipient, setRecipient] = useState({
        nombre: '', cedula: '', telefono: '', direccion: '', ciudad: ''
    });

    // Cargar datos al abrir
    useEffect(() => {
        if (isOpen && mainItem) {
            // LÓGICA DE PRIORIDAD:
            // 1. Si ya existen datos de envío específicos (shippingData), úsalos.
            // 2. Si no, usa los datos del cliente original como base.
            
            const savedShipping = mainItem.shippingData;

            setRecipient({
                nombre: savedShipping?.nombre || mainItem.clientName || '',
                cedula: savedShipping?.cedula || '', 
                telefono: savedShipping?.telefono || mainItem.clientPhone || '', 
                direccion: savedShipping?.direccion || mainItem.clientAddress || '', 
                ciudad: savedShipping?.ciudad || mainItem.clientCity || '' // Usamos clientCity que pasamos desde la vista
            });

            if (defaultSender) {
                setSender(defaultSender);
            }
        }
    }, [isOpen, mainItem, defaultSender]);

    // --- GUARDAR EN CAMPO SEPARADO (datos_envio) ---
    const handleSaveRecipientData = async () => {
        if (!items || items.length === 0) return;
        setSaving(true);
        try {
            const orderIds = [...new Set(items.map(it => it.orderId))];

            const updates = orderIds.map(id => {
                const orderRef = doc(db, 'pedidos', id);
                // CORRECCIÓN: Guardamos en 'datos_envio', NO tocamos 'cliente'
                return updateDoc(orderRef, {
                    datos_envio: {
                        nombre: recipient.nombre,
                        cedula: recipient.cedula,
                        telefono: recipient.telefono,
                        direccion: recipient.direccion,
                        ciudad: recipient.ciudad
                    }
                });
            });

            await Promise.all(updates);
            notify("Datos de envío guardados (Cliente original intacto)");
        } catch (error) {
            console.error(error);
            notify("Error al guardar: " + error.message, "error");
        }
        setSaving(false);
    };

    const copyImage = async (imgUrl) => {
        try {
            const data = await fetch(imgUrl);
            const blob = await data.blob();
            await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
            notify("Imagen copiada");
        } catch (err) {
            notify("No se pudo copiar (CORS). Abriendo...", "error");
            window.open(imgUrl, '_blank');
        }
    };

    const generateText = () => {
        let text = `*DATOS PARA ENVÍO*\n\n`;
        text += `*PRODUCTO(S):*\n`;
        items.forEach(it => {
            text += `👟 ${it.modelo} - Talla: ${it.talla || 'N/A'} - SKU: ${it.sku}\n`;
        });
        
        text += `\n*DESTINATARIO:*\n`;
        text += `Nombre: ${recipient.nombre}\n`;
        text += `C.C: ${recipient.cedula || 'Pendiente'}\n`;
        text += `Tel: ${recipient.telefono}\n`;
        text += `Dir: ${recipient.direccion}\n`;
        text += `Ciudad: ${recipient.ciudad}\n`;
        
        text += `\n*REMITENTE:*\n`;
        text += `Nombre: ${sender.nombre}\n`;
        text += `C.C: ${sender.cedula}\n`;
        text += `Tel: ${sender.telefono}\n`;

        return text;
    };

    const copyFullInfo = () => {
        const text = generateText();
        navigator.clipboard.writeText(text);
        notify("Datos copiados al portapapeles");
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Preparar Envío al Proveedor">
            <div className="flex flex-col gap-6">
                
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <h4 className="text-xs font-bold text-gray-500 uppercase mb-3 flex items-center gap-2"><Icon name="Package"/> Productos a Despachar</h4>
                    <div className="space-y-3">
                        {items.map((it, i) => (
                            <div key={i} className="flex gap-4 items-center bg-white p-2 rounded-lg border border-gray-100">
                                <div className="relative group">
                                    <SafeImg src={it.imagen} className="w-16 h-16 rounded-md object-cover bg-gray-100"/>
                                    <button onClick={() => copyImage(it.imagen)} className="absolute inset-0 bg-black/50 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-md transition-opacity text-xs font-bold">Copiar</button>
                                </div>
                                <div className="flex-1">
                                    <div className="font-bold text-gray-800">{it.modelo}</div>
                                    <div className="flex gap-2 mt-1">
                                        <button onClick={() => {navigator.clipboard.writeText(it.talla); notify("Talla copiada")}} className="text-xs bg-gray-100 px-2 py-1 rounded border hover:bg-gray-200">Talla: <b>{it.talla}</b> <Icon name="Copy" size={10} className="inline ml-1"/></button>
                                        <button onClick={() => {navigator.clipboard.writeText(it.sku); notify("SKU copiado")}} className="text-xs bg-gray-100 px-2 py-1 rounded border hover:bg-gray-200">SKU: {it.sku}</button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* DATOS DESTINATARIO */}
                    <div className="space-y-3 relative">
                        <div className="flex justify-between items-end border-b border-emerald-100 pb-1">
                            <h4 className="text-xs font-bold text-emerald-600 uppercase">Datos Destinatario</h4>
                            <button 
                                onClick={handleSaveRecipientData} 
                                disabled={saving}
                                className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-1 rounded hover:bg-emerald-200 font-bold flex items-center gap-1 transition-colors"
                            >
                                {saving ? <Icon name="Loader" className="animate-spin" size={10}/> : <Icon name="Save" size={10}/>}
                                {saving ? 'Guardando...' : 'Guardar Envío'}
                            </button>
                        </div>
                        
                        <Input label="Nombre" value={recipient.nombre} onChange={e => setRecipient({...recipient, nombre: e.target.value})} />
                        <div className="grid grid-cols-2 gap-2">
                            <Input label="Cédula/CC" value={recipient.cedula} onChange={e => setRecipient({...recipient, cedula: e.target.value})} placeholder="Requerido" />
                            <Input label="Teléfono" value={recipient.telefono} onChange={e => setRecipient({...recipient, telefono: e.target.value})} />
                        </div>
                        <Input label="Dirección" value={recipient.direccion} onChange={e => setRecipient({...recipient, direccion: e.target.value})} placeholder="Dirección completa" />
                        <Input label="Ciudad" value={recipient.ciudad} onChange={e => setRecipient({...recipient, ciudad: e.target.value})} />
                    </div>

                    {/* DATOS REMITENTE */}
                    <div className="space-y-3">
                        <div className="flex justify-between items-center border-b border-indigo-100 pb-1">
                            <h4 className="text-xs font-bold text-indigo-600 uppercase">Datos Remitente</h4>
                            <div className="flex items-center gap-2">
                                <label className="text-[10px] text-gray-500 font-bold cursor-pointer">Usar Guardado</label>
                                <input type="checkbox" checked={useDefaultSender} onChange={e => {
                                    setUseDefaultSender(e.target.checked);
                                    if(e.target.checked && defaultSender) setSender(defaultSender);
                                    else setSender({nombre:'', cedula:'', telefono:''});
                                }} className="accent-indigo-600 cursor-pointer"/>
                            </div>
                        </div>
                        
                        <Input label="Nombre" value={sender.nombre} onChange={e => setSender({...sender, nombre: e.target.value})} disabled={useDefaultSender} />
                        <div className="grid grid-cols-2 gap-2">
                            <Input label="Cédula/CC" value={sender.cedula} onChange={e => setSender({...sender, cedula: e.target.value})} disabled={useDefaultSender} />
                            <Input label="Teléfono" value={sender.telefono} onChange={e => setSender({...sender, telefono: e.target.value})} disabled={useDefaultSender} />
                        </div>
                        {useDefaultSender && !defaultSender && <p className="text-xs text-red-500">No hay datos guardados en Configuración.</p>}
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                    <Button variant="secondary" onClick={onClose}>Cerrar</Button>
                    <Button onClick={copyFullInfo} className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg flex items-center gap-2">
                        <Icon name="Clipboard" size={18}/> Copiar Todo para WhatsApp
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default ShippingLabelModal;