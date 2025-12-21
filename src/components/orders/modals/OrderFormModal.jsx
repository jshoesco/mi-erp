import React, { useState, useMemo } from 'react';
import Modal from '../../ui/Modal';
import Button from '../../ui/Button';
import { Input, NumberInput } from '../../ui/Input';
import { Select } from '../../ui/Select'; // <--- EL ESTÁNDAR
import Dropzone from '../../ui/Dropzone'; // <--- USAMOS EL MISMO QUE EN PRODUCTOS
import SafeImg from '../../ui/SafeImg';
import Icon from '../../ui/Icon';
import { uploadToCloudinary, formatCurrency } from '../../../lib/utils';

const QuoteModal = ({
  isOpen,
  onClose,
  productsList = [],
  shippingOptions = [],
  cloudConfig,
  clientHistory = {},
  onSave,
  providersList = []
}) => {
  const [uploading, setUploading] = useState(false);

  // Estado del Formulario
  const [client, setClient] = useState({ nombre: '', telefono: '', ciudad_entrega: '' });
  const [product, setProduct] = useState({
    sku: '', modelo: '', marca: '', costo: '', precio: '', genero: 'Unisex', imagen: '',
    talla: '',
    proveedor_uid: '', proveedor_nombre: ''
  });

  // Estado Buscador Visual
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  // --- 1. LÓGICA DE CLIENTES ---
  // Preparamos listas para los Selects
  const historyArray = useMemo(() => Object.values(clientHistory || {}), [clientHistory]);
  const phoneOptions = useMemo(() => historyArray.map(c => c.telefono).filter(Boolean), [historyArray]);
  const nameOptions = useMemo(() => historyArray.map(c => c.nombre).filter(Boolean), [historyArray]);
  const cityOptions = useMemo(() => shippingOptions.map(s => s.ciudad), [shippingOptions]);

  // Al seleccionar un teléfono, autofill del resto
  const handlePhoneSelect = (e) => {
    const val = e.target.value;
    const found = historyArray.find(c => c.telefono === val);
    if (found) {
      setClient({ ...client, telefono: val, nombre: found.nombre || '', ciudad_entrega: found.ciudad_entrega || '' });
    } else {
      setClient({ ...client, telefono: val });
    }
  };

  // Al seleccionar un nombre, autofill del resto
  const handleNameSelect = (e) => {
    const val = e.target.value;
    const found = historyArray.find(c => c.nombre === val);
    if (found) {
      setClient({ ...client, nombre: val, telefono: found.telefono || '', ciudad_entrega: found.ciudad_entrega || '' });
    } else {
      setClient({ ...client, nombre: val });
    }
  };

  // --- 2. LÓGICA DE PRODUCTOS ---
  const filteredProducts = useMemo(() => {
    if (!searchQuery) return [];
    const q = searchQuery.toLowerCase();
    return productsList.filter(p =>
      (p.modelo?.toLowerCase().includes(q)) ||
      (p.sku?.toLowerCase().includes(q)) ||
      (p.marca?.toLowerCase().includes(q))
    ).slice(0, 10); // Limitamos a 10 para no saturar
  }, [productsList, searchQuery]);

  const selectProduct = (p) => {
    const provName = providersList?.find(prov => prov.id === p.proveedor_uid)?.nombre || 'Desconocido';
    setProduct({
      sku: p.sku,
      modelo: p.modelo,
      marca: p.marca,
      costo: p.costo,
      precio: p.precio,
      genero: p.genero,
      imagen: p.imagen,
      talla: '',
      proveedor_uid: p.proveedor_uid || '',
      proveedor_nombre: provName,
      isExisting: true
    });
    setSearchQuery('');
    setShowSuggestions(false);
  };

  // Adaptador para seleccionar proveedor en producto nuevo
  const handleProviderChange = (e) => {
    const name = e.target.value;
    const found = providersList.find(p => p.nombre === name);
    setProduct(prev => ({
      ...prev,
      proveedor_uid: found ? found.id : '',
      proveedor_nombre: name
    }));
  };

  const handleFile = async (files) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!cloudConfig.cloud_name) return alert("Falta configuración de Cloudinary");

    setUploading(true);
    try {
      const res = await uploadToCloudinary(file, cloudConfig, `QUOTE-${Date.now()}`);
      setProduct(prev => ({ ...prev, imagen: res.secure_url }));
    } catch (e) { console.error(e); }
    setUploading(false);
  };

  const handleSubmit = () => {
    if (!client.nombre || !product.modelo) return alert("Faltan datos obligatorios (Nombre, Modelo)");
    onSave({
      cliente: client,
      producto: product,
      fecha: new Date().toISOString(),
      estado: 'Pendiente'
    });
  };

  // Componente auxiliar Label para mantener estilo
  const Label = ({ children }) => (
    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.1em] ml-1 block mb-2">
      {children}
    </label>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Cotizar / Buscar Producto">
      <div className="space-y-6 max-h-[85vh] overflow-y-auto custom-scrollbar p-1">

        {/* 1. SECCIÓN CLIENTE */}
        <div className="bg-gray-50/50 p-5 rounded-2xl border border-gray-100 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Icon name="User" size={16} className="text-gray-400" />
            <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Datos del Cliente</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Teléfono</Label>
              <Select
                options={phoneOptions}
                value={client.telefono}
                onChange={handlePhoneSelect}
                placeholder="Buscar..."
              />
            </div>
            <div>
              <Label>Nombre</Label>
              <Select
                options={nameOptions}
                value={client.nombre}
                onChange={handleNameSelect}
                placeholder="Nombre Cliente..."
              />
            </div>
          </div>

          <div>
            <Label>Ciudad Destino</Label>
            <Select
              options={cityOptions}
              value={client.ciudad_entrega}
              onChange={e => setClient({ ...client, ciudad_entrega: e.target.value })}
              placeholder="Seleccionar Ciudad..."
            />
          </div>
        </div>

        {/* 2. SECCIÓN PRODUCTO */}
        <div className="space-y-4">
          <div className="flex justify-between items-end">
            <div className="flex items-center gap-2">
              <Icon name="Search" size={16} className="text-gray-400" />
              <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Producto Solicitado</span>
            </div>
            {!product.isExisting && searchQuery === '' && product.modelo && (
              <span className="text-[9px] font-bold bg-amber-100 text-amber-700 px-2 py-1 rounded-md border border-amber-200 uppercase tracking-wide">
                Nuevo / No Registrado
              </span>
            )}
          </div>

          {/* BUSCADOR VISUAL */}
          <div className="relative">
            <Input
              placeholder="BUSCAR EN CATÁLOGO (SKU, MODELO)..."
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setShowSuggestions(true); }}
              onFocus={() => setShowSuggestions(true)}
            />
            {showSuggestions && searchQuery && filteredProducts.length > 0 && (
              <div className="absolute top-full mt-2 left-0 w-full bg-white border border-gray-100 shadow-xl rounded-xl z-30 max-h-56 overflow-y-auto custom-scrollbar">
                {filteredProducts.map((p, i) => (
                  <div
                    key={p.id}
                    onClick={() => selectProduct(p)}
                    className={`flex items-center gap-3 p-3 cursor-pointer border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors`}
                  >
                    <SafeImg src={p.imagen} className="w-10 h-10 rounded-lg bg-gray-100 object-cover" />
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] font-black text-gray-800 uppercase truncate">{p.modelo}</div>
                      <div className="text-[9px] text-gray-400 font-mono">{p.sku} • {p.marca}</div>
                    </div>
                    <div className="text-[10px] font-black text-brand-red">{formatCurrency(p.precio)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* COLUMNA IZQUIERDA: FOTO */}
            <div className="flex flex-col gap-3">
              <Dropzone
                value={product.imagen}
                onChange={handleFile}
                loading={uploading}
              />
              {product.isExisting && (
                <div className="text-[9px] bg-indigo-50 text-indigo-700 p-3 rounded-xl border border-indigo-100 flex justify-between items-center">
                  <span className="font-black uppercase tracking-wider">Proveedor:</span>
                  <span className="font-mono">{product.proveedor_nombre}</span>
                </div>
              )}
            </div>

            {/* COLUMNA DERECHA: CAMPOS */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input label="Marca" value={product.marca} onChange={e => setProduct({ ...product, marca: e.target.value })} />
                <Input label="Talla" value={product.talla} onChange={e => setProduct({ ...product, talla: e.target.value })} placeholder="Ej: 40" />
              </div>

              <Input label="Modelo" value={product.modelo} onChange={e => setProduct({ ...product, modelo: e.target.value })} placeholder="Ej: Nike Air Force..." />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Género</Label>
                  <Select
                    options={['Unisex', 'Hombre', 'Mujer', 'Niños']}
                    value={product.genero}
                    onChange={e => setProduct({ ...product, genero: e.target.value })}
                  />
                </div>
                <NumberInput label="Precio Cotizado" value={product.precio} onChange={e => setProduct({ ...product, precio: e.target.value })} />
              </div>

              {/* Selector de Proveedor (Solo si es nuevo) */}
              {!product.isExisting && (
                <div>
                  <Label>Proveedor (Consulta)</Label>
                  <Select
                    options={providersList.map(p => p.nombre)}
                    value={product.proveedor_nombre}
                    onChange={handleProviderChange}
                    placeholder="Seleccionar..."
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-50">
          <Button variant="secondary" onClick={onClose} className="text-[10px]">Cancelar</Button>
          <Button onClick={handleSubmit} disabled={uploading} className="px-6 text-[10px] uppercase font-black tracking-widest">
            Guardar Cotización
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default QuoteModal;