import React from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { BottomNav } from "./components/UI.jsx";
import FloatingCTA from "./components/FloatingCTA.jsx";
import { BookingProvider } from "./context/BookingContext.jsx";
import Home from "./pages/Home.jsx";
import Tours from "./pages/Tours.jsx";
import TourDetail from "./pages/TourDetail.jsx";
import BookingDateTime from "./pages/BookingDateTime.jsx";
import BookingCustomer from "./pages/BookingCustomer.jsx";
import BookingPayment from "./pages/BookingPayment.jsx";
import BookingConfirmation from "./pages/BookingConfirmation.jsx";
import Bookings from "./pages/Bookings.jsx";
import Profile from "./pages/Profile.jsx";
import AdminLogin from "./pages/AdminLogin.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";

function Shell() {
  const location = useLocation();
  const mainTabs = ["/", "/passeios", "/reservas", "/perfil"];
  const showNav = mainTabs.includes(location.pathname);
  // O CTA flutuante fica visível nas telas de navegação/descoberta, mas some
  // durante o fluxo de reserva (onde já existe um botão principal na tela)
  // e no painel administrativo.
  const hideFloatingCTA =
    location.pathname.startsWith("/admin") ||
    /\/passeio\/[^/]+\/(data-horario|dados|pagamento|confirmacao)/.test(location.pathname);

  return (
    <div className="flex flex-col h-screen w-full mx-auto bg-ink relative" style={{ maxWidth: 480 }}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/passeios" element={<Tours />} />
        <Route path="/passeio/:id" element={<TourDetail />} />
        <Route path="/passeio/:id/data-horario" element={<BookingDateTime />} />
        <Route path="/passeio/:id/dados" element={<BookingCustomer />} />
        <Route path="/passeio/:id/pagamento" element={<BookingPayment />} />
        <Route path="/passeio/:id/confirmacao" element={<BookingConfirmation />} />
        <Route path="/reservas" element={<Bookings />} />
        <Route path="/perfil" element={<Profile />} />
        <Route path="/admin" element={<AdminLogin />} />
        <Route path="/admin/painel" element={<AdminDashboard />} />
      </Routes>
      {!hideFloatingCTA && <FloatingCTA aboveNav={showNav} />}
      {showNav && <BottomNav />}
    </div>
  );
}

export default function App() {
  return (
    <BookingProvider>
      <Shell />
    </BookingProvider>
  );
}
