import React from 'react';
import { VscError } from "react-icons/vsc";
import { VscFilterFilled } from "react-icons/vsc";

export const Button = () => {
  return (
    <>
        <div className="m-3 d-grid">
            <button className="btn " type="button" style={{backgroundColor:"var(--levender)",color:"var(--white-color)"}}>Send Message</button>
        </div>
      
    </>
  )
}
