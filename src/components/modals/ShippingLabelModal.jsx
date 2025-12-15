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
    const [generatingCollage, setGeneratingCollage] = useState(false);
    
    // ESTADOS DE VISTA
    const [viewMode, setViewMode] = useState('gallery'); 
    const [recipient, setRecipient] = useState({ nombre: '', cedula: '', telefono: '', direccion: '', ciudad: '' });
    const [sender, setSender] = useState({ nombre: '', cedula: '', telefono: '' });
    const [useDefaultSender, setUseDefaultSender] = useState(true);

    const mainItem = items[0];

    useEffect(() => {
        if (isOpen && mainItem) {
            const savedShipping = mainItem.shippingData;
            setRecipient({
                nombre: savedShipping?.nombre || mainItem.clientName || '',
                cedula: savedShipping?.cedula || '', 
                telefono: savedShipping?.telefono || mainItem.clientPhone || '', 
                direccion: savedShipping?.direccion || mainItem.clientAddress || '', 
                ciudad: savedShipping?.ciudad || mainItem.clientCity || ''
            });
            if (defaultSender) setSender(defaultSender);
        }
    }, [isOpen, mainItem, defaultSender]);

    const handleSaveRecipientData = async () => {
        if (!items || items.length === 0) return;
        setSaving(true);
        try {
            const orderIds = [...new Set(items.map(it => it.orderId))];
            await Promise.all(orderIds.map(id => 
                updateDoc(doc(db, 'pedidos', id), {
                    datos_envio: {
                        nombre: recipient.nombre,
                        cedula: recipient.cedula,
                        telefono: recipient.telefono,
                        direccion: recipient.direccion,
                        ciudad: recipient.ciudad
                    }
                })
            ));
            notify("Datos de envío guardados");
        } catch (error) { notify(error.message, "error"); }
        setSaving(false);
    };

    // --- COPIAR IMAGEN INDIVIDUAL (BLINDADO) ---
    const copyImageSecure = async (imgUrl) => {
        if (!imgUrl) return notify("Sin imagen", "error");
        try {
            notify("Procesando...", "info");
            const response = await fetch(imgUrl, { mode: 'cors' });
            const blob = await response.blob();
            await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
            notify("Imagen copiada 📸");
        } catch (err) {
            // Fallback con Canvas si falla el blob directo
            try {
                const img = new Image();
                img.crossOrigin = "Anonymous";
                img.src = imgUrl;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0);
                    canvas.toBlob(async (blob) => {
                        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
                        notify("Imagen copiada 📸");
                    });
                };
            } catch (e) { window.open(imgUrl, '_blank'); notify("Error seguridad. Abriendo imagen...", "warning"); }
        }
    };

    // --- GENERAR COLLAGE INTELIGENTE (VERSIÓN OPTIMIZADA PARA MUCHOS ITEMS) ---
    const handleCopyCollage = async () => {
        setGeneratingCollage(true);
        notify("Generando Collage... 🎨", "info");

        try {
            // 1. FILTRAR DUPLICADOS (Mismo SKU = 1 sola foto)
            const uniqueItems = [];
            const seenSkus = new Set();
            
            items.forEach(item => {
                const identifier = item.sku || item.id; // Preferencia al SKU
                if (!seenSkus.has(identifier) && item.imagen) {
                    seenSkus.add(identifier);
                    uniqueItems.push(item);
                }
            });

            if (uniqueItems.length === 0) throw new Error("No hay imágenes válidas");

            // 2. PRE-CARGAR IMÁGENES
            const images = await Promise.all(uniqueItems.map(item => {
                return new Promise((resolve) => {
                    const img = new Image();
                    img.crossOrigin = "Anonymous";
                    img.src = item.imagen;
                    img.onload = () => resolve(img);
                    img.onerror = () => resolve(null);
                });
            }));

            const validImages = images.filter(img => img !== null);
            const count = validImages.length;

            // --- AQUÍ ESTÁ LA MAGIA MATEMÁTICA ---
            // Si son pocos, usamos 2 columnas. Si son bastantes, 3. Si son muchísimos, 4.
            // Esto evita que la imagen sea un "fideo" largo hacia abajo.
            let cols = 2;
            if (count === 1) cols = 1;
            else if (count >= 5 && count <= 9) cols = 3;
            else if (count >= 10) cols = 4;

            const rows = Math.ceil(count / cols);
            
            // Tamaño de cada celda (Calidad alta para zoom)
            const cellWidth = 350; 
            const cellHeight = 350;
            const gap = 15; // Espacio blanco entre fotos
            const padding = 20; // Marco blanco alrededor de todo

            const canvas = document.createElement('canvas');
            canvas.width = (cols * cellWidth) + ((cols - 1) * gap) + (padding * 2);
            canvas.height = (rows * cellHeight) + ((rows - 1) * gap) + (padding * 2);
            const ctx = canvas.getContext('2d');

            // Fondo blanco
            ctx.fillStyle = "#FFFFFF";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // 3. DIBUJAR
            validImages.forEach((img, i) => {
                const col = i % cols;
                const row = Math.floor(i / cols);
                
                const x = padding + (col * (cellWidth + gap));
                const y = padding + (row * (cellHeight + gap));

                // Dibujar imagen "contain" (centrada sin recortes feos)
                const scale = Math.min(cellWidth / img.width, cellHeight / img.height);
                const w = img.width * scale;
                const h = img.height * scale;
                const offsetX = (cellWidth - w) / 2;
                const offsetY = (cellHeight - h) / 2;

                ctx.drawImage(img, x + offsetX, y + offsetY, w, h);
                
                // Opcional: Dibujar un borde gris finito alrededor de cada foto para que no se mezclen
                ctx.strokeStyle = "#e5e7eb";
                ctx.lineWidth = 1;
                ctx.strokeRect(x, y, cellWidth, cellHeight);
            });

            // 4. GENERAR BLOB Y COPIAR
            canvas.toBlob(async (blob) => {
                try {
                    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
                    notify(`¡Collage de ${count} productos copiado! 📸`);
                } catch (err) {
                    console.error(err);
                    notify("Error al copiar. Intenta de nuevo.", "error");
                }
                setGeneratingCollage(false);
            }, 'image/png', 0.9);

        } catch (e) {
            console.error(e);
            notify("Error: " + e.message, "error");
            setGeneratingCollage(false);
        }
    };

    const copyFullInfo = () => {
        let text = `*DATOS PARA ENVÍO*\n\n*PRODUCTO(S):*\n`;
        items.forEach(it => {
            text += `👟 ${it.modelo} ${it.nombre || ''} - Talla: ${it.talla}\n`;
        });
        text += `\n*DESTINATARIO:*\nNombre: ${recipient.nombre}\nC.C: ${recipient.cedula || 'Pendiente'}\nTel: ${recipient.telefono}\nDir: ${recipient.direccion}\nCiudad: ${recipient.ciudad}\n\n*REMITENTE:*\nNombre: ${sender.nombre}\nC.C: ${sender.cedula}\nTel: ${sender.telefono}\n`;
        navigator.clipboard.writeText(text);
        notify("Datos copiados");
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Preparar Envío">
            <div className="flex flex-col gap-6">
                
                {/* SECCIÓN VISUAL (GALERÍA) */}
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 transition-all">
                    <div className="flex justify-between items-center mb-3">
                        <h4 className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
                            <Icon name="Grid" size={16}/> Resumen Visual ({items.length})
                        </h4>
                        
                        <div className="flex gap-2">
                            {/* BOTÓN COLLAGE (LA ESTRELLA) */}
                            {items.length > 0 && (
                                <button 
                                    onClick={handleCopyCollage}
                                    disabled={generatingCollage}
                                    className="text-[10px] bg-indigo-600 text-white px-3 py-1.5 rounded hover:bg-indigo-700 font-bold flex items-center gap-1 transition-colors shadow-sm disabled:opacity-50"
                                >
                                    {generatingCollage ? <Icon name="Loader" className="animate-spin" size={12}/> : <Icon name="Camera" size={12}/>} 
                                    {generatingCollage ? 'Generando...' : 'Copiar Collage Resumen'}
                                </button>
                            )}
                            
                            {/* SWITCH DE VISTA */}
                            <div className="flex bg-white rounded-lg border border-gray-200 p-0.5 shadow-sm">
                                <button onClick={() => setViewMode('gallery')} className={`px-2 py-1 rounded-md transition-colors ${viewMode === 'gallery' ? 'bg-gray-100 text-indigo-600' : 'text-gray-400'}`}><Icon name="Grid" size={14}/></button>
                                <button onClick={() => setViewMode('list')} className={`px-2 py-1 rounded-md transition-colors ${viewMode === 'list' ? 'bg-gray-100 text-indigo-600' : 'text-gray-400'}`}><Icon name="List" size={14}/></button>
                            </div>
                        </div>
                    </div>

                    {/* VISTA MOSAICO */}
                    {viewMode === 'gallery' && (
                        <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                            {items.map((it, i) => (
                                <div key={i} className="group relative aspect-square bg-white rounded-lg border border-gray-200 hover:border-indigo-400 transition-all overflow-hidden">
                                    <SafeImg src={it.imagen} className="w-full h-full object-cover"/>
                                    <div className="absolute bottom-0 left-0 right-0 bg-white/90 backdrop-blur-sm border-t border-gray-100 p-1 text-center">
                                        <div className="font-bold text-gray-800 text-[9px] truncate">{it.modelo}</div>
                                        <div className="font-mono font-bold text-indigo-600 text-[9px]">T: {it.talla}</div>
                                    </div>
                                    <button onClick={() => copyImageSecure(it.imagen)} className="absolute top-1 right-1 p-1.5 bg-white/90 rounded-full shadow-sm text-gray-600 hover:text-brand-red opacity-0 group-hover:opacity-100 transition-opacity" title="Copiar Solo Esta"><Icon name="Copy" size={12}/></button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* VISTA LISTA */}
                    {viewMode === 'list' && (
                        <div className="space-y-2">
                            {items.map((it, i) => (
                                <div key={i} className="flex gap-3 items-center bg-white p-2 rounded-lg border border-gray-100">
                                    <div className="h-10 w-10 bg-gray-100 rounded border border-gray-200 overflow-hidden"><SafeImg src={it.imagen} className="w-full h-full object-cover"/></div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-bold text-gray-800 text-xs truncate">{it.modelo}</div>
                                        <div className="text-[10px] text-gray-500">Talla: {it.talla}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* FORMULARIO DE DATOS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* DESTINATARIO */}
                    <div className="space-y-3 relative">
                        <div className="flex justify-between items-end border-b border-emerald-100 pb-1">
                            <h4 className="text-xs font-bold text-emerald-600 uppercase">Destinatario</h4>
                            <button onClick={handleSaveRecipientData} disabled={saving} className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-1 rounded hover:bg-emerald-200 font-bold flex items-center gap-1 transition-colors">
                                {saving ? <Icon name="Loader" className="animate-spin" size={10}/> : <Icon name="Save" size={10}/>} Guardar
                            </button>
                        </div>
                        <Input label="Nombre" value={recipient.nombre} onChange={e => setRecipient({...recipient, nombre: e.target.value})} />
                        <div className="grid grid-cols-2 gap-2">
                            <Input label="Cédula/CC" value={recipient.cedula} onChange={e => setRecipient({...recipient, cedula: e.target.value})} placeholder="Requerido" />
                            <Input label="Teléfono" value={recipient.telefono} onChange={e => setRecipient({...recipient, telefono: e.target.value})} />
                        </div>
                        <Input label="Dirección" value={recipient.direccion} onChange={e => setRecipient({...recipient, direccion: e.target.value})} />
                        <Input label="Ciudad" value={recipient.ciudad} onChange={e => setRecipient({...recipient, ciudad: e.target.value})} />
                    </div>

                    {/* REMITENTE */}
                    <div className="space-y-3">
                        <div className="flex justify-between items-center border-b border-indigo-100 pb-1">
                            <h4 className="text-xs font-bold text-indigo-600 uppercase">Remitente</h4>
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