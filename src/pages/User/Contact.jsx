import { useState, useEffect } from "react";

import { FaLocationDot } from "react-icons/fa6";
import { FaPhoneAlt, FaClock } from "react-icons/fa";
import { MdMarkEmailUnread } from "react-icons/md";
import { CgAsterisk } from "react-icons/cg";
import Navbar from "../../components/User/Navbar";
import Footer from "../../components/User/Footer";

import { useAuth } from "../../context/AuthContext";
import { db } from "../../firebase";
import { doc, getDoc } from "firebase/firestore";

import ContactImage from "../../assets/images/contact-image.png";

import "../../assets/styles/Contact.css";

const Contact = () => {
  const { currentUser } = useAuth();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [orderId, setOrderId] = useState("");
  const [problemType, setProblemType] = useState("Product Damage");
  const [otherProblem, setOtherProblem] = useState("");
  const [message, setMessage] = useState("");

  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (currentUser) {
        setEmail(currentUser.email || "");
        try {
          const userDocRef = doc(db, "users", currentUser.uid);
          const userSnap = await getDoc(userDocRef);
          if (userSnap.exists()) {
            const data = userSnap.data();
            if (data.name) {
              const parts = data.name.trim().split(" ");
              setFirstName(parts[0] || "");
              setLastName(parts.slice(1).join(" ") || "");
            }
            if (data.mobile) {
              setContactNumber(data.mobile);
            }
          }
        } catch (err) {
          console.error("Error fetching user profile for contact form:", err);
        }
      }
    };
    fetchUserProfile();
  }, [currentUser]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !contactNumber.trim() || !orderId.trim() || !message.trim()) {
      setErrorMessage("Please fill out all required fields.");
      return;
    }

    if (problemType === "Other" && !otherProblem.trim()) {
      setErrorMessage("Please specify the custom problem.");
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");

    try {
      const subject = encodeURIComponent(`Complaint - Order #${orderId.trim()} (${problemType === "Other" ? otherProblem.trim() : problemType})`);
      const email = "starbags1993@gmail.com";
      const body = encodeURIComponent(
        `Hello Star Bags Support,\n\n` +
        `Here are the complaint details:\n` +
        `- Name: ${firstName.trim()} ${lastName.trim()}\n` +
        `- Email: ${email.trim()}\n` +
        `- Contact: ${contactNumber.trim()}\n` +
        `- Order ID: ${orderId.trim()}\n` +
        `- Problem: ${problemType === "Other" ? otherProblem.trim() : problemType}\n\n` +
        `Complaint Message:\n${message.trim()}\n\n` +
        `Regards,\n` +
        `${firstName.trim()} ${lastName.trim()}`
      );
      
      const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${email}&su=${subject}&body=${body}`;
      window.open(gmailUrl, "_blank");
      
      setSuccessMessage("Opening Gmail in a new tab with pre-filled complaint details. Please send the pre-filled email from your Gmail account.");
      
      setOrderId("");
      setProblemType("Product Damage");
      setOtherProblem("");
      setMessage("");
    } catch (err) {
      console.error("Error opening Gmail tab:", err);
      setErrorMessage("Could not open Gmail automatically. Please send an email directly to starbags1993@gmail.com.");
    }
  };

  return (
    <>
      <Navbar />

      {/* HERO SECTION */}
      <div className="contact-image">
        <img src={ContactImage} alt="Contact" />

        <div className="contact-content">
          <h1>Let's Stay Connected</h1>

          <p>
            Crafting enduring stories through leather. Reach out to our workshop
            or visit our flagship studio.
          </p>
        </div>
      </div>

      {/* CONTACT SECTION */}
      <div className="container py-4">
        <div className="row g-4 align-items-start">
          {/* FORM */}
          <div className="col-12 col-lg-6">
            <h1 className="contact-form-title">Customer Support</h1>
            <div className="contact-form-box">
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label">
                    E-mail Address
                    <sup>
                      <CgAsterisk />
                    </sup>
                  </label>

                  <input
                    type="email"
                    className="form-control"
                    placeholder="Enter your e-mail"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="row">
                  <div className="col-12 col-md-6 mb-3">
                    <label className="form-label">
                      First Name
                      <sup>
                        <CgAsterisk />
                      </sup>
                    </label>

                    <input
                      type="text"
                      className="form-control"
                      placeholder="First name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="col-12 col-md-6 mb-3">
                    <label className="form-label">
                      Last Name
                      <sup>
                        <CgAsterisk />
                      </sup>
                    </label>

                    <input
                      type="text"
                      className="form-control"
                      placeholder="Last name"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label">
                    Product Order Id
                    <sup>
                      <CgAsterisk />
                    </sup>
                  </label>

                  <input
                    type="text"
                    className="form-control"
                    placeholder="Enter your Order ID"
                    value={orderId}
                    onChange={(e) => setOrderId(e.target.value)}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">
                    Contact Number
                    <sup>
                      <CgAsterisk />
                    </sup>
                  </label>

                  <input
                    type="tel"
                    className="form-control"
                    placeholder="Enter your contact number"
                    value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value)}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">
                    What is your problem
                    <sup>
                      <CgAsterisk />
                    </sup>
                  </label>

                  <select
                    className="form-select"
                    value={problemType}
                    onChange={(e) => setProblemType(e.target.value)}
                  >
                    <option>Product Damage</option>
                    <option>Product Mismatch</option>
                    <option>Quality Issues</option>
                    <option>Other</option>
                  </select>

                  {/* SHOW ONLY WHEN OTHER IS SELECTED */}
                  {problemType === "Other" && (
                    <>
                      <label className="form-label mt-2">
                        Other
                        <sup>
                          <CgAsterisk />
                        </sup>
                      </label>

                      <input
                        type="text"
                        className="form-control"
                        placeholder="Enter Other Problem"
                        value={otherProblem}
                        onChange={(e) => setOtherProblem(e.target.value)}
                        required
                      />
                    </>
                  )}
                </div>

                <div className="mb-4">
                  <label className="form-label">Write the message</label>

                  <textarea
                    className="form-control"
                    rows="5"
                    placeholder="Write your message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                  ></textarea>
                </div>

                {successMessage && (
                  <div className="alert alert-success py-2 px-3 mb-3 small" role="alert">
                    {successMessage}
                  </div>
                )}
                {errorMessage && (
                  <div className="alert alert-danger py-2 px-3 mb-3 small" role="alert">
                    {errorMessage}
                  </div>
                )}

                <div className="d-grid">
                  <button className="btn btn-dark" type="submit">
                    Send Message
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* GET IN TOUCH */}
          <div className="col-12 col-lg-5 offset-lg-1  ">
            <div className="get-touch">
              <h1>Get in Touch</h1>

              <div className="contact-info-box">
                <span>
                  <FaLocationDot />
                </span>

                <div>
                  <h5>STORE LOCATION</h5>
                  <p>
                    No 554, Vannikamvalam Opposite, Old Bus Stand Road,
                    <br /> Bhavani Main Road, Perundurai-638052, Tamil Nadu
                  </p>
                </div>
              </div>

              <div className="contact-info-box">
                <span>
                  <FaPhoneAlt />
                </span>

                <div>
                  <h5>PHONE</h5>
                  <p>+91 97999 02475</p>
                </div>
              </div>

              <div className="contact-info-box">
                <span>
                  <FaClock />
                </span>

                <div>
                  <h5>BUSINESS HOURS</h5>

                  <p>
                    Mon - Fri: 09:00 - 18:00
                    <br />
                    Sat: 10:00 - 14:00
                  </p>
                </div>
              </div>

              <div className="contact-info-box">
                <span>
                  <MdMarkEmailUnread />
                </span>

                <div>
                  <h5>EMAIL</h5>
                  <p>starbags1993@gmail.com</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
};

export default Contact;
