import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  User, 
  Check, 
  ArrowLeft, 
  ArrowRight, 
  Sparkles, 
  Phone, 
  Mail, 
  Smile, 
  MessageSquare,
  QrCode,
  Share2,
  BookmarkCheck
} from 'lucide-react';
import { Salon, Service, Staff, Appointment } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface BookingWizardProps {
  salon: Salon;
  preSelectedService?: Service | null;
  onClose: () => void;
  onBookingComplete: (newBooking: Appointment) => void;
}

export default function BookingWizard({ 
  salon, 
  preSelectedService, 
  onClose, 
  onBookingComplete 
}: BookingWizardProps) {
  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState<Service | null>(preSelectedService || null);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  
  // Client Details
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('+54 9 ');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const isImageUrl = (img: string) => !!img && (img.startsWith('http') || img.startsWith('data:'));
  const [bookingCode, setBookingCode] = useState('');

  // Generation of next 7 days for selection
  const getNextDays = () => {
    const days = [];
    const weekdayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const today = new Date();
    
    for (let i = 1; i <= 10; i++) {
      const nextDate = new Date(today);
      nextDate.setDate(today.getDate() + i);
      
      // Skip Sundays if they are closed, but let's keep all or skip Sunday (0) for realism
      if (nextDate.getDay() === 0) continue; 
      
      const dayNum = nextDate.getDate();
      const monthNum = nextDate.getMonth() + 1;
      const formattedDate = `${nextDate.getFullYear()}-${String(monthNum).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      
      days.push({
        dateString: formattedDate,
        dayOfWeek: weekdayNames[nextDate.getDay()],
        dayNum: dayNum,
        monthName: nextDate.toLocaleString('es-ES', { month: 'short' }).toUpperCase()
      });
    }
    return days;
  };

  const nextDays = getNextDays();

  // Simulated available time slots
  const timeSlots = [
    '09:00', '10:00', '11:00', '12:00', '13:00', '14:30', '15:30', '16:30', '17:30', '18:30', '19:30'
  ];

  const handleNextStep = () => {
    if (step === 1 && !selectedService) return;
    if (step === 2 && !selectedStaff) return;
    if (step === 3 && (!selectedDate || !selectedTime)) return;
    setStep(prev => prev + 1);
  };

  const handlePrevStep = () => {
    setStep(prev => prev - 1);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !email) return;

    const codigo = 'BU-' + Math.random().toString(36).slice(2, 7).toUpperCase();
    setBookingCode(codigo);

    const newBooking: Appointment = {
      id: `apt-${Date.now()}`,
      salonId: salon.id,
      salonName: salon.name,
      clientName: name,
      clientPhone: phone,
      clientEmail: email,
      serviceId: selectedService?.id || '',
      serviceName: selectedService?.name || '',
      price: selectedService?.price || 0,
      staffId: selectedStaff?.id || '',
      staffName: selectedStaff?.name || '',
      date: selectedDate,
      time: selectedTime,
      status: 'Confirmado', // Real-time confirm for perfect UX
      notes: notes,
      createdAt: new Date().toISOString(),
      code: codigo
    };

    onBookingComplete(newBooking);
    setStep(5); // Show confirmation ticket
  };

  // Mensaje con el código del turno para el cliente
  const codigoMensaje = () =>
    `✅ *Turno confirmado en ${salon.name}*\n\n` +
    `🎟️ *Tu código:* ${bookingCode}\n` +
    `💅 *Servicio:* ${selectedService?.name}\n` +
    `👩‍🎨 *Profesional:* ${selectedStaff?.name}\n` +
    `📅 *Fecha:* ${selectedDate}\n` +
    `🕒 *Hora:* ${selectedTime} hs\n` +
    `📍 *Lugar:* ${salon.address}\n\n` +
    `Mostrá este código al llegar. ¡Nos vemos!`;
  const waCliente = () => `https://wa.me/${(phone || '').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(codigoMensaje())}`;
  const mailCliente = () => `mailto:${email}?subject=${encodeURIComponent('Tu turno en ' + salon.name)}&body=${encodeURIComponent(codigoMensaje())}`;

  return (
    <div id="booking-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div 
        className="relative w-full max-w-lg overflow-hidden rounded-3xl shadow-2xl transition-all duration-300"
        style={{ backgroundColor: 'white', border: `1px solid ${salon.colorTheme.borderColor}` }}
      >
        {/* Banner header inside modal */}
        <div className={`p-6 ${salon.colorTheme.primary} text-white flex justify-between items-center relative`}>
          <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
            {isImageUrl(salon.logo) ? (
              <img src={salon.logo} alt="" className="w-20 h-20 object-contain" referrerPolicy="no-referrer" />
            ) : (
              <span className="text-8xl font-black">{salon.logo}</span>
            )}
          </div>
          <div>
            <span className="text-xs tracking-wider uppercase font-semibold text-white/80">Reservar Turno</span>
            <h3 className="text-2xl font-bold font-sans tracking-tight">{salon.name}</h3>
          </div>
          <button 
            id="close-booking"
            onClick={onClose}
            className="p-2 text-white bg-white/20 hover:bg-white/30 rounded-full transition-colors focus:outline-none"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Step Indicator */}
        {step < 5 && (
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {[1, 2, 3, 4].map((s) => (
                <div 
                  key={s} 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    step === s 
                      ? `w-8 ${salon.colorTheme.primary}` 
                      : step > s 
                        ? `${salon.colorTheme.primary} opacity-50 w-2` 
                        : 'bg-gray-200 w-2'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
              Paso {step} de 4
            </span>
          </div>
        )}

        {/* Modal Body Container with animations */}
        <div className="p-6 max-h-[60vh] overflow-y-auto scrollbar-thin">
          <AnimatePresence mode="wait">
            {/* STEP 1: SERVICE SELECTION */}
            {step === 1 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div>
                  <h4 className={`text-lg font-bold ${salon.colorTheme.textPrimary} mb-1 flex items-center gap-2`}>
                    <Sparkles className="w-5 h-5 animate-pulse text-amber-500" />
                    Seleccioná tu servicio
                  </h4>
                  <p className="text-sm text-gray-500">¿Qué tratamiento te gustaría realizar hoy?</p>
                </div>

                <div className="space-y-3">
                  {salon.services.map((service) => (
                    <button
                      key={service.id}
                      onClick={() => setSelectedService(service)}
                      className={`w-full p-4 rounded-2xl border text-left flex justify-between items-center transition-all ${
                        selectedService?.id === service.id
                          ? `${salon.colorTheme.borderColor} bg-amber-50/20 ring-2 ring-offset-2 ring-[#E08297]`
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        {isImageUrl(service.image) ? (
                          <img src={service.image} alt={service.name} className="w-11 h-11 rounded-xl object-cover flex-shrink-0" referrerPolicy="no-referrer" />
                        ) : (
                          <span className="text-2xl p-2 bg-gray-100 rounded-xl">{service.image}</span>
                        )}
                        <div>
                          <div className="font-semibold text-gray-900 flex items-center gap-2">
                            {service.name}
                            {service.isNew && (
                              <span className="text-[10px] bg-pink-100 text-pink-700 px-2 py-0.5 rounded-full font-bold">
                                NUEVO
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{service.description}</p>
                          <div className="flex items-center space-x-3 mt-1.5 text-xs text-gray-400">
                            <span className="flex items-center">
                              <Clock className="w-3.5 h-3.5 mr-1" />
                              {service.durationMinutes} min
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <span className={`text-base font-bold ${salon.colorTheme.textAccent}`}>
                          ${service.price.toLocaleString('es-AR')}
                        </span>
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center mt-1 ml-auto ${
                          selectedService?.id === service.id 
                            ? `${salon.colorTheme.primary} border-transparent text-white` 
                            : 'border-gray-300'
                        }`}>
                          {selectedService?.id === service.id && <Check className="w-3 h-3" />}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* STEP 2: STAFF SELECTION */}
            {step === 2 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div>
                  <h4 className={`text-lg font-bold ${salon.colorTheme.textPrimary} mb-1 flex items-center gap-2`}>
                    <User className="w-5 h-5" />
                    Elegí a tu profesional
                  </h4>
                  <p className="text-sm text-gray-500">Nuestras artistas expertas están listas para embellecerte.</p>
                </div>

                <div className="space-y-3">
                  {/* Option for Any Professional */}
                  <button
                    onClick={() => setSelectedStaff({
                      id: 'any',
                      name: 'Cualquier Profesional disponible',
                      role: 'Te asignaremos a la artista disponible más rápida',
                      image: '✨',
                      rating: 5.0,
                      reviewsCount: 100,
                      specialty: 'Optimiza tu tiempo de espera'
                    })}
                    className={`w-full p-4 rounded-2xl border text-left flex justify-between items-center transition-all ${
                      selectedStaff?.id === 'any'
                        ? `${salon.colorTheme.borderColor} bg-amber-50/20 ring-2 ring-offset-2 ring-[#E08297]`
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-pink-400 to-amber-300 flex items-center justify-center text-xl text-white shadow-inner">
                        ✨
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">Cualquiera disponible</div>
                        <p className="text-xs text-gray-500">Asignación automática más rápida</p>
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                      selectedStaff?.id === 'any' 
                        ? `${salon.colorTheme.primary} border-transparent text-white` 
                        : 'border-gray-300'
                    }`}>
                      {selectedStaff?.id === 'any' && <Check className="w-3 h-3" />}
                    </div>
                  </button>

                  {salon.staff.map((staff) => (
                    <button
                      key={staff.id}
                      onClick={() => setSelectedStaff(staff)}
                      className={`w-full p-4 rounded-2xl border text-left flex justify-between items-center transition-all ${
                        selectedStaff?.id === staff.id
                          ? `${salon.colorTheme.borderColor} bg-amber-50/20 ring-2 ring-offset-2 ring-[#E08297]`
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        {isImageUrl(staff.image) ? (
                          <img src={staff.image} alt={staff.name} className="w-12 h-12 rounded-2xl object-cover flex-shrink-0" referrerPolicy="no-referrer" />
                        ) : (
                          <span className="text-3xl p-2 bg-pink-50 rounded-2xl">{staff.image}</span>
                        )}
                        <div>
                          <div className="font-semibold text-gray-900 flex items-center gap-1.5">
                            {staff.name}
                            <span className="text-xs text-amber-500 font-bold flex items-center">
                              ★ {staff.rating}
                            </span>
                          </div>
                          <p className="text-xs text-pink-600 font-medium">{staff.role}</p>
                          <p className="text-xs text-gray-500 mt-1">{staff.specialty}</p>
                        </div>
                      </div>
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                        selectedStaff?.id === staff.id 
                          ? `${salon.colorTheme.primary} border-transparent text-white` 
                          : 'border-gray-300'
                      }`}>
                        {selectedStaff?.id === staff.id && <Check className="w-3 h-3" />}
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* STEP 3: DATE & TIME SELECTION */}
            {step === 3 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div>
                  <h4 className={`text-lg font-bold ${salon.colorTheme.textPrimary} mb-1 flex items-center gap-2`}>
                    <Calendar className="w-5 h-5" />
                    Elegí Fecha y Hora
                  </h4>
                  <p className="text-sm text-gray-500">¿Cuándo te gustaría venir al salón?</p>
                </div>

                {/* Date Slider Horizontal */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Días Disponibles</span>
                  <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-thin snap-x">
                    {nextDays.map((d) => (
                      <button
                        key={d.dateString}
                        onClick={() => setSelectedDate(d.dateString)}
                        className={`flex-none w-16 py-3 rounded-2xl border text-center flex flex-col items-center justify-center transition-all snap-start ${
                          selectedDate === d.dateString
                            ? `${salon.colorTheme.primary} border-transparent text-white shadow-md transform scale-105`
                            : 'border-gray-200 hover:border-gray-300 bg-white text-gray-800'
                        }`}
                      >
                        <span className={`text-[10px] font-bold tracking-wider ${selectedDate === d.dateString ? 'text-white/80' : 'text-gray-400'}`}>
                          {d.dayOfWeek}
                        </span>
                        <span className="text-xl font-extrabold my-0.5">{d.dayNum}</span>
                        <span className={`text-[9px] font-bold ${selectedDate === d.dateString ? 'text-white/90' : 'text-gray-500'}`}>
                          {d.monthName}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Time Grid */}
                {selectedDate && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-2"
                  >
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Horarios Disponibles</span>
                    <div className="grid grid-cols-4 gap-2">
                      {timeSlots.map((time) => (
                        <button
                          key={time}
                          onClick={() => setSelectedTime(time)}
                          className={`py-2 px-3 rounded-xl border text-center font-mono text-sm font-semibold transition-all ${
                            selectedTime === time
                              ? `${salon.colorTheme.primary} border-transparent text-white shadow-sm`
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700 bg-white'
                          }`}
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* STEP 4: CLIENT INFORMATION FORM */}
            {step === 4 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div>
                  <h4 className={`text-lg font-bold ${salon.colorTheme.textPrimary} mb-1 flex items-center gap-2`}>
                    <Smile className="w-5 h-5 text-pink-500" />
                    Tus Datos de Contacto
                  </h4>
                  <p className="text-sm text-gray-500">Último paso para agendar tu cita y enviarte el recordatorio.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Nombre Completo</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Clara Domínguez"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#E08297] bg-white text-gray-900"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Celular / WhatsApp</label>
                      <input
                        type="tel"
                        required
                        placeholder="Ej. 11-3004-9988"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#E08297] bg-white text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">E-mail</label>
                      <input
                        type="email"
                        required
                        placeholder="ejemplo@gmail.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#E08297] bg-white text-gray-900"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Notas o Aclaraciones (Opcional)</label>
                    <textarea
                      placeholder="Ej. Deseo base de kapping un poco más gruesa, o prefiero decoración francesa clásica..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={2}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#E08297] bg-white text-gray-900 resize-none"
                    />
                  </div>

                  {/* Booking Brief Box */}
                  <div className="p-4 rounded-2xl bg-amber-50/40 border border-amber-100 flex justify-between items-center text-xs">
                    <div className="space-y-1">
                      <div className="font-bold text-gray-800 flex items-center">
                        <Check className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                        {selectedService?.name}
                      </div>
                      <div className="text-gray-500 flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {selectedDate} a las {selectedTime} hs ({selectedStaff?.name})
                      </div>
                    </div>
                    <span className="text-sm font-extrabold text-[#E08297]">
                      ${selectedService?.price.toLocaleString('es-AR')}
                    </span>
                  </div>

                  {/* Hidden Submit button triggered by footer */}
                  <button type="submit" id="hidden-submit-btn" className="hidden" />
                </form>
              </motion.div>
            )}

            {/* STEP 5: SUCCESS TICKET */}
            {step === 5 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-6 text-center py-4"
              >
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mb-3 animate-bounce">
                    <BookmarkCheck className="w-9 h-9" />
                  </div>
                  <h4 className="text-xl font-extrabold text-gray-900 tracking-tight">¡Turno Confirmado con Éxito!</h4>
                  <p className="text-xs text-gray-500 max-w-xs mx-auto mt-1">
                    Guardamos tu cita. Te enviamos un correo electrónico y el salón estará esperándote.
                  </p>
                </div>

                {/* Digital Ticket */}
                <div className="relative border border-gray-200 bg-gray-50 rounded-2xl p-5 text-left shadow-inner overflow-hidden max-w-sm mx-auto">
                  {/* Decorative Ticket Side Cuts */}
                  <div className="absolute top-1/2 -left-3 w-6 h-6 bg-white border border-gray-200 rounded-full -translate-y-1/2" />
                  <div className="absolute top-1/2 -right-3 w-6 h-6 bg-white border border-gray-200 rounded-full -translate-y-1/2" />

                  {/* Salon Header on Ticket */}
                  <div className="flex justify-between items-center border-b border-dashed border-gray-300 pb-3 mb-3">
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">SALÓN</span>
                      <h5 className={`font-bold text-sm ${salon.colorTheme.textPrimary}`}>{salon.name}</h5>
                    </div>
                    {isImageUrl(salon.logo) ? (
                      <img src={salon.logo} alt="" className="w-8 h-8 rounded-md object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <span className="text-2xl">{salon.logo}</span>
                    )}
                  </div>

                  {/* Ticket Details */}
                  <div className="space-y-2.5 text-xs text-gray-700">
                    <div className="flex justify-between">
                      <span className="text-gray-400 font-medium">Cliente:</span>
                      <span className="font-bold text-gray-950">{name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400 font-medium">Servicio:</span>
                      <span className="font-bold text-gray-950">{selectedService?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400 font-medium">Especialista:</span>
                      <span className="font-bold text-gray-950">{selectedStaff?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400 font-medium">Fecha y Hora:</span>
                      <span className="font-bold text-gray-950 font-mono">{selectedDate} @ {selectedTime} hs</span>
                    </div>
                    <div className="flex justify-between border-t border-dashed border-gray-200 pt-3 mt-3">
                      <span className="text-gray-400 font-bold">Monto a pagar:</span>
                      <span className={`font-extrabold text-sm ${salon.colorTheme.textAccent}`}>
                        ${selectedService?.price.toLocaleString('es-AR')}
                      </span>
                    </div>
                  </div>

                  {/* QR Code and Checkin */}
                  <div className="mt-4 flex items-center justify-between bg-white p-3 rounded-xl border border-gray-100">
                    <div>
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">CÓDIGO DE TURNO</span>
                      <span className="text-sm text-gray-900 font-mono font-black tracking-wider">{bookingCode}</span>
                    </div>
                    <div className="bg-gray-100 p-1.5 rounded-lg">
                      <QrCode className="w-7 h-7 text-gray-800" />
                    </div>
                  </div>
                </div>

                {/* Recibir el código: el cliente elige el canal */}
                <div className="flex flex-col gap-2 pt-2 max-w-xs mx-auto">
                  <p className="text-xs font-bold text-gray-500">📩 Recibí tu código por:</p>
                  <div className="grid grid-cols-2 gap-2">
                    <a
                      href={waCliente()}
                      target="_blank"
                      rel="noreferrer"
                      className="py-3 bg-[#25D366] hover:bg-[#1ebd59] text-white rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5 shadow-sm transition-all"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>WhatsApp</span>
                    </a>
                    <a
                      href={mailCliente()}
                      className="py-3 bg-sky-500 hover:bg-sky-600 text-white rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5 shadow-sm transition-all"
                    >
                      <span>✉️</span>
                      <span>Email</span>
                    </a>
                  </div>
                  <button 
                    onClick={onClose}
                    className="w-full py-3 bg-gray-150 hover:bg-gray-200 text-gray-800 rounded-xl font-bold text-sm transition-colors mt-1"
                  >
                    Finalizar y Cerrar
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Modal Footer (Controls) */}
        {step < 5 && (
          <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-between items-center rounded-b-3xl">
            {step > 1 ? (
              <button
                onClick={handlePrevStep}
                className="flex items-center space-x-2 py-2.5 px-4 text-sm font-semibold text-gray-600 hover:text-gray-900 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Atrás</span>
              </button>
            ) : (
              <div /> // Placeholder
            )}

            {step < 4 ? (
              <button
                onClick={handleNextStep}
                disabled={
                  (step === 1 && !selectedService) ||
                  (step === 2 && !selectedStaff) ||
                  (step === 3 && (!selectedDate || !selectedTime))
                }
                className={`flex items-center space-x-2 py-2.5 px-5 rounded-xl text-sm font-bold text-white shadow-sm transition-all ${
                  ((step === 1 && !selectedService) ||
                  (step === 2 && !selectedStaff) ||
                  (step === 3 && (!selectedDate || !selectedTime)))
                    ? 'bg-gray-300 cursor-not-allowed opacity-55'
                    : `${salon.colorTheme.primary} ${salon.colorTheme.primaryHover} transform hover:-translate-y-0.5`
                }`}
              >
                <span>Siguiente</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => {
                  const submitBtn = document.getElementById('hidden-submit-btn');
                  if (submitBtn) submitBtn.click();
                }}
                className={`flex items-center space-x-2 py-2.5 px-6 rounded-xl text-sm font-extrabold text-white shadow-md transition-all ${salon.colorTheme.primary} ${salon.colorTheme.primaryHover} transform hover:-translate-y-0.5`}
              >
                <span>Confirmar Cita</span>
                <Check className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
