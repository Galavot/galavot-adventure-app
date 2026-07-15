import React from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { BottomNav } from "./components/UI.jsx";
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

function Shell() {
  const location = useLocation();
  const mainTabs = ["/", "/passeios", "/reservas", "/perfil"];
  const showNav = mainTabs.includes(location.pathname);

  return (
    <div className="flex flex-col h-screen w-full mx-auto bg-ink" style={{ maxWidth: 480 }}>
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
      </Routes>
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
