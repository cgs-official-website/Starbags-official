import React, { useState, useEffect } from "react";
import "../../assets/styles/SavedAddress.css";
import Navbar from "../../components/User/Navbar";
import Footer from "../../components/User/Footer";
import ProfileSideNav from "../../components/User/Profile-Side-Nav";
import { MdEdit, MdAdd, MdDelete } from "react-icons/md";
import { IoMdClose } from "react-icons/io";
import { useAuth } from "../../context/AuthContext";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase";
import { useNavigate } from "react-router-dom";

const emptyForm = {
  email: "",
  name: "",
  contact: "",
  state: "",
  city: "",
  pin: "",
  address: "",
};

const emptyErrors = {
  email: "",
  name: "",
  contact: "",
  state: "",
  city: "",
  pin: "",
  address: "",
};

const indianStates = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
];

function validate(formData) {
  const errors = { ...emptyErrors };
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const contactRegex = /^[6-9][0-9]{9}$/;
  const pinRegex = /^[0-9]{6}$/;

  if (!formData.email.trim()) errors.email = "Email address is required.";
  else if (!emailRegex.test(formData.email)) errors.email = "Enter a valid email address.";

  if (!formData.name.trim()) errors.name = "Name is required.";
  else if (formData.name.trim().length < 2) errors.name = "Name must be at least 2 characters.";

  if (!formData.contact.trim()) errors.contact = "Contact number is required.";
  else if (!contactRegex.test(formData.contact)) errors.contact = "Enter a valid 10-digit mobile number.";

  if (!formData.state) errors.state = "Please select a state.";

  if (!formData.city.trim()) errors.city = "City is required.";

  if (!formData.pin.trim()) errors.pin = "Pincode is required.";
  else if (!pinRegex.test(formData.pin)) errors.pin = "Enter a valid 6-digit pincode.";

  if (!formData.address.trim()) errors.address = "Address is required.";
  else if (formData.address.trim().length < 10) errors.address = "Please enter a more detailed address.";

  return errors;
}

function hasErrors(errors) {
  return Object.values(errors).some((e) => e !== "");
}

function SavedAddress() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [savedAddresses, setSavedAddresses] = useState([]);
  const [loadingAddresses, setLoadingAddresses] = useState(true);

  const hasAddresses = savedAddresses.length > 0;
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [addressToDelete, setAddressToDelete] = useState(null);

  useEffect(() => {
    const fetchAddresses = async () => {
      if (!currentUser) {
        navigate("/login");
        return;
      }
      try {
        const userDocRef = doc(db, "users", currentUser.uid);
        const userSnap = await getDoc(userDocRef);
        if (userSnap.exists()) {
          const data = userSnap.data();
          if (data.addresses && Array.isArray(data.addresses)) {
            setSavedAddresses(data.addresses);
            localStorage.setItem("savedAddresses", JSON.stringify(data.addresses));
          }
        }
      } catch (err) {
        console.error("Error fetching addresses:", err);
      } finally {
        setLoadingAddresses(false);
      }
    };
    fetchAddresses();
  }, [currentUser, navigate]);

  useEffect(() => {
    if (!loadingAddresses && savedAddresses.length === 0) {
      setShowForm(true);
    }
  }, [loadingAddresses, savedAddresses.length]);

  const syncAddressesToDB = async (updatedAddresses) => {
    if (currentUser) {
      try {
        const userDocRef = doc(db, "users", currentUser.uid);
        await updateDoc(userDocRef, { addresses: updatedAddresses });
        localStorage.setItem("savedAddresses", JSON.stringify(updatedAddresses));
      } catch (err) {
        console.error("Error saving addresses to DB:", err);
      }
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e, errors, setErrors) => {
    e.preventDefault();
    const validationErrors = validate(formData);
    if (hasErrors(validationErrors)) {
      setErrors(validationErrors);
      return;
    }

    let updatedAddresses;
    if (editingId !== null) {
      updatedAddresses = savedAddresses.map((addr) =>
        addr.id === editingId
          ? { ...addr, ...formData, mobile: formData.contact }
          : addr
      );
      setEditingId(null);
    } else {
      const newAddr = { id: Date.now(), ...formData, mobile: formData.contact };
      updatedAddresses = [...savedAddresses, newAddr];
    }
    setSavedAddresses(updatedAddresses);
    await syncAddressesToDB(updatedAddresses);
    setFormData(emptyForm);
    setShowForm(false);
  };

  const handleCancel = () => {
    setFormData(emptyForm);
    setEditingId(null);
    if (savedAddresses.length > 0) setShowForm(false);
  };

  const handleEdit = (addr) => {
    setFormData({
      email: addr.email || "",
      name: addr.name,
      contact: addr.contact || addr.mobile,
      state: addr.state,
      city: addr.city,
      pin: addr.pin,
      address: addr.address,
    });
    setEditingId(addr.id);
    setShowForm(true);
    setTimeout(() => {
      document.getElementById("address-form-section")?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const triggerDeletePrompt = (id) => {
    setAddressToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDeleteAction = async () => {
    const remaining = savedAddresses.filter((addr) => addr.id !== addressToDelete);
    setSavedAddresses(remaining);
    await syncAddressesToDB(remaining);
    setShowDeleteModal(false);
    setAddressToDelete(null);
    if (remaining.length === 0) setShowForm(true);
  };

  const handleAddNew = () => {
    setFormData(emptyForm);
    setEditingId(null);
    setShowForm((prev) => !prev);
    if (!showForm) {
      setTimeout(() => {
        document.getElementById("address-form-section")?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  };

  return (
    <>
      <Navbar />
      <div className="container py-3 my-2">
        <h4 className="mb-3 fw-bold">Settings and Profile</h4>
        <div className="row justify-content-center align-items-start">
          <div className="col-lg-3 col-md-5 mb-3 d-none d-lg-block sidebar-sticky">
            <ProfileSideNav />
          </div>

          <div className="col-lg-9  col-12">
            {loadingAddresses ? (
              <div className="saved-address-card">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div className="skeleton-line" style={{ width: "140px", height: "20px", borderRadius: "4px", background: "#e5e7eb" }} />
                  <div className="skeleton-line" style={{ width: "80px", height: "32px", borderRadius: "6px", background: "#e5e7eb" }} />
                </div>
                {[1, 2].map((i) => (
                  <div key={i} className="address-item mb-3" style={{ padding: "12px", borderRadius: "8px", border: "1px solid #f0f0f0" }}>
                    <div className="skeleton-line mb-2" style={{ width: "60%", height: "14px", borderRadius: "4px", background: "#e5e7eb" }} />
                    <div className="skeleton-line mb-2" style={{ width: "80%", height: "14px", borderRadius: "4px", background: "#e5e7eb" }} />
                    <div className="skeleton-line" style={{ width: "40%", height: "14px", borderRadius: "4px", background: "#e5e7eb" }} />
                  </div>
                ))}
              </div>
            ) : hasAddresses ? (
              <div className="saved-address-card">
                {/* ── Header row ── */}
                <div className="addr-card-header">
                  <h5 className="fw-bold mb-0">Saved Addresses</h5>
                  <button
                    className="btn add-address-btn d-flex align-items-center gap-1"
                    onClick={handleAddNew}
                    type="button"
                  >
                    {showForm && editingId === null ? (
                      <>
                        <IoMdClose />
                        <span className="add-btn-label">Close</span>
                      </>
                    ) : (
                      <>
                        <MdAdd />
                        <span className="add-btn-label">Add new</span>
                      </>
                    )}
                  </button>
                </div>

                <div className={`address-form-collapse ${showForm ? "open" : ""}`}>
                  <div id="address-form-section" className="address-form-box mb-4">
                    <h6 className="fw-bold mb-3">
                      {editingId ? "Edit Address" : "New Address"}
                    </h6>
                    <AddressForm
                      formData={formData}
                      onChange={handleChange}
                      onSave={handleSave}
                      onCancel={handleCancel}
                    />
                  </div>
                </div>

                <div className="address-list">
                  {savedAddresses.map((addr, index) => (
                    <div key={addr.id} className="address-item">
                      <div className="address-item-top">
                        <span className="address-label">Address {index + 1}</span>
                        <div className="addr-action-btns">
                          <button
                            className="btn addr-edit-btn"
                            onClick={() => handleEdit(addr)}
                            type="button"
                          >
                            <MdEdit /> Edit
                          </button>
                          <button
                            className="btn addr-delete-btn"
                            onClick={() => triggerDeletePrompt(addr.id)}
                            type="button"
                          >
                            <MdDelete /> Delete
                          </button>
                        </div>
                      </div>
                      <p className="address-name">{addr.name}</p>
                      <p className="address-text">{addr.address}</p>
                      <p className="address-text">{addr.city}, {addr.state} – {addr.pin}</p>
                      <p className="address-text">Mobile: {addr.mobile || addr.contact}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="saved-address-card">
                <h5 className="fw-bold mb-3">Address</h5>
                <AddressForm
                  formData={formData}
                  onChange={handleChange}
                  onSave={handleSave}
                  onCancel={handleCancel}
                  noCancel
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Delete Confirmation Modal ── */}
      {showDeleteModal && (() => {
        return (
          <div className="del-modal-overlay">
            <div className="del-modal-box" role="dialog" aria-modal="true" aria-labelledby="del-modal-title">
              <div className="del-modal-icon-ring">
                <MdDelete size={22} />
              </div>
              <h5 id="del-modal-title" className="del-modal-title">Remove this address?</h5>
              <p className="del-modal-sub mb-4">
                This delivery address will be permanently removed from your account and cannot be recovered.
              </p>
              <div className="del-modal-footer">
                <button
                  type="button"
                  className="del-btn-cancel"
                  onClick={() => setShowDeleteModal(false)}
                >
                  Keep it
                </button>
                <button
                  type="button"
                  className="del-btn-confirm"
                  onClick={confirmDeleteAction}
                >
                  Yes, remove
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      <Footer />
    </>
  );
}

// ── AddressForm with inline error messages ──
function AddressForm({ formData, onChange, onSave, onCancel, noCancel }) {
  const [errors, setErrors] = useState({ ...emptyErrors });
  const starStyle = { color: "var(--levender, #8b5cf6)", marginLeft: "3px" };
  const errStyle = { color: "#ef4444", fontSize: "0.78rem", marginTop: "4px" };

  const handleFieldChange = (e) => {
    const { name } = e.target;
    onChange(e);
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleContactChange = (e) => {
    const val = e.target.value.replace(/\D/g, "");
    if (val.length <= 10) {
      onChange({ target: { name: "contact", value: val } });
      if (errors.contact) setErrors((prev) => ({ ...prev, contact: "" }));
    }
  };

  const handlePinChange = (e) => {
    const val = e.target.value.replace(/\D/g, "");
    if (val.length <= 6) {
      onChange({ target: { name: "pin", value: val } });
      if (errors.pin) setErrors((prev) => ({ ...prev, pin: "" }));
    }
  };

  const handleSubmit = (e) => {
    onSave(e, errors, setErrors);
  };

  const inputClass = (field) =>
    `form-control addr-input${errors[field] ? " is-invalid-custom" : ""}`;

  return (
    <form onSubmit={handleSubmit} noValidate className="address-form">

      {/* Email */}
      <div className="mb-3">
        <label className="form-label-sm">E-mail Address<span style={starStyle}>*</span></label>
        <input
          type="email"
          className={inputClass("email")}
          name="email"
          placeholder="Enter your e-mail"
          value={formData.email}
          onChange={handleFieldChange}
        />
        {errors.email && <p style={errStyle}>⚠ {errors.email}</p>}
      </div>

      {/* Name */}
      <div className="mb-3">
        <label className="form-label-sm">Name<span style={starStyle}>*</span></label>
        <input
          type="text"
          className={inputClass("name")}
          name="name"
          placeholder="Enter your name"
          value={formData.name}
          onChange={handleFieldChange}
        />
        {errors.name && <p style={errStyle}>⚠ {errors.name}</p>}
      </div>

      {/* Contact */}
      <div className="mb-3">
        <label className="form-label-sm">Contact Number<span style={starStyle}>*</span></label>
        <input
          type="text"
          className={inputClass("contact")}
          name="contact"
          placeholder="Enter 10 digit number"
          value={formData.contact}
          onChange={handleContactChange}
          maxLength={10}
        />
        {errors.contact && <p style={errStyle}>⚠ {errors.contact}</p>}
      </div>

      {/* State */}
      <div className="mb-3">
        <label className="form-label-sm">State<span style={starStyle}>*</span></label>
        <select
          className={`form-select addr-input${errors.state ? " is-invalid-custom" : ""}`}
          name="state"
          value={formData.state}
          onChange={handleFieldChange}
        >
          <option value="" disabled hidden>Select your state</option>
          {indianStates.map((state, idx) => (
            <option key={idx} value={state}>{state}</option>
          ))}
        </select>
        {errors.state && <p style={errStyle}>⚠ {errors.state}</p>}
      </div>

      {/* City */}
      <div className="mb-3">
        <label className="form-label-sm">City<span style={starStyle}>*</span></label>
        <input
          type="text"
          className={inputClass("city")}
          name="city"
          placeholder="Enter your city"
          value={formData.city}
          onChange={handleFieldChange}
        />
        {errors.city && <p style={errStyle}>⚠ {errors.city}</p>}
      </div>

      {/* Pincode */}
      <div className="mb-3">
        <label className="form-label-sm">Pincode<span style={starStyle}>*</span></label>
        <input
          type="text"
          className={inputClass("pin")}
          name="pin"
          placeholder="Enter 6 digit Pincode"
          value={formData.pin}
          onChange={handlePinChange}
          maxLength={6}
        />
        {errors.pin && <p style={errStyle}>⚠ {errors.pin}</p>}
      </div>

      {/* Address */}
      <div className="mb-4">
        <label className="form-label-sm">Address<span style={starStyle}>*</span></label>
        <textarea
          className={inputClass("address")}
          name="address"
          placeholder="Enter flat/house no, landmark, building name"
          rows={3}
          value={formData.address}
          onChange={handleFieldChange}
        />
        {errors.address && <p style={errStyle}>⚠ {errors.address}</p>}
      </div>

      <div className="d-flex gap-3">
        {!noCancel && (
          <button type="button" className="btn btn-addr-cancel flex-fill" onClick={onCancel}>
            Cancel
          </button>
        )}
        <button type="submit" className="btn btn-addr-save flex-fill">
          Save Address
        </button>
      </div>
    </form>
  );
}

export default SavedAddress;