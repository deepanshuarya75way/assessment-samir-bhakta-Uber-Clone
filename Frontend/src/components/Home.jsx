import React, { useRef, useState, useEffect, useContext } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { FaArrowDownLong } from "react-icons/fa6";
import LocationSearchPanel from '../pages/LocationSearchPanel';
import VehiclePanel from '../pages/VehiclePanel';
import ConfirmedRide from '../pages/ConfirmedRide';
import LookingForDriver from '../pages/LookingForDriver';
import WaitingForDriver from '../pages/WaitingForDriver';
import axios from 'axios';
import { UserDataContext } from '../context/UserContext';
import { SocketContext } from '../context/SocketContext';
import { useNavigate } from 'react-router-dom';
import LiveTracking from './LiveTracking';

const Home = () => {
  const [pickup, setpickup] = useState('')
  const [destination, setDestination] = useState('')
  const [panelOpen, setPanelOpen] = useState(false)
  const panelRef = useRef(null)
  const panelCloseREf = useRef(null)
  const vehicleFoundRef = useRef(null)
  const waitingForDriverRef = useRef(null)
  const vehiclePanelRef = useRef(null)
  const confirmedRideRef = useRef(null)
  const [vehiclePanel, setVehiclePanel] = useState(false)
  const [confirmRidePanel, setConfirmRidePanel] = useState(false)
  const [vehicleFound, setVehicleFound] = useState(false)
  const [waitingForDriver, setWaitingForDriver] = useState(false)
  const [suggestions, setSuggestions] = useState([]) // Initialize as an array
  const [activeField, setActiveField] = useState(null)
  const [fare, setFare] = useState({})
  const [vehicleType, setVehicleType] = useState(null)
  const [ride, setRide] = useState(null)
  const [userLocation, setUserLocation] = useState({ lng: 0, lat: 0 });
  const [discountedFare,setDiscountedFare]= useState({})
  const [availableCoupon,setAvailableCoupon]= useState(null)
  const [appliedCoupon,setAppliedCoupon]= useState(null)
  const [couponLoading,setCouponLoading]= useState(false)
  const [couponError,setCouponError]= useState("")

  const getAuthToken=()=> localStorage.getItem('token')|| localStorage.getItem('userToken')
  const { socket } = useContext(SocketContext)
  const { user } = useContext(UserDataContext)
  const navigate = useNavigate()

  useEffect(() => {
    socket.emit('join', { userType: 'user', userId: user._id });

    socket.on('ride-confirmed', ride => {
      setWaitingForDriver(true);
      setVehicleFound(false);
      setRide(ride)
    });

    socket.on('ride-started', ride => {
      setWaitingForDriver(false);
      navigate('/riding', { state: { ride } });
    });

    const updateLocation = () => {
          const location = {
            lng:  72.8354,
            lat: 18.9388
          };
          setUserLocation(location);
          socket.emit('update-location-user', {
            userId: user._id,
            location
          });
          console.log(user._id)
        }  
    
    const locationInterval = setInterval(updateLocation, 10000)
    updateLocation()

    return () => {
      socket.off('ride-confirmed');
      socket.off('ride-started');
      clearInterval(locationInterval);
    };
  }, [socket, user._id, navigate]);

  useEffect(()=>{
    const fetchCouponInfo= async()=>{
      const token= getAuthToken()
      if(!token) return
      try{
        const res= await axios.get(`${import.meta.env.VITE_BASE_URL}/rides/coupon-info`,{
          headers:{
            Authorization: `Bearer ${token}`
          }
        })
        if(res.data?.success && res.data?.coupon){
          setAvailableCoupon(res.data.coupon)
        }
      }catch(err){
        console.error('error fetching coupon')
      }
    }
    fetchCouponInfo()
  },[])

  const handleApplyCoupon= async (code) => {
    if(!code){
      setCouponError("enter coupon code")
      return
    }
    if(!pickup){
      setCouponError("pickup location needed")
      return
    }
    setCouponLoading(true)
    setCouponError("")
    try {
      const res= await axios.post(`${import.meta.env.VITE_BASE_URL}/rides/apply-coupon`,{
        couponCode: code,
        pickup,
        originalFare: fare
      },{
        headers:{
          Authorization: `BEARER ${getAuthToken()}`
        }
      })
      if(res.data?.success){
        setAppliedCoupon(res.data.coupon)
        if(res.data.discountedFare){
          setDiscountedFare(res.data.discountedFare)
        }else{
          const disc= res.data.discount||50
          const newFare= {}
          for(const [k,v] of Object.entries(fare)){
            newFare[k] = Math.max(0,Math.round(Number(v)-disc))
          }
          setDiscountedFare(newFare)
        }
        setCouponError('')
      }
    } catch (err) {
      console.log('error applying coupon',err)
      const msg= err.response?.data?.message || err.message
      setCouponError(msg)
      setAppliedCoupon(null)
      setDiscountedFare({})
    }finally{
      setCouponLoading(false)
    }
  }

  const handleRemoveCoup= ()=>{
    setCouponError("")
      setAppliedCoupon(null)
      setDiscountedFare({})
  }

  const submitHandler = async (e) => {
    e.preventDefault();
    setVehiclePanel(true);
    setPanelOpen(false);
    try {
      const res = await axios.get(`${import.meta.env.VITE_BASE_URL}/rides/get-fare`, {
        params: {
          pickup, destination
        },
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      })
      setFare(res.data)
    } catch (err) {
      console.log(err);
    }

  }

  const handleInputChange = async (value, field) => {
    if (field === 'pickup') {
      setpickup(value)
    } else {
      setDestination(value)
    }

    if (value.length >= 3) {
      try {
        const res = await axios.get(`${import.meta.env.VITE_BASE_URL}/maps/get-suggestions`, {
          params: { input: value },
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        setSuggestions(res.data); // Ensure suggestions are set from response data
        setPanelOpen(true);
        setActiveField(field);
      } catch (error) {
        console.error('Error fetching suggestions:', error);
      }
    } else {
      setSuggestions([]);
    }
  }

  const handleSuggestionSelect = (suggestion) => {
    if (activeField === 'pickup') {
      setpickup(suggestion); // Ensure the correct property is used
      setActiveField('destination');
      setDestination('');
    } else {
      setDestination(suggestion); // Ensure the correct property is used
      setPanelOpen(false);
      if (pickup) {
        setVehiclePanel(true);
      }
    }
  }

  const handleInputFocus = (field) => {
    setPanelOpen(true);
    setActiveField(field);
    if (field === 'destination') {
      setSuggestions([]); // Clear previous suggestions when focusing on destination
    }
  };

  async function createRide() {
    try {
      const res = await axios.post(`${import.meta.env.VITE_BASE_URL}/rides/create`, {
        pickup, destination, vehicleType
      }+pickup,+destination,+vehicleType,+ appliedCoupon?.code||undefined, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}` || `Bearer ${getAuthToken()}`
        }
      })
    } catch (error) {
      console.log(error);
    }
  }

  useGSAP(function () {
    if (panelOpen) {
      gsap.to(panelRef.current, {
        height: '70%',
        opacity: 1
      })
      gsap.to(panelCloseREf.current, {
        opacity: 1
      })
    } else {
      gsap.to(panelRef.current, {
        height: '0%',
        opacity: 0
      })
      gsap.to(panelCloseREf.current, {
        opacity: 0
      })
    }

  }, [panelOpen])

  useGSAP(function () {
    if (vehiclePanel) {
      gsap.to(vehiclePanelRef.current, {
        transform: 'translateY(0)'
      })
    } else {
      gsap.to(vehiclePanelRef.current, {
        transform: 'translateY(100%)'
      })
    }
  }, [vehiclePanel])

  useGSAP(function () {
    if (confirmRidePanel) {
      gsap.to(confirmedRideRef.current, {
        transform: 'translateY(0)'
      })
    } else {
      gsap.to(confirmedRideRef.current, {
        transform: 'translateY(100%)'
      })
    }
  }, [confirmRidePanel])

  useGSAP(function () {
    if (vehicleFound) {
      gsap.to(vehicleFoundRef.current, {
        transform: 'translateY(0)'
      })
    } else {
      gsap.to(vehicleFoundRef.current, {
        transform: 'translateY(100%)'
      })
    }
  }, [vehicleFound])

  useGSAP(function () {
    if (waitingForDriver) {
      gsap.to(waitingForDriverRef.current, {
        transform: 'translateY(0)'
      })
    } else {
      gsap.to(waitingForDriverRef.current, {
        transform: 'translateY(100%)'
      })
    }
  }, [waitingForDriver])


  return (
    <div className="h-screen relative overflow-hidden">
      {/* Uber Logo */}
      <img className="w-16 absolute left-5 top-5"
        src="https://download.logo.wine/logo/Uber/Uber-Logo.wine.png"
        alt="Uber Logo" />

      {/* Background Image */}
      <div className="h-screen w-screen">
        <LiveTracking userLocation={userLocation} />
      </div>

      {/* Panel for Form */}
      <div className="flex flex-col justify-end h-screen absolute top-0 w-full">
        <div className="h-[30%] p-6 bg-white rounded-t-2xl shadow-lg">
          {/* Panel Close Icon */}
          <h5
            ref={panelCloseREf}
            onClick={() => setPanelOpen(false)}
            className="opacity-0 absolute right-6 top-6 text-2xl cursor-pointer transition-transform transform hover:scale-110"
          >
            <FaArrowDownLong />
          </h5>

          {/* Form Heading */}
          <h4 className="text-2xl font-semibold text-gray-800">Find a trip</h4>

          {/* Form */}
          <form
            onSubmit={(e) => {
              submitHandler(e);
            }}
          >
            <input
              type="text"
              value={pickup}
              onChange={(e) => handleInputChange(e.target.value, 'pickup')}
              onFocus={() => handleInputFocus('pickup')}
              className="bg-gray-200 w-full mt-5 px-4 py-3 text-lg rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400"
              placeholder="Add pickup Location"
            />
            <input
              type="text"
              value={destination}
              onChange={(e) => handleInputChange(e.target.value, 'destination')}
              onFocus={() => handleInputFocus('destination')}
              className="bg-gray-200 w-full mt-3 px-4 py-3 text-lg rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400"
              placeholder="Add dropoff Location"
            />
            <button className='bg-black text-white rounded-md w-full p-3'>Find Trip</button>
          </form>
        </div>

        {/* Location Search Panel */}
        <div
          ref={panelRef}
          className="bg-white h-0 overflow-hidden transition-all duration-300 mt-6"
        >
          <LocationSearchPanel
            suggestions={suggestions}
            activeField={activeField}
            onSelect={handleSuggestionSelect}
          />
        </div>
      </div>

      {/* Vehicle Selection Panel */}
      <div ref={vehiclePanelRef} className="fixed translate-y-full z-10 w-full bottom-0 bg-white p-6 shadow-lg">
        <VehiclePanel setVehicleType={setVehicleType} discountedFare={discountedFare} appliedCoupon={appliedCoupon} availableCoupon={availableCoupon} couponError={couponError} couponLoading={couponLoading} onApplyCoupon={handleApplyCoupon} onRemoveCoupon={handleRemoveCoup}  fare={fare} setConfirmRidePanel={setConfirmRidePanel} setVehiclePanel={setVehiclePanel} />
      </div>

      {/* Ride Selection Panel */}
      <div ref={confirmedRideRef} className="fixed translate-y-full z-10 w-full bottom-0 bg-white p-6 shadow-lg">
        <ConfirmedRide pickup={pickup} discountedFare={discountedFare} appliedCoupon={appliedCoupon} availableCoupon={availableCoupon} couponError={couponError} couponLoading={couponLoading} onApplyCoupon={handleApplyCoupon} onRemoveCoupon={handleRemoveCoup} destination={destination} fare={fare} vehicleType={vehicleType} createRide={createRide} setConfirmRidePanel={setConfirmRidePanel} setVehicleFound={setVehicleFound} />
      </div>

      {/* vehilce found Selection Panel */}
      <div ref={vehicleFoundRef} className="fixed translate-y-full z-10 w-full bottom-0 bg-white p-6 shadow-lg">
        <LookingForDriver pickup={pickup} destination={destination} fare={fare} vehicleType={vehicleType} createRide={createRide} setVehicleFound={setVehicleFound} />
      </div>

      {/* waiting for driver Panel */}
      <div ref={waitingForDriverRef} className="fixed translate-y-full z-10 w-full bottom-0 bg-white p-6 shadow-lg">
        <WaitingForDriver ride={ride} setWaitingForDriver={setWaitingForDriver} />
      </div>
    </div>

  )
}
export default Home