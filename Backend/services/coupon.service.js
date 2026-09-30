import couponConfig from "../config/coupon.config.js";
import { getAddressCoordinate, calDistInKm } from "./maps.service.js";

export const getAvailCoupCon=()=>{
  return{
    code: couponConfig.code,
    discount: couponConfig.discount,
    discountType: couponConfig.discountType,
    targetArea:{
      name: couponConfig.targetArea.name,
      radiusKm: couponConfig.targetArea.radiusKm,
      lat: couponConfig.targetArea.lat,
      lng: couponConfig.targetArea.lng
    },
    description: couponConfig.description,
    isActive: couponConfig.isActive
  }
}

export const validAndApplyCoup= async({ couponCode , pickup, origFare})=>{
  if(!couponCode){
    const err= new Error('please enter coupon code')
    err.statusCode = 400
    throw err
  }
  if(!pickup){
    const err= new Error('pickup location is req.')
    err.statusCode = 400
    throw err
  }
  const normInputCode= couponCode.trim().toUpperCase()
  const normConfigCode= couponCode.code.trim().toUpperCase();

  if(normInputCode!== normConfigCode|| !couponCode.isActive){
    const err= new Error(`invalid couponcode ${couponCode}`)
    err.statusCode = 400
    throw err
  }
  let pickupCoords
  try {
    pickupCoords= await getAddressCoordinate(pickup)
  } catch (err) {
    const error= new Error('unable to fetch pickup coord')
    error.statusCode = 400
    throw error
  }
  if(!pickupCoords || typeof pickupCoords.lat !== 'number' || typeof pickupCoords.lng!== 'number'){
    const err= new Error('invalid pickup coord')
    err.statusCode = 400
    throw err
  }
  const distKm= calDistInKm(pickupCoords.lat, pickupCoords.lng, couponConfig.targetArea.lat, couponConfig.targetArea.lng)
  if(distKm> couponConfig.targetArea.radiusKm){
    const err= new Error(`${couponConfig.code} is valid in ${couponConfig.targetArea.radiusKm} km of ${couponConfig.targetArea.name}`)
    err.statusCode = 400
    err.isAreaError= true
    err.distKm= Number(distKm.toFixed(2))
    err.allowedRadInKm= couponConfig.targetArea.radiusKm
    throw err
  }

  let discFare= null
  if(origFare && typeof origFare ==='object'){
    discFare={}
    for(const[vehicle, fare] of Object.entries(origFare)){
      const numFare= Number(fare)
      if(!isNaN(numFare)){
        discFare[vehicle]= Math.max(0,Math.round(numFare-couponConfig.discount))
      }
    }
  }
  return {
    valid: true,
    coupon:{
      code: couponConfig.code,
      discount: couponConfig.discount,
      discountType: couponConfig.discountType,
      targetArea:couponConfig.targetArea,
      description: couponConfig.description
    },
    discount: couponConfig.discount,
    distKm: Number(distKm.toFixed(2)),
    discFare,
    message: `coupon ${couponConfig.code} apply success`
  }
}