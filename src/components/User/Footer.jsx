import "../../assets/styles/Footer.css";
import { FiPhone } from "react-icons/fi";
import { IoLocationOutline } from "react-icons/io5";
import { FaXTwitter } from "react-icons/fa6";
import { FaInstagram, FaFacebookF } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const Footer = () => {
  const navigate = useNavigate();
  const year = new Date().getFullYear();
  
  // Safe URL-encoded dynamic link targeted directly to the Perundurai - Bhavani road address
  const mapUrl = "https://www.google.com/maps/search/?api=1&query=Star+Bags+Perundhurai+-+Bhavani+Rd+Perundurai+Tamil+Nadu+638052";

  const handleCategoryClick = (e, category) => {
    e.preventDefault();
    navigate("/AllProducts", {
      state: { filters: { category } },
    });
  };

  return (
    <footer>
      <div className="container">
        {/* Row structured with dynamic flex spacing utilities */}
        <div className="d-flex flex-wrap justify-content-between py-4 links-wrapper">
          
          {/* Brand Info & Social Media */}
          <div className="col-lg-4 col-12 details pe-lg-5">
            <div className="d-flex align-items-end footer-logo gap-2 ">
              <img
                src="../src/assets/images/brand-logo-light.png"
                alt=""
                height={"40px"}
              />
            </div>
            <p>
             Crafting stylish bags, wallets & travel essentials with premium quality and timeless design.
            </p>
            <p>Follow us on </p>
            <ul className="social-icons">
              <li>
                <a href="#" aria-label="Instagram">
                  <FaInstagram />
                </a>
              </li>
              <li>
                <a href="#" aria-label="Facebook">
                  <FaFacebookF />
                </a>
              </li>
              <li>
                <a href="#" aria-label="Twitter">
                  <FaXTwitter />
                </a>
              </li>
            </ul>
          </div>

          {/* Navigation Sections */}
          
          <div className="col-lg-2 col-6 product-details ps-4">
            <h6>Shop</h6>
            <ul className="footer-link">
              <li><a href="#" onClick={(e) => handleCategoryClick(e, "bag")}>Bags</a></li>
              <li><a href="#" onClick={(e) => handleCategoryClick(e, "wallet")}>Wallets</a></li>
              <li><a href="#" onClick={(e) => handleCategoryClick(e, "belt")}>Belts</a></li>
            </ul>
          </div>

          <div className="col-lg-2 col-6 product-details">
            <h6>Information</h6>
            <ul className="footer-link">
              <li><a href="#">About us</a></li>
              <li><a href="/contact">Contact</a></li>
              <li><a href="#">Privacy policy </a></li>
            </ul>
          </div>


          <div className="col-lg-2 col-6 product-details ps-4">
            <h6>Services</h6>
            <ul className="footer-link">
              <li><a href="#">COD</a></li>
            </ul>
          </div>

          {/* Corrected Address Mapping Link Block */}
          <div className="col-lg-2 col-6 address">
            <h6>Contact us</h6>
            <div style={{paddingTop:"5px"}}>
              <a 
              href={mapUrl} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="d-flex gap-2 address-link"
            >
              <span>
                <IoLocationOutline size="1.1rem" />
              </span>
              <div>
                <p>                  
                  Perundhurai - Bhavani Rd, <br />
                  Perundurai, <br />
                  Tamil Nadu - 638052.
                </p>
              </div>
            </a>
            </div>
            <div className="d-flex gap-2 mt-2">
              <span><FiPhone  size="1rem" /></span>
              <div>
                <p className="bw-bold">PHONE</p>
                <p>+91 99655 12123</p>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Bar Info */}
        <div className="d-flex justify-content-between  text-center py-3 footer-end">
          <p>&copy;{year}STARBAGS. All rights reserved.</p>
          <div className="d-flex gap-3 policy">
            <p className="">Privacy Policy {year}</p>
            <p className="">Copyright Company</p>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;