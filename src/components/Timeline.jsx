import React from "react";
import Reveal from "./Reveal.jsx";

export default function Timeline({ steps }) {
  return (
    <div className="flex flex-col">
      {steps.map((step, i) => {
        const isLast = i === steps.length - 1;
        return (
          <Reveal key={i} delay={i * 60}>
            <div className="flex gap-3">
              <div className="flex flex-col items-center">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-[12px] font-bold bg-orange text-ink"
                >
                  {i + 1}
                </div>
                {!isLast && <div className="w-px flex-1 my-1" style={{ background: "#413C35", minHeight: 22 }} />}
              </div>
              <div className={isLast ? "pb-1" : "pb-4"}>
                <div className="text-white text-[13px] font-semibold mt-0.5">{step.title}</div>
                <div className="text-muted text-[11px] leading-relaxed mt-0.5">{step.desc}</div>
              </div>
            </div>
          </Reveal>
        );
      })}
    </div>
  );
}
