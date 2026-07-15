import React, { createContext, useContext, useState } from "react";

const BookingContext = createContext(null);

export function BookingProvider({ children }) {
  const [participants, setParticipants] = useState(2);
  const [selectedDateIndex, setSelectedDateIndex] = useState(0);
  const [selectedTime, setSelectedTime] = useState(null);
  const [method, setMethod] = useState(null);
  const [customer, setCustomer] = useState({ name: "", phone: "", accepted: false });
  const [lastConfirmedBooking, setLastConfirmedBooking] = useState(null);

  const resetBookingFlow = () => {
    setParticipants(2);
    setSelectedDateIndex(0);
    setSelectedTime(null);
    setMethod(null);
    setCustomer({ name: "", phone: "", accepted: false });
  };

  const value = {
    participants,
    setParticipants,
    selectedDateIndex,
    setSelectedDateIndex,
    selectedTime,
    setSelectedTime,
    method,
    setMethod,
    customer,
    setCustomer,
    lastConfirmedBooking,
    setLastConfirmedBooking,
    resetBookingFlow,
  };

  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>;
}

export function useBooking() {
  const ctx = useContext(BookingContext);
  if (!ctx) throw new Error("useBooking must be used within BookingProvider");
  return ctx;
}
