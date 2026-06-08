import React, { useState, useCallback, useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";
import AdminSidebar from "../../components/Admin/AdminSidebar";
import { FiUploadCloud, FiCalendar, FiEdit, FiTrash2 } from "react-icons/fi";
import ConfirmModal from "../../components/Admin/ConfirmModal";
import banner1 from "../../assets/images/banner1.png";
import banner2 from "../../assets/images/banner2.png";
import walletImg from "../../assets/images/wallet.png";
import "../../assets/styles/BannerManagement.css";
import AdminHeader from "../../components/Admin/AdminHeader";
import { FormSkeleton } from "../../components/Admin/AdminSkeleton";
import { collection, getDocs, doc, setDoc, deleteDoc } from "firebase/firestore";
import { db } from "../../firebase";

const ACTIVE_SLOT_COUNT = 3;

const makeDefault = (slotIndex) => {
  if (slotIndex === 0) {
    return {
      id: `default-slot-0`,
      slotIndex: 0,
      title: "Signature Duffel Launch",
      subtitle: "Exclusive Collection",
      ctaText: "Shop Now",
      redirectLink: "/AllProducts",
      startDate: "2026-01-01",
      endDate: "2026-12-31",
      image: banner1,
      status: "ACTIVE",
      isDefault: true,
    };
  } else if (slotIndex === 1) {
    return {
      id: `default-slot-1`,
      slotIndex: 1,
      title: "Handcrafted Luxury Bags",
      subtitle: "Timeless Italian Design",
      ctaText: "Explore",
      redirectLink: "/AllProducts",
      startDate: "2026-01-01",
      endDate: "2026-12-31",
      image: banner2,
      status: "ACTIVE",
      isDefault: true,
    };
  } else {
    return {
      id: `default-slot-2`,
      slotIndex: 2,
      title: "Premium Leather Wallets",
      subtitle: "Sleek and Minimalist Essentials",
      ctaText: "Discover",
      redirectLink: "/AllProducts",
      startDate: "2026-01-01",
      endDate: "2026-12-31",
      image: walletImg,
      status: "ACTIVE",
      isDefault: true,
    };
  }
};

const INITIAL_ACTIVE = Array.from({ length: ACTIVE_SLOT_COUNT }, (_, i) =>
  makeDefault(i),
);

const EMPTY_FORM = {
  title: "",
  subtitle: "",
  ctaText: "",
  redirectLink: "",
  startDate: "",
  endDate: "",
  image: null,
};

const todayStr = () => new Date().toISOString().split("T")[0];

const formatDateLabel = (start, end) => {
  const s = new Date(start);
  const e = new Date(end);
  if (isNaN(s) || isNaN(e)) return "";
  
  const sStr = s.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '/');
  const eStr = e.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '/');
  
  return `${sStr} - ${eStr}`;
};

const isExpired = (banner) => banner.endDate && banner.endDate < todayStr();

function BannerManagement() {
  const [loading, setLoading] = useState(true);
  const [activeSlots, setActiveSlots] = useState(INITIAL_ACTIVE);
  const [scheduled, setScheduled] = useState([]);

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'banners'));
        const activeBanners = [];
        const scheduledBanners = [];
        let offerTextsData = null;

        querySnapshot.forEach((docSnap) => {
          if (docSnap.id === 'offer-banner-texts') {
            offerTextsData = docSnap.data();
            return;
          }
          const data = { id: docSnap.id, ...docSnap.data() };
          if (data.status === 'ACTIVE') activeBanners.push(data);
          else if (data.status === 'SCHEDULED') scheduledBanners.push(data);
        });

        // Sort scheduled by startDate ascending
        scheduledBanners.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

        // Merge active banners into slots based on their slotIndex
        const merged = [...INITIAL_ACTIVE];
        activeBanners.forEach((banner) => {
          const idx = banner.slotIndex !== undefined ? banner.slotIndex : 0;
          if (idx >= 0 && idx < ACTIVE_SLOT_COUNT) {
            merged[idx] = banner;
          }
        });

        // Process expirations and promotions, then write back to Firestore
        let hasChanges = false;
        const newActiveSlots = [...merged];
        const newScheduled = [...scheduledBanners];
        const today = todayStr();

        for (let i = 0; i < newActiveSlots.length; i++) {
          const banner = newActiveSlots[i];
          if (isExpired(banner)) {
            const nextScheduledIndex = newScheduled.findIndex(
              (b) => b.startDate <= today,
            );

            if (nextScheduledIndex !== -1) {
              const next = newScheduled[nextScheduledIndex];
              const promotedBanner = {
                ...next,
                slotIndex: banner.slotIndex,
                status: "ACTIVE",
                isDefault: false,
              };
              newActiveSlots[i] = promotedBanner;
              newScheduled.splice(nextScheduledIndex, 1);
              
              // Write the promoted active banner to Firestore
              await setDoc(doc(db, 'banners', String(next.id)), promotedBanner);
              
              // Delete the old expired banner from Firestore
              if (banner.id && !banner.isDefault) {
                await deleteDoc(doc(db, 'banners', String(banner.id)));
              }
              hasChanges = true;
            } else if (!banner.isDefault) {
              newActiveSlots[i] = makeDefault(banner.slotIndex);
              // Delete the expired active banner from Firestore so it falls back to default
              if (banner.id) {
                await deleteDoc(doc(db, 'banners', String(banner.id)));
              }
              hasChanges = true;
            }
          }
        }

        setActiveSlots(newActiveSlots);
        setScheduled(newScheduled);
        if (offerTextsData) setOfferTexts(offerTextsData);
      } catch (err) {
        console.error('Error loading banners:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchBanners();
  }, []);


  const [activeTab, setActiveTab] = useState("active");

  const [formMode, setFormMode] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  const today = todayStr();

  // Offer Banner state & handlers
  const [bannerType, setBannerType] = useState("main"); // 'main' or 'offer'

  const [offerTexts, setOfferTexts] = useState({
    text1: "Flat 40% OFF on premium handbags and wallets for a limited time.",
    text2: "New year offer 70 % offer",
    text3: "bags deal will be closed . grap the deal",
    text4: "Flat 40% OFF on premium handbags and wallets for a limited time.",
  });

  const [offerFormActive, setOfferFormActive] = useState(false);
  const [offerForm, setOfferForm] = useState({
    text1: "",
    text2: "",
    text3: "",
    text4: "",
  });

  const handleEditOfferClick = () => {
    setOfferFormActive(true);
    setOfferForm({
      text1: offerTexts.text1,
      text2: offerTexts.text2,
      text3: offerTexts.text3,
      text4: offerTexts.text4,
    });
  };

  const handleOfferSubmit = async (e) => {
    e.preventDefault();
    if (!offerForm.text1 || !offerForm.text2 || !offerForm.text3 || !offerForm.text4) {
      alert('All four texts are required!');
      return;
    }
    const newTexts = {
      text1: offerForm.text1,
      text2: offerForm.text2,
      text3: offerForm.text3,
      text4: offerForm.text4,
    };
    try {
      await setDoc(doc(db, 'banners', 'offer-banner-texts'), newTexts);
      setOfferTexts(newTexts);
      setOfferFormActive(false);
      showToast('Offer banner updated successfully.', 'success');
    } catch (err) {
      console.error('Error saving offer banner:', err);
      showToast('Failed to save offer banner!', 'error');
    }
  };

  const handleOfferCancel = () => {
    setOfferFormActive(false);
    setOfferForm({
      text1: "",
      text2: "",
      text3: "",
      text4: "",
    });
  };

  const showToast = useCallback((msg, type = "success") => {
    if (type === "warning") {
      toast(msg, { icon: "⚠️" });
    } else if (type === "error") {
      toast.error(msg);
    } else {
      toast.success(msg);
    }
  }, []);

  const openForm = (mode, banner = null) => {
    setFormMode(mode);
    setEditingId(banner?.id ?? null);
    
    if (banner) {
      setForm({
        title: banner.title,
        subtitle: banner.subtitle || "",
        ctaText: banner.ctaText || "",
        redirectLink: banner.redirectLink || "",
        startDate: banner.startDate || "",
        endDate: banner.endDate || "",
        image: banner.image || null,
      });
    } else {
      const d = new Date();
      d.setMonth(d.getMonth() + 1);
      const nextMonth = d.toISOString().split("T")[0];
      
      setForm({
        ...EMPTY_FORM,
        startDate: todayStr(),
        endDate: nextMonth,
      });
    }
  };

  const closeForm = () => {
    setFormMode(null);
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const setField = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const isFormActive = formMode !== null;

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('Max 5 MB. Image is too large to process.');
      e.target.value = '';
      return;
    }
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      alert('JPG, PNG or WEBP only.');
      e.target.value = '';
      return;
    }
    try {
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (e) => {
          const img = new Image();
          img.src = e.target.result;
          img.onload = () => {
            const MAX_WIDTH = 1200;
            let targetWidth = img.width;
            let targetHeight = img.height;
            
            if (targetWidth > MAX_WIDTH) {
              const ratio = MAX_WIDTH / targetWidth;
              targetWidth = MAX_WIDTH;
              targetHeight = targetHeight * ratio;
            }

            const canvas = document.createElement('canvas');
            canvas.width = targetWidth;
            canvas.height = targetHeight;
            
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, targetWidth, targetHeight);
            ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
            
            resolve(canvas.toDataURL('image/jpeg', 0.6));
          };
          img.onerror = () => reject(new Error('Invalid image file'));
        };
        reader.onerror = (err) => reject(err);
      });
      setField('image', base64);
    } catch (err) {
      alert('Failed to process image.');
      e.target.value = '';
    }
  };

  const handleSubmit = async () => {
    if (!form.image || !form.title || !form.startDate || !form.endDate) {
      alert('Please fill all required fields (Image, Title, Start Date, End Date).');
      return;
    }
    if (form.endDate < form.startDate) {
      alert('End date cannot be before start date.');
      return;
    }

    try {
      if (formMode === 'edit-active') {
        const updated = activeSlots.map((b) =>
          b.id === editingId ? { ...b, ...form, isDefault: false, status: 'ACTIVE' } : b
        );
        const changedBanner = updated.find((b) => b.id === editingId);
        if (changedBanner) await setDoc(doc(db, 'banners', String(editingId)), changedBanner);
        setActiveSlots(updated);
        showToast('Active banner updated successfully.', 'success');

      } else if (formMode === 'create-scheduled') {
        const newId = Date.now();
        const newBanner = { id: newId, ...form, status: 'SCHEDULED', isDefault: false };
        await setDoc(doc(db, 'banners', String(newId)), newBanner);
        setScheduled((prev) => [...prev, newBanner]);
        setActiveTab('schedule');
        showToast('Banner scheduled! Visible in the Schedule tab.', 'success');

      } else if (formMode === 'edit-scheduled') {
        const updatedBanner = { ...scheduled.find((b) => b.id === editingId), ...form };
        await setDoc(doc(db, 'banners', String(editingId)), updatedBanner);
        setScheduled((prev) => prev.map((b) => (b.id === editingId ? updatedBanner : b)));
        showToast('Scheduled banner updated.', 'success');
      }
    } catch (err) {
      console.error('Error saving banner:', err);
      showToast('Failed to save banner!', 'error');
    }

    closeForm();
  };

  // Expiration and scheduled promotions are processed and synced to Firestore on initialization mount.

  const deleteScheduled = (id) => {
    setDeleteTargetId(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      await deleteDoc(doc(db, 'banners', String(deleteTargetId)));
      setScheduled((prev) => prev.filter((b) => b.id !== deleteTargetId));
      showToast('Scheduled banner deleted.', 'warning');
    } catch (err) {
      console.error('Error deleting banner:', err);
      showToast('Failed to delete banner!', 'error');
    }
    setShowDeleteModal(false);
    setDeleteTargetId(null);
  };

  const switchTab = (tab) => {
    closeForm();
    setActiveTab(tab);
  };

  const sortedScheduled = [...scheduled].sort(
    (a, b) => new Date(a.startDate) - new Date(b.startDate),
  );

  return (
    <div className="admin-layout">
      <Toaster position="top-right" />
      <AdminSidebar />

      <div className="admin-main">
        <AdminHeader
          title="Banner Management"
          subtitle="Manage your banners."
        />

        <div className="banner-management-wrapper">
          <div className="d-flex gap-3 mb-4" style={{ padding: "0" }}>
            <button
              type="button"
              onClick={() => setBannerType("main")}
              className="btn py-2 px-4 fw-bold"
              style={{
                borderRadius: 6,
                background: bannerType === "main" ? "#8b5cf6" : "#ede9fe",
                color: bannerType === "main" ? "#ffffff" : "#7c3aed",
                border: "none",
                fontSize: "14px",
                flex: 1,
                maxWidth: "400px",
              }}
            >
              Main banner
            </button>
            <button
              type="button"
              onClick={() => setBannerType("offer")}
              className="btn py-2 px-4 fw-bold"
              style={{
                borderRadius: 6,
                background: bannerType === "offer" ? "#8b5cf6" : "#ede9fe",
                color: bannerType === "offer" ? "#ffffff" : "#7c3aed",
                border: "none",
                fontSize: "14px",
                flex: 1,
                maxWidth: "400px",
              }}
            >
              Offer banner
            </button>
          </div>

          {loading ? (
            <FormSkeleton />
          ) : bannerType === "offer" ? (
            <div className="banner-content-grid">
              {/* Offer Banner Form Section */}
              <div className="banner-form-section">
                {!offerFormActive && (
                  <div className="form-inactive-overlay">
                    <div className="form-inactive-hint">
                      <i
                        className="bi bi-pencil-square"
                        style={{ fontSize: 20, color: "#7c3aed" }}
                      ></i>
                      <p>
                        Click "Edit" in the Library panel to edit the offer
                        banner sentences.
                      </p>
                    </div>
                  </div>
                )}

                <div
                  className={`form-inner-content ${!offerFormActive ? "inactive-form" : "active-form"}`}
                >
                  <h2 className="form-header-title">Offer banner</h2>
                  <p className="form-header-desc">
                    Enter your most beautiful offer copy to create premium,
                    pixel-perfect marketing assets for our global atelier store.
                  </p>

                  {/* <h3 className="form-section-title">Offer banner</h3> */}

                  <form onSubmit={handleOfferSubmit}>
                    <div className="form-grid">
                      <div className="form-group">
                        <label>
                          Text 1 <span className="required">*</span>
                        </label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Enter banner text"
                          value={offerForm.text1}
                          onChange={(e) =>
                            setOfferForm((prev) => ({
                              ...prev,
                              text1: e.target.value,
                            }))
                          }
                          disabled={!offerFormActive}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>
                          Text 2 <span className="required">*</span>
                        </label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Enter subtitle text"
                          value={offerForm.text2}
                          onChange={(e) =>
                            setOfferForm((prev) => ({
                              ...prev,
                              text2: e.target.value,
                            }))
                          }
                          disabled={!offerFormActive}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>
                          Text 3 <span className="required">*</span>
                        </label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Enter button text"
                          value={offerForm.text3}
                          onChange={(e) =>
                            setOfferForm((prev) => ({
                              ...prev,
                              text3: e.target.value,
                            }))
                          }
                          disabled={!offerFormActive}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>
                          Text 4 <span className="required">*</span>
                        </label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Enter redirect link"
                          value={offerForm.text4}
                          onChange={(e) =>
                            setOfferForm((prev) => ({
                              ...prev,
                              text4: e.target.value,
                            }))
                          }
                          disabled={!offerFormActive}
                          required
                        />
                      </div>
                    </div>

                    <div className="form-action-row mt-4">
                      <button
                        type="button"
                        className="cancel-btn"
                        onClick={handleOfferCancel}
                        disabled={!offerFormActive}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="submit-btn"
                        disabled={!offerFormActive}
                      >
                        Save Changes
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              {/* Offer Banner Library Section */}
              <div className="banner-library-section">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h2 className="library-title m-0">Library</h2>
                  <button
                    type="button"
                    onClick={handleEditOfferClick}
                    className="btn d-flex align-items-center gap-1 p-0 fw-bold"
                    style={{
                      color: "#8b5cf6",
                      fontSize: "13px",
                      background: "none",
                      border: "none",
                    }}
                  >
                    <FiEdit size={12} /> Edit
                  </button>
                </div>

                <div className="library-list offer-library-list">
                  {[
                    { val: offerTexts.text1, num: "1" },
                    { val: offerTexts.text2, num: "2" },
                    { val: offerTexts.text3, num: "3" },
                    { val: offerTexts.text4, num: "4" },
                  ].map((item, idx) => (
                    <div
                      key={idx}
                      className="d-flex align-items-center gap-3"
                      style={{
                        padding: "16px",
                        borderRadius: "8px",
                        border: offerFormActive
                          ? "1px solid #8b5cf6"
                          : "1px solid #e9d5ff",
                        background: "#ffffff",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                        transition: "all 0.2s ease",
                        marginBottom: "16px",
                        width: "100%",
                        boxSizing: "border-box",
                      }}
                    >
                      <div
                        className="d-flex align-items-center justify-content-center fw-bold"
                        style={{
                          width: "32px",
                          height: "32px",
                          background: "#e5e7eb",
                          borderRadius: "50%",
                          fontSize: "14px",
                          color: "#111827",
                          flexShrink: 0,
                        }}
                      >
                        {item.num}
                      </div>
                      <div
                        style={{
                          fontSize: "13px",
                          fontWeight: 500,
                          color: "#111827",
                          textAlign: "start",
                          lineHeight: "1.4",
                        }}
                      >
                        {item.val}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="banner-content-grid">
              <div className="banner-form-section">
                {!isFormActive && (
                  <div className="form-inactive-overlay">
                    <div className="form-inactive-hint">
                      <i
                        className="bi bi-file-earmark-plus"
                        style={{ fontSize: 20, color: "#7c3aed" }}
                      ></i>
                      <p>
                        Select a banner to edit, or add a new scheduled banner
                        from the library panel.
                      </p>
                    </div>
                  </div>
                )}

                <div
                  className={`form-inner-content ${!isFormActive ? "inactive-form" : "active-form"}`}
                >
                  <h2 className="form-header-title">
                    {formMode === "edit-active"
                      ? "Edit Active Banner"
                      : formMode === "edit-scheduled"
                        ? "Edit Scheduled Banner"
                        : "Create Scheduled Banner"}
                  </h2>
                  <p className="form-header-desc">
                    {formMode === "edit-active"
                      ? "Update this active slot. Changes go live immediately."
                      : "Design and schedule a banner. It will auto-promote when an active banner expires."}
                  </p>

                  <div
                    className="upload-box"
                    onClick={(e) => {
                      if (e.target.id === "banner-upload") return;
                      if (isFormActive) {
                        document.getElementById("banner-upload").click();
                      }
                    }}
                  >
                    <input
                      type="file"
                      id="banner-upload"
                      accept="image/*"
                      onChange={handleImageChange}
                      disabled={!isFormActive}
                    />
                    {form.image ? (
                      <img
                        src={form.image}
                        alt="Preview"
                        className="preview-image"
                      />
                    ) : (
                      <>
                        <FiUploadCloud className="upload-icon" />
                        <p className="upload-text">
                          Drag or upload the hero banner
                        </p>
                        <p className="upload-dim">JPG, PNG, WEBP · Max 5 MB</p>
                      </>
                    )}
                  </div>

                  <h3 className="form-section-title">Banner Information</h3>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>
                        Banner Title <span className="required">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. Summer Collection"
                        value={form.title}
                        onChange={(e) => setField("title", e.target.value)}
                        disabled={!isFormActive}
                      />
                    </div>
                    <div className="form-group">
                      <label>Subtitle</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. Exclusive Drop"
                        value={form.subtitle}
                        onChange={(e) => setField("subtitle", e.target.value)}
                        disabled={!isFormActive}
                      />
                    </div>
                    <div className="form-group">
                      <label>CTA Text</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. Shop Now"
                        value={form.ctaText}
                        onChange={(e) => setField("ctaText", e.target.value)}
                        disabled={!isFormActive}
                      />
                    </div>
                    <div className="form-group">
                      <label>Redirect Link</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. /shop/summer"
                        value={form.redirectLink}
                        onChange={(e) =>
                          setField("redirectLink", e.target.value)
                        }
                        disabled={!isFormActive}
                      />
                    </div>
                  </div>

                  <h3 className="form-section-title">
                    {formMode === "edit-active"
                      ? "Active Period"
                      : "Schedule Period"}
                  </h3>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>
                        START DATE <span className="required">*</span>
                      </label>
                      <div className="form-input-wrap">
                        <input
                          type="date"
                          className="form-input"
                          value={form.startDate}
                          min={today}
                          onChange={(e) =>
                            setField("startDate", e.target.value)
                          }
                          disabled={!isFormActive}
                        />
                        <FiCalendar className="input-icon" />
                      </div>
                    </div>
                    <div className="form-group">
                      <label>
                        END DATE <span className="required">*</span>
                      </label>
                      <div className="form-input-wrap">
                        <input
                          type="date"
                          className="form-input"
                          value={form.endDate}
                          min={form.startDate || today}
                          onChange={(e) => setField("endDate", e.target.value)}
                          disabled={!isFormActive}
                        />
                        <FiCalendar className="input-icon" />
                      </div>
                    </div>
                  </div>

                  <div className="form-action-row">
                    <button
                      className="cancel-btn"
                      onClick={closeForm}
                      disabled={!isFormActive}
                    >
                      Cancel
                    </button>
                    <button
                      className="submit-btn"
                      onClick={handleSubmit}
                      disabled={!isFormActive}
                    >
                      {formMode === "edit-active"
                        ? "Update Active Banner"
                        : formMode === "edit-scheduled"
                          ? "Update Scheduled Banner"
                          : "Schedule Banner"}
                    </button>
                  </div>
                </div>
              </div>

              <div className="banner-library-section">
                <h2 className="library-title">Library</h2>
                <div className="library-tabs">
                  <div
                    className={`library-tab ${activeTab === "active" ? "active" : ""}`}
                    onClick={() => switchTab("active")}
                  >
                    Active ({activeSlots.length})
                  </div>
                  <div
                    className={`library-tab ${activeTab === "schedule" ? "active" : ""}`}
                    onClick={() => switchTab("schedule")}
                  >
                    Schedule ({scheduled.length})
                  </div>
                </div>

                <div className="library-list">
                  {activeTab === "active" &&
                    activeSlots.map((banner) => {
                      const expired = isExpired(banner);
                      return (
                        <div
                          className={`library-card ${expired ? "card-expired" : banner.isDefault ? "card-default" : "card-live"}`}
                          key={banner.id}
                        >
                          <div className="card-image-wrap">
                            <img
                              src={banner.image}
                              alt={banner.title}
                              className="card-image"
                            />
                            <div
                              className={`card-badge ${expired ? "badge-expired" : banner.isDefault ? "badge-default" : "badge-active"}`}
                            >
                              {expired
                                ? "EXPIRED"
                                : banner.isDefault
                                  ? "DEFAULT"
                                  : "ACTIVE"}
                            </div>
                            <div className="card-slot-label">
                              Slot {banner.slotIndex + 1}
                            </div>
                          </div>

                          <div className="card-info">
                            <h4 className="card-title">{banner.title}</h4>

                            {/* {banner.isDefault && !expired && (
                          <p className="card-default-note">🔵 Default banner — edit to replace</p>
                        )} */}

                            <div className="card-meta">
                              <div className="card-date">
                                <FiCalendar />{" "}
                                {formatDateLabel(
                                  banner.startDate,
                                  banner.endDate,
                                )}
                              </div>
                              <div className="card-actions">
                                <button
                                  className="action-btn edit"
                                  title="Edit this banner"
                                  onClick={() => {
                                    openForm("edit-active", banner);
                                    setActiveTab("active");
                                  }}
                                >
                                  <FiEdit size={14} />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                  {activeTab === "schedule" && (
                    <>
                      <div
                        className={`add-schedule-banner ${formMode === "create-scheduled" ? "add-banner-active" : ""}`}
                        onClick={() => openForm("create-scheduled")}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) =>
                          e.key === "Enter" && openForm("create-scheduled")
                        }
                      >
                        <span className="add-banner-plus">+</span>
                        <span className="add-banner-label">
                          Add New Scheduled Banner
                        </span>
                      </div>

                      {sortedScheduled.length === 0 && (
                        <div className="empty-schedule">
                          <p>No scheduled banners yet.</p>
                          <p>
                            Create one above — it will auto-promote when an
                            active banner expires.
                          </p>
                        </div>
                      )}

                      {sortedScheduled.map((banner, idx) => (
                        <div
                          className="library-card card-scheduled"
                          key={banner.id}
                        >
                          <div className="card-image-wrap">
                            <img
                              src={banner.image}
                              alt={banner.title}
                              className="card-image"
                            />
                            <div className="card-badge badge-scheduled">
                              SCHEDULED
                            </div>
                            <div className="card-slot-label">
                              #{idx + 1} in queue
                            </div>
                          </div>
                          <div className="card-info">
                            <h4 className="card-title">{banner.title}</h4>
                            <div className="card-meta">
                              <div className="card-date">
                                <FiCalendar />{" "}
                                {formatDateLabel(
                                  banner.startDate,
                                  banner.endDate,
                                )}
                              </div>
                              <div className="card-actions">
                                <button
                                  className="action-btn edit"
                                  title="Edit"
                                  onClick={() =>
                                    openForm("edit-scheduled", banner)
                                  }
                                >
                                  <FiEdit size={14} />
                                </button>
                                <button
                                  className="action-btn delete"
                                  title="Delete"
                                  onClick={() => deleteScheduled(banner.id)}
                                >
                                  <FiTrash2 size={14} />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title="Confirm Delete"
        message="Are you sure you want to Delete this Banner ?"
        confirmText="Delete"
        isDanger={true}
      />
    </div>
  );
}

export default BannerManagement;
