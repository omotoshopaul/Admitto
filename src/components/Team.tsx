import React from 'react';

const team = [
  { name: "Shafe Emmanuella", role: "Data Analyst" },
  { name: "Chidinma Nworie", role: "Data Analyst" },
  { name: "Akinsola Peniel", role: "Back-End Engineer" },
  { name: "Omotosho Paul", role: "Front-End Engineer" }
];

export default function Team() {
  return (
    <section id="team" className="py-24 px-6 max-w-5xl mx-auto">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Meet the Team</h2>
        <p className="text-lg text-gray-500">
          Meet the team behind Admitto
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4 mb-20">
        {team.map((member, index) => (
          <div key={index} className="flex flex-col items-center text-center">
            <div 
              className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-[#D9D9D9] mb-6"
              style={{ border: '2px solid rgba(226, 75, 74, 0.7)' }}
            ></div>
            <h3 className="font-bold text-gray-900 text-lg mb-1">{member.name}</h3>
            <p className="text-sm text-gray-500">{member.role}</p>
          </div>
        ))}
      </div>

      <div className="max-w-[700px] mx-auto text-center">
        <p className="text-xl md:text-2xl text-black font-medium leading-relaxed">
          <span className="text-brand-red">"</span>
          Built by four University of Lagos students who saw one problem from both sides — students losing offers over avoidable mistakes, officers drowning in manual verification.
          <span className="text-brand-red">"</span>
        </p>
      </div>
    </section>
  );
}
