import React, { createContext, useContext, useState } from "react";
import { getUpcomingDates } from "../data.js";

const BookingContext = createContext(null);

export function BookingProvider({ children }) {
  const [dates] = useState(() => getUpcomingDates(30));
  const [participants, setParticipants] = useState(2);
  const [selectedDateIndex, setSelectedDateIndex] = useState(0);
  const [selectedTime, setSelectedTime] = useState(null);
  const [method, setMethod] = useState(null);
  const [paymentPlan, setPaymentPlan] = useState("sinal"); // "sinal" | "vista"
  const [customer, setCustomer] = useState({
    name: "",
    phone: "",
    email: "",
    cpf: "",
    accepted: false,
    manualVistoEm: null,
    termoVistoEm: null,
    aceiteEm: null,
  });

  const resetBookingFlow = () => {
    setParticipants(2);
    setSelectedDateIndex(0);
    setSelectedTime(null);
    setMethod(null);
    setPaymentPlan("sinal");
    setCustomer({
      name: "",
      phone: "",
      email: "",
      cpf: "",
      accepted: false,
      manualVistoEm: null,
      termoVistoEm: null,
      aceiteEm: null,
    });
  };

  const value = {
    dates,
    participants,
    setParticipants,
    selectedDateIndex,
    setSelectedDateIndex,
    selectedTime,
    setSelectedTime,
    method,
    setMethod,
    paymentPlan,
    setPaymentPlan,
    customer,
    setCustomer,
    resetBookingFlow,
  };

  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>;
}

export function useBooking() {
  const ctx = useContext(BookingContext);
  if (!ctx) throw new Error("useBooking must be used within BookingProvider");
  return ctx;
}
