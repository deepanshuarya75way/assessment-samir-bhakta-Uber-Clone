import React, { useRef, useState, useEffect, useContext } from 'react'
import { Link } from 'react-router-dom'
import { IoLogOut } from "react-icons/io5";
import CaptainDetails from '../pages/CaptainDetails';
import RidePopUp from '../pages/RidePopUp';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import ConfirmRidePopupPanel from '../pages/ConfirmRidePopupPanel';
import { SocketContext } from '../context/SocketContext';
import { CaptainDataContext } from '../context/CaptainContext';
import axios from 'axios';
//import LiveTracking from './LiveTracking';

const CaptainHome = () => {
  const [ridePopupPanel, setRidePopupPanel] = useState(false)
  const ridePopupPanelRef = useRef(null)
  const [ride, setRide] = useState(null)
  const [confirmRidePopupPanel, setConfirmRidePopupPanel] = useState(false)
  const confirmRidePopupPanelRef = useRef(null)
  const { socket } = useContext(SocketContext)
  const { captain } = useContext(CaptainDataContext)
  const [captainLocation, setCaptainLocation] = useState({ lng: 0, lat: 0 });

  useEffect(() => {
    socket.emit('join', {
      userId: captain._id,
      userType: 'captain'
    })

    socket.on('new-ride', (data) => {
      setRide(data);
      setRidePopupPanel(true);
      console.log('Received new ride data:', data);
    });

    const updateLocation = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(position => {
          const location = {
            lng: position.coords.longitude,
            lat: position.coords.latitude
          };
          setCaptainLocation(location);
          socket.emit('update-location-captain', {
            userId: captain._id,
            location
          });
          console.log(captain._id, position.coords.latitude, position.coords.longitude)
        })
      }
    }
    const locationInterval = setInterval(updateLocation, 10000)
    updateLocation()
    return () => {
      clearInterval(locationInterval);
      socket.off('new-ride');
    };

  }, [socket, captain._id])

  async function confirmRide() {
    const res = await axios.post(`${import.meta.env.VITE_BASE_URL}/rides/confirm`, {
      rideId: ride._id,
      captainId: captain._id,
    }, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    })
    setRidePopupPanel(false)
    setConfirmRidePopupPanel(true)
  }

  useGSAP(function () {
    if (ridePopupPanel) {
      gsap.to(ridePopupPanelRef.current, {
        transform: 'translateY(0)'
      })
    } else {
      gsap.to(ridePopupPanelRef.current, {
        transform: 'translateY(100%)'
      })
    }
  }, [ridePopupPanel])

  useGSAP(function () {
    if (confirmRidePopupPanel) {
      gsap.to(confirmRidePopupPanelRef.current, {
        transform: 'translateY(0)'
      })
    } else {
      gsap.to(confirmRidePopupPanelRef.current, {
        transform: 'translateY(100%)'
      })
    }
  }, [confirmRidePopupPanel])

  return (
    <div className='h-screen'>
      <div className='fixed p-3 top-0 flex items-center justify-between w-screen'>
        <img className="w-16"
          src="https://download.logo.wine/logo/Uber/Uber-Logo.wine.png"
          alt="Uber Logo" />
        <Link to={'/captain-login'} className='h-10 bg-white flex items-center justify-center rounded-full'>
          <IoLogOut />
        </Link>
      </div>
      <div className='h-1/2'>
        <LiveTracking userLocation={captainLocation} />
      </div>
      <div className='h-1/2'>
        <CaptainDetails />
      </div>
      <div ref={ridePopupPanelRef} className="fixed translate-y-full z-10 w-full bottom-0 bg-white p-6 shadow-lg">
        <RidePopUp ride={ride} confirmRide={confirmRide} setRidePopupPanel={setRidePopupPanel} setConfirmRidePopupPanel={setConfirmRidePopupPanel} />
      </div>
      <div ref={confirmRidePopupPanelRef} className="fixed translate-y-full z-10 w-full bottom-0 bg-white p-6 shadow-lg">
        <ConfirmRidePopupPanel ride={ride} setRidePopupPanel={setRidePopupPanel} setConfirmRidePopupPanel={setConfirmRidePopupPanel} />
      </div>
    </div>
  )
}

export default CaptainHome