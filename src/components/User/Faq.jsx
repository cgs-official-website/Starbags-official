import { useState } from "react";
import '../../assets/styles/Faq.css'
import { IoIosArrowDown } from "react-icons/io";


export const Faq = () => {
  const [active, setActive] = useState(null);

  const faqData = [
    {
      question: "What type of leather do you use?",
      answer:
        "We use premium genuine leather crafted for durability, comfort, and timeless style.",
    },

    {
      question: "Are your products handmade?",
      answer:
        "Yes, our leather products are handcrafted with attention to quality and detail.",
    },

    {
      question: "Do you offer cash on delivery?",
      answer: "Yes, cash on delivery is available for selected locations.",
    },

    {
      question: "How long does shipping take?",
      answer: "Orders are usually delivered within 3-7 business days.",
    },

    {
      question: "Can I return or exchange products?",
      answer: "Yes, we provide easy returns and exchanges within 7 days.",
    },

    {
      question: "Do you offer international shipping?",
      answer: "Currently we ship to selected international countries.",
    },

    {
      question: "How do I care for leather products?",
      answer:
        "Keep leather away from moisture and clean gently using a soft cloth.",
    },

    {
      question: "Are your products water resistant?",
      answer: "Our products are water resistant but not fully waterproof.",
    },

    {
      question: "Can I track my order?",
      answer:
        "Yes, tracking details will be shared once your order is shipped.",
    },

    {
      question: "Do you provide warranty?",
      answer: "Yes, we offer a limited warranty against manufacturing defects.",
    },
  ];

  const toggleFaq = (index) => {
    setActive(active === index ? null : index);
  };

  return (
    <>
      <section className="faq-section container  "  id="faq-section">
        
          <div className="faq-title text-center"  >
            <h3>Frequently Asked Questions</h3>
            <p>
              Everything you need to know about our leather products and services.
            </p>
          </div>
        <div className="faq-container py-4 mx-4">
          <div className="faq-wrapper">
            {faqData.map((item, index) => (
              <div
                className={`faq-card ${active === index ? "active" : ""} mx-3`}
                key={index}
              >
                <div className="faq-question" onClick={() => toggleFaq(index)}>
                  <h5>{item.question}</h5>

                  <div className="faq-icon"><span><IoIosArrowDown /></span></div>
                </div>

                <div className="faq-answer">
                  <p>{item.answer}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};

