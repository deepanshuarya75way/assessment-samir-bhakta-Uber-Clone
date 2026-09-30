import React from 'react'
import { useState } from 'react';
import { FaUser } from "react-icons/fa";
import { ImCross } from "react-icons/im";
import { RiMoneyRupeeCircleLine } from 'react-icons/ri'

const VehiclePanel = (props) => {
  const [couponCode,setCouponCode] = useState("")
  const handleApplyCoupon=(e)=>{
    if(e) e.preventDefault()
    if(couponCode.trim() && props.onApplyCoupon){
      props.onApplyCoupon(couponCode.trim())
    }
  }

  const handleQuickApply=(code)=>{
    setCouponCode(code)
    if(props.onApplyCoupon){
      props.onApplyCoupon(code)
    }
  }
  return (
    <div>
        <h5 onClick={()=> props.setVehiclePanel(false)} className='p-3 right-0 absolute w-[93%] top-0'><ImCross/></h5>
        <h3 className="text-lg font-medium mb-4">Choose a vehicle</h3>

        {/* Vehicle Options */}
        <div onClick={()=>{
            props.setConfirmRidePanel(true);
            props.setVehiclePanel(false);
            props.setVehicleType('car');
        }} className="flex items-center border-2 active:border-black-400 rounded-lg p-4 mb-4">
          <img
            className="h-12 w-12 rounded-full"
            src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ0dvpmpkBxRwzt84h3R46p43rK3mZWrhAvXw&s"
            alt="Vehicle"
          />
          <div className="ml-4 w-2/3">
            <h4 className="font-medium text-gray-800">
              Uber Go<span className="inline-flex items-center"><FaUser className="ml-1 text-gray-500" /> 4</span>
            </h4>
            <h5 className="text-gray-600">2 mins away</h5>
            <p className="text-sm text-gray-500">Affordable rides</p>
          </div>
          <h2 className="text-xl font-semibold text-gray-800">₹{props.fare.car}</h2>
        </div>
        <div onClick={()=>{
            props.setConfirmRidePanel(true);
            props.setVehiclePanel(false);
            props.setVehicleType('motorcycle');
        }} className="flex items-center border-2 active:border-black-400  rounded-lg p-4 mb-4">
          <img
            className="h-12 w-12 rounded-full"
            src="https://www.uber-assets.com/image/upload/f_auto,q_auto:eco,c_fill,h_368,w_552/v1649231091/assets/2c/7fa194-c954-49b2-9c6d-a3b8601370f5/original/Uber_Moto_Orange_312x208_pixels_Mobile.png"
            alt="Vehicle"
          />
          <div className="ml-4 w-2/3">
            <h4 className="font-medium text-gray-800">
              Uber Moto<span className="inline-flex items-center"><FaUser className="ml-1 text-gray-500" /> 4</span>
            </h4>
            <h5 className="text-gray-600">2 mins away</h5>
            <p className="text-sm text-gray-500">Affordable rides</p>
          </div>
          <h2 className="text-xl font-semibold text-gray-800">₹{props.fare.motorcycle}</h2>
        </div>
        <div onClick={()=>{
            props.setConfirmRidePanel(true);
            props.setVehiclePanel(false);
            props.setVehicleType('auto');
        }} className="flex items-center border-2 active:border-black-400  rounded-lg p-4 mb-4">
          <img
            className="h-12 w-12 rounded-full"
            src='https://www.uber-assets.com/image/upload/f_auto,q_auto:eco,c_fill,h_368,w_552/v1648431773/assets/1d/db8c56-0204-4ce4-81ce-56a11a07fe98/original/Uber_Auto_558x372_pixels_Desktop.png'
            alt="Vehicle"
          />
          <div className="ml-4 w-2/3">
            <h4 className="font-medium text-gray-800">
              Uber Auto <span className="inline-flex items-center"><FaUser className="ml-1 text-gray-500" /> 4</span>
            </h4>
            <h5 className="text-gray-600">2 mins away</h5>
            <p className="text-sm text-gray-500">Affordable rides</p>
          </div>
          <h2 className="text-xl font-semibold text-gray-800">₹{props.fare.auto}</h2>
        </div>
    </div>
  )
}

export default VehiclePanel