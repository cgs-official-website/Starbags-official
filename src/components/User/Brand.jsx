import { useNavigate } from 'react-router-dom';
import '../../assets/styles/Brand.css'

// 1. Import the images explicitly at the top
import skybagsLogo from '../../assets/images/brand1.jpg';
import wildcraftLogo from '../../assets/images/brand2.jpg';
import americanTouristerLogo from '../../assets/images/brand3.jpg';
// import safariLogo from '../../assets/images/brand4.jpg';
import safariLogo from '../../assets/images/image 75.png';

const Brand = () => {
  const navigate = useNavigate();

  // 2. Assign the imported variables directly to the keys (no quotes!)
  const brands = [
    {
      id: 'skybags',
      name: 'Skybags',
      logo: skybagsLogo, 
    },
    {
      id: 'american-tourister',
      name: 'American Tourister',
      logo: americanTouristerLogo,
    },
    {
      id: 'wildcraft',
      name: 'Wildcraft',
      logo: wildcraftLogo,
    },
    {
      id: 'safari',
      name: 'Safari',
      logo: safariLogo,
    },
  ];

  const handleBrandClick = (brand) => {
    let filterBrandName = brand.name;
    if (brand.name === 'Skybags') {
      filterBrandName = 'Sky bags';
    }
    navigate('/AllProducts', {
      state: {
        filters: {
          category: 'bag',
          brands: [filterBrandName]
        }
      }
    });
  };

  return (
    <div className="brands-container container my-3 ">
      <h3 className="brands-heading" style={{ fontWeight: "600" }}>Top Brands</h3>
      <div className="brands-grid">
        {brands.map((brand) => (
          <div
            key={brand.id}
            onClick={() => handleBrandClick(brand)}
            className="brand-card"
          >
            <img 
              src={brand.logo} 
              alt={brand.name} 
              className="brand-logo"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default Brand;