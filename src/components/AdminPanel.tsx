import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Calendar as CalendarIcon, 
  Users, 
  Settings, 
  Plus, 
  Check, 
  X, 
  Clock, 
  TrendingUp, 
  DollarSign, 
  Smartphone, 
  Edit, 
  Trash, 
  AlertCircle,
  FileText,
  UserCheck,
  Building,
  Star,
  MapPin,
  Phone,
  Bookmark,
  ShoppingBag,
  ClipboardList
} from 'lucide-react';
import { Salon, Appointment, ClientProfile, FinancialSummary, AppointmentStatus, ProductItem, ProductOrder } from '../types';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import {
  validarLicencia, asegurarCuentaSeguraDueno, asegurarCuentaSeguraColab,
  estaLogueado, signOutGlobal,
} from '../cloud';
import { bioSupported, bioEnabled, bioEnable, bioLogin } from '../biometric';

interface AdminPanelProps {
  salons: Salon[];
  appointments: Appointment[];
  clients: ClientProfile[];
  activeSalonId: string;
  onSelectSalon: (id: string) => void;
  onUpdateSalon: (updated: Salon) => void;
  onUpdateAppointments: (updated: Appointment[]) => void;
  onUpdateClients: (updated: ClientProfile[]) => void;
  onCloseAdmin: () => void;
  onLoggedIn?: (code: string) => void | Promise<void>;
  onLogout?: () => void;
  publicCode?: string;
  onListBackups?: () => Promise<any[]>;
  onRestoreBackup?: (id: number) => Promise<boolean>;
}

export default function AdminPanel({
  salons,
  appointments,
  clients,
  activeSalonId,
  onSelectSalon,
  onUpdateSalon,
  onUpdateAppointments,
  onUpdateClients,
  onCloseAdmin,
  onLoggedIn,
  onLogout,
  publicCode,
  onListBackups,
  onRestoreBackup
}: AdminPanelProps) {
  // Copias de seguridad (rollback)
  const [backups, setBackups] = useState<any[]>([]);
  const [backupsOpen, setBackupsOpen] = useState(false);
  const [backupsBusy, setBackupsBusy] = useState(false);
  const cargarBackups = async () => {
    if (!onListBackups) return;
    setBackupsBusy(true);
    try { setBackups(await onListBackups()); setBackupsOpen(true); }
    finally { setBackupsBusy(false); }
  };
  const restaurarBackup = async (id: number) => {
    if (!onRestoreBackup) return;
    if (!window.confirm('¿Restaurar esta copia? Se reemplazan los datos actuales por los de esa fecha. (La versión actual queda guardada por las dudas.)')) return;
    setBackupsBusy(true);
    try {
      const ok = await onRestoreBackup(id);
      alert(ok ? '✅ Copia restaurada. Ya están cargados los datos de esa fecha.' : 'No se pudo restaurar. Probá de nuevo.');
      if (ok) setBackupsOpen(false);
    } finally { setBackupsBusy(false); }
  };
  // Authentication State
  const [authUsername, setAuthUsername] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string; username: string; role: 'admin' | 'colaborador' } | null>(() => (
    estaLogueado() ? { id: 'me', name: 'Mi cuenta', username: '', role: 'admin' as const } : null
  ));
  const [loginCode, setLoginCode] = useState('');
  const [loginRole, setLoginRole] = useState<'admin' | 'colaborador'>('admin');
  const [loginLoading, setLoginLoading] = useState(false);

  // Ingreso biométrico (huella / Face ID) en este dispositivo
  const [bioAvail, setBioAvail] = useState(false);
  const [bioOn, setBioOn] = useState(false);
  const [bioCheck, setBioCheck] = useState(false);

  useEffect(() => {
    bioSupported().then(setBioAvail);
    setBioOn(bioEnabled());
  }, []);

  const [activeTab, setActiveTab] = useState<'overview' | 'appointments' | 'crm' | 'reports' | 'settings' | 'collaborators' | 'products_catalog' | 'services_catalog' | 'orders_management' | 'reseñas'>('overview');

  // Products and Catalog form states
  const [newProdName, setNewProdName] = useState('');
  const [newProdDesc, setNewProdDesc] = useState('');
  const [newProdPrice, setNewProdPrice] = useState('');
  const [newProdCategory, setNewProdCategory] = useState<'Promo' | 'Destacados' | 'Lo más vistos' | 'Productos'>('Productos');
  const [newProdImage, setNewProdImage] = useState('');
  const [newProdComponents, setNewProdComponents] = useState<string[]>([]);
  const [newCompText, setNewCompText] = useState('');
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  // Services Catalog form states
  const [newSerName, setNewSerName] = useState('');
  const [newSerDesc, setNewSerDesc] = useState('');
  const [newSerPrice, setNewSerPrice] = useState('');
  const [newSerDuration, setNewSerDuration] = useState('45');
  const [newSerCategory, setNewSerCategory] = useState<'Nuevos' | 'Elegidos' | 'Galería' | 'Productos' | 'Promos' | 'Ofertas' | 'Servicios'>('Servicios');
  const [newSerImage, setNewSerImage] = useState('');
  const [newSerComponents, setNewSerComponents] = useState<string[]>([]);
  const [newSerCompText, setNewSerCompText] = useState('');
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);

  // Login real reutilizable (formulario y huella)
  const doLogin = async (code: string, usuario: string, clave: string, role: 'admin' | 'colaborador') => {
    const lic = await validarLicencia(code);
    if (!lic) return { ok: false, msg: 'Licencia inválida o vencida.' };
    const r = role === 'admin'
      ? await asegurarCuentaSeguraDueno(usuario, clave, code)
      : await asegurarCuentaSeguraColab(usuario, clave, code);
    if (!r.ok) return { ok: false, msg: r.msg || 'No se pudo iniciar sesión.' };
    if (onLoggedIn) await onLoggedIn(code);
    setCurrentUser({ id: usuario, name: usuario, username: usuario, role });
    setActiveTab(role === 'admin' ? 'overview' : 'appointments');
    return { ok: true };
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    const code = loginCode.trim().toUpperCase();
    const usuario = authUsername.trim();
    const clave = authPassword;
    if (!code) { setAuthError('Ingresá el código de licencia.'); return; }
    if (!usuario) { setAuthError('Ingresá tu usuario.'); return; }
    if (clave.length < 6) { setAuthError('La contraseña debe tener 6 caracteres o más.'); return; }
    setLoginLoading(true);
    const r = await doLogin(code, usuario, clave, loginRole);
    if (!r.ok) { setLoginLoading(false); setAuthError(r.msg || 'No se pudo iniciar sesión.'); return; }
    if (bioCheck && bioAvail) {
      try { await bioEnable({ codigo: code, usuario, password: clave, role: loginRole }); setBioOn(true); }
      catch (e) { /* si la huella falla, igual entra */ }
    }
    setLoginLoading(false);
  };

  // Ingreso con huella / Face ID: recupera las credenciales guardadas y loguea
  const handleBioLogin = async () => {
    setAuthError('');
    setLoginLoading(true);
    try {
      const creds = await bioLogin();
      if (!creds) { setAuthError('No se pudo leer la huella. Ingresá con tus datos.'); return; }
      const r = await doLogin(creds.codigo, creds.usuario, creds.password, creds.role);
      if (!r.ok) { setAuthError((r.msg || 'No se pudo entrar') + ' — volvé a ingresar tus datos.'); return; }
    } catch (err: any) {
      setAuthError('Huella cancelada o no disponible en este dispositivo.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setAuthUsername(''); setAuthPassword(''); setLoginCode('');
    if (onLogout) onLogout();
  };

  // Check if current collaborator session is revoked by admin
  useEffect(() => {
    if (currentUser && currentUser.role === 'colaborador') {
      const revoked = localStorage.getItem(`nail_platform_session_revoked_${currentUser.id}`);
      if (revoked === 'true') {
        localStorage.removeItem(`nail_platform_session_revoked_${currentUser.id}`);
        handleLogout();
        alert('Tu sesión ha sido cerrada por el administrador por razones de seguridad.');
      }
    }
  }, [currentUser, activeSalonId]);

  // Collaborators form & editing states
  const [newColName, setNewColName] = useState('');
  const [newColUsername, setNewColUsername] = useState('');
  const [newColPassword, setNewColPassword] = useState('');
  const [colSuccessMsg, setColSuccessMsg] = useState('');

  const [editingCollaboratorId, setEditingCollaboratorId] = useState<string | null>(null);
  const [editColName, setEditColName] = useState('');
  const [editColUsername, setEditColUsername] = useState('');
  const [editColPassword, setEditColPassword] = useState('');

  const handleStartEditCollaborator = (col: any) => {
    setEditingCollaboratorId(col.id);
    setEditColName(col.name);
    setEditColUsername(col.username);
    setEditColPassword(col.password);
  };

  const handleSaveCollaborator = (id: string) => {
    if (!editColName || !editColUsername || !editColPassword) return;
    const list = activeSalon.collaborators || [];
    
    // Check if other collaborator has the same username
    if (editColUsername.toLowerCase() === 'admin' || list.some(c => c.id !== id && c.username.toLowerCase() === editColUsername.toLowerCase())) {
      alert('El nombre de usuario ya está en uso o no está permitido.');
      return;
    }

    const updatedList = list.map(c => {
      if (c.id === id) {
        return { ...c, name: editColName, username: editColUsername, password: editColPassword };
      }
      return c;
    });

    onUpdateSalon({
      ...activeSalon,
      collaborators: updatedList
    });

    // If edited current logged in collaborator, update current user too
    if (currentUser && currentUser.id === id) {
      const updatedUser = { ...currentUser, name: editColName, username: editColUsername };
      setCurrentUser(updatedUser);
      localStorage.setItem(`nail_platform_current_user_${activeSalonId}`, JSON.stringify(updatedUser));
    }

    // Force a re-login check or keep session active. We can also force logout if the username or password changed, for maximum security!
    localStorage.setItem(`nail_platform_session_revoked_${id}`, 'true');

    setEditingCollaboratorId(null);
    setColSuccessMsg('¡Colaborador actualizado con éxito!');
    setTimeout(() => setColSuccessMsg(''), 3000);
  };

  const handleForceLogoutCollaborator = (colId: string, colName: string) => {
    localStorage.setItem(`nail_platform_session_revoked_${colId}`, 'true');
    if (currentUser && currentUser.id === colId) {
      handleLogout();
      alert(`Tu sesión como ${colName} ha sido cerrada por seguridad.`);
    } else {
      alert(`La sesión de ${colName} ha sido cerrada y revocada con éxito. Se le solicitará iniciar sesión nuevamente la próxima vez.`);
    }
  };

  const handleAddCollaborator = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColName || !newColUsername || !newColPassword) return;

    const list = activeSalon.collaborators || [];
    // Check if username already exists
    if (newColUsername.toLowerCase() === 'admin' || list.some(c => c.username.toLowerCase() === newColUsername.toLowerCase())) {
      alert('El nombre de usuario ya está en uso o no está permitido.');
      return;
    }

    const newCol = { id: `col-${Date.now()}`, name: newColName, username: newColUsername, password: newColPassword };
    onUpdateSalon({
      ...activeSalon,
      collaborators: [...list, newCol]
    });

    setNewColName('');
    setNewColUsername('');
    setNewColPassword('');
    setColSuccessMsg('¡Colaborador creado con éxito!');
    setTimeout(() => setColSuccessMsg(''), 3000);
  };

  const handleDeleteCollaborator = (id: string) => {
    const list = activeSalon.collaborators || [];
    onUpdateSalon({
      ...activeSalon,
      collaborators: list.filter(c => c.id !== id)
    });
    // Invalidate session for security
    localStorage.setItem(`nail_platform_session_revoked_${id}`, 'true');
    if (currentUser && currentUser.id === id) {
      handleLogout();
    }
  };

  // Product Catalog Handlers
  const handleAddCompToDraft = () => {
    if (newCompText.trim()) {
      setNewProdComponents(prev => [...prev, newCompText.trim()]);
      setNewCompText('');
    }
  };

  const handleRemoveCompFromDraft = (index: number) => {
    setNewProdComponents(prev => prev.filter((_, i) => i !== index));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, callback: (base64: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        callback(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName || !newProdPrice) {
      alert('Por favor completa el nombre y el precio.');
      return;
    }

    const productsList = activeSalon.products || [];
    const parsedPrice = parseFloat(newProdPrice);

    const productData: ProductItem = {
      id: editingProductId || `prod-${Date.now()}`,
      name: newProdName,
      description: newProdDesc,
      price: parsedPrice,
      category: newProdCategory,
      image: newProdImage || 'https://images.unsplash.com/photo-1519014816548-bf5fe059798b?auto=format&fit=crop&q=80&w=300',
      components: newProdComponents
    };

    let updatedProducts: ProductItem[];
    if (editingProductId) {
      updatedProducts = productsList.map(p => p.id === editingProductId ? productData : p);
      setEditingProductId(null);
      setColSuccessMsg('¡Producto actualizado con éxito!');
    } else {
      updatedProducts = [...productsList, productData];
      setColSuccessMsg('¡Producto registrado con éxito!');
    }

    onUpdateSalon({
      ...activeSalon,
      products: updatedProducts
    });

    // Reset fields
    setNewProdName('');
    setNewProdDesc('');
    setNewProdPrice('');
    setNewProdCategory('Productos');
    setNewProdImage('');
    setNewProdComponents([]);
    setNewCompText('');

    setTimeout(() => setColSuccessMsg(''), 3000);
  };

  const handleStartEditProduct = (prod: ProductItem) => {
    setEditingProductId(prod.id);
    setNewProdName(prod.name);
    setNewProdDesc(prod.description);
    setNewProdPrice(prod.price.toString());
    setNewProdCategory(prod.category);
    setNewProdImage(prod.image);
    setNewProdComponents(prod.components || []);
  };

  const handleDeleteProduct = (id: string) => {
    const productsList = activeSalon.products || [];
    onUpdateSalon({
      ...activeSalon,
      products: productsList.filter(p => p.id !== id)
    });
    setColSuccessMsg('¡Producto eliminado con éxito!');
    setTimeout(() => setColSuccessMsg(''), 3000);
  };

  // Service Catalog Handlers
  const handleAddSerCompToDraft = () => {
    if (newSerCompText.trim()) {
      setNewSerComponents(prev => [...prev, newSerCompText.trim()]);
      setNewSerCompText('');
    }
  };

  const handleRemoveSerCompFromDraft = (index: number) => {
    setNewSerComponents(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSerName || !newSerPrice) {
      alert('Por favor completa el nombre y el precio.');
      return;
    }

    const servicesList = activeSalon.services || [];
    const parsedPrice = parseFloat(newSerPrice);
    const parsedDuration = parseInt(newSerDuration, 10) || 45;

    const serviceData = {
      id: editingServiceId || `ser-${Date.now()}`,
      name: newSerName,
      description: newSerDesc,
      price: parsedPrice,
      durationMinutes: parsedDuration,
      category: newSerCategory,
      image: newSerImage || 'https://images.unsplash.com/photo-1604654894610-df4906b197ae?auto=format&fit=crop&q=80&w=300',
      components: newSerComponents
    };

    let updatedServices;
    if (editingServiceId) {
      updatedServices = servicesList.map(s => s.id === editingServiceId ? serviceData : s);
      setEditingServiceId(null);
      setColSuccessMsg('¡Servicio actualizado con éxito!');
    } else {
      updatedServices = [...servicesList, serviceData];
      setColSuccessMsg('¡Servicio registrado con éxito!');
    }

    onUpdateSalon({
      ...activeSalon,
      services: updatedServices
    });

    // Reset fields
    setNewSerName('');
    setNewSerDesc('');
    setNewSerPrice('');
    setNewSerDuration('45');
    setNewSerCategory('Servicios');
    setNewSerImage('');
    setNewSerComponents([]);
    setNewSerCompText('');

    setTimeout(() => setColSuccessMsg(''), 3000);
  };

  const handleStartEditService = (ser: any) => {
    setEditingServiceId(ser.id);
    setNewSerName(ser.name);
    setNewSerDesc(ser.description);
    setNewSerPrice(ser.price.toString());
    setNewSerDuration((ser.durationMinutes || 45).toString());
    setNewSerCategory(ser.category || 'Servicios');
    setNewSerImage(ser.image || '');
    setNewSerComponents(ser.components || []);
  };

  const handleDeleteService = (id: string) => {
    const servicesList = activeSalon.services || [];
    onUpdateSalon({
      ...activeSalon,
      services: servicesList.filter(s => s.id !== id)
    });
    setColSuccessMsg('¡Servicio eliminado con éxito!');
    setTimeout(() => setColSuccessMsg(''), 3000);
  };

  const handleUpdateOrderStatus = (orderId: string, status: 'Pendiente' | 'Entregado' | 'Cancelado') => {
    const ordersList = activeSalon.orders || [];
    const updatedOrders = ordersList.map(o => o.id === orderId ? { ...o, status } : o);
    onUpdateSalon({
      ...activeSalon,
      orders: updatedOrders
    });
    setColSuccessMsg('¡Estado del pedido actualizado!');
    setTimeout(() => setColSuccessMsg(''), 3000);
  };

  const handleDeleteOrder = (orderId: string) => {
    const ordersList = activeSalon.orders || [];
    onUpdateSalon({
      ...activeSalon,
      orders: ordersList.filter(o => o.id !== orderId)
    });
    setColSuccessMsg('Pedido eliminado.');
    setTimeout(() => setColSuccessMsg(''), 3000);
  };
  
  // Local state for adding/editing manual appointments
  const [showAddApt, setShowAddApt] = useState(false);
  const [newAptClient, setNewAptClient] = useState('');
  const [newAptPhone, setNewAptPhone] = useState('');
  const [newAptEmail, setNewAptEmail] = useState('');
  const [newAptServiceId, setNewAptServiceId] = useState('');
  const [newAptStaffId, setNewAptStaffId] = useState('');
  const [newAptDate, setNewAptDate] = useState('');
  const [newAptTime, setNewAptTime] = useState('');
  const [newAptNotes, setNewAptNotes] = useState('');

  // Local state for editing clients
  const [editingClientId, setEditingClientId] = useState<string | null>(null);
  const [editClientPref, setEditClientPref] = useState('');

  // Local state for exporting reports
  const [exportSuccess, setExportSuccess] = useState(false);

  // Get active salon details
  const activeSalon = salons.find(s => s.id === activeSalonId) || salons[0] || ({
    id: '', name: 'Bellas Uñas', slogan: '', logo: '💅', address: '', phone: '', email: '',
    rating: 0, reviewsCount: 0, colorTheme: {} as any, services: [], staff: [],
    collaborators: [], products: [], orders: [],
  } as Salon);

  const handlePrintQR = () => {
    const link = window.location.origin + '/?codigo=' + activeSalon.id;
    const qr = 'https://api.qrserver.com/v1/create-qr-code/?size=600x600&margin=10&data=' + encodeURIComponent(link);
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(
      '<html><head><title>QR - ' + activeSalon.name + '</title>' +
      '<style>' +
      '@page { size: A4; margin: 0; }' +
      'body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin:0; color:#0f172a; }' +
      '.page { width:210mm; min-height:297mm; box-sizing:border-box; padding:26mm 20mm; text-align:center; display:flex; flex-direction:column; align-items:center; justify-content:center; }' +
      '.name { font-size:40px; font-weight:800; letter-spacing:1px; margin:0 0 6px; }' +
      '.tag { font-size:14px; letter-spacing:4px; text-transform:uppercase; color:#db2777; margin:0 0 28px; }' +
      '.qr { width:340px; height:340px; border:2px solid #0f172a; border-radius:18px; padding:14px; }' +
      '.cta { font-size:26px; font-weight:800; margin:30px 0 10px; }' +
      '.sub { font-size:17px; color:#334155; max-width:150mm; line-height:1.55; margin:0 auto; }' +
      '.foot { margin-top:34px; font-size:12px; color:#94a3b8; font-family:monospace; }' +
      '</style></head><body>' +
      '<div class="page">' +
      '<div class="name">' + (activeSalon.name || 'Bellas Unas').toUpperCase() + '</div>' +
      '<div class="tag">Reserva online</div>' +
      '<img class="qr" src="' + qr + '" referrerpolicy="no-referrer" alt="QR" onload="setTimeout(function(){window.print();},250)" />' +
      '<div class="cta">Escanea y reserva tu turno al instante</div>' +
      '<div class="sub">Apunta la camara de tu celular al codigo y entra a nuestra pagina: mira los servicios, precios y reserva tu turno desde donde estes. Se la primera en aprovechar las promos.</div>' +
      '<div class="foot">' + link + '</div>' +
      '</div>' +
      '</body></html>'
    );
    w.document.close();
  };

  // Filter appointments for the active salon
  const salonAppointments = appointments.filter(a => a.salonId === activeSalon.id);

  // 1. Calculations for Dashboard Overview Metrics
  const totalRevenue = salonAppointments
    .filter(a => a.status === 'Completado')
    .reduce((sum, a) => sum + a.price, 0);

  const pendingAppointments = salonAppointments.filter(a => a.status === 'Pendiente').length;
  const confirmedAppointments = salonAppointments.filter(a => a.status === 'Confirmado').length;
  const activeAppointmentsCount = pendingAppointments + confirmedAppointments;

  const averageTicket = salonAppointments.filter(a => a.status === 'Completado').length > 0 
    ? Math.round(totalRevenue / salonAppointments.filter(a => a.status === 'Completado').length)
    : 0;

  // 2. Prepare charts data
  // Monthly revenue chart (recharts)
  const monthlyData = [
    { name: 'Feb', Ventas: activeSalonId === 'bellas-unas' ? 210000 : 120000, Citas: 22 },
    { name: 'Mar', Ventas: activeSalonId === 'bellas-unas' ? 285000 : 180000, Citas: 30 },
    { name: 'Abr', Ventas: activeSalonId === 'bellas-unas' ? 320000 : 210000, Citas: 34 },
    { name: 'May', Ventas: activeSalonId === 'bellas-unas' ? 410000 : 290000, Citas: 45 },
    { name: 'Jun', Ventas: activeSalonId === 'bellas-unas' ? 485000 : 340000, Citas: 52 },
    { name: 'Jul (Hoy)', Ventas: totalRevenue, Citas: salonAppointments.length }
  ];

  // Service Breakdown data for Donut Chart
  const servicesCountMap: Record<string, number> = {};
  salonAppointments.forEach(a => {
    if (a.status === 'Completado' || a.status === 'Confirmado') {
      servicesCountMap[a.serviceName] = (servicesCountMap[a.serviceName] || 0) + a.price;
    }
  });

  const donutColors = ['#E08297', '#FBBF24', '#34D399', '#60A5FA', '#A78BFA', '#F472B6'];
  const serviceBreakdownData = Object.keys(servicesCountMap).map((name, i) => ({
    name,
    value: servicesCountMap[name]
  }));

  // Specialist comparison bar data
  const staffPerformanceMap: Record<string, { total: number, count: number }> = {};
  salonAppointments.forEach(a => {
    if (a.status === 'Completado') {
      if (!staffPerformanceMap[a.staffName]) {
        staffPerformanceMap[a.staffName] = { total: 0, count: 0 };
      }
      staffPerformanceMap[a.staffName].total += a.price;
      staffPerformanceMap[a.staffName].count += 1;
    }
  });

  const staffChartData = Object.keys(staffPerformanceMap).map(name => ({
    name,
    Ingresos: staffPerformanceMap[name].total,
    Citas: staffPerformanceMap[name].count
  }));

  // 3. Handlers
  const handleUpdateStatus = (id: string, newStatus: AppointmentStatus) => {
    const updated = appointments.map(a => {
      if (a.id === id) {
        return { ...a, status: newStatus };
      }
      return a;
    });
    onUpdateAppointments(updated);

    // If marked as completed, let's also update the client's statistics inside CRM
    if (newStatus === 'Completado') {
      const apt = appointments.find(a => a.id === id);
      if (apt) {
        const updatedClients = clients.map(c => {
          if (c.email.toLowerCase() === apt.clientEmail.toLowerCase() || c.phone === apt.clientPhone) {
            return {
              ...c,
              totalSpent: c.totalSpent + apt.price,
              visitsCount: c.visitsCount + 1,
              lastVisitDate: apt.date
            };
          }
          return c;
        });
        
        // Check if client existed. If not, add new client
        const clientExists = clients.some(c => c.email.toLowerCase() === apt.clientEmail.toLowerCase());
        if (!clientExists) {
          const newClient: ClientProfile = {
            id: `cli-${Date.now()}`,
            name: apt.clientName,
            phone: apt.clientPhone,
            email: apt.clientEmail,
            preferences: 'Ninguna especificada',
            totalSpent: apt.price,
            visitsCount: 1,
            lastVisitDate: apt.date
          };
          onUpdateClients([...updatedClients, newClient]);
        } else {
          onUpdateClients(updatedClients);
        }
      }
    }
  };

  const handleAddManualAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    const service = activeSalon.services.find(s => s.id === newAptServiceId);
    const staff = activeSalon.staff.find(st => st.id === newAptStaffId);
    if (!service || !staff) return;

    const newBooking: Appointment = {
      id: `apt-${Date.now()}`,
      salonId: activeSalon.id,
      salonName: activeSalon.name,
      clientName: newAptClient,
      clientPhone: newAptPhone,
      clientEmail: newAptEmail || 'walkin@salon.com',
      serviceId: service.id,
      serviceName: service.name,
      price: service.price,
      staffId: staff.id,
      staffName: staff.name,
      date: newAptDate,
      time: newAptTime,
      status: 'Confirmado',
      notes: newAptNotes,
      createdAt: new Date().toISOString()
    };

    onUpdateAppointments([newBooking, ...appointments]);

    // Also register or update client profile
    const clientExists = clients.some(c => c.phone === newAptPhone);
    if (!clientExists) {
      const newClient: ClientProfile = {
        id: `cli-${Date.now()}`,
        name: newAptClient,
        phone: newAptPhone,
        email: newAptEmail || 'walkin@salon.com',
        preferences: 'Cliente walk-in manual',
        totalSpent: service.price,
        visitsCount: 1,
        lastVisitDate: newAptDate
      };
      onUpdateClients([...clients, newClient]);
    }

    // Reset Form
    setNewAptClient('');
    setNewAptPhone('');
    setNewAptEmail('');
    setNewAptServiceId('');
    setNewAptStaffId('');
    setNewAptDate('');
    setNewAptTime('');
    setNewAptNotes('');
    setShowAddApt(false);
  };

  const handleSaveClientPref = (clientId: string) => {
    const updated = clients.map(c => {
      if (c.id === clientId) {
        return { ...c, preferences: editClientPref };
      }
      return c;
    });
    onUpdateClients(updated);
    setEditingClientId(null);
  };

  // Live profile modification
  const handleUpdateProfileField = (field: keyof Salon, value: any) => {
    onUpdateSalon({
      ...activeSalon,
      [field]: value
    });
  };

  const [finBackupHecho, setFinBackupHecho] = useState(false);
  const [finPuedeBorrar, setFinPuedeBorrar] = useState(false);

  const exportarPlanilla = () => {
    const esc = (v: any) => '"' + String(v ?? '').replace(/"/g, '""') + '"';
    const rol = currentUser?.role === 'admin' ? 'Dueño / Admin' : 'Colaborador';
    const rows: string[] = [];
    // Fila 1: quién exporta (vendedor / admin) — estilo Bar-Cel
    rows.push([esc(rol + ': ' + (currentUser?.name || '')), esc('Salón: ' + activeSalon.name), esc('Emitido: ' + new Date().toLocaleString())].join(';'));
    rows.push('');
    rows.push(['Fecha', 'Hora', 'Cliente', 'Teléfono', 'Servicio', 'Profesional', 'Estado', 'Precio'].map(esc).join(';'));
    salonAppointments.forEach(a => {
      rows.push([a.date, a.time, a.clientName, a.clientPhone, a.serviceName, a.staffName, a.status, a.price].map(esc).join(';'));
    });
    rows.push('');
    const totalCompletado = salonAppointments.filter(a => a.status === 'Completado').reduce((s, a) => s + (a.price || 0), 0);
    rows.push([esc('Total facturado (completadas)'), esc(totalCompletado)].join(';'));

    const csv = '﻿' + rows.join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Finanzas_${activeSalon.name.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    setFinBackupHecho(true);
    setExportSuccess(true);
    setTimeout(() => setExportSuccess(false), 2500);
  };

  const vaciarFinanzas = () => {
    if (!finPuedeBorrar) return;
    if (!confirm('¿Vaciar el historial de finanzas? Se eliminarán las citas COMPLETADAS de esta sucursal (el resto queda). Asegurate de haber descargado la planilla.')) return;
    const restantes = appointments.filter(a => !(a.salonId === activeSalon.id && a.status === 'Completado'));
    onUpdateAppointments(restantes);
    setFinPuedeBorrar(false);
    setFinBackupHecho(false);
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center font-sans p-6 relative overflow-hidden w-full">
        {/* Ambient glows */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-pink-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-md bg-slate-900/85 backdrop-blur-md p-8 rounded-3xl border border-slate-800 shadow-2xl relative z-10 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-pink-500/10 text-pink-400 rounded-full flex items-center justify-center mx-auto text-3xl">
              💅
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">Portal Administrativo</h2>
            <p className="text-xs text-slate-400">Ingresá con tu licencia <strong className="text-pink-400">BELL</strong></p>
          </div>

          {bioAvail && bioOn && (
            <div>
              <button
                type="button"
                onClick={handleBioLogin}
                disabled={loginLoading}
                className="w-full py-3.5 bg-gradient-to-r from-fuchsia-500 to-pink-600 hover:from-fuchsia-600 hover:to-pink-700 disabled:opacity-60 text-white font-black text-xs rounded-xl shadow-lg transition-all transform active:scale-95 cursor-pointer flex items-center justify-center gap-2"
              >
                <Smartphone className="w-4 h-4" /> Ingresar con huella / Face ID
              </button>
              <div className="flex items-center gap-2 my-3">
                <span className="flex-1 h-px bg-slate-800"></span>
                <span className="text-[10px] text-slate-500 uppercase">o con tus datos</span>
                <span className="flex-1 h-px bg-slate-800"></span>
              </div>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            {authError && (
              <div className="p-3.5 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl font-bold">
                ⚠️ {authError}
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800">
              <button type="button" onClick={() => setLoginRole('admin')}
                className={`py-2 rounded-lg text-[11px] font-black transition ${loginRole === 'admin' ? 'bg-gradient-to-r from-pink-500 to-rose-600 text-white' : 'text-slate-400'}`}>👑 Dueño/a</button>
              <button type="button" onClick={() => setLoginRole('colaborador')}
                className={`py-2 rounded-lg text-[11px] font-black transition ${loginRole === 'colaborador' ? 'bg-gradient-to-r from-pink-500 to-rose-600 text-white' : 'text-slate-400'}`}>🤝 Colaborador/a</button>
            </div>

            <div className="space-y-1 text-left">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Código de licencia</label>
              <input
                type="text"
                value={loginCode}
                onChange={(e) => setLoginCode(e.target.value)}
                placeholder="BELL-XXXX-..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-pink-500 font-mono uppercase"
                required
              />
            </div>

            <div className="space-y-1 text-left">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Usuario</label>
              <input 
                type="text" 
                value={authUsername}
                onChange={(e) => setAuthUsername(e.target.value)}
                placeholder="Ingresá tu usuario"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-pink-500 font-bold"
                required
              />
            </div>

            <div className="space-y-1 text-left">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Contraseña</label>
              <input 
                type="password" 
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-pink-500"
                required
              />
            </div>

            {bioAvail && !bioOn && (
              <label className="flex items-start gap-2 text-[11px] text-slate-300 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 cursor-pointer text-left">
                <input
                  type="checkbox"
                  checked={bioCheck}
                  onChange={(e) => setBioCheck(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-pink-600"
                />
                <span>
                  🔒 <strong className="text-slate-200">Activar ingreso con huella / Face ID</strong> en este dispositivo,
                  para no volver a tipear las credenciales.
                </span>
              </label>
            )}

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-3.5 bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 disabled:opacity-60 text-white font-black text-xs rounded-xl shadow-lg transition-all transform active:scale-95 cursor-pointer"
            >
              {loginLoading ? 'Ingresando…' : 'Ingresar al Panel'}
            </button>
          </form>

          <div className="border-t border-slate-800/60 pt-4 text-center space-y-2">
<button
              onClick={onCloseAdmin}
              className="text-xs font-bold text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              ← Volver al Sitio Público
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      
      {/* Upper Navigation Row with multi-tenant selector */}
      <header className="bg-slate-950 border-b border-slate-800 px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Nombre del salón */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-xl">{activeSalon?.logo || '💅'}</span>
          <div>
            <span className="text-sm font-black text-white block">{activeSalon?.name || 'Bellas Uñas'}</span>
            <span className="text-[10px] text-slate-400">Panel del salón</span>
          </div>
        </div>

        {/* Global Exit Admin Button */}
        <div className="flex items-center space-x-4 w-full md:w-auto justify-end">
          <div className="text-right">
            <span className="text-xs text-slate-100 font-bold block">{currentUser?.name}</span>
            <span className="text-[9px] bg-emerald-500/10 text-emerald-400 font-extrabold px-2 py-0.5 rounded-full uppercase">
              {currentUser?.role === 'admin' ? 'Dueño/Admin' : 'Colaborador'}
            </span>
          </div>
          <button
            onClick={handleLogout}
            title="Cerrar Sesión Administrativa"
            className="px-3 py-2 bg-slate-900 hover:bg-red-950/40 hover:text-red-400 rounded-xl text-xs font-bold border border-slate-800 hover:border-red-500/30 transition-all cursor-pointer"
          >
            🔒 Salir
          </button>
          <button
            onClick={onCloseAdmin}
            className="flex items-center space-x-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 hover:text-white rounded-xl text-xs font-bold transition-all border border-slate-700 shadow-sm cursor-pointer"
          >
            <Smartphone className="w-4 h-4 text-pink-400" />
            <span>Volver a Web Pública</span>
          </button>
        </div>
      </header>

      {/* Main Admin layout */}
      <div className="flex-1 flex flex-col lg:flex-row">
        
        {/* Sidebar Nav */}
        <nav className="w-full lg:w-64 bg-slate-950 border-r border-slate-800 p-4 space-y-2 shrink-0">
          <span className="text-[10px] font-bold text-slate-500 tracking-widest uppercase block px-3 mb-2">MENÚ PRINCIPAL</span>
          
          <button
            onClick={() => setActiveTab('appointments')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'appointments'
                ? 'bg-pink-500/10 text-pink-400 border-l-4 border-pink-500'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900'
            }`}
          >
            <div className="flex items-center space-x-3">
              <CalendarIcon className="w-4.5 h-4.5" />
              <span>Gestión de Citas</span>
            </div>
            {activeAppointmentsCount > 0 && (
              <span className="bg-pink-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full">
                {activeAppointmentsCount}
              </span>
            )}
          </button>

          {currentUser?.role === 'admin' && (
            <>
              <button
                onClick={() => setActiveTab('crm')}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'crm'
                    ? 'bg-pink-500/10 text-pink-400 border-l-4 border-pink-500'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900'
                }`}
              >
                <Users className="w-4.5 h-4.5" />
                <span>Fichas de Clientes (CRM)</span>
              </button>

              <button
                onClick={() => setActiveTab('services_catalog')}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'services_catalog'
                    ? 'bg-pink-500/10 text-pink-400 border-l-4 border-pink-500'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900'
                }`}
              >
                <ClipboardList className="w-4.5 h-4.5 text-pink-400" />
                <span>Servicios</span>
              </button>

              <button
                onClick={() => setActiveTab('products_catalog')}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'products_catalog'
                    ? 'bg-pink-500/10 text-pink-400 border-l-4 border-pink-500'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900'
                }`}
              >
                <ShoppingBag className="w-4.5 h-4.5 text-pink-400" />
                <span>Catálogo (Promos/Productos)</span>
              </button>

              <button
                onClick={() => setActiveTab('orders_management')}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'orders_management'
                    ? 'bg-pink-500/10 text-pink-400 border-l-4 border-pink-500'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <ClipboardList className="w-4.5 h-4.5 text-amber-400" />
                  <span>Pedidos Recibidos</span>
                </div>
                {(activeSalon.orders?.filter(o => o.status === 'Pendiente').length || 0) > 0 && (
                  <span className="bg-amber-500 text-slate-950 text-[9px] font-black px-2 py-0.5 rounded-full">
                    {activeSalon.orders?.filter(o => o.status === 'Pendiente').length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('overview')}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'overview'
                    ? 'bg-pink-500/10 text-pink-400 border-l-4 border-pink-500'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900'
                }`}
              >
                <BarChart3 className="w-4.5 h-4.5" />
                <span>Dashboard</span>
              </button>

              <button
                onClick={() => setActiveTab('reports')}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'reports'
                    ? 'bg-pink-500/10 text-pink-400 border-l-4 border-pink-500'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900'
                }`}
              >
                <TrendingUp className="w-4.5 h-4.5" />
                <span>Finanzas y Reportes</span>
              </button>

              <button
                onClick={() => setActiveTab('collaborators')}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'collaborators'
                    ? 'bg-pink-500/10 text-pink-400 border-l-4 border-pink-500'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900'
                }`}
              >
                <UserCheck className="w-4.5 h-4.5" />
                <span>Colaboradores</span>
              </button>

              <button
                onClick={() => setActiveTab('settings')}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'settings'
                    ? 'bg-pink-500/10 text-pink-400 border-l-4 border-pink-500'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900'
                }`}
              >
                <Settings className="w-4.5 h-4.5" />
                <span>Configuración Perfil</span>
              </button>

              <button
                onClick={() => setActiveTab('reseñas')}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'reseñas'
                    ? 'bg-pink-500/10 text-pink-400 border-l-4 border-pink-500'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className="w-4.5 h-4.5 flex items-center justify-center">🌟</span>
                  <span>Reseñas</span>
                </div>
                {(((activeSalon.reviews as any[]) || []).filter((r: any) => !r.approved).length) > 0 && (
                  <span className="bg-pink-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full">
                    {((activeSalon.reviews as any[]) || []).filter((r: any) => !r.approved).length}
                  </span>
                )}
              </button>
            </>
          )}
        </nav>

        {/* Content Box */}
        <main className="flex-1 p-6 space-y-6 overflow-y-auto">
          
          {/* Active branch display */}
          <div className="flex items-center space-x-2 bg-slate-800/40 p-4 rounded-2xl border border-slate-800">
            <span className="text-2xl">{activeSalon.logo}</span>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Panel de Control</span>
              <h2 className="text-lg font-bold text-white">{activeSalon.name} — {activeSalon.address}</h2>
            </div>
          </div>

          {/* TAB 1: OVERVIEW DASHBOARD */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-fadeIn">
              
              {/* Stats Row */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                
                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block">INGRESOS DE HOY</span>
                    <h3 className="text-2xl font-black text-emerald-400">${totalRevenue.toLocaleString('es-AR')}</h3>
                    <span className="text-[10px] text-slate-500 block">Suma de citas completadas</span>
                  </div>
                  <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
                    <DollarSign className="w-6 h-6" />
                  </div>
                </div>

                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block">CITAS POR ATENDER</span>
                    <h3 className="text-2xl font-black text-amber-400">{activeAppointmentsCount}</h3>
                    <span className="text-[10px] text-slate-500 block">{pendingAppointments} pendientes, {confirmedAppointments} confirmadas</span>
                  </div>
                  <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl">
                    <CalendarIcon className="w-6 h-6" />
                  </div>
                </div>

                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block">PROMEDIO POR CLIENTE</span>
                    <h3 className="text-2xl font-black text-[#E08297]">${averageTicket.toLocaleString('es-AR')}</h3>
                    <span className="text-[10px] text-slate-500 block">Ticket promedio en salón</span>
                  </div>
                  <div className="p-3 bg-pink-500/10 text-[#E08297] rounded-xl">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                </div>

                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block">RESEÑAS SUCURSAL</span>
                    <h3 className="text-2xl font-black text-amber-400 flex items-center gap-1">
                      ★ {activeSalon.rating}
                    </h3>
                    <span className="text-[10px] text-slate-500 block">Sobre {activeSalon.reviewsCount} votos</span>
                  </div>
                  <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl">
                    <Star className="w-6 h-6 fill-amber-400/25" />
                  </div>
                </div>

              </div>

              {/* Grid with main schedule alert and graph previews */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Visual mini list of next appointments */}
                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4 lg:col-span-1">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                    <h4 className="text-xs font-bold tracking-widest uppercase text-slate-400">PRÓXIMAS CITAS (HOY)</h4>
                    <span className="text-[10px] text-pink-400 bg-pink-500/10 px-2.5 py-0.5 rounded font-black">AGENDA</span>
                  </div>

                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {salonAppointments.length > 0 ? (
                      salonAppointments.map((apt) => (
                        <div key={apt.id} className="p-3.5 bg-slate-900 rounded-xl border border-slate-800/60 space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-xs text-slate-200">{apt.clientName}</span>
                            <span className="font-mono text-[11px] font-semibold text-slate-400 flex items-center">
                              <Clock className="w-3 h-3 mr-1" />
                              {apt.time} hs
                            </span>
                          </div>
                          <div className="flex justify-between text-[11px] text-slate-400">
                            <span>{apt.serviceName}</span>
                            <span className="font-bold">${apt.price.toLocaleString('es-AR')}</span>
                          </div>
                          <div className="flex justify-between items-center pt-1.5 border-t border-slate-800/45">
                            <span className="text-[10px] text-pink-400 font-bold">Artist: {apt.staffName}</span>
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                              apt.status === 'Completado' ? 'bg-emerald-500/20 text-emerald-400' :
                              apt.status === 'Confirmado' ? 'bg-blue-500/20 text-blue-400' :
                              apt.status === 'Cancelado' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
                            }`}>
                              {apt.status}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-slate-500 py-10 text-xs">
                        No hay citas cargadas para esta sucursal.
                      </div>
                    )}
                  </div>
                </div>

                {/* Mini Graph Preview */}
                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 lg:col-span-2 space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                    <h4 className="text-xs font-bold tracking-widest uppercase text-slate-400">CRECIMIENTO FINANCIERO MENSUAL</h4>
                    <span className="text-[10px] text-emerald-400 font-bold">Facturación en Pesos</span>
                  </div>
                  
                  <div className="h-72 w-full text-xs font-mono">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                        <XAxis dataKey="name" stroke="#64748B" />
                        <YAxis stroke="#64748B" />
                        <Tooltip contentStyle={{ backgroundColor: '#0F172A', borderColor: '#1E293B', color: '#F1F5F9' }} />
                        <Legend />
                        <Bar dataKey="Ventas" fill="#E08297" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 2: APPOINTMENT MANAGER */}
          {activeTab === 'appointments' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h3 className="text-xl font-bold text-white">Administrador de Turnos</h3>
                  <p className="text-xs text-slate-400">Controlá los turnos cargados, registrá asistencias y agregá clientes walk-in manualmente.</p>
                </div>
                <button
                  onClick={() => setShowAddApt(true)}
                  className="flex items-center space-x-1 px-4 py-2.5 bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nuevo Turno Manual (Walk-In)</span>
                </button>
              </div>

              {/* Form to add walk-in booking */}
              {showAddApt && (
                <div className="bg-slate-950 p-6 rounded-2xl border border-pink-500/30 space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                    <span className="text-xs font-bold tracking-widest text-pink-400 uppercase flex items-center gap-1">
                      👑 AGENDAR CLIENTA PRESENCIAL EN SUCURSAL
                    </span>
                    <button 
                      onClick={() => setShowAddApt(false)}
                      className="p-1 text-slate-400 hover:text-white rounded-full bg-slate-900"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <form onSubmit={handleAddManualAppointment} className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-300">
                    <div>
                      <label className="block text-slate-400 font-semibold mb-1">Nombre de la Clienta</label>
                      <input 
                        type="text" 
                        required 
                        placeholder="Ej. Maria Becerra"
                        value={newAptClient}
                        onChange={(e) => setNewAptClient(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-pink-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 font-semibold mb-1">Celular / WhatsApp</label>
                      <input 
                        type="tel" 
                        required 
                        placeholder="Ej. 11-5555-6666"
                        value={newAptPhone}
                        onChange={(e) => setNewAptPhone(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-pink-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 font-semibold mb-1">E-mail (Opcional)</label>
                      <input 
                        type="email" 
                        placeholder="maria@ejemplo.com"
                        value={newAptEmail}
                        onChange={(e) => setNewAptEmail(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-pink-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 font-semibold mb-1">Servicio Solicitado</label>
                      <select 
                        required
                        value={newAptServiceId}
                        onChange={(e) => setNewAptServiceId(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-pink-500"
                      >
                        <option value="">Seleccionar Servicio</option>
                        {activeSalon.services.map(s => (
                          <option key={s.id} value={s.id}>{s.name} (${s.price.toLocaleString('es-AR')})</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-400 font-semibold mb-1">Manicurista Asignada</label>
                      <select 
                        required
                        value={newAptStaffId}
                        onChange={(e) => setNewAptStaffId(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-pink-500"
                      >
                        <option value="">Seleccionar Profesional</option>
                        {activeSalon.staff.map(st => (
                          <option key={st.id} value={st.id}>{st.name} ({st.role})</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-slate-400 font-semibold mb-1">Fecha</label>
                        <input 
                          type="date" 
                          required 
                          value={newAptDate}
                          onChange={(e) => setNewAptDate(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-pink-500"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 font-semibold mb-1">Hora</label>
                        <input 
                          type="time" 
                          required 
                          value={newAptTime}
                          onChange={(e) => setNewAptTime(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-pink-500"
                        />
                      </div>
                    </div>

                    <div className="md:col-span-3">
                      <label className="block text-slate-400 font-semibold mb-1">Notas Internas de la manicura (Opcional)</label>
                      <textarea 
                        rows={2}
                        placeholder="Ej. Trae diseño en foto de Instagram. Uñas esculpidas cortas..."
                        value={newAptNotes}
                        onChange={(e) => setNewAptNotes(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-pink-500"
                      />
                    </div>

                    <div className="md:col-span-3 flex justify-end space-x-2 pt-2">
                      <button 
                        type="button"
                        onClick={() => setShowAddApt(false)}
                        className="px-4 py-2 bg-slate-850 hover:bg-slate-800 rounded-xl font-bold"
                      >
                        Cancelar
                      </button>
                      <button 
                        type="submit"
                        className="px-6 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-xl font-bold shadow"
                      >
                        Confirmar Cita
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Appointments List Grid */}
              <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden">
                <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex justify-between items-center">
                  <span className="text-xs font-bold tracking-widest text-slate-400 uppercase">
                    REGISTRO DE CITAS ({salonAppointments.length} turnos)
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium">Ordenados por fecha y hora</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 bg-slate-900/40">
                        <th className="p-4 font-bold">CLIENTA</th>
                        <th className="p-4 font-bold">CONTACTO</th>
                        <th className="p-4 font-bold">SERVICIO</th>
                        <th className="p-4 font-bold">MANICURISTA</th>
                        <th className="p-4 font-bold">FECHA / HORA</th>
                        <th className="p-4 font-bold text-center">MONTO</th>
                        <th className="p-4 font-bold text-center">ESTADO</th>
                        <th className="p-4 font-bold text-right">ACCIONES RÁPIDAS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {salonAppointments.length > 0 ? (
                        salonAppointments.map((apt) => (
                          <tr key={apt.id} className="border-b border-slate-800/50 hover:bg-slate-900/30 transition-colors">
                            <td className="p-4">
                              <div className="font-bold text-slate-100">{apt.clientName}</div>
                              {apt.notes && (
                                <div className="text-[10px] text-pink-400 italic mt-0.5 max-w-xs truncate">
                                  📝 {apt.notes}
                                </div>
                              )}
                            </td>
                            <td className="p-4">
                              <div className="text-slate-300 font-medium">{apt.clientPhone}</div>
                              <div className="text-[10px] text-slate-500">{apt.clientEmail}</div>
                            </td>
                            <td className="p-4">
                              <div className="font-semibold text-slate-200">{apt.serviceName}</div>
                            </td>
                            <td className="p-4">
                              <div className="text-slate-300">{apt.staffName}</div>
                            </td>
                            <td className="p-4">
                              <div className="font-bold text-slate-200">{apt.date}</div>
                              <div className="text-slate-400 text-[10px] font-mono">{apt.time} hs</div>
                            </td>
                            <td className="p-4 text-center">
                              <span className="font-bold text-slate-100">${apt.price.toLocaleString('es-AR')}</span>
                            </td>
                            <td className="p-4 text-center">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold block w-max mx-auto ${
                                apt.status === 'Completado' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' :
                                apt.status === 'Confirmado' ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30' :
                                apt.status === 'Cancelado' ? 'bg-red-500/15 text-red-400 border border-red-500/30' : 
                                'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                              }`}>
                                {apt.status}
                              </span>
                            </td>
                            <td className="p-4 text-right">
                              <div className="flex justify-end space-x-1.5">
                                {apt.status !== 'Completado' && apt.status !== 'Cancelado' && (
                                  <>
                                    <button
                                      onClick={() => handleUpdateStatus(apt.id, 'Completado')}
                                      className="p-1 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white rounded transition-colors cursor-pointer"
                                      title="Marcar como Completado (Agrega a reportes)"
                                    >
                                      <Check className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => handleUpdateStatus(apt.id, 'Cancelado')}
                                      className="p-1 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded transition-colors cursor-pointer"
                                      title="Cancelar Turno"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </>
                                )}
                                {apt.status === 'Pendiente' && (
                                  <button
                                    onClick={() => handleUpdateStatus(apt.id, 'Confirmado')}
                                    className="px-2 py-1 bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white rounded text-[10px] font-bold transition-all cursor-pointer"
                                  >
                                    Confirmar
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={8} className="p-8 text-center text-slate-500">
                            No hay citas agendadas para este salón.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: FINANCIAL REPORTS */}
          {activeTab === 'reports' && (
            <div className="space-y-6 animate-fadeIn">
              
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="text-xl font-bold text-white">Reportes Financieros</h3>
                  <p className="text-xs text-slate-400">Analizá el rendimiento comercial de la sucursal y descargá resúmenes en un clic.</p>
                </div>
                <button
                  onClick={exportarPlanilla}
                  className="flex items-center space-x-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 hover:text-white text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-emerald-400" />
                  <span>Exportar planilla (Excel/CSV)</span>
                </button>
              </div>

              {exportSuccess && (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-2xl flex items-center space-x-2 text-xs">
                  <Check className="w-5 h-5 shrink-0" />
                  <span>¡Planilla descargada! Abrila con Excel o Google Sheets.</span>
                </div>
              )}

              {finBackupHecho && (
                <div className="p-4 bg-slate-950 border border-red-900/40 rounded-2xl space-y-3">
                  <div className="flex items-start gap-2">
                    <span className="text-red-400 text-lg">🗑️</span>
                    <div>
                      <h4 className="text-xs font-bold text-slate-200">Vaciar historial de finanzas</h4>
                      <p className="text-[11px] text-slate-400">Elimina las citas <strong>completadas</strong> de esta sucursal (el resto queda). Descargá la planilla antes.</p>
                    </div>
                  </div>
                  <label className="flex items-center gap-2 text-[11px] text-slate-300 cursor-pointer">
                    <input type="checkbox" checked={finPuedeBorrar} onChange={e => setFinPuedeBorrar(e.target.checked)} />
                    Ya descargué la planilla, habilitar el borrado
                  </label>
                  <button
                    onClick={vaciarFinanzas}
                    disabled={!finPuedeBorrar}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-red-500/90 hover:bg-red-500 text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    Vaciar finanzas
                  </button>
                </div>
              )}

              {/* Secondary Metric highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block mb-1">FACTURADO CONSOLIDADO</span>
                  <h4 className="text-xl font-black text-emerald-400">${totalRevenue.toLocaleString('es-AR')}</h4>
                  <span className="text-[10px] text-slate-400 font-semibold block mt-1">Este Mes</span>
                </div>
                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block mb-1">EFICIENCIA DE CITAS</span>
                  <h4 className="text-xl font-black text-blue-400">
                    {salonAppointments.length > 0 
                      ? Math.round((salonAppointments.filter(a => a.status === 'Completado').length / salonAppointments.length) * 100) 
                      : 0}%
                  </h4>
                  <span className="text-[10px] text-slate-400 font-semibold block mt-1">Tasa de Asistencia</span>
                </div>
                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block mb-1">PRODUCTIVIDAD SUCURSAL</span>
                  <h4 className="text-xl font-black text-[#E08297]">Excelente</h4>
                  <span className="text-[10px] text-slate-400 font-semibold block mt-1">Basado en volumen</span>
                </div>
              </div>

              {/* High End Double Charts Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* 1. Category Distribution Pie Chart */}
                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                    <h4 className="text-xs font-bold tracking-widest uppercase text-slate-400">INGRESOS POR SERVICIO</h4>
                    <span className="text-[10px] text-slate-500">Monto consolidado</span>
                  </div>
                  
                  <div className="h-64 w-full flex flex-col justify-center text-xs">
                    {serviceBreakdownData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={serviceBreakdownData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {serviceBreakdownData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={donutColors[index % donutColors.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(val: number) => `$${val.toLocaleString('es-AR')}`} />
                          <Legend verticalAlign="bottom" height={36} />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="text-center text-slate-500 py-20">
                        Cargá citas completadas para graficar el desglose.
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. Staff Productivity Bar Chart */}
                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                    <h4 className="text-xs font-bold tracking-widest uppercase text-slate-400">DESEMPEÑO DEL PERSONAL</h4>
                    <span className="text-[10px] text-slate-500">Ingresos generados ($)</span>
                  </div>

                  <div className="h-64 w-full text-xs font-mono">
                    {staffChartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={staffChartData} layout="vertical" margin={{ top: 10, right: 10, left: 20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                          <XAxis type="number" stroke="#64748B" />
                          <YAxis dataKey="name" type="category" stroke="#64748B" />
                          <Tooltip contentStyle={{ backgroundColor: '#0F172A', borderColor: '#1E293B', color: '#F1F5F9' }} />
                          <Bar dataKey="Ingresos" fill="#A78BFA" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="text-center text-slate-500 py-20">
                        No hay ingresos registrados para el personal de esta sucursal.
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 4: CLIENTS CRM */}
          {activeTab === 'crm' && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h3 className="text-xl font-bold text-white">Fichero de Clientes (CRM)</h3>
                <p className="text-xs text-slate-400">Listado histórico de clientas registradas en sus salones, preferencias y gastos acumulados.</p>
              </div>

              <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-800">
                  <span className="text-xs font-bold tracking-widest text-slate-400 uppercase block">DIRECTORIO CENTRAL DE CLIENTAS</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 bg-slate-900/40">
                        <th className="p-4 font-bold">CLIENTA</th>
                        <th className="p-4 font-bold">CONTACTO</th>
                        <th className="p-4 font-bold">PREFERENCIAS & DISEÑOS FAVORITOS</th>
                        <th className="p-4 font-bold text-center">VISITAS</th>
                        <th className="p-4 font-bold text-center">DINERO ACUMULADO</th>
                        <th className="p-4 font-bold text-center">ÚLTIMA VISITA</th>
                        <th className="p-4 font-bold text-right">ACCIONES</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clients.map((client) => (
                        <tr key={client.id} className="border-b border-slate-800/50 hover:bg-slate-900/30 transition-colors">
                          <td className="p-4">
                            <div className="font-bold text-slate-100">{client.name}</div>
                            <span className="text-[10px] bg-slate-800 text-pink-400 font-bold px-2 py-0.5 rounded-full">
                              ID: {client.id}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="text-slate-300 font-medium">{client.phone}</div>
                            <div className="text-[10px] text-slate-500">{client.email}</div>
                          </td>
                          <td className="p-4 max-w-sm">
                            {editingClientId === client.id ? (
                              <div className="flex items-center space-x-2">
                                <input
                                  type="text"
                                  value={editClientPref}
                                  onChange={(e) => setEditClientPref(e.target.value)}
                                  className="bg-slate-900 border border-slate-700 text-white p-2 rounded-xl text-xs w-full focus:outline-none focus:border-pink-500"
                                />
                                <button
                                  onClick={() => handleSaveClientPref(client.id)}
                                  className="p-1.5 bg-emerald-500 text-white rounded hover:bg-emerald-600 cursor-pointer"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between group">
                                <span className="text-slate-300 italic">“{client.preferences}”</span>
                                <button
                                  onClick={() => {
                                    setEditingClientId(client.id);
                                    setEditClientPref(client.preferences);
                                  }}
                                  className="p-1 text-slate-400 hover:text-white rounded ml-2 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </td>
                          <td className="p-4 text-center">
                            <span className="font-bold text-slate-100">{client.visitsCount}</span>
                          </td>
                          <td className="p-4 text-center">
                            <span className="font-black text-emerald-400">${client.totalSpent.toLocaleString('es-AR')}</span>
                          </td>
                          <td className="p-4 text-center">
                            <span className="text-slate-300 font-medium">{client.lastVisitDate || 'Sin registros'}</span>
                          </td>
                          <td className="p-4 text-right">
                            <button
                              onClick={() => {
                                setEditingClientId(client.id);
                                setEditClientPref(client.preferences);
                              }}
                              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[10px] font-bold transition-all cursor-pointer"
                            >
                              Editar Ficha
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: SETTINGS PERFIL */}
          {activeTab === 'settings' && (
            <div className="space-y-6 animate-fadeIn">
              {/* QR del salon: descargar / imprimir para colgar en el local */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4">
                <span className="text-xs font-bold tracking-widest text-pink-400 uppercase block border-b border-slate-800 pb-2 flex items-center gap-2"><span>📱</span> Tu QR para el local</span>
                <p className="text-xs text-slate-400">Descargalo o imprimilo y colgalo en tu salón. Tus clientas lo escanean y reservan turno desde el celular.</p>
                <div className="flex flex-col sm:flex-row items-center gap-5">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=320x320&margin=8&data=${encodeURIComponent(window.location.origin + '/?codigo=' + activeSalon.id)}`}
                    alt="QR del salón"
                    referrerPolicy="no-referrer"
                    className="w-40 h-40 rounded-lg bg-white p-2 shrink-0"
                  />
                  <div className="flex-1 w-full space-y-3">
                    <div className="text-[11px] font-mono text-pink-300 break-all bg-slate-900 border border-slate-800 rounded px-3 py-2">{window.location.origin + '/?codigo=' + activeSalon.id}</div>
                    <div className="grid grid-cols-2 gap-2">
                      <a
                        href={`https://api.qrserver.com/v1/create-qr-code/?size=1000x1000&margin=20&data=${encodeURIComponent(window.location.origin + '/?codigo=' + activeSalon.id)}`}
                        download={`QR-${activeSalon.name}.png`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold py-2.5 rounded-lg"
                      >Descargar QR</a>
                      <button
                        type="button"
                        onClick={handlePrintQR}
                        className="flex items-center justify-center gap-1.5 bg-pink-500 hover:bg-pink-400 text-white text-xs font-bold py-2.5 rounded-lg"
                      >Imprimir PDF</button>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Configuración del Salón (Inquilino)</h3>
                <p className="text-xs text-slate-400">Modificá los datos generales de la sucursal activa. Los cambios se verán inmediatamente en la web pública de reservas.</p>
              </div>

              {/* 1. VISUAL THEME & DESIGN PRESETS - OF PRIMER NIVEL */}
              <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-6">
                <span className="text-xs font-bold tracking-widest text-pink-400 uppercase block border-b border-slate-800 pb-2 flex items-center gap-2">
                  <span>🎨</span> DISEÑO Y TEMA DEL SALÓN
                </span>

                {/* Estilo de Interfáz (Sleek vs Clean Minimalism) */}
                <div className="space-y-3 pb-4 border-b border-slate-800/60">
                  <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider">
                    Estilo de Interfáz (Estructura de la Web)
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Sleek Interface */}
                    <button
                      onClick={() => handleUpdateProfileField('interfaceStyle', 'sleek')}
                      className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between space-y-3 cursor-pointer ${
                        (activeSalon.interfaceStyle || 'sleek') === 'sleek'
                          ? 'bg-pink-500/10 border-pink-500 ring-2 ring-pink-500/30'
                          : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex justify-between items-center w-full">
                        <span className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                          ✨ Sleek Interface (Predeterminado)
                        </span>
                        {(activeSalon.interfaceStyle || 'sleek') === 'sleek' && (
                          <span className="bg-pink-500 text-slate-950 text-[9px] font-black px-1.5 py-0.5 rounded-md">
                            ACTIVO
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 leading-relaxed">
                        Interfáz moderna y pulida con sombras suaves, tarjetas redondeadas 3D, decoraciones premium y bordes finos de alta fidelidad.
                      </p>
                    </button>

                    {/* Clean Minimalism */}
                    <button
                      onClick={() => handleUpdateProfileField('interfaceStyle', 'minimalism')}
                      className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between space-y-3 cursor-pointer ${
                        activeSalon.interfaceStyle === 'minimalism'
                          ? 'bg-purple-500/10 border-purple-500 ring-2 ring-purple-500/30'
                          : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex justify-between items-center w-full">
                        <span className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                          🍃 Clean Minimalism
                        </span>
                        {activeSalon.interfaceStyle === 'minimalism' && (
                          <span className="bg-purple-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md">
                            ACTIVO
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 leading-relaxed">
                        Estilo zen ultra-limpio, sobrio y despejado. Líneas ultra-finas, mayor espacio en blanco y tipografías perfectamente calibradas sin ruidos visuales.
                      </p>
                    </button>
                  </div>
                </div>

                {/* Preset Selector */}
                <div className="space-y-3">
                  <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider">
                    Estilo de Salón (Preset Visual)
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Option 1 */}
                    <button
                      onClick={() => handleUpdateProfileField('designPreset', 'boutique-rosa')}
                      className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between space-y-3 cursor-pointer ${
                        (activeSalon.designPreset || 'boutique-rosa') === 'boutique-rosa'
                          ? 'bg-pink-500/10 border-pink-500 ring-2 ring-pink-500/30'
                          : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex justify-between items-center w-full">
                        <span className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                          🌸 Boutique Rosa
                        </span>
                        {(activeSalon.designPreset || 'boutique-rosa') === 'boutique-rosa' && (
                          <span className="bg-pink-500 text-slate-950 text-[9px] font-black px-1.5 py-0.5 rounded-md">
                            ACTIVO
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 leading-relaxed">
                        Estilo dulce, romántico y floreado. Ideal para salones delicados y manicuría tradicional.
                      </p>
                    </button>

                    {/* Option 2 */}
                    <button
                      onClick={() => handleUpdateProfileField('designPreset', 'spa-dorado')}
                      className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between space-y-3 cursor-pointer ${
                        activeSalon.designPreset === 'spa-dorado'
                          ? 'bg-amber-500/10 border-amber-500 ring-2 ring-amber-500/30'
                          : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex justify-between items-center w-full">
                        <span className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                          ⚜️ Spa Dorado
                        </span>
                        {activeSalon.designPreset === 'spa-dorado' && (
                          <span className="bg-amber-500 text-slate-950 text-[9px] font-black px-1.5 py-0.5 rounded-md">
                            ACTIVO
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 leading-relaxed">
                        Sofisticado, minimalista, limpio y lujoso. Colores neutros con detalles en oro y madera.
                      </p>
                    </button>

                    {/* Option 3 */}
                    <button
                      onClick={() => handleUpdateProfileField('designPreset', 'floral-neon')}
                      className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between space-y-3 cursor-pointer ${
                        activeSalon.designPreset === 'floral-neon'
                          ? 'bg-purple-500/10 border-purple-500 ring-2 ring-purple-500/30'
                          : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex justify-between items-center w-full">
                        <span className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                          ⚡ Floral Neón
                        </span>
                        {activeSalon.designPreset === 'floral-neon' && (
                          <span className="bg-purple-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md">
                            ACTIVO
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 leading-relaxed">
                        Futurista, vibrante y moderno. Glows de neón con flores exóticas de alto impacto.
                      </p>
                    </button>
                  </div>
                </div>

                {/* Font Selector */}
                <div className="space-y-3">
                  <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider">
                    Tipografía Exclusiva (Letra de la Web)
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
                    {[
                      { id: 'font-sans', label: 'Inter Standard', css: 'font-sans' },
                      { id: 'font-poppins', label: 'Poppins Moderna', css: 'font-poppins' },
                      { id: 'font-quicksand', label: 'Quicksand Dulce', css: 'font-quicksand' },
                      { id: 'font-montserrat', label: 'Montserrat Corp', css: 'font-montserrat' },
                      { id: 'font-playfair', label: 'Playfair Luxe', css: 'font-playfair font-serif' },
                      { id: 'font-dancing', label: 'Dancing Cursive', css: 'font-dancing text-sm' },
                    ].map((font) => (
                      <button
                        key={font.id}
                        onClick={() => handleUpdateProfileField('fontFamily', font.id)}
                        className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center space-y-1 ${
                          (activeSalon.fontFamily || 'font-sans') === font.id
                            ? 'bg-pink-500/10 border-pink-500 text-pink-400 font-bold'
                            : 'bg-slate-900/50 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <span className={`${font.css} truncate max-w-full text-xs`}>{font.label}</span>
                        <span className={`${font.css} text-[9px] text-slate-500`}>Abc 123</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color Preset Palette Quick Selector */}
                <div className="space-y-3">
                  <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider">
                    Paletas de Colores de Diseñador
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Palette 1 */}
                    <button
                      onClick={() => handleUpdateProfileField('colorTheme', {
                        primary: 'bg-[#E08297]',
                        primaryHover: 'hover:bg-[#CC6F84]',
                        accent: 'text-[#E08297]',
                        bgMain: 'bg-[#FFF6F6]',
                        bgCard: 'bg-white',
                        textPrimary: 'text-[#5C2E37]',
                        textAccent: 'text-[#A34E5F]',
                        borderColor: 'border-[#FFDFE4]'
                      })}
                      className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 hover:border-slate-700 flex items-center space-x-3 text-left cursor-pointer"
                    >
                      <div className="flex -space-x-1 shrink-0">
                        <div className="w-4 h-4 rounded-full bg-[#E08297]" />
                        <div className="w-4 h-4 rounded-full bg-[#FFF6F6] border border-gray-300" />
                        <div className="w-4 h-4 rounded-full bg-[#5C2E37]" />
                      </div>
                      <div className="truncate">
                        <span className="text-[10px] font-bold text-slate-200 block">Sakura Chic</span>
                        <span className="text-[9px] text-slate-500 block">Rosa chicle, dulce, fresco</span>
                      </div>
                    </button>

                    {/* Palette 2 */}
                    <button
                      onClick={() => handleUpdateProfileField('colorTheme', {
                        primary: 'bg-[#1e4620]',
                        primaryHover: 'hover:bg-[#153116]',
                        accent: 'text-[#1e4620]',
                        bgMain: 'bg-[#F4F7F4]',
                        bgCard: 'bg-white',
                        textPrimary: 'text-[#112412]',
                        textAccent: 'text-[#2e5e31]',
                        borderColor: 'border-[#E0EDE0]'
                      })}
                      className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 hover:border-slate-700 flex items-center space-x-3 text-left cursor-pointer"
                    >
                      <div className="flex -space-x-1 shrink-0">
                        <div className="w-4 h-4 rounded-full bg-[#1e4620]" />
                        <div className="w-4 h-4 rounded-full bg-[#F4F7F4] border border-gray-300" />
                        <div className="w-4 h-4 rounded-full bg-[#112412]" />
                      </div>
                      <div className="truncate">
                        <span className="text-[10px] font-bold text-slate-200 block">Emerald Luxury</span>
                        <span className="text-[9px] text-slate-500 block">Verde imperial, sofisticado</span>
                      </div>
                    </button>

                    {/* Palette 3 */}
                    <button
                      onClick={() => handleUpdateProfileField('colorTheme', {
                        primary: 'bg-[#A68064]',
                        primaryHover: 'hover:bg-[#8F6C52]',
                        accent: 'text-[#A68064]',
                        bgMain: 'bg-[#FAF7F2]',
                        bgCard: 'bg-white',
                        textPrimary: 'text-[#4A3425]',
                        textAccent: 'text-[#7D5F48]',
                        borderColor: 'border-[#F0E6D8]'
                      })}
                      className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 hover:border-slate-700 flex items-center space-x-3 text-left cursor-pointer"
                    >
                      <div className="flex -space-x-1 shrink-0">
                        <div className="w-4 h-4 rounded-full bg-[#A68064]" />
                        <div className="w-4 h-4 rounded-full bg-[#FAF7F2] border border-gray-300" />
                        <div className="w-4 h-4 rounded-full bg-[#4A3425]" />
                      </div>
                      <div className="truncate">
                        <span className="text-[10px] font-bold text-slate-200 block">Boho Terracota</span>
                        <span className="text-[9px] text-slate-500 block">Tierra, madera, orgánico</span>
                      </div>
                    </button>

                    {/* Palette 4 */}
                    <button
                      onClick={() => handleUpdateProfileField('colorTheme', {
                        primary: 'bg-[#E5A9B4]',
                        primaryHover: 'hover:bg-[#D498A3]',
                        accent: 'text-[#E5A9B4]',
                        bgMain: 'bg-[#111115]',
                        bgCard: 'bg-[#18181F]',
                        textPrimary: 'text-[#FFFFFF]',
                        textAccent: 'text-[#FFD2D9]',
                        borderColor: 'border-[#25252D]'
                      })}
                      className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 hover:border-slate-700 flex items-center space-x-3 text-left cursor-pointer"
                    >
                      <div className="flex -space-x-1 shrink-0">
                        <div className="w-4 h-4 rounded-full bg-[#E5A9B4]" />
                        <div className="w-4 h-4 rounded-full bg-[#111115] border border-gray-700" />
                        <div className="w-4 h-4 rounded-full bg-[#FFFFFF]" />
                      </div>
                      <div className="truncate">
                        <span className="text-[10px] font-bold text-slate-200 block">Midnight Rose Gold</span>
                        <span className="text-[9px] text-slate-500 block">Oscuro élite, oro rosa</span>
                      </div>
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-6">
                <span className="text-xs font-bold tracking-widest text-pink-400 uppercase block border-b border-slate-800 pb-2">
                  DATOS BÁSICOS DE {activeSalon.name}
                </span>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-300">
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Nombre Comercial de la Sucursal</label>
                    <input 
                      type="text" 
                      value={activeSalon.name}
                      onChange={(e) => handleUpdateProfileField('name', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white font-bold focus:outline-none focus:border-pink-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Eslogan / Mensaje de Bienvenida</label>
                    <input 
                      type="text" 
                      value={activeSalon.slogan}
                      onChange={(e) => handleUpdateProfileField('slogan', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white italic focus:outline-none focus:border-pink-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Dirección Física</label>
                    <input 
                      type="text" 
                      value={activeSalon.address}
                      onChange={(e) => handleUpdateProfileField('address', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-pink-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Teléfono / WhatsApp de Contacto</label>
                    <input 
                      type="text" 
                      value={activeSalon.phone || "+54 9 "}
                      onChange={(e) => handleUpdateProfileField('phone', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-pink-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="flex items-center gap-2.5 cursor-pointer select-none bg-slate-900/60 border border-slate-800 rounded-xl p-3">
                      <input
                        type="checkbox"
                        checked={!!activeSalon.referralEnabled}
                        onChange={(e) => onUpdateSalon({ ...activeSalon, referralEnabled: e.target.checked })}
                        className="w-4 h-4 accent-pink-500"
                      />
                      <span className="text-slate-200 font-semibold text-sm">🎟️ Mostrar botón de <strong>Referidos</strong> en la página pública</span>
                    </label>
                  </div>

                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">E-mail Administrativo</label>
                    <input 
                      type="email" 
                      value={activeSalon.email}
                      onChange={(e) => handleUpdateProfileField('email', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-pink-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Icono / Logo Representativo</label>
                    <input 
                      type="text" 
                      value={activeSalon.logo}
                      onChange={(e) => handleUpdateProfileField('logo', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white text-center text-lg focus:outline-none focus:border-pink-500 font-bold"
                    />
                  </div>

                  <div className="md:col-span-2 space-y-3 pt-2">
                    <label className="block text-slate-400 font-semibold">Imagen de Portada / Local</label>
                    <input 
                      type="text" 
                      value={activeSalon.coverImage || ''}
                      onChange={(e) => handleUpdateProfileField('coverImage', e.target.value)}
                      placeholder="Pegar dirección de imagen (URL)"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white text-xs focus:outline-none focus:border-pink-500 font-mono"
                    />

                    {/* Pre-selected Luxury Salon defaults */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">O elegir una de nuestras portadas premium:</span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {[
                          { name: '🌸 Manicuria Chic', url: 'https://images.unsplash.com/photo-1604654894610-df4906b197ae?auto=format&fit=crop&q=80&w=800' },
                          { name: '🌿 Spa Orgánico', url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=800' },
                          { name: '✨ Luxury Lounge', url: 'https://images.unsplash.com/photo-1519014816548-bf5fe059798b?auto=format&fit=crop&q=80&w=800' },
                          { name: '⚡ Glam Studio', url: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=80&w=800' },
                        ].map((img) => (
                          <button
                            key={img.name}
                            type="button"
                            onClick={() => handleUpdateProfileField('coverImage', img.url)}
                            className={`relative h-16 rounded-xl overflow-hidden border-2 transition-all text-left cursor-pointer group ${
                              activeSalon.coverImage === img.url ? 'border-pink-500 scale-95 ring-2 ring-pink-500/20' : 'border-slate-800 hover:border-slate-700'
                            }`}
                          >
                            <img src={img.url} alt={img.name} className="w-full h-full object-cover filter brightness-75 group-hover:scale-110 transition-transform duration-300" referrerPolicy="no-referrer" />
                            <div className="absolute inset-0 bg-black/30 flex items-end p-1.5">
                              <span className="text-[8px] font-black text-white uppercase tracking-wider truncate w-full">{img.name}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs rounded-xl flex items-start space-x-2">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <span>
                    <strong>Atención Inquilino:</strong> Al guardar o modificar cualquier campo anterior, la base de datos local guardará la información y se reflejará en tiempo real tanto en el panel como en la pantalla pública de reservas.
                  </span>
                </div>

                {currentUser?.role === 'admin' && onListBackups && (
                  <div className="p-5 bg-white border border-rose-100 rounded-2xl space-y-4 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2"><span>🛟</span> Copias de seguridad</h3>
                        <p className="text-[11px] text-slate-500">Si borrás algo por error, restaurá una versión anterior de tu salón. Se guardan solas cada vez que hay cambios (se conservan las últimas 10).</p>
                      </div>
                      <button type="button" onClick={cargarBackups} disabled={backupsBusy}
                        className="shrink-0 bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold px-4 py-2 rounded-xl disabled:opacity-60 cursor-pointer">
                        {backupsBusy ? 'Cargando…' : (backupsOpen ? 'Actualizar' : 'Ver copias')}
                      </button>
                    </div>

                    {backupsOpen && (
                      backups.length === 0 ? (
                        <p className="text-[11px] text-slate-400 italic">Todavía no hay copias guardadas. Se generan automáticamente cada vez que guardás cambios.</p>
                      ) : (
                        <div className="space-y-2 max-h-72 overflow-auto pr-1">
                          {backups.map((b: any) => (
                            <div key={b.id} className="flex items-center justify-between gap-3 bg-rose-50/60 border border-rose-100 rounded-xl p-3">
                              <div className="text-xs text-slate-600">
                                <span className="font-mono block text-slate-800">{new Date(b.guardado).toLocaleString()}</span>
                                <span className="text-[10px] text-slate-400 font-mono">{b.servicios} servicios · {b.turnos} turnos · {b.clientes} clientes</span>
                              </div>
                              <button type="button" onClick={() => restaurarBackup(b.id)} disabled={backupsBusy}
                                className="shrink-0 text-[10px] font-semibold px-3 py-1.5 rounded-lg bg-white hover:bg-rose-100 text-rose-600 border border-rose-200 disabled:opacity-60 cursor-pointer">
                                Restaurar
                              </button>
                            </div>
                          ))}
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: RESEÑAS */}
          {activeTab === 'reseñas' && currentUser?.role === 'admin' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="border-b border-slate-800 pb-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2"><span>🌟</span> Opiniones de clientes</h3>
                <p className="text-xs text-slate-400">Aprobá las opiniones que dejan tus clientes para mostrarlas en la página pública.</p>
              </div>
              <div className="p-5 bg-white border border-rose-100 rounded-2xl space-y-3 shadow-sm">
                {(() => {
                  const revs = (activeSalon.reviews as any[]) || [];
                  const pend = revs.filter((r: any) => !r.approved);
                  const aprob = revs.filter((r: any) => r.approved);
                  if (revs.length === 0) return <p className="text-[11px] text-slate-400 italic">Todavía no hay opiniones cargadas.</p>;
                  return (
                    <div className="space-y-3">
                      {pend.length > 0 && (
                        <div className="space-y-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500">Pendientes ({pend.length})</span>
                          {pend.map((r: any) => (
                            <div key={r.id} className="bg-amber-50 border border-amber-100 rounded-xl p-3 space-y-1.5">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-xs font-bold text-slate-700">{r.name} <span className="text-amber-500">{'★'.repeat(Math.max(1, Math.min(5, r.rating || 5)))}</span></span>
                                <span className="text-[10px] text-slate-400 shrink-0">{r.date ? new Date(r.date).toLocaleDateString() : ''}</span>
                              </div>
                              <p className="text-[11px] text-slate-600 italic">“{r.text}”</p>
                              <div className="flex gap-2 justify-end">
                                <button onClick={() => onUpdateSalon({ ...activeSalon, reviews: ((activeSalon.reviews as any[]) || []).map((x: any) => x.id === r.id ? { ...x, approved: true } : x) })} className="text-[10px] font-bold px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white cursor-pointer">✓ Aprobar</button>
                                <button onClick={() => onUpdateSalon({ ...activeSalon, reviews: ((activeSalon.reviews as any[]) || []).filter((x: any) => x.id !== r.id) })} className="text-[10px] font-bold px-3 py-1 rounded-lg bg-white border border-red-200 text-red-500 hover:bg-red-50 cursor-pointer">🗑️ Borrar</button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      {aprob.length > 0 && (
                        <div className="space-y-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-500">Publicadas ({aprob.length})</span>
                          {aprob.map((r: any) => (
                            <div key={r.id} className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex items-center justify-between gap-2">
                              <div className="min-w-0">
                                <span className="text-xs font-bold text-slate-700 block truncate">{r.name} <span className="text-amber-500">{'★'.repeat(Math.max(1, Math.min(5, r.rating || 5)))}</span></span>
                                <p className="text-[11px] text-slate-500 italic truncate">“{r.text}”</p>
                              </div>
                              <button onClick={() => onUpdateSalon({ ...activeSalon, reviews: ((activeSalon.reviews as any[]) || []).filter((x: any) => x.id !== r.id) })} className="shrink-0 text-[10px] font-bold px-3 py-1 rounded-lg bg-white border border-red-200 text-red-500 hover:bg-red-50 cursor-pointer">🗑️</button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* TAB 6: COLABORADORES */}
          {activeTab === 'collaborators' && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h3 className="text-xl font-bold text-white">Gestión de Colaboradores (Staff)</h3>
                <p className="text-xs text-slate-400">
                  Agregá colaboradores y creá sus credenciales de acceso. Ellos podrán iniciar sesión con su propio usuario para ver únicamente la agenda reducida de citas, sin acceso a finanzas o configuraciones.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* 1. Add Collaborator Form */}
                <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-pink-400 border-b border-slate-800 pb-2 flex items-center gap-2">
                    <span>➕</span> REGISTRAR COLABORADOR
                  </h4>

                  {colSuccessMsg && (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl font-bold animate-pulse">
                      ✓ {colSuccessMsg}
                    </div>
                  )}

                  <form onSubmit={handleAddCollaborator} className="space-y-4 text-xs text-slate-300">
                    <div className="space-y-1">
                      <label className="block text-slate-400 font-semibold">Nombre Completo</label>
                      <input 
                        type="text" 
                        value={newColName}
                        onChange={(e) => setNewColName(e.target.value)}
                        placeholder="Ej. Sofía manicurista"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-pink-500 font-medium"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-slate-400 font-semibold">Usuario de Acceso</label>
                      <input 
                        type="text" 
                        value={newColUsername}
                        onChange={(e) => setNewColUsername(e.target.value)}
                        placeholder="Ej. sofia.nails (todo en minúsculas)"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-pink-500 font-mono text-xs"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-slate-400 font-semibold">Contraseña</label>
                      <input 
                        type="text" 
                        value={newColPassword}
                        onChange={(e) => setNewColPassword(e.target.value)}
                        placeholder="Contraseña segura"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-pink-500 font-mono text-xs"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3.5 bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-slate-950 font-black text-[11px] uppercase tracking-wider rounded-xl shadow-md transition-all transform active:scale-95 cursor-pointer"
                    >
                      Registrar Colaborador
                    </button>
                  </form>
                </div>

                {/* 2. Collaborators List */}
                <div className="lg:col-span-2 bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-pink-400 border-b border-slate-800 pb-2 flex items-center gap-2">
                    <span>👥</span> COLABORADORES ACTUALES ({activeSalon.name})
                  </h4>

                  {(!activeSalon.collaborators || activeSalon.collaborators.length === 0) ? (
                    <div className="text-center py-12 space-y-2">
                      <span className="text-4xl block">🔍</span>
                      <p className="text-xs text-slate-400 font-semibold">Aún no has registrado ningún colaborador en esta sucursal.</p>
                      <p className="text-[10px] text-slate-500">Usa el formulario de la izquierda para agregar tu primer staff.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs text-slate-300">
                        <thead>
                          <tr className="border-b border-slate-800 text-slate-400 uppercase text-[9px] font-bold tracking-wider">
                            <th className="py-3 px-4">Nombre</th>
                            <th className="py-3 px-4">Usuario</th>
                            <th className="py-3 px-4">Contraseña</th>
                            <th className="py-3 px-4 text-right">Acciones</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                          {activeSalon.collaborators.map((col) => {
                            const isEditing = editingCollaboratorId === col.id;
                            return (
                              <tr key={col.id} className="hover:bg-slate-900/40 transition-colors">
                                {isEditing ? (
                                  <>
                                    <td className="py-2 px-4">
                                      <input
                                        type="text"
                                        value={editColName}
                                        onChange={(e) => setEditColName(e.target.value)}
                                        className="bg-slate-900 border border-slate-700 text-white text-xs rounded-lg p-2 w-full font-bold focus:outline-none focus:border-pink-500"
                                      />
                                    </td>
                                    <td className="py-2 px-4">
                                      <input
                                        type="text"
                                        value={editColUsername}
                                        onChange={(e) => setEditColUsername(e.target.value)}
                                        className="bg-slate-900 border border-slate-700 text-pink-400 font-mono text-xs rounded-lg p-2 w-full focus:outline-none focus:border-pink-500"
                                      />
                                    </td>
                                    <td className="py-2 px-4">
                                      <input
                                        type="text"
                                        value={editColPassword}
                                        onChange={(e) => setEditColPassword(e.target.value)}
                                        className="bg-slate-900 border border-slate-700 text-white font-mono text-xs rounded-lg p-2 w-full focus:outline-none focus:border-pink-500"
                                      />
                                    </td>
                                    <td className="py-2 px-4 text-right space-x-2 whitespace-nowrap">
                                      <button
                                        onClick={() => handleSaveCollaborator(col.id)}
                                        className="text-[10px] bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 font-bold px-2.5 py-1.5 rounded-lg border border-emerald-500/30 transition-all cursor-pointer"
                                      >
                                        Guardar
                                      </button>
                                      <button
                                        onClick={() => setEditingCollaboratorId(null)}
                                        className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-2.5 py-1.5 rounded-lg border border-slate-700 transition-all cursor-pointer"
                                      >
                                        Cancelar
                                      </button>
                                    </td>
                                  </>
                                ) : (
                                  <>
                                    <td className="py-3.5 px-4 font-bold text-white">{col.name}</td>
                                    <td className="py-3.5 px-4 font-mono text-pink-400">{col.username}</td>
                                    <td className="py-3.5 px-4 font-mono text-slate-400">{col.password}</td>
                                    <td className="py-3.5 px-4 text-right">
                                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                                        <button
                                          onClick={() => handleStartEditCollaborator(col)}
                                          className="text-[10px] bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 font-bold px-2 py-1 rounded-lg border border-amber-500/20 hover:border-amber-500/30 transition-all cursor-pointer"
                                        >
                                          ✏️ Editar
                                        </button>
                                        <button
                                          onClick={() => {
                                            if (confirm(`¿Estás seguro de que deseas cerrar la sesión activa de ${col.name}? Deberá volver a ingresar.`)) {
                                              handleForceLogoutCollaborator(col.id, col.name);
                                            }
                                          }}
                                          className="text-[10px] bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 font-bold px-2 py-1 rounded-lg border border-sky-500/20 hover:border-sky-500/30 transition-all cursor-pointer"
                                        >
                                          🔒 Cerrar Sesión
                                        </button>
                                        <button
                                          onClick={() => {
                                            if (confirm(`¿Estás seguro de que deseas eliminar a ${col.name}? No podrá volver a ingresar.`)) {
                                              handleDeleteCollaborator(col.id);
                                            }
                                          }}
                                          className="text-[10px] bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold px-2 py-1 rounded-lg border border-red-500/20 hover:border-red-500/30 transition-all cursor-pointer"
                                        >
                                          🗑️ Eliminar
                                        </button>
                                      </div>
                                    </td>
                                  </>
                                )}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

          {/* TAB 7: CATÁLOGO DE PRODUCTOS / PROMOS */}
          {activeTab === 'products_catalog' && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h3 className="text-xl font-bold text-white">Catálogo Premium (Promos, Destacados y Productos)</h3>
                <p className="text-xs text-slate-400">
                  Definí promociones combo, productos destacados y novedades de tu salón. Los clientes podrán verlos en tiempo real, agregarlos a su "carterita de compras" y encargar el pedido para retirar por sucursal con un código de retiro único.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* 1. Add/Edit Product Form */}
                <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4 h-fit">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-pink-400 border-b border-slate-800 pb-2 flex items-center gap-2">
                    <span>{editingProductId ? '✏️' : '➕'}</span> {editingProductId ? 'EDITAR ELEMENTO' : 'AGREGAR PROMO / PRODUCTO'}
                  </h4>

                  {colSuccessMsg && (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl font-bold animate-pulse">
                      ✓ {colSuccessMsg}
                    </div>
                  )}

                  <form onSubmit={handleSaveProduct} className="space-y-4 text-xs text-slate-300">
                    <div className="space-y-1">
                      <label className="block text-slate-400 font-semibold">Categoría</label>
                      <select
                        value={newProdCategory}
                        onChange={(e) => setNewProdCategory(e.target.value as any)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-pink-500 font-bold"
                      >
                        <option value="Promo">🌸 Promociones / Combos (Promo)</option>
                        <option value="Destacados">⭐ Destacados</option>
                        <option value="Lo más vistos">🔥 Lo más vistos</option>
                        <option value="Productos">🧴 Productos generales</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-slate-400 font-semibold font-bold">Nombre del Producto / Promo</label>
                      <input 
                        type="text" 
                        value={newProdName}
                        onChange={(e) => setNewProdName(e.target.value)}
                        placeholder="Ej. Combo Esculpidas + Spa de Pies"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white font-bold text-xs focus:outline-none focus:border-pink-500"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-slate-400 font-semibold font-bold">Precio ($ ARS)</label>
                      <input 
                        type="number" 
                        value={newProdPrice}
                        onChange={(e) => setNewProdPrice(e.target.value)}
                        placeholder="Ej. 18500"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white font-mono text-xs focus:outline-none focus:border-pink-500 font-bold"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-slate-400 font-semibold font-bold">Detalle / Descripción</label>
                      <textarea 
                        value={newProdDesc}
                        onChange={(e) => setNewProdDesc(e.target.value)}
                        placeholder="Describí brevemente qué incluye, los beneficios o modos de uso..."
                        rows={3}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white text-xs focus:outline-none focus:border-pink-500 font-medium"
                      />
                    </div>

                    {/* Image Options */}
                    <div className="space-y-2 border-t border-slate-800/60 pt-3">
                      <label className="block text-slate-400 font-semibold font-bold">Imagen del Producto</label>
                      
                      {/* URL input */}
                      <input 
                        type="text" 
                        value={newProdImage}
                        onChange={(e) => setNewProdImage(e.target.value)}
                        placeholder="Pegar URL de la imagen..."
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white font-mono text-[10px] focus:outline-none focus:border-pink-500"
                      />

                      {/* PC/Mobile File Input */}
                      <div className="flex items-center space-x-2">
                        <label className="flex-1 flex flex-col items-center justify-center py-2 border-2 border-dashed border-slate-800 hover:border-pink-500/50 bg-slate-900/40 hover:bg-slate-900 rounded-xl cursor-pointer transition-all">
                          <span className="text-[10px] text-pink-400 font-bold">📁 Subir desde PC / Móvil</span>
                          <span className="text-[8px] text-slate-500 mt-0.5">Capturar foto o elegir de galería</span>
                          <input 
                            type="file" 
                            accept="image/*" 
                            onChange={(e) => handleImageUpload(e, setNewProdImage)}
                            className="hidden" 
                          />
                        </label>

                        {newProdImage && (
                          <div className="w-12 h-12 rounded-xl overflow-hidden border border-slate-800 shrink-0">
                            <img src={newProdImage} alt="Preview" className="w-full h-full object-cover" />
                          </div>
                        )}
                      </div>

                      {/* Quick pre-select luxury defaults */}
                      <div className="space-y-1 pt-1">
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">O USAR DE NUESTRA BIBLIOTECA:</span>
                        <div className="grid grid-cols-4 gap-2">
                          {[
                            'https://images.unsplash.com/photo-1604654894610-df4906b197ae?auto=format&fit=crop&q=80&w=300',
                            'https://images.unsplash.com/photo-1519014816548-bf5fe059798b?auto=format&fit=crop&q=80&w=300',
                            'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=300',
                            'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=80&w=300'
                          ].map((url, index) => (
                            <button
                              key={index}
                              type="button"
                              onClick={() => setNewProdImage(url)}
                              className={`h-10 rounded-lg overflow-hidden border-2 transition-all ${
                                newProdImage === url ? 'border-pink-500 scale-90' : 'border-slate-800 hover:border-slate-700'
                              }`}
                            >
                              <img src={url} alt="preset" className="w-full h-full object-cover" />
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Dynamic Compos Customizer */}
                    <div className="space-y-2 border-t border-slate-800/60 pt-3">
                      <div className="flex items-center justify-between">
                        <label className="block text-slate-400 font-semibold font-bold">Compos (Componentes / Incluye)</label>
                        <span className="text-[9px] bg-pink-500/10 text-pink-400 px-1.5 py-0.5 rounded-full font-bold">Combo Builder</span>
                      </div>
                      
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          value={newCompText}
                          onChange={(e) => setNewCompText(e.target.value)}
                          placeholder="Ej. Esmalte Semipermanente"
                          className="flex-1 bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white text-xs focus:outline-none focus:border-pink-500"
                        />
                        <button
                          type="button"
                          onClick={handleAddCompToDraft}
                          className="bg-pink-500 hover:bg-pink-600 text-slate-950 font-black px-3 rounded-xl transition-colors cursor-pointer text-sm"
                        >
                          +
                        </button>
                      </div>

                      {newProdComponents.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1.5 bg-slate-900/50 p-2 rounded-xl border border-slate-900">
                          {newProdComponents.map((comp, i) => (
                            <span 
                              key={i} 
                              className="text-[9px] bg-slate-800 text-slate-300 font-bold pl-2.5 pr-1.5 py-1 rounded-lg border border-slate-750 flex items-center gap-1 hover:border-red-500/50 transition-colors group"
                            >
                              <span>{comp}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveCompFromDraft(i)}
                                className="w-4 h-4 bg-slate-950 rounded text-slate-500 group-hover:text-red-400 font-bold flex items-center justify-center text-[8px]"
                              >
                                ✕
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="pt-2 flex space-x-2">
                      <button
                        type="submit"
                        className="flex-1 py-3 bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-slate-950 font-black text-[11px] uppercase tracking-wider rounded-xl shadow-md transition-all transform active:scale-95 cursor-pointer"
                      >
                        {editingProductId ? 'Guardar Cambios' : 'Registrar Producto'}
                      </button>

                      {editingProductId && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingProductId(null);
                            setNewProdName('');
                            setNewProdDesc('');
                            setNewProdPrice('');
                            setNewProdCategory('Productos');
                            setNewProdImage('');
                            setNewProdComponents([]);
                            setNewCompText('');
                          }}
                          className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold uppercase tracking-wider rounded-xl text-[10px] cursor-pointer"
                        >
                          Cancelar
                        </button>
                      )}
                    </div>
                  </form>
                </div>

                {/* 2. Products Grid / List */}
                <div className="lg:col-span-2 bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-pink-400 border-b border-slate-800 pb-2 flex items-center gap-2">
                    <span>🛍️</span> ELEMENTOS ACTUALES EN EL CATÁLOGO ({activeSalon.products?.length || 0})
                  </h4>

                  {(!activeSalon.products || activeSalon.products.length === 0) ? (
                    <div className="text-center py-20 space-y-3">
                      <span className="text-5xl block">🛒</span>
                      <p className="text-xs text-slate-400 font-bold">Aún no has agregado productos, combos o promociones en esta sucursal.</p>
                      <p className="text-[10px] text-slate-500 max-w-md mx-auto">Completá el formulario de la izquierda y seleccioná si es una <strong>Promo</strong>, un <strong>Destacado</strong>, <strong>Lo más visto</strong> o un <strong>Producto</strong> para que aparezca en la tienda de tu web pública.</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {['Promo', 'Destacados', 'Lo más vistos', 'Productos'].map((cat) => {
                        const list = activeSalon.products?.filter(p => p.category === cat) || [];
                        if (list.length === 0) return null;
                        return (
                          <div key={cat} className="space-y-3 border-b border-slate-900 pb-5 last:border-none">
                            <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-pink-500"></span>
                              <span>{cat === 'Promo' ? '🔥 Promociones & Combos' : cat}</span>
                              <span className="text-[9px] bg-slate-900 text-slate-400 px-2 py-0.5 rounded-full border border-slate-850 font-bold">{list.length}</span>
                            </h5>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              {list.map((prod) => (
                                <div key={prod.id} className="bg-slate-900/60 p-4 rounded-xl border border-slate-800/80 flex gap-3 relative hover:border-slate-700 transition-all group">
                                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-slate-950 border border-slate-850 shrink-0">
                                    <img src={prod.image} alt={prod.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" referrerPolicy="no-referrer" />
                                  </div>

                                  <div className="flex-1 min-w-0 space-y-1">
                                    <div className="flex items-start justify-between gap-1">
                                      <h6 className="font-bold text-white text-xs truncate">{prod.name}</h6>
                                      <span className="text-pink-400 font-black font-mono text-xs shrink-0">${prod.price.toLocaleString('es-AR')}</span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-medium line-clamp-2">{prod.description || 'Sin descripción.'}</p>
                                    
                                    {prod.components && prod.components.length > 0 && (
                                      <div className="flex flex-wrap gap-1 pt-1.5">
                                        {prod.components.map((comp, idx) => (
                                          <span key={idx} className="text-[7.5px] font-bold uppercase tracking-wider bg-pink-500/10 text-pink-400 px-1.5 py-0.5 rounded-md border border-pink-500/10">
                                            {comp}
                                          </span>
                                        ))}
                                      </div>
                                    )}

                                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800/40 mt-2">
                                      <button
                                        onClick={() => handleStartEditProduct(prod)}
                                        className="text-[9px] text-amber-400 hover:bg-amber-400/10 px-2 py-1 rounded-md border border-amber-400/20 transition-colors cursor-pointer font-bold flex items-center gap-1"
                                      >
                                        ✏️ Editar
                                      </button>
                                      <button
                                        onClick={() => {
                                          if (confirm(`¿Estás seguro de que deseas eliminar ${prod.name}?`)) {
                                            handleDeleteProduct(prod.id);
                                          }
                                        }}
                                        className="text-[9px] text-red-400 hover:bg-red-400/10 px-2 py-1 rounded-md border border-red-400/20 transition-colors cursor-pointer font-bold flex items-center gap-1"
                                      >
                                        🗑️ Eliminar
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

          {/* TAB: GESTIÓN DE SERVICIOS */}
          {activeTab === 'services_catalog' && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h3 className="text-xl font-bold text-white">Catálogo de Servicios</h3>
                <p className="text-xs text-slate-400">
                  Agregá, editá y organizá los servicios de tu salón (manicuría, esculpidas, spa, pestañas, etc). Definí su precio, duración, detalles e incluyé campos dinámicos personalizados con el botón (+).
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* 1. Add/Edit Service Form */}
                <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4 h-fit">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-pink-400 border-b border-slate-800 pb-2 flex items-center gap-2">
                    <span>{editingServiceId ? '✏️' : '➕'}</span> {editingServiceId ? 'EDITAR SERVICIO' : 'AGREGAR NUEVO SERVICIO'}
                  </h4>

                  {colSuccessMsg && (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl font-bold animate-pulse">
                      ✓ {colSuccessMsg}
                    </div>
                  )}

                  <form onSubmit={handleSaveService} className="space-y-4 text-xs text-slate-300">
                    <div className="space-y-1">
                      <label className="block text-slate-400 font-semibold">Categoría de la Pestaña</label>
                      <select
                        value={newSerCategory}
                        onChange={(e) => setNewSerCategory(e.target.value as any)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-pink-500 font-bold"
                      >
                        <option value="Servicios">💅 Servicios Principales</option>
                        <option value="Nuevos">✨ Nuevos Lanzamientos</option>
                        <option value="Elegidos">⭐ Los Elegidos</option>
                        <option value="Galería">📸 Galería de Trabajo</option>
                        <option value="Promos">🎁 Promociones Especiales</option>
                        <option value="Ofertas">🔥 Ofertas del Mes</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-slate-400 font-semibold font-bold">Nombre del Servicio</label>
                      <input 
                        type="text" 
                        value={newSerName}
                        onChange={(e) => setNewSerName(e.target.value)}
                        placeholder="Ej. Uñas Esculpidas en Gel Premium"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white font-bold text-xs focus:outline-none focus:border-pink-500"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="block text-slate-400 font-semibold font-bold">Precio ($ ARS)</label>
                        <input 
                          type="number" 
                          value={newSerPrice}
                          onChange={(e) => setNewSerPrice(e.target.value)}
                          placeholder="Ej. 12000"
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white font-mono text-xs focus:outline-none focus:border-pink-500 font-bold"
                          required
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-slate-400 font-semibold font-bold">Duración (Minutos)</label>
                        <input 
                          type="number" 
                          value={newSerDuration}
                          onChange={(e) => setNewSerDuration(e.target.value)}
                          placeholder="Ej. 60"
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white font-mono text-xs focus:outline-none focus:border-pink-500 font-bold"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-slate-400 font-semibold font-bold">Detalle / Descripción</label>
                      <textarea 
                        value={newSerDesc}
                        onChange={(e) => setNewSerDesc(e.target.value)}
                        placeholder="Describí brevemente en qué consiste el servicio, materiales que usás..."
                        rows={3}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white text-xs focus:outline-none focus:border-pink-500 font-medium"
                      />
                    </div>

                    {/* Image Options */}
                    <div className="space-y-2 border-t border-slate-800/60 pt-3">
                      <label className="block text-slate-400 font-semibold font-bold">Imagen de Portada del Servicio</label>
                      
                      {/* URL input */}
                      <input 
                        type="text" 
                        value={newSerImage}
                        onChange={(e) => setNewSerImage(e.target.value)}
                        placeholder="Pegar URL de la imagen..."
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white font-mono text-[10px] focus:outline-none focus:border-pink-500"
                      />

                      {/* File Input */}
                      <div className="flex items-center space-x-2">
                        <label className="flex-1 flex flex-col items-center justify-center py-2 border-2 border-dashed border-slate-800 hover:border-pink-500/50 bg-slate-900/40 hover:bg-slate-900 rounded-xl cursor-pointer transition-all">
                          <span className="text-[10px] text-pink-400 font-bold">📁 Subir desde PC / Móvil</span>
                          <span className="text-[8px] text-slate-500 mt-0.5">Capturar foto o elegir de galería</span>
                          <input 
                            type="file" 
                            accept="image/*" 
                            onChange={(e) => handleImageUpload(e, setNewSerImage)}
                            className="hidden" 
                          />
                        </label>

                        {newSerImage && (
                          <div className="w-12 h-12 rounded-xl overflow-hidden border border-slate-800 shrink-0">
                            <img src={newSerImage} alt="Preview" className="w-full h-full object-cover" />
                          </div>
                        )}
                      </div>

                      {/* Library suggestions */}
                      <div className="space-y-1 pt-1">
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">SUGERIDAS:</span>
                        <div className="grid grid-cols-4 gap-2">
                          {[
                            'https://images.unsplash.com/photo-1604654894610-df4906b197ae?auto=format&fit=crop&q=80&w=300',
                            'https://images.unsplash.com/photo-1632345031435-8797b2d58045?auto=format&fit=crop&q=80&w=300',
                            'https://images.unsplash.com/photo-1607779097040-26e80aa78e66?auto=format&fit=crop&q=80&w=300',
                            'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=300'
                          ].map((url, index) => (
                            <button
                              key={index}
                              type="button"
                              onClick={() => setNewSerImage(url)}
                              className={`h-10 rounded-lg overflow-hidden border-2 transition-all ${
                                newSerImage === url ? 'border-pink-500 scale-90' : 'border-slate-800 hover:border-slate-700'
                              }`}
                            >
                              <img src={url} alt="preset" className="w-full h-full object-cover" />
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Dynamic Bullet customizer */}
                    <div className="space-y-2 border-t border-slate-800/60 pt-3">
                      <div className="flex items-center justify-between">
                        <label className="block text-slate-400 font-semibold font-bold">Campos Extras / Características</label>
                        <span className="text-[9px] bg-pink-500/10 text-pink-400 px-1.5 py-0.5 rounded-full font-bold">Botón +</span>
                      </div>
                      
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          value={newSerCompText}
                          onChange={(e) => setNewSerCompText(e.target.value)}
                          placeholder="Ej. Duración 2 semanas intactas"
                          className="flex-1 bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white text-xs focus:outline-none focus:border-pink-500"
                        />
                        <button
                          type="button"
                          onClick={handleAddSerCompToDraft}
                          className="bg-pink-500 hover:bg-pink-600 text-slate-950 font-black px-3 rounded-xl transition-colors cursor-pointer text-sm"
                        >
                          +
                        </button>
                      </div>

                      {newSerComponents.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1.5 bg-slate-900/50 p-2 rounded-xl border border-slate-900">
                          {newSerComponents.map((comp, i) => (
                            <span 
                              key={i} 
                              className="text-[9px] bg-slate-800 text-slate-300 font-bold pl-2.5 pr-1.5 py-1 rounded-lg border border-slate-750 flex items-center gap-1 hover:border-red-500/50 transition-colors group"
                            >
                              <span>{comp}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveSerCompFromDraft(i)}
                                className="w-4 h-4 bg-slate-950 rounded text-slate-500 group-hover:text-red-400 font-bold flex items-center justify-center text-[8px]"
                              >
                                ✕
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="pt-2 flex space-x-2">
                      <button
                        type="submit"
                        className="flex-1 py-3 bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-slate-950 font-black text-[11px] uppercase tracking-wider rounded-xl shadow-md transition-all transform active:scale-95 cursor-pointer"
                      >
                        {editingServiceId ? 'Guardar Cambios' : 'Registrar Servicio'}
                      </button>

                      {editingServiceId && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingServiceId(null);
                            setNewSerName('');
                            setNewSerDesc('');
                            setNewSerPrice('');
                            setNewSerDuration('45');
                            setNewSerCategory('Servicios');
                            setNewSerImage('');
                            setNewSerComponents([]);
                            setNewSerCompText('');
                          }}
                          className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold uppercase tracking-wider rounded-xl text-[10px] cursor-pointer"
                        >
                          Cancelar
                        </button>
                      )}
                    </div>
                  </form>
                </div>

                {/* 2. Services Grid / List */}
                <div className="lg:col-span-2 bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-pink-400 border-b border-slate-800 pb-2 flex items-center gap-2">
                    <span>💅</span> SERVICIOS ACTIVOS ({activeSalon.services?.length || 0})
                  </h4>

                  {(!activeSalon.services || activeSalon.services.length === 0) ? (
                    <div className="text-center py-20 space-y-3">
                      <span className="text-5xl block">💅</span>
                      <p className="text-xs text-slate-400 font-bold">Aún no has agregado ningún servicio en esta sucursal.</p>
                      <p className="text-[10px] text-slate-500 max-w-md mx-auto">Completá el formulario de la izquierda para dar de alta tu primer servicio y definir su precio, duración, foto y características especiales.</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {['Servicios', 'Nuevos', 'Elegidos', 'Galería', 'Promos', 'Ofertas'].map((cat) => {
                        const list = activeSalon.services?.filter(s => s.category === cat) || [];
                        if (list.length === 0) return null;
                        return (
                          <div key={cat} className="space-y-3 border-b border-slate-900 pb-5 last:border-none">
                            <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-pink-500"></span>
                              <span>{cat === 'Servicios' ? '💅 Servicios Principales' : cat}</span>
                              <span className="text-[9px] bg-slate-900 text-slate-400 px-2 py-0.5 rounded-full border border-slate-850 font-bold">{list.length}</span>
                            </h5>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              {list.map((ser) => (
                                <div key={ser.id} className="bg-slate-900/60 p-4 rounded-xl border border-slate-800/80 flex gap-3 relative hover:border-slate-700 transition-all group">
                                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-slate-950 border border-slate-850 shrink-0">
                                    <img src={ser.image} alt={ser.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" referrerPolicy="no-referrer" />
                                  </div>

                                  <div className="flex-1 min-w-0 space-y-1">
                                    <div className="flex items-start justify-between gap-1">
                                      <h6 className="font-bold text-white text-xs truncate">{ser.name}</h6>
                                      <span className="text-pink-400 font-black font-mono text-xs shrink-0">${ser.price.toLocaleString('es-AR')}</span>
                                    </div>
                                    <div className="flex items-center text-[9px] text-slate-400 gap-1.5 font-medium">
                                      <span className="flex items-center gap-0.5">⏱️ {ser.durationMinutes || 45} min</span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-medium line-clamp-2">{ser.description || 'Sin descripción.'}</p>
                                    
                                    {ser.components && ser.components.length > 0 && (
                                      <div className="flex flex-wrap gap-1 pt-1.5">
                                        {ser.components.map((comp: string, idx: number) => (
                                          <span key={idx} className="text-[7.5px] font-bold uppercase tracking-wider bg-pink-500/10 text-pink-400 px-1.5 py-0.5 rounded-md border border-pink-500/10">
                                            {comp}
                                          </span>
                                        ))}
                                      </div>
                                    )}

                                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800/40 mt-2">
                                      <button
                                        onClick={() => handleStartEditService(ser)}
                                        className="text-[9px] text-amber-400 hover:bg-amber-400/10 px-2 py-1 rounded-md border border-amber-400/20 transition-colors cursor-pointer font-bold flex items-center gap-1"
                                      >
                                        ✏️ Editar
                                      </button>
                                      <button
                                        onClick={() => {
                                          if (confirm(`¿Estás seguro de que deseas eliminar el servicio ${ser.name}?`)) {
                                            handleDeleteService(ser.id);
                                          }
                                        }}
                                        className="text-[9px] text-red-400 hover:bg-red-400/10 px-2 py-1 rounded-md border border-red-400/20 transition-colors cursor-pointer font-bold flex items-center gap-1"
                                      >
                                        🗑️ Eliminar
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

          {/* TAB 8: PEDIDOS RECIBIDOS (TIENDA) */}
          {activeTab === 'orders_management' && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h3 className="text-xl font-bold text-white">Pedidos de la Tienda (Carterita)</h3>
                <p className="text-xs text-slate-400">
                  Controlá y gestioná las solicitudes de encargo realizadas por tus clientes. Cada cliente recibe un código único al enviar su carrito de compras para que pases a prepararlo y se lo entregues al retirar.
                </p>
              </div>

              <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-widest text-pink-400 border-b border-slate-800 pb-2 flex items-center gap-2">
                  <span>📥</span> HISTORIAL DE ENCARGOS POR TIENDA
                </h4>

                {(!activeSalon.orders || activeSalon.orders.length === 0) ? (
                  <div className="text-center py-24 space-y-3">
                    <span className="text-5xl block">📦</span>
                    <p className="text-xs text-slate-400 font-bold">Aún no se han recibido encargos por carterita.</p>
                    <p className="text-[10px] text-slate-500">Cuando tus clientes entren a la web pública, agreguen productos con el botón (+) y hagan clic en "Encargar", sus solicitudes aparecerán listadas aquí de inmediato.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400 uppercase text-[9px] font-bold tracking-wider">
                          <th className="py-3 px-4">Código / Fecha</th>
                          <th className="py-3 px-4">Cliente</th>
                          <th className="py-3 px-4">Productos Encargados</th>
                          <th className="py-3 px-4">Total</th>
                          <th className="py-3 px-4">Estado</th>
                          <th className="py-3 px-4 text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/40">
                        {[...activeSalon.orders].reverse().map((order) => {
                          const dateObj = new Date(order.createdAt);
                          const formattedDate = dateObj.toLocaleDateString('es-AR') + ' ' + dateObj.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
                          return (
                            <tr key={order.id} className="hover:bg-slate-900/30 transition-colors">
                              
                              {/* 1. Code and Date */}
                              <td className="py-4 px-4 space-y-1">
                                <span className="inline-block text-[10px] font-black font-mono bg-amber-500/10 text-amber-400 px-2 py-1 rounded-lg border border-amber-500/25">
                                  {order.pickupCode}
                                </span>
                                <span className="block text-[9px] text-slate-500">{formattedDate}</span>
                              </td>

                              {/* 2. Client Info */}
                              <td className="py-4 px-4 space-y-1">
                                <span className="block font-bold text-white text-xs">{order.clientName}</span>
                                <span className="block text-[10px] font-mono text-pink-400 hover:underline">
                                  <a href={`https://wa.me/${order.clientPhone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer">
                                    💬 {order.clientPhone}
                                  </a>
                                </span>
                              </td>

                              {/* 3. Items list */}
                              <td className="py-4 px-4">
                                <div className="space-y-1 max-w-xs">
                                  {order.items.map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-center bg-slate-900/40 px-2.5 py-1 rounded-lg border border-slate-850 text-[10px] text-slate-300">
                                      <span className="font-bold truncate mr-2">{item.name}</span>
                                      <span className="text-pink-400 font-bold shrink-0 font-mono">x{item.quantity}</span>
                                    </div>
                                  ))}
                                </div>
                              </td>

                              {/* 4. Total price */}
                              <td className="py-4 px-4 font-black font-mono text-white text-xs">
                                ${order.totalPrice.toLocaleString('es-AR')}
                              </td>

                              {/* 5. Status Badge */}
                              <td className="py-4 px-4">
                                <span className={`inline-block text-[9px] font-extrabold px-2 py-1 rounded-full border ${
                                  order.status === 'Pendiente' 
                                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' 
                                    : order.status === 'Entregado'
                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                    : 'bg-red-500/10 text-red-400 border-red-500/20'
                                }`}>
                                  {order.status}
                                </span>
                              </td>

                              {/* 6. Action buttons */}
                              <td className="py-4 px-4 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  {order.status === 'Pendiente' && (
                                    <>
                                      <button
                                        onClick={() => handleUpdateOrderStatus(order.id, 'Entregado')}
                                        className="text-[9px] bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 font-extrabold px-2 py-1.5 rounded-lg transition-all cursor-pointer"
                                      >
                                        ✓ Entregar
                                      </button>
                                      <button
                                        onClick={() => handleUpdateOrderStatus(order.id, 'Cancelado')}
                                        className="text-[9px] bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 font-extrabold px-2 py-1.5 rounded-lg transition-all cursor-pointer"
                                      >
                                        ✕ Cancelar
                                      </button>
                                    </>
                                  )}
                                  <button
                                    onClick={() => {
                                      if (confirm('¿Estás seguro de que deseas eliminar este registro de pedido de la base de datos?')) {
                                        handleDeleteOrder(order.id);
                                      }
                                    }}
                                    className="text-[9px] bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white font-bold p-1.5 rounded-lg border border-slate-700 transition-all cursor-pointer"
                                    title="Eliminar pedido"
                                  >
                                    🗑️
                                  </button>
                                </div>
                              </td>

                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

        </main>
      </div>

    </div>
  );
}
