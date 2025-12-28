import React, { useState } from 'react';
import { auth, signInWithEmailAndPassword } from '../lib/firebase';
import { TOKENS } from '../theme/constants';

// IMPORTACIÓN DEL SISTEMA DE DISEÑO GENÉRICO
import { Input } from '../components/ui/forms/Controls';
import { Button } from '../components/ui/display/Button';
import { H1, TextLabel } from '../components/ui/display/Typography';
import Icon from '../components/ui/display/Icon';

const LoginScreen = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        if (e) e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (err) {
            setError("Credenciales inválidas.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`h-screen w-full flex items-center justify-center bg-brand-light p-6 relative overflow-hidden`}>
            {/* Sombras de marca sutiles */}
            <div className="absolute top-0 left-0 w-full h-full opacity-30 pointer-events-none">
                <div className="absolute -top-24 -left-24 w-96 h-96 bg-brand-red/10 rounded-full blur-[120px]" />
                <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-brand-dark/10 rounded-full blur-[120px]" />
            </div>

            <div className={`w-full max-w-[420px] ${TOKENS.animation.fade} relative z-10`}>
                <div className={`bg-brand-surface ${TOKENS.radius.container} shadow-card border border-brand-light p-12 flex flex-col items-center`}>

                    {/* LOGO GENÉRICO */}
                    <div className={`w-20 h-20 bg-brand-dark ${TOKENS.radius.inner} flex items-center justify-center mb-10 shadow-xl shadow-brand-dark/20`}>
                        <span className="text-white font-black text-3xl tracking-tighter">JS</span>
                    </div>

                    <div className="text-center mb-10">
                        <H1>Acceso al Sistema</H1>
                        <TextLabel className="mt-2 block">Ingresa tus credenciales de CEO</TextLabel>
                    </div>

                    <form onSubmit={handleLogin} className="w-full space-y-6">
                        <Input
                            label="Email Corporativo"
                            type="email"
                            placeholder="nombre@empresa.com"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            autoFocus
                        />

                        <Input
                            label="Contraseña"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                        />

                        {error && (
                            <div className={`bg-red-50 text-brand-red ${TOKENS.text.tiny} p-4 ${TOKENS.radius.inner} border border-red-100 flex items-center gap-3 animate-shake`}>
                                <Icon name="AlertCircle" size={16} />
                                {error}
                            </div>
                        )}

                        <div className="pt-4">
                            <Button
                                variant="brand"
                                className="w-full h-14"
                                loading={loading}
                                icon="LogIn"
                            >
                                Entrar ahora
                            </Button>
                        </div>
                    </form>

                    <p className={`mt-12 ${TOKENS.text.tiny} text-brand-gray/30 tracking-[0.4em]`}>
                        Josue Sistemas — V.2.5
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginScreen;