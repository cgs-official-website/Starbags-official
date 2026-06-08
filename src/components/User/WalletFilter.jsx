import { useNavigate } from "react-router-dom";
import { FaArrowRight } from "react-icons/fa6";
import HomeProduct from "./HomeProduct";
import { useProducts } from "../../context/ProductsContext";

const WalletFilter = () => {
  const navigate = useNavigate();
  const { products, loading } = useProducts();

  // Filter only wallet-category products from live Firestore data
  const walletProducts = products.filter(
    (product) => product.category?.toLowerCase() === "wallet"
  );

  const handleViewAllWallets = () => {
    navigate("/AllProducts", {
      state: {
        filters: {
          category: "wallet",
        },
      },
    });
  };

  return (
    <section className="my-4">
      <div className="container d-flex justify-content-between align-items-center mb-2">
        <h3 style={{ fontWeight: "600", margin: 0 }}>Wallets</h3>
        <span
          onClick={handleViewAllWallets}
          className="text-decoration-none"
          style={{ color: "var(--levender, #8B5CF6)", cursor: "pointer", fontWeight: "500" }}
        >
          View All <FaArrowRight />
        </span>
      </div>

      {loading ? (
        <div className="container">
          <p className="text-muted py-3">Loading wallets...</p>
        </div>
      ) : walletProducts.length > 0 ? (
        <HomeProduct products={walletProducts} />
      ) : (
        <div className="container">
          <p className="text-muted py-3">No matching premium wallets available.</p>
        </div>
      )}
    </section>
  );
};

export default WalletFilter;