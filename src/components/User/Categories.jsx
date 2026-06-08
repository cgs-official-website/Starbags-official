import { BiSolidWallet } from "react-icons/bi";
// import {  GiBelt } from "react-icons/gi";
import { GiSchoolBag } from "react-icons/gi";
import Belt from "../../assets/images/belt.svg";
// import BeltImg from "../../assets/images/belt.png";


import "../../../src/assets/styles/Categories.css";
// import Belt from "./Belt";
// import Belt from "./Belt";

export const Categories = () => {
  const categories = [
    // {
    //   // name: "Belts",
    //   // icon: <GiBelt />,
    //   // icon: <Belt/>,
    // },
    {
      name: "Bags",
      icon: <GiSchoolBag />,
    },
    {
      name: "Wallets",
      icon: <BiSolidWallet />,
    },
  ];

  return (
    <section className="categories-section">
      <div className="container">
        <h1 className="category-title">
          Categories
        </h1>

        <div className="categories-wrapper">
          <div className="category-card">
            {/* ICON */}
            <div className="category-icon bg-primary">
              <a href="#">
                <img src={Belt}alt="" className="belt-icon text-light" />
              </a>
            </div>

            {/* IMAGE  */}
            {/* <div className="category-icon bg-primary">
              <a href="#">
                <img src={BeltImg} className="img-belt" />
              </a>
            </div> */}

            {/* NAME */}
            <h5>Belts</h5>
          </div>
          {categories.map((cat, index) => (
            <div key={index} className="category-card">
              {/* ICON */}
              <div className="category-icon">
                <a href="#" className="icon-navigate">{cat.icon}</a>
              </div>

              {/* NAME */}
              <h5>{cat.name}</h5>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
