// src/theme/constants.js
export const TOKENS = {
    // RADIOS (CURVATURA)
    radius: {
        container: 'rounded-[2.5rem]',
        card: 'rounded-[2rem]',
        inner: 'rounded-[1.2rem]',
        button: 'rounded-[1.1rem]',
        full: 'rounded-full',
    },
    // ESPACIADOS (PADDINGS/GAPS)
    spacing: {
        view: 'p-8',
        card: 'p-6',
        section: 'space-y-8',
        group: 'gap-4',
    },
    // TIPOGRAFÍA (TAMAÑOS Y PESOS)
    text: {
        h1: 'text-2xl font-black uppercase tracking-tighter text-brand-dark',
        h2: 'text-lg font-black uppercase tracking-tight text-brand-dark',
        h3: 'text-sm font-black uppercase tracking-tight text-brand-dark',
        label: 'text-[10px] font-black uppercase tracking-widest text-brand-gray/50',
        price: 'text-lg font-black tracking-tight text-brand-dark',
        tiny: 'text-[9px] font-black uppercase tracking-tighter',
    },
    // INTERACCIÓN Y EFECTOS
    action: {
        hover: 'hover:scale-[1.02] active:scale-[0.98] transition-all duration-300',
        shadow: 'shadow-card hover:shadow-md',
        glass: 'bg-white/5 backdrop-blur-md border border-white/10',
    },
    // ANIMACIONES (LO QUE FALTABA)
    animation: {
        fade: 'animate-fade-in'
    }
};