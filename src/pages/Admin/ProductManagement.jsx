import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import AdminSidebar from "../../components/Admin/AdminSidebar";
import {
  FiFilter,
  FiPlus,
  FiEdit,
  FiTrash2,
  FiRefreshCw,
  FiArrowUpRight,
  FiArrowDownRight,
} from "react-icons/fi";
import ConfirmModal from "../../components/Admin/ConfirmModal";
import { BsBag, BsGraphDown, BsBoxSeam, BsClockHistory } from "react-icons/bs";
import toast, { Toaster } from "react-hot-toast";
import "../../assets/styles/ProductManagement.css";
import AdminHeader from "../../components/Admin/AdminHeader";
import {
  CardSkeleton,
  TableSkeleton,
} from "../../components/Admin/AdminSkeleton";
import {
  collection,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../firebase";

function ProductManagement() {
  const navigate = useNavigate();
  const location = useLocation();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    const fetchProducts = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "products"));
        const prodsList = [];
        querySnapshot.forEach((docSnap) => {
          prodsList.push({ ...docSnap.data() });
        });
        // Sort products by newest first
        prodsList.sort((a, b) => new Date(b.createdAt || b.updatedAt || 0) - new Date(a.createdAt || a.updatedAt || 0));
        setProducts(prodsList);
      } catch (err) {
        console.error("Error fetching products:", err);
        toast.error("Failed to load products!");
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const [stockBy, setStockBy] = useState(() => {
    if (location.state && location.state.stockBy) {
      return location.state.stockBy;
    }
    return "Stock by";
  });
  const [category, setCategory] = useState("Category");
  const [subCategory, setSubCategory] = useState("Sub Category");
  const [brandFilter, setBrandFilter] = useState("Brand");
  const [materialFilter, setMaterialFilter] = useState("Material");
  const [showAddPage, setShowAddPage] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editIndex, setEditIndex] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const getInitialProductState = (cat = "Bag") => ({
    id: `SBP-${cat === "Wallet" ? "WLT" : cat === "Belt" ? "BLT" : "BAG"}-${Math.floor(
      Math.random() * 100000,
    )
      .toString()
      .padStart(5, "0")}`,
    image:
      "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=100&h=100&fit=crop",
    images: [null, null, null, null, null],
    name: "",
    category: "Bag",
    subCategory: "",
    material: "",
    brand: "",
    size: "",
    capacity: "",
    price: "",
    discount: "",
    stocks: "",
    description: "",
  });

  const [newProduct, setNewProduct] = useState(getInitialProductState());

  const resetForm = () => {
    setNewProduct(getInitialProductState());
    setIsEditing(false);
    setEditIndex(null);
  };

  const handleCancel = () => {
    setShowAddPage(false);
    resetForm();
  };

  const filteredProducts = products.filter((p) => {
    let matchStock = true;
    if (stockBy === "In Stock") matchStock = parseInt(p.stocks) > 0;
    if (stockBy === "Out of Stock") matchStock = parseInt(p.stocks) === 0;

    let matchCategory = true;
    if (category !== "Category") matchCategory = p.category === category;

    let matchSubCategory = true;
    if (category === "Bag" && subCategory !== "Sub Category") {
      matchSubCategory = p.subCategory === subCategory;
    }

    let matchBrand = true;
    if (category === "Bag" && brandFilter !== "Brand") {
      matchBrand = p.brand === brandFilter;
    }

    let matchMaterial = true;
    if (materialFilter !== "Material") {
      matchMaterial = p.material === materialFilter;
    }

    return matchStock && matchCategory && matchSubCategory && matchBrand && matchMaterial;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    const stockA = parseInt(a.stocks) || 0;
    const stockB = parseInt(b.stocks) || 0;
    if (stockBy === "Low to High") {
      return stockA - stockB;
    }
    if (stockBy === "High to Low") {
      return stockB - stockA;
    }
    return 0;
  });

  const totalPages = Math.ceil(sortedProducts.length / rowsPerPage) || 1;
  const currentProducts = sortedProducts.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage,
  );

  const confirmDelete = (product) => {
    setProductToDelete(product);
    setShowDeleteModal(true);
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setProductToDelete(null);
  };

  const executeDelete = async () => {
    if (productToDelete !== null) {
      try {
        await deleteDoc(doc(db, "products", productToDelete.id));
        const originalIndex = products.findIndex((p) => p === productToDelete);
        if (originalIndex !== -1) {
          const newProds = [...products];
          newProds.splice(originalIndex, 1);
          setProducts(newProds);
          toast.success("Product deleted successfully!");
        }
      } catch (err) {
        console.error("Error deleting product:", err);
        toast.error("Failed to delete product!");
      }
    }
    setShowDeleteModal(false);
    setProductToDelete(null);
  };

  const handleEdit = (productToEdit) => {
    const originalIndex = products.findIndex((p) => p === productToEdit);
    setNewProduct({
      ...productToEdit,
      capacity:
        productToEdit.category === "Bag"
          ? productToEdit.size
          : productToEdit.capacity || "",
      images:
        productToEdit.images && productToEdit.images.some(Boolean)
          ? productToEdit.images
          : [productToEdit.image, null, null, null, null],
    });
    setIsEditing(true);
    setEditIndex(originalIndex);
    setShowAddPage(true);
  };

  const handleResetFilter = () => {
    setStockBy("Stock by");
    setCategory("Category");
    setSubCategory("Sub Category");
    setBrandFilter("Brand");
    setMaterialFilter("Material");
    setCurrentPage(1);
  };

  const handleImageUpload = async (index, event) => {
    const files = Array.from(event.target.files);
    if (!files.length) return;

    const newImages = [...newProduct.images];
    let currentIndex = index;

    for (let i = 0; i < files.length && currentIndex < 5; i++) {
      const file = files[i];
      try {
        const base64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = (e) => {
            const img = new Image();
            img.src = e.target.result;
            img.onload = () => {
              const MAX_SIZE = 800;
              const size = Math.min(img.width, img.height);

              // Calculate center crop coordinates
              const startX = (img.width - size) / 2;
              const startY = (img.height - size) / 2;

              // Scale down if the image is larger than MAX_SIZE
              const targetSize = Math.min(size, MAX_SIZE);

              const canvas = document.createElement("canvas");
              canvas.width = targetSize;
              canvas.height = targetSize;

              const ctx = canvas.getContext("2d");
              // Fill white background in case of transparency (since we output as JPEG)
              ctx.fillStyle = "#FFFFFF";
              ctx.fillRect(0, 0, targetSize, targetSize);

              // Crop, resize, and draw onto canvas
              ctx.drawImage(
                img,
                startX,
                startY,
                size,
                size,
                0,
                0,
                targetSize,
                targetSize,
              );

              // Output heavily compressed Base64 JPEG
              const compressedBase64 = canvas.toDataURL("image/jpeg", 0.6);
              resolve(compressedBase64);
            };
            img.onerror = () => reject(new Error("Invalid image file"));
          };
          reader.onerror = (error) => reject(error);
        });
        newImages[currentIndex] = base64;
        currentIndex++;
      } catch (err) {
        console.error("Error reading image file:", err);
        toast.error("Failed to process image!");
      }
    }

    setNewProduct((prev) => ({
      ...prev,
      images: newImages,
      image: newImages[0] || prev.image,
    }));

    event.target.value = "";
  };

  const removeImage = (index) => {
    const newImages = [...newProduct.images];
    newImages[index] = null;
    setNewProduct({
      ...newProduct,
      images: newImages,
      image:
        newImages[0] ||
        "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=100&h=100&fit=crop", // fallback
    });
  };

  const renderImageBox = (index, isMain = false) => {
    const hasImage = newProduct.images[index];
    const className = isMain ? "pm-upload-main" : "pm-upload-sub";

    return (
      <div
        className={className}
        style={{ position: "relative", overflow: "hidden", cursor: "pointer" }}
        onClick={() => document.getElementById(`upload-img-${index}`).click()}
      >
        {hasImage ? (
          <>
            <img
              src={hasImage}
              alt={`upload-${index}`}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeImage(index);
              }}
              style={{
                position: "absolute",
                top: 6,
                right: 6,
                background: "rgba(0,0,0,0.6)",
                color: "#fff",
                border: "none",
                borderRadius: "50%",
                width: 22,
                height: 22,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                zIndex: 10,
              }}
            >
              <i className="bi bi-x" style={{ fontSize: 16 }}></i>
            </button>
          </>
        ) : isMain ? (
          <>
            <i className="bi bi-cloud-arrow-up"></i>
            <span>Upload Cover Image</span>
            <small>1200 x 1200 px recommended</small>
          </>
        ) : (
          <i className="bi bi-camera"></i>
        )}
        <input
          type="file"
          id={`upload-img-${index}`}
          accept="image/*"
          multiple
          style={{ display: "none" }}
          onChange={(e) => handleImageUpload(index, e)}
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    );
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.price) {
      toast.error("Name and Price are required!");
      return;
    }
    if (
      newProduct.category === "Bag" &&
      (!newProduct.capacity || newProduct.capacity.trim() === "")
    ) {
      toast.error("Please select at least one Capacity!");
      return;
    }
    if (
      newProduct.category === "Belt" &&
      (!newProduct.size || newProduct.size.trim() === "")
    ) {
      toast.error("Please select at least one Size!");
      return;
    }

    const productToSave = {
      ...newProduct,
      brand: newProduct.category === "Bag" ? newProduct.brand : "-",
      subCategory: newProduct.category === "Bag" ? newProduct.subCategory : "-",
      capacity: newProduct.category === "Bag" ? newProduct.capacity : "-",
      size:
        newProduct.category === "Bag"
          ? newProduct.capacity
          : newProduct.category === "Belt"
            ? newProduct.size
            : "-",
      updatedAt: new Date().toISOString(),
      createdAt: isEditing
        ? newProduct.createdAt || new Date().toISOString()
        : new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, "products", productToSave.id), productToSave);
      if (isEditing && editIndex !== null) {
        const updated = [...products];
        updated[editIndex] = productToSave;
        setProducts(updated);
        toast.success("Product updated successfully!");
      } else {
        setProducts([productToSave, ...products]);
        toast.success("Product added successfully!");
      }
      handleCancel();
    } catch (err) {
      console.error("Error saving product:", err);
      toast.error("Failed to save product to database!");
    }
  };

  if (showAddPage) {
    return (
      <div className="admin-layout pm-main">
        <Toaster position="top-right" />
        <AdminSidebar />
        <div className="admin-main" style={{ padding: 0 }}>
          <AdminHeader
            title="Product Management"
            subtitle="Manage your products."
          />
          <div className="pm-add-page">
            <div
              className="d-flex align-items-center gap-2 mb-4"
              style={{ padding: "0 24px" }}
            >
              <button
                type="button"
                onClick={handleCancel}
                className="btn btn-link text-dark p-0 text-decoration-none d-flex align-items-center gap-1"
              >
                <i className="bi bi-arrow-left" style={{ fontSize: 14 }}></i>
                <span
                  style={{ fontSize: 12, color: "#111827", fontWeight: 500 }}
                >
                  Product management
                </span>
              </button>
              <span style={{ fontSize: 12, color: "#8b5cf6", fontWeight: 500 }}>
                / {isEditing ? "Edit product" : "Add product"}
              </span>
            </div>

            <form onSubmit={handleAddSubmit}>
              <div className="pm-add-grid">
                <div className="pm-panel">
                  <div className="pm-panel-header">
                    <h2 className="pm-panel-title">Product Details</h2>
                    <i className="bi bi-archive pm-panel-icon"></i>
                  </div>

                  <div
                    className={
                      newProduct.category === "Bag"
                        ? "pm-form-row-2"
                        : "pm-add-form-group"
                    }
                  >
                    <div className="pm-add-form-group">
                      <label>Category Type</label>
                      <select
                        className="pm-add-input pm-add-select"
                        value={newProduct.category}
                        required
                        onChange={(e) => {
                          const newCat = e.target.value;
                          const prefix =
                            newCat === "Wallet"
                              ? "WLT"
                              : newCat === "Belt"
                                ? "BLT"
                                : "BAG";
                          const idSuffix = newProduct.id.split("-").pop();
                          setNewProduct({
                            ...newProduct,
                            category: newCat,
                            id: `SBP-${prefix}-${idSuffix}`,
                          });
                        }}
                      >
                        <option>Bag</option>
                        <option>Belt</option>
                        <option>Wallet</option>
                      </select>
                    </div>
                    {newProduct.category === "Bag" && (
                      <div className="pm-add-form-group">
                        <label>Sub Category</label>
                        <select
                          className="pm-add-input pm-add-select"
                          value={newProduct.subCategory || ""}
                          required
                          onChange={(e) =>
                            setNewProduct({
                              ...newProduct,
                              subCategory: e.target.value,
                            })
                          }
                        >
                          <option value="">Choose Sub Category</option>
                          <option>Trolley Bag</option>
                          <option>Hand Bag</option>
                          <option>Lunch Bag</option>
                          <option>Office Bag</option>
                          <option>Travel Bag</option>
                          <option>School Bag</option>
                          <option>College Bag</option>
                        </select>
                      </div>
                    )}
                  </div>

                  <div className="pm-add-form-group">
                    <label>Material of the Product</label>
                    <select
                      className="pm-add-input pm-add-select"
                      value={newProduct.material || ""}
                      required
                      onChange={(e) =>
                        setNewProduct({
                          ...newProduct,
                          material: e.target.value,
                        })
                      }
                    >
                      <option value="">Choose Material</option>
                      <option>Leather</option>
                      <option>Canvas</option>
                    </select>
                  </div>

                  <div className="pm-add-form-group">
                    <label>Product Name</label>
                    <input
                      type="text"
                      className="pm-add-input"
                      placeholder="e.g. Midnight Suede Executive Tote"
                      value={newProduct.name}
                      required
                      onChange={(e) =>
                        setNewProduct({ ...newProduct, name: e.target.value })
                      }
                    />
                  </div>

                  {newProduct.category === "Bag" && (
                    <div className="pm-add-form-group">
                      <label className="mb-2 d-block">
                        Capacity (Select Multiple)
                      </label>
                      <div
                        className="d-flex gap-3 flex-wrap align-items-center "
                        style={{ minHeight: "52px" }}
                      >
                        {["20L", "30L", "40L"].map((cap) => {
                          const isChecked = (newProduct.capacity || "")
                            .split(",")
                            .map((s) => s.trim())
                            .includes(cap);
                          return (
                            <button
                              type="button"
                              key={cap}
                              className={`btn d-flex align-items-center gap-1 pm-size-chip ${isChecked ? "active-chip" : ""}`}
                              onClick={() => {
                                const currentCaps = newProduct.capacity
                                  ? newProduct.capacity
                                      .split(",")
                                      .map((s) => s.trim())
                                      .filter(Boolean)
                                  : [];
                                const nextCaps = currentCaps.includes(cap)
                                  ? currentCaps.filter((c) => c !== cap)
                                  : [...currentCaps, cap];
                                setNewProduct({
                                  ...newProduct,
                                  capacity: nextCaps.join(", "),
                                });
                              }}
                            >
                              {isChecked && (
                                <span
                                  className="d-inline-flex align-items-center justify-content-center text-white rounded-circle me-1"
                                  style={{
                                    width: "14px",
                                    height: "14px",
                                    backgroundColor: "#8b5cf6",
                                  }}
                                >
                                  <i
                                    className="bi bi-check"
                                    style={{
                                      fontSize: "12px",
                                      lineHeight: "1",
                                      fontWeight: "bold",
                                    }}
                                  ></i>
                                </span>
                              )}
                              {cap}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {newProduct.category === "Belt" && (
                    <div className="pm-add-form-group">
                      <label className="mb-2 d-block">
                        Size (Select Multiple)
                      </label>
                      <div
                        className="d-flex gap-3 flex-wrap align-items-center"
                        style={{ minHeight: "52px" }}
                      >
                        {["Small", "Medium", "Long"].map((sz) => {
                          const isChecked = (newProduct.size || "")
                            .split(",")
                            .map((s) => s.trim())
                            .includes(sz);
                          return (
                            <button
                              type="button"
                              key={sz}
                              className={`btn d-flex align-items-center gap-1 pm-size-chip ${isChecked ? "active-chip" : ""}`}
                              onClick={() => {
                                const currentSizes = newProduct.size
                                  ? newProduct.size
                                      .split(",")
                                      .map((s) => s.trim())
                                      .filter(Boolean)
                                  : [];
                                const nextSizes = currentSizes.includes(sz)
                                  ? currentSizes.filter((s) => s !== sz)
                                  : [...currentSizes, sz];
                                setNewProduct({
                                  ...newProduct,
                                  size: nextSizes.join(", "),
                                });
                              }}
                            >
                              {isChecked && (
                                <span
                                  className="d-inline-flex align-items-center justify-content-center text-white rounded-circle me-1"
                                  style={{
                                    width: "14px",
                                    height: "14px",
                                    backgroundColor: "#8b5cf6",
                                  }}
                                >
                                  <i
                                    className="bi bi-check"
                                    style={{
                                      fontSize: "12px",
                                      lineHeight: "1",
                                      fontWeight: "bold",
                                    }}
                                  ></i>
                                </span>
                              )}
                              {sz}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div
                    className={
                      newProduct.category === "Bag"
                        ? "pm-form-row-2"
                        : "pm-add-form-group"
                    }
                  >
                    <div className="pm-add-form-group">
                      <label>Product ID</label>
                      <input
                        type="text"
                        className="pm-add-input"
                        placeholder="SB-2024-XXXX"
                        value={newProduct.id}
                        required
                        onChange={(e) =>
                          setNewProduct({ ...newProduct, id: e.target.value })
                        }
                      />
                    </div>
                    {newProduct.category === "Bag" && (
                      <div className="pm-add-form-group">
                        <label>Brand</label>
                        <select
                          className="pm-add-input pm-add-select"
                          value={newProduct.brand || ""}
                          required
                          onChange={(e) =>
                            setNewProduct({
                              ...newProduct,
                              brand: e.target.value,
                            })
                          }
                        >
                          <option value="">Choose Brand</option>
                          <option>Puma</option>
                          <option>American Tourister</option>
                          <option>Sky bags</option>
                          <option>VIP</option>
                          <option>Safari</option>
                          <option>Rubee bags</option>
                          <option>Wildcraft</option>
                        </select>
                      </div>
                    )}
                  </div>

                  <div className="pm-form-row-3">
                    <div className="pm-add-form-group">
                      <label>No. of Stocks</label>
                      <input
                        type="number"
                        className="pm-add-input"
                        placeholder="0"
                        value={newProduct.stocks}
                        required
                        onChange={(e) =>
                          setNewProduct({
                            ...newProduct,
                            stocks: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="pm-add-form-group">
                      <label>Price (₹)</label>
                      <input
                        type="text"
                        className="pm-add-input"
                        placeholder="0.00"
                        value= {newProduct.price}
                        required
                        onChange={(e) =>
                          setNewProduct({
                            ...newProduct,
                            price: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="pm-add-form-group">
                      <label>Discount (%)</label>
                      <input
                        type="text"
                        className="pm-add-input"
                        placeholder="0"
                        value={newProduct.discount}
                        required
                        onChange={(e) =>
                          setNewProduct({
                            ...newProduct,
                            discount: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className="pm-right-col">
                  <div className="pm-panel">
                    <div className="pm-panel-header">
                      <h2 className="pm-panel-title">Product Images</h2>
                      <i className="bi bi-image pm-panel-icon"></i>
                    </div>
                    <div className="pm-image-grid">
                      {renderImageBox(0, true)}
                      {renderImageBox(1)}
                      {renderImageBox(2)}
                      {renderImageBox(3)}
                      {renderImageBox(4)}
                    </div>
                  </div>

                  <div className="pm-panel">
                    <div className="pm-panel-header">
                      <h2 className="pm-panel-title">
                        Product Short Description
                      </h2>
                      <i className="bi bi-file-text pm-panel-icon"></i>
                    </div>
                    <textarea
                      className="pm-textarea"
                      placeholder="Enter short description about the product..."
                      value={newProduct.description || ""}
                      required
                      onChange={(e) =>
                        setNewProduct({
                          ...newProduct,
                          description: e.target.value,
                        })
                      }
                    ></textarea>
                    <div className="pm-char-count">
                      Recommended: 150-200 characters
                    </div>
                  </div>

                  <div className="pm-add-actions">
                    <button
                      type="button"
                      className="pm-btn-outline"
                      onClick={handleCancel}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="pm-btn-solid">
                      {isEditing ? "Update Product" : "Publish Product"}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-layout pm-main">
      <Toaster position="top-right" />
      <AdminSidebar />
      <div className="admin-main">
        {/* Header */}
        <AdminHeader
          title="Product Management"
          subtitle="Manage your products."
        />

        <div className="pm-content">
          {loading ? (
            <>
              <CardSkeleton count={4} />
              <TableSkeleton rows={rowsPerPage} cols={10} />
            </>
          ) : (
            <>
              <div className="pm-stats-grid">
                <div className="pm-stat-card">
                  <div className="pm-stat-top">
                    <div>
                      <p className="pm-stat-title">Total Products</p>
                      <p className="pm-stat-value">{products.length}</p>
                    </div>
                    <div
                      className="pm-stat-icon"
                      style={{ background: "#e0e7ff", color: "#6366f1" }}
                    >
                      <BsBag />
                    </div>
                  </div>
                  <div
                    className={
                      products.length > 0 &&
                      products.filter((p) => parseInt(p.stocks) > 0).length /
                        products.length >=
                        0.5
                        ? "pm-stat-bottom pm-stat-up"
                        : "pm-stat-bottom pm-stat-down"
                    }
                  >
                    {products.length > 0 &&
                    products.filter((p) => parseInt(p.stocks) > 0).length /
                      products.length >=
                      0.5 ? (
                      <FiArrowUpRight style={{ fontSize: "16px" }} />
                    ) : (
                      <FiArrowDownRight style={{ fontSize: "16px" }} />
                    )}{" "}
                    {products.length > 0
                      ? Math.round(
                          (products.filter((p) => parseInt(p.stocks) > 0)
                            .length /
                            products.length) *
                            100,
                        )
                      : 0}
                    % Available
                  </div>
                </div>

                <div className="pm-stat-card">
                  <div className="pm-stat-top">
                    <div>
                      <p className="pm-stat-title">In Stock Products</p>
                      <p className="pm-stat-value">
                        {products.filter((p) => parseInt(p.stocks) > 0).length}
                      </p>
                    </div>
                    <div
                      className="pm-stat-icon"
                      style={{ background: "#d1fae5", color: "#10b981" }}
                    >
                      <BsGraphDown />
                    </div>
                  </div>
                  <div
                    className={
                      products.filter((p) => parseInt(p.stocks) === 0).length >
                      0
                        ? "pm-stat-bottom pm-stat-down"
                        : "pm-stat-bottom pm-stat-up"
                    }
                  >
                    {products.filter((p) => parseInt(p.stocks) === 0).length >
                    0 ? (
                      <FiArrowDownRight style={{ fontSize: "16px" }} />
                    ) : (
                      <FiArrowUpRight style={{ fontSize: "16px" }} />
                    )}{" "}
                    {products.filter((p) => parseInt(p.stocks) === 0).length}{" "}
                    Out of Stock
                  </div>
                </div>

                <div className="pm-stat-card">
                  <div className="pm-stat-top">
                    <div>
                      <p className="pm-stat-title">Out of Stock</p>
                      <p className="pm-stat-value">
                        {
                          products.filter((p) => parseInt(p.stocks) === 0)
                            .length
                        }
                      </p>
                    </div>
                    <div
                      className="pm-stat-icon"
                      style={{ background: "#ffedd5", color: "#f97316" }}
                    >
                      <BsBoxSeam />
                    </div>
                  </div>
                  <div className="pm-stat-bottom pm-stat-up">
                    <FiArrowUpRight style={{ fontSize: "16px" }} />{" "}
                    {products.filter((p) => parseInt(p.stocks) === 0).length}{" "}
                    items unavailable
                  </div>
                </div>

                <div className="pm-stat-card">
                  <div className="pm-stat-top">
                    <div>
                      <p className="pm-stat-title">Low Stock Items</p>
                      <p className="pm-stat-value">
                        {
                          products.filter(
                            (p) =>
                              parseInt(p.stocks) > 0 &&
                              parseInt(p.stocks) <= 10,
                          ).length
                        }
                      </p>
                    </div>
                    <div
                      className="pm-stat-icon"
                      style={{ background: "#fee2e2", color: "#ef4444" }}
                    >
                      <BsClockHistory />
                    </div>
                  </div>
                  <div
                    className={
                      products.filter(
                        (p) =>
                          parseInt(p.stocks) > 0 && parseInt(p.stocks) <= 10,
                      ).length > 0
                        ? "pm-stat-bottom pm-stat-down"
                        : "pm-stat-bottom pm-stat-up"
                    }
                  >
                    {products.filter(
                      (p) => parseInt(p.stocks) > 0 && parseInt(p.stocks) <= 10,
                    ).length > 0 ? (
                      <FiArrowDownRight style={{ fontSize: "16px" }} />
                    ) : (
                      <FiArrowUpRight style={{ fontSize: "16px" }} />
                    )}{" "}
                    Stock &le; 10 units
                  </div>
                </div>
              </div>

              <div className="pm-toolbar">
                <div className="pm-toolbar-left">
                  <button className="pm-filter-icon-btn">
                    <FiFilter />
                  </button>

                  <div className="pm-select-wrap">
                    <select
                      className="pm-select"
                      value={stockBy}
                      onChange={(e) => {
                        setStockBy(e.target.value);
                        setCurrentPage(1);
                      }}
                    >
                      <option>Stock by</option>
                      <option>In Stock</option>
                      <option>Out of Stock</option>
                      <option>Low to High</option>
                      <option>High to Low</option>
                    </select>
                    <i className="bi bi-chevron-down pm-select-arrow"></i>
                  </div>

                  <div className="pm-select-wrap">
                    <select
                      className="pm-select"
                      value={category}
                      onChange={(e) => {
                        setCategory(e.target.value);
                        setSubCategory("Sub Category");
                        setBrandFilter("Brand");
                      }}
                    >
                      <option>Category</option>
                      <option>Bag</option>
                      <option>Belt</option>
                      <option>Wallet</option>
                    </select>
                    <i className="bi bi-chevron-down pm-select-arrow"></i>
                  </div>

                  <div className="pm-select-wrap">
                    <select
                      className="pm-select"
                      value={materialFilter}
                      onChange={(e) => {
                        setMaterialFilter(e.target.value);
                        setCurrentPage(1);
                      }}
                    >
                      <option>Material</option>
                      <option>Leather</option>
                      <option>Canvas</option>
                    </select>
                    <i className="bi bi-chevron-down pm-select-arrow"></i>
                  </div>

                  {category === "Bag" && (
                    <>
                      <div className="pm-select-wrap">
                        <select
                          className="pm-select"
                          value={subCategory}
                          onChange={(e) => setSubCategory(e.target.value)}
                        >
                          <option>Sub Category</option>
                          <option>Trolley Bag</option>
                          <option>Hand Bag</option>
                          <option>Lunch Bag</option>
                          <option>Office Bag</option>
                          <option>Travel Bag</option>
                          <option>School Bag</option>
                          <option>College Bag</option>
                        </select>
                        <i className="bi bi-chevron-down pm-select-arrow"></i>
                      </div>

                      <div className="pm-select-wrap">
                        <select
                          className="pm-select"
                          value={brandFilter}
                          onChange={(e) => setBrandFilter(e.target.value)}
                        >
                          <option>Brand</option>
                          <option>Puma</option>
                          <option>American Tourister</option>
                          <option>Sky bags</option>
                          <option>VIP</option>
                          <option>Safari</option>
                          <option>Rubee bags</option>
                          <option>Wildcraft</option>
                        </select>
                        <i className="bi bi-chevron-down pm-select-arrow"></i>
                      </div>
                    </>
                  )}

                  <button className="pm-reset-btn" onClick={handleResetFilter}>
                    <FiRefreshCw /> Reset Filter
                  </button>
                </div>

                <button
                  className="pm-add-btn"
                  onClick={() => setShowAddPage(true)}
                >
                  <FiPlus /> Add product
                </button>
              </div>

              <div className="pm-table-container">
                <table className="pm-table">
                  <thead>
                    <tr>
                      <th>Product ID</th>
                      <th>Image</th>
                      <th>Product name</th>
                      <th>Category</th>
                      <th>Brand</th>
                      <th>Size</th>
                      <th>Price</th>
                      <th>Discount</th>
                      <th>Stocks</th>
                      <th>Edit / Delete</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentProducts.map((p, index) => (
                      <tr key={index}>
                        <td style={{ fontWeight: 500, color: "#111827" }}>
                          {p.id}
                        </td>
                        <td>
                          <img
                            src={p.image}
                            alt="product"
                            className="pm-product-image"
                          />
                        </td>
                        <td style={{ fontWeight: 500, color: "#4b5563" }}>
                          {p.name}
                        </td>
                        <td>{p.category}</td>
                        <td>{p.brand}</td>
                        <td>{p.size}</td>
                        <td style={{ fontWeight: 500, color: "#4b5563" }}>
                          ₹{p.price}
                        </td>
                        <td className="pm-discount-green">{p.discount}%</td>
                        <td>{p.stocks}</td>
                        <td>
                          <div className="pm-action-btns">
                            <button
                              className="pm-action-btn edit"
                              onClick={() => handleEdit(p)}
                            >
                              <FiEdit size={14} />
                            </button>
                            <button
                              className="pm-action-btn delete"
                              onClick={() => confirmDelete(p)}
                            >
                              <FiTrash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {currentProducts.length === 0 && (
                      <tr>
                        <td
                          colSpan="10"
                          style={{
                            textAlign: "center",
                            padding: "20px",
                            color: "#6b7280",
                          }}
                        >
                          No products found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                <div className="pm-pagination">
                  <span className="pm-page-info">
                    Showing{" "}
                    {sortedProducts.length === 0
                      ? 0
                      : (currentPage - 1) * rowsPerPage + 1}{" "}
                    to{" "}
                    {Math.min(currentPage * rowsPerPage, sortedProducts.length)}{" "}
                    of {sortedProducts.length} results
                  </span>
                  <div className="pm-page-controls">
                    <div className="pm-pages">
                      <button
                        className="pm-page-btn arrow"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage((p) => p - 1)}
                      >
                        &lt;
                      </button>
                      {[...Array(totalPages)].map((_, i) => (
                        <button
                          key={i}
                          className={`pm-page-btn ${currentPage === i + 1 ? "active" : ""}`}
                          onClick={() => setCurrentPage(i + 1)}
                        >
                          {i + 1}
                        </button>
                      ))}
                      <button
                        className="pm-page-btn arrow"
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage((p) => p + 1)}
                      >
                        &gt;
                      </button>
                    </div>
                    <div className="pm-rows-wrap">
                      Rows per page
                      <div style={{ position: "relative" }}>
                        <select
                          className="pm-rows-select"
                          value={rowsPerPage}
                          onChange={(e) => {
                            setRowsPerPage(Number(e.target.value));
                            setCurrentPage(1);
                          }}
                        >
                          <option value={5}>5</option>
                          <option value={10}>10</option>
                          <option value={20}>20</option>
                        </select>
                        <i
                          className="bi bi-chevron-down"
                          style={{
                            position: "absolute",
                            right: 8,
                            top: "50%",
                            transform: "translateY(-50%)",
                            fontSize: 10,
                            pointerEvents: "none",
                          }}
                        ></i>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={cancelDelete}
        onConfirm={executeDelete}
        title="Confirm Delete"
        message="Are you sure you want to Delete this Product ?"
        confirmText="Delete"
        isDanger={true}
      />
    </div>
  );
}

export default ProductManagement;
