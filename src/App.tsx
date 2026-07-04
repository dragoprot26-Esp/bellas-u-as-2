import React, { useState, useEffect, useRef } from 'react';
import { INITIAL_SALONS } from './data';
import { Salon, Appointment, ClientProfile, Service } from './types';
import PublicSalonPage from './components/PublicSalonPage';
import BookingWizard from './components/BookingWizard';
import AdminPanel from './components/AdminPanel';
import { Sparkles, Download, Check, X, KeyRound } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  bellPublica, bellAgregarCita, cloudLoad, cloudSave,
  estaLogueado, miMembresia, signOutGlobal,
} from './cloud';

export default function App() {
  // Un salón por licencia (tenant = código de licencia)
  const [salon, setSalon] = useState<Salon | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [clients, setClients] = useState<ClientProfile[]>([]);
  const [cloudCode, setCloudCode] = useState<string>('');
  const [isPublicView, setIsPublicView] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // UI
  const [isAdminMode, setIsAdminMode] = useState<boolean>(false);
  const [showBooking, setShowBooking] = useState<boolean>(false);
  const [preSelectedService, setPreSelectedService] = useState<Service | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showPwaDialog, setShowPwaDialog] = useState<boolean>(false);

  const triggerToast = (msg: string) => { setToastMessage(msg); setTimeout(() => setToastMessage(null), 4000); };

  const aplicarSalon = (s: any, code: string) => {
    if (!s) return;
    setSalon({ ...s, id: code });
  };

  // Carga inicial: ?codigo= abre el salón público; con sesión, restaura el panel del dueño.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = (params.get('codigo') || params.get('salon') || '').trim().toUpperCase();
    (async () => {
      if (code) {
        setCloudCode(code); setIsPublicView(true);
        const r = await bellPublica(code);
        if (r && r.ok && r.salon) aplicarSalon(r.salon, code);
        setLoading(false);
        return;
      }
      if (estaLogueado()) {
        const m = await miMembresia();
        if (m && m.tenant_id) {
          setCloudCode(m.tenant_id);
          const remote = await cloudLoad(m.tenant_id);
          if (remote) {
            if (remote.salon) aplicarSalon(remote.salon, m.tenant_id);
            if (Array.isArray(remote.appointments)) setAppointments(remote.appointments);
            if (Array.isArray(remote.clients)) setClients(remote.clients);
          }
          setIsAdminMode(true);
        }
      }
      setLoading(false);
    })();
  }, []);

  // Login OK desde el panel: vincula el salón y carga/siembra la nube.
  const handleLoggedIn = async (code: string) => {
    setCloudCode(code); setIsPublicView(false); setIsAdminMode(true);
    const remote = await cloudLoad(code);
    const vacio = !remote || (!remote.salon && !remote.appointments);
    if (vacio) {
      const base: Salon = {
        ...(INITIAL_SALONS[0] as Salon),
        id: code,
        name: 'Mi Salón de Uñas',
        slogan: 'Tus manos, nuestra obra de arte 💅',
        address: '',
        phone: '+54 9 ',
        email: '',
        rating: 5,
        reviewsCount: 0,
        coverImage: '',
        services: [],
        staff: [],
        products: [],
        orders: [],
        collaborators: [],
        referralEnabled: false,
      };
      setSalon(base); setAppointments([]); setClients([]);
      await cloudSave(code, { salon: base, appointments: [], clients: [] });
    } else {
      if (remote.salon) aplicarSalon(remote.salon, code);
      setAppointments(Array.isArray(remote.appointments) ? remote.appointments : []);
      setClients(Array.isArray(remote.clients) ? remote.clients : []);
    }
  };

  const handleLogout = () => {
    signOutGlobal();
    setIsAdminMode(false); setCloudCode(''); setSalon(null);
    setAppointments([]); setClients([]);
  };

  // Guardado en la nube (admin) con debounce + traer-antes-de-guardar
  // (para no pisar turnos/pedidos que entraron desde la página pública).
  const saveTimer = useRef<any>(null);
  useEffect(() => {
    if (!isAdminMode || !cloudCode || isPublicView || !salon) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      const remote = await cloudLoad(cloudCode);
      let apps = appointments;
      let sal: Salon = salon;
      if (remote) {
        if (Array.isArray(remote.appointments)) {
          const ids = new Set(appointments.map(a => a.id));
          const nuevos = remote.appointments.filter((a: any) => a && a.id && !ids.has(a.id));
          if (nuevos.length) { apps = [...nuevos, ...appointments]; setAppointments(apps); }
        }
        const remOrders = remote.salon && remote.salon.orders;
        if (Array.isArray(remOrders)) {
          const oids = new Set((salon.orders || []).map(o => o.id));
          const nuevosO = remOrders.filter((o: any) => o && o.id && !oids.has(o.id));
          if (nuevosO.length) { sal = { ...salon, orders: [...nuevosO, ...(salon.orders || [])] }; setSalon(sal); }
        }
      }
      cloudSave(cloudCode, { salon: sal, appointments: apps, clients });
    }, 1200);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [salon, appointments, clients, isAdminMode, cloudCode, isPublicView]);

  // Campanita: sondeo de turnos y pedidos nuevos (cada 15s) para el panel
  useEffect(() => {
    if (!isAdminMode || !cloudCode || isPublicView) return;
    const iv = setInterval(async () => {
      const remote = await cloudLoad(cloudCode);
      if (!remote) return;
      if (Array.isArray(remote.appointments)) {
        setAppointments(prev => {
          const ids = new Set(prev.map(a => a.id));
          const nuevos = (remote.appointments as any[]).filter((a: any) => a && a.id && !ids.has(a.id));
          return nuevos.length ? [...nuevos, ...prev] : prev;
        });
      }
      const remOrders = remote.salon && remote.salon.orders;
      if (Array.isArray(remOrders)) {
        setSalon(prev => {
          if (!prev) return prev;
          const oids = new Set((prev.orders || []).map(o => o.id));
          const nuevosO = (remOrders as any[]).filter((o: any) => o && o.id && !oids.has(o.id));
          return nuevosO.length ? { ...prev, orders: [...nuevosO, ...(prev.orders || [])] } : prev;
        });
      }
    }, 15000);
    return () => clearInterval(iv);
  }, [isAdminMode, cloudCode, isPublicView]);

  const handleBookingComplete = (newBooking: Appointment) => {
    const b = { ...newBooking, salonId: cloudCode || newBooking.salonId };
    setAppointments(prev => [b, ...prev]);
    if (cloudCode) bellAgregarCita(cloudCode, b);
    const clientExists = clients.some(c => c.phone === b.clientPhone);
    if (!clientExists) {
      setClients(prev => [...prev, {
        id: `cli-${Date.now()}`, name: b.clientName, phone: b.clientPhone, email: b.clientEmail,
        preferences: '', totalSpent: b.price, visitsCount: 1, lastVisitDate: b.date,
      }]);
    } else {
      setClients(prev => prev.map(c => c.phone === b.clientPhone
        ? { ...c, totalSpent: c.totalSpent + b.price, visitsCount: c.visitsCount + 1, lastVisitDate: b.date } : c));
    }
    triggerToast(`¡Turno reservado con éxito para ${b.clientName}!`);
  };

  const handleUpdateSalon = (updated: Salon) => {
    setSalon({ ...updated, id: cloudCode || updated.id });
    triggerToast('¡Perfil del salón actualizado!');
  };

  const handleOpenBooking = (service: Service | null) => { setPreSelectedService(service); setShowBooking(true); };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-200 flex items-center justify-center">
        <div className="text-center space-y-2"><span className="text-3xl">💅</span><p className="text-sm">Cargando…</p></div>
      </div>
    );
  }

  // Panel de administración
  if (isAdminMode) {
    return (
      <AdminPanel
        salons={salon ? [salon] : []}
        appointments={appointments}
        clients={clients}
        activeSalonId={cloudCode}
        onSelectSalon={() => {}}
        onUpdateSalon={handleUpdateSalon}
        onUpdateAppointments={setAppointments}
        onUpdateClients={setClients}
        onCloseAdmin={() => setIsAdminMode(false)}
        onLoggedIn={handleLoggedIn}
        onLogout={handleLogout}
        publicCode={cloudCode}
      />
    );
  }

  // Vista pública del salón
  if (salon) {
    return (
      <div className="min-h-screen bg-white text-gray-900">
        <PublicSalonPage
          salon={salon}
          onOpenBooking={handleOpenBooking}
          onNavigateToAdmin={() => setIsAdminMode(true)}
          onUpdateSalon={handleUpdateSalon}
        />

        {showBooking && (
          <BookingWizard
            salon={salon}
            preSelectedService={preSelectedService}
            onClose={() => { setShowBooking(false); setPreSelectedService(null); }}
            onBookingComplete={handleBookingComplete}
          />
        )}

        <PwaDialog show={showPwaDialog} name={salon.name} onClose={() => setShowPwaDialog(false)} onDone={() => { setShowPwaDialog(false); triggerToast('Seguí los pasos para agregar el ícono a tu inicio.'); }} />
        <Toast msg={toastMessage} />
      </div>
    );
  }

  // Sin código y sin sesión: bienvenida + acceso al panel
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-sm w-full text-center space-y-4 shadow-2xl">
        <span className="text-4xl">💅</span>
        <h1 className="text-xl font-black">Bellas Uñas</h1>
        <p className="text-xs text-slate-400">Abrí el salón desde su enlace (con su código), o ingresá al panel si sos dueño/a o colaborador/a.</p>
        <button onClick={() => setIsAdminMode(true)} className="w-full bg-pink-500 hover:bg-pink-600 text-white font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-2">
          <KeyRound className="w-4 h-4" /> Ingresar al panel
        </button>
      </div>
      <Toast msg={toastMessage} />
    </div>
  );
}

function Toast({ msg }: { msg: string | null }) {
  return (
    <AnimatePresence>
      {msg && (
        <motion.div initial={{ opacity: 0, y: 50, x: '-50%' }} animate={{ opacity: 1, y: 0, x: '-50%' }} exit={{ opacity: 0, y: 50, x: '-50%' }}
          className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white py-3 px-6 rounded-2xl shadow-2xl flex items-center space-x-2 text-xs font-bold border border-emerald-500">
          <Check className="w-4 h-4" /><span>{msg}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function PwaDialog({ show, name, onClose, onDone }: { show: boolean; name: string; onClose: () => void; onDone: () => void }) {
  return (
    <AnimatePresence>
      {show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full relative space-y-5 text-slate-100 shadow-2xl">
            <button onClick={onClose} className="absolute top-4 right-4 p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-full"><X className="w-5 h-5" /></button>
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-pink-500/10 text-pink-400 rounded-full flex items-center justify-center mx-auto text-xl">📲</div>
              <h3 className="text-lg font-bold text-white">Instalar {name}</h3>
              <p className="text-xs text-slate-400">Agregá el salón a tu pantalla de inicio como una app.</p>
            </div>
            <div className="space-y-4 border-t border-b border-slate-800/70 py-4 text-xs">
              <div className="flex items-start space-x-3">
                <span className="w-5 h-5 bg-pink-500/20 text-pink-400 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">1</span>
                <div><span className="font-bold text-slate-200 block">iPhone (Safari)</span><span className="text-slate-400 block">Tocá <strong>Compartir</strong> → <strong>"Agregar a pantalla de inicio"</strong>.</span></div>
              </div>
              <div className="flex items-start space-x-3">
                <span className="w-5 h-5 bg-pink-500/20 text-pink-400 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">2</span>
                <div><span className="font-bold text-slate-200 block">Android (Chrome)</span><span className="text-slate-400 block">Menú (3 puntos) → <strong>"Instalar aplicación"</strong>.</span></div>
              </div>
            </div>
            <div className="flex justify-end"><button onClick={onDone} className="px-5 py-2.5 bg-pink-500 hover:bg-pink-600 text-white rounded-xl text-xs font-bold">Entendido</button></div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
