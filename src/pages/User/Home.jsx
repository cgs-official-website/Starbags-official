import BeltFilter from "../../components/User/BeltFilter";
import Brand from "../../components/User/Brand";
import DealSections from "../../components/User/DealSections";
import { Faq } from "../../components/User/Faq";
import Footer from "../../components/User/Footer";
import { Hero } from "../../components/User/Hero";
import HomeProduct from "../../components/User/HomeProduct";
import Navbar from "../../components/User/Navbar";
import WalletFilter from "../../components/User/WalletFilter";

const Home = () => {
  return (
    <div>
      <Navbar />
      <Hero />
      <Brand/>
      <DealSections/>
      <HomeProduct/>
      <WalletFilter/>
      <BeltFilter/>
      <Faq />
      <Footer />
    </div>
  );
};

export default Home;
