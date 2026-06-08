import { useNavigate } from 'react-router-dom';
import { IoIosArrowForward } from "react-icons/io";
import { useProducts } from '../../context/ProductsContext';
import '../../assets/styles/DealSections.css';

const DealSections = () => {
  const navigate = useNavigate();
  const { products: dbProducts, loading } = useProducts();

  const getSubCategoryProducts = (subCategoryName, sampleProducts) => {
    if (loading || !dbProducts || dbProducts.length === 0) {
      return sampleProducts;
    }
    const filtered = dbProducts.filter(
      (p) => (p.subCategory || '').toLowerCase() === subCategoryName.toLowerCase()
    );
    if (filtered.length === 0) {
      return sampleProducts;
    }
    // Sort by discount descending
    const sorted = [...filtered].sort((a, b) => Number(b.discount || 0) - Number(a.discount || 0));
    
    const result = [];
    for (let i = 0; i < 4; i++) {
      if (sorted[i]) {
        result.push({
          id: sorted[i].id || sorted[i].productId,
          name: sorted[i].brand || sorted[i].brandName || sorted[i].name,
          discount: `Min. ${sorted[i].discount}% off`,
          image: sorted[i].image,
          isDb: true,
          productData: sorted[i]
        });
      } else {
        // Pad with sample products if we have fewer than 4 items
        const sample = sampleProducts[i - sorted.length];
        if (sample) result.push(sample);
      }
    }
    return result;
  };

  const dealCategories = [
    {
      id: 'school-bags',
      title: 'Deals on school bags',
      filterKey: 'bag',
      subCategoryName: 'School Bag',
      products: getSubCategoryProducts('School Bag', [
        { id: 'sample-school-1', name: 'Vip', discount: 'Min. 25% off', image: '../../assets/images/school1.svg' },
        { id: 'sample-school-2', name: 'Rubeen', discount: 'Min. 55% off', image: '../../assets/images/school2.svg' },
        { id: 'sample-school-3', name: 'Safari', discount: 'Min. 35% off', image: '../../assets/images/school3.svg' },
        { id: 'sample-school-4', name: 'Sky bags', discount: 'Min. 45% off', image: '../../assets/images/school4.svg' },
      ]),
    },
    {
      id: 'travel-bags',
      title: 'Deals on travel bags',
      filterKey: 'bag',
      subCategoryName: 'Travel Bag',
      products: getSubCategoryProducts('Travel Bag', [
        { id: 'sample-travel-1', name: 'safari', discount: 'Min. 25% off', image: '../../assets/images/travel1.svg' },
        { id: 'sample-travel-2', name: 'Rubeen', discount: 'Min. 55% off', image: '../../assets/images/travel2.svg' },
        { id: 'sample-travel-3', name: 'sky Bags', discount: 'Min. 35% off', image: '../../assets/images/travel3.svg' },
        { id: 'sample-travel-4', name: 'Rubeen', discount: 'Min. 45% off', image: '../../assets/images/travel4.svg' },
      ]),
    },
    {
      id: 'hand-bags',
      title: 'Deals on hand bags',
      filterKey: 'bag',
      subCategoryName: 'Hand Bag',
      products: getSubCategoryProducts('Hand Bag', [
        { id: 'sample-hand-1', name: 'hike', discount: 'Min. 25% off', image: '../../assets/images/hand1.svg' },
        { id: 'sample-hand-2', name: 'dialyobject', discount: 'Min. 55% off', image: '../../assets/images/hand2.svg' },
        { id: 'sample-hand-3', name: 'Lapurso', discount: 'Min. 35% off', image: '../../assets/images/hand3.svg' },
        { id: 'sample-hand-4', name: 'Motorola', discount: 'Min. 45% off', image: '../../assets/images/hand4.svg' },
      ]),
    },
  ];

  const getImageUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
      return path;
    }
    return new URL(path, import.meta.url).href;
  };

  const handleRedirect = (categoryKey, subCategoryName) => {
    navigate('/AllProducts', {
      state: {
        filters: {
          category: categoryKey,
          bags: [subCategoryName],
        },
      },
    });
  };

  const handleProductClick = (product, subCategoryName) => {
    const rawBrandName = product.productData 
      ? (product.productData.brand || product.productData.brandName) 
      : product.name;
    
    const filters = {
      category: 'bag',
      bags: [subCategoryName]
    };

    if (rawBrandName) {
      let filterBrand = rawBrandName;
      const lower = rawBrandName.toLowerCase();
      if (lower === 'skybags' || lower === 'sky bags') {
        filterBrand = 'Sky bags';
      } else if (lower === 'vip') {
        filterBrand = 'VIP';
      } else if (lower === 'rubeen' || lower === 'rubee bags') {
        filterBrand = 'Rubee bags';
      } else if (lower === 'safari') {
        filterBrand = 'Safari';
      } else if (lower === 'puma') {
        filterBrand = 'Puma';
      } else if (lower === 'american tourister' || lower === 'american tourist') {
        filterBrand = 'American Tourister';
      } else if (lower === 'wildcraft') {
        filterBrand = 'Wildcraft';
      }
      filters.brands = [filterBrand];
    }

    navigate('/AllProducts', {
      state: {
        filters
      }
    });
  };

  return (
    <div className="dashboard-container container">
      {dealCategories.map((category) => (
        <div key={category.id} className="category-card">
          
          {/* Header Row */}
          <div className="category-header">
            <h2 className="category-title">{category.title}</h2>
            <button 
              className="arrow-btn" 
              aria-label="View more"
              onClick={() => handleRedirect(category.filterKey, category.subCategoryName)}
            >
              <span className="arrow-icon"> <IoIosArrowForward /> </span>
            </button>
          </div>

          {/* 2x2 Product Grid */}
          <div className="products-grid">
            {category.products.map((product) => (
              <div 
                key={product.id} 
                className="product-item"
                onClick={() => handleProductClick(product, category.subCategoryName)}
                style={{ cursor: 'pointer' }}
              >
                <div className="product-image-wrapper">
                  <img 
                    src={getImageUrl(product.image)} 
                    alt={product.name} 
                    className="product-img" 
                  />
                </div>
                <div className="product-info">
                  <span className="product-name">{product.name}</span>
                  <span className="product-discount">{product.discount}</span>
                </div>
              </div>
            ))}
          </div>

        </div>
      ))}
    </div>
  );
};

export default DealSections;