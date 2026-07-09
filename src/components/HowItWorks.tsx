import React from 'react';

const steps = [
  {
    title: "Fill out your details",
    description: "Enter your personal information to set up your verification profile."
  },
  {
    title: "Review and confirm your details",
    description: "Double-check everything is accurate before it becomes your reference for verification."
  },
  {
    title: "Select your verification type",
    description: "Choose the type of verification you need for your documents."
  },
  {
    title: "Upload your documents",
    description: "Submit your documents and wait while they're reviewed."
  },
  {
    title: "Start verification",
    description: "Click start verification to begin the automated check."
  },
  {
    title: "Get your results",
    description: "Receive your verification results and next steps."
  }
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 px-6 max-w-5xl mx-auto relative overflow-hidden">
      <h2 className="text-3xl md:text-4xl font-bold text-center mb-20 text-gray-900">How it works</h2>
      
      {/* Subtle vertical connector line (desktop only) */}
      <div className="hidden md:block absolute left-1/2 top-[200px] bottom-[150px] w-px bg-red-100 -translate-x-1/2 z-0"></div>

      <div className="flex flex-col gap-16 md:gap-24 relative z-10">
        {steps.map((step, index) => {
          const isEven = index % 2 !== 0;
          const num = String(index + 1).padStart(2, '0');
          
          return (
            <div key={index} className={`flex flex-col md:flex-row items-center gap-10 md:gap-20 ${isEven ? 'md:flex-row-reverse' : ''}`}>
              
              {/* Content Side */}
              <div className={`flex-1 flex flex-col items-start ${!isEven ? 'md:items-end text-left md:text-right' : 'text-left'}`}>
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-50 border-2 border-brand-red text-brand-red font-bold mb-5 shadow-sm">
                  {num}
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">{step.title}</h3>
                <p className="text-gray-500 text-lg leading-relaxed max-w-sm">
                  {step.description}
                </p>
              </div>

              {/* Image Side */}
              <div className="flex-1 w-full">
                <img 
                  src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MDAiIGhlaWdodD0iNDAwIj48cmVjdCB3aWR0aD0iNjAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iI2U3ZTVlNCIvPjwvc3ZnPg==" 
                  alt={`Step ${index + 1} illustration`}
                  className="w-full aspect-video md:aspect-[4/3] bg-gray-100 rounded-2xl shadow-sm border border-gray-100 object-cover"
                />
              </div>

            </div>
          );
        })}
      </div>
    </section>
  );
}
