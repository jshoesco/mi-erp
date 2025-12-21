import React, { useState } from 'react';
import { auth, signInWithEmailAndPassword } from '../lib/firebase';
import Button from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import Icon, { Spinner } from '../components/ui/Icon';

const LoginScreen = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (err) {
            setError("Credenciales incorrectas.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-brand-light">
            <div className="bg-white p-8 rounded-3xl shadow-xl max-w-sm w-full space-y-8 border border-gray-100">
                <div className="text-center space-y-2">
                    <div className="w-20 h-20 bg-brand-dark text-brand-red rounded-2xl flex items-center justify-center mx-auto shadow-lg transform rotate-3">
                        <span className="font-black text-3xl tracking-tighter">JS</span>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Bienvenido de nuevo</h1>
                    <p className="text-sm text-gray-400">Ingresa tus credenciales de acceso</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-5">
                    <div className="space-y-4">
                        <Input type="email" placeholder="Correo electrónico" value={email} onChange={e => setEmail(e.target.value)} />
                        <Input type="password" placeholder="Contraseña" value={password} onChange={e => setPassword(e.target.value)} />
                    </div>
                    
                    {error && (
                        <div className="text-brand-red text-xs font-bold bg-red-50 p-3 rounded-xl border border-red-100 flex gap-2 items-center animate-pulse">
                            <Icon name="AlertTriangle" size={16} /> {error}
                        </div>
                    )}
                    
                    <Button className="w-full h-14 text-lg bg-brand-red hover:bg-red-700 shadow-xl shadow-red-500/30" disabled={loading}>
                        {loading ? <div className="flex items-center gap-2"><Spinner /> Entrando...</div> : "Iniciar Sesión"}
                    </Button>
                </form>
            </div>
        </div>
    );
};

export default LoginScreen;