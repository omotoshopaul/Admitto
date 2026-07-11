import React, { useState, useRef, useEffect } from 'react';
import { Plus, Minus } from 'lucide-react';

const faqs = [
  {
    question: "What is Admitto?",
    answer: "Admitto is your intelligent admissions companion. It verifies your admission documents against your confirmed personal details, catches errors before they become problems, and helps you submit with confidence."
  },
  {
    question: "How does Admitto work?",
    answer: (
      <>
        Check out a detailed guide to see how Admitto works <a href="#how-it-works" className="text-[#E24B4A] hover:underline">here</a>.
      </>
    )
  },
  {
    question: "How long does it take to get my documents verified?",
    answer: "Verification typically happens within minutes of upload, though times may vary depending on the number and type of documents submitted."
  },
  {
    question: "How many types of document verification do we have?",
    answer: "We offer two types of verification. The first checks your uploaded documents against your pre-saved personal details to catch mismatches and errors. The second checks the content of documents like testimonials for spelling and grammatical mistakes, and compares them against Admitto's standard template references."
  },
  {
    question: "How reliable is Admitto with my documents?",
    answer: "Admitto cross-checks every document carefully against your confirmed details and our reference templates, flagging anything that doesn't match so you can fix it before submission."
  },
  {
    question: "What do I do when my verification is flagged?",
    answer: "If an issue is found, Admitto shows you a template of what the correct document should look like, so you know exactly how to fix the mistake before resubmitting."
  },
  {
    question: "How do I get in touch with Admitto?",
    answer: "You can reach us by email at admittoverification@gmail.com or via WhatsApp at +2348109673729."
  },
  {
    question: "What other services do we offer?",
    answer: "You can purchase your WAEC and NECO scratch cards through the Purchase section in the Admitto app."
  }
];

export default function FAQ() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const toggleAccordion = (index: number) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <section id="faqs" className="py-24 px-6 max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">FAQs</h2>
        <p className="text-lg text-gray-500">
          Don't worry, we are here to explain everything you might want to know
        </p>
      </div>

      <div 
        className="bg-white rounded-[24px] md:rounded-[32px] p-6 md:p-10"
        style={{ border: '1.5px solid rgba(226, 75, 74, 0.7)' }}
      >
        <div className="flex flex-col">
          {faqs.map((faq, index) => {
            const isOpen = activeIndex === index;
            return (
              <div key={index} className="border-b border-gray-100 last:border-b-0">
                <button
                  onClick={() => toggleAccordion(index)}
                  className="w-full py-6 flex items-center justify-between text-left focus:outline-none"
                >
                  <span className="text-base md:text-lg font-medium text-black pr-8">
                    {faq.question}
                  </span>
                  <span className="text-gray-400 flex-shrink-0">
                    {isOpen ? <Minus size={24} /> : <Plus size={24} />}
                  </span>
                </button>
                <div 
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    isOpen ? 'max-h-[500px] opacity-100 pb-6' : 'max-h-0 opacity-0 pb-0'
                  }`}
                >
                  <p className="text-gray-600 text-base leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
