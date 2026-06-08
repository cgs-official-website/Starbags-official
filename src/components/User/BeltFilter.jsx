import { useNavigate } from "react-router-dom";
import { FaArrowRight } from "react-icons/fa6";
import HomeProduct from "./HomeProduct";
import { useProducts } from "../../context/ProductsContext";

const BeltFilter = () => {
  const navigate = useNavigate();
  const { products, loading } = useProducts();

  // Filter only belt-category products from live Firestore data
  const beltProducts = products.filter(
    (product) => product.category?.toLowerCase() === "belt"
  );

  const handleViewAllBelts = () => {
    navigate("/AllProducts", {
      state: {
        filters: {
          category: "belt",
        },
      },
    });
  };

  return (
    <section className="my-4">
      <div className="container d-flex justify-content-between align-items-center mb-2">
        <h3 style={{ fontWeight: "600", margin: 0 }}>Belts</h3>
        <span
          onClick={handleViewAllBelts}
          className="text-decoration-none"
          style={{ color: "var(--levender, #8B5CF6)", cursor: "pointer", fontWeight: "500" }}
        >
          View All <FaArrowRight />
        </span>
      </div>

      {loading ? (
        <div className="container">
          <p className="text-muted py-3">Loading belts...</p>
        </div>
      ) : beltProducts.length > 0 ? (
        <HomeProduct products={beltProducts} />
      ) : (
        <div className="container">
          <p className="text-muted py-3">No matching premium belts available.</p>
        </div>
      )}
    </section>
  );
};

export default BeltFilter;