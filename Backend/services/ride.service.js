import rideModel from '../models/ride.model.js';
import { sendMessageToSocketId } from '../socket.js';
import { getDistanceTime } from './maps.service.js';
import { validAndApplyCoup } from './coupon.service.js';
import crypto from 'crypto';

async function getFare(pickup, destination) {
    if (!pickup || !destination) {
        throw new Error('Pickup and destination are required');
    }
    const distanceTime = await getDistanceTime(pickup, destination);
    const baseFare = {
        auto: 30,
        car: 50,
        motorcycle: 20
    };

    const perKmRate = {
        auto: 10,
        car: 15,
        motorcycle: 8
    };

    const perMinuteRate = {
        auto: 1,
        car: 2,
        motorcycle: 1
    };       

    const fare = {
        auto: Math.round(baseFare.auto + (distanceTime.distance * perKmRate.auto) + (distanceTime.duration.durationInMinutes * perMinuteRate.auto)),
        car: Math.round(baseFare.car + (distanceTime.distance * perKmRate.car) + (distanceTime.duration.durationInMinutes * perMinuteRate.car)),
        motorcycle: Math.round(baseFare.motorcycle + (distanceTime.distance * perKmRate.motorcycle) + (distanceTime.duration.durationInMinutes * perMinuteRate.motorcycle))
    };   
    return fare;
}

function getOTP(num) {
    const otp = crypto.randomInt(Math.pow(10, num - 1), Math.pow(10, num)).toString()
    return otp;
}

const createRide = async ({user, pickup, destination, vehicleType, couponCode }) => {
    if(!user || !pickup || !destination || !vehicleType){
        throw new Error('User, pickup, destination, and vehicle type are required');
    }
    const fare = await getFare(pickup, destination);
    const origFare= Number(fare[vehicleType])
    let finalFare= origFare
    let appiedCoupon= null;
    let discount=0;
    
    if(couponCode){
        const couponRes= await validAndApplyCoup({
            couponCode,
            pickup,
            origFare:fare
        })
        appiedCoupon= couponRes.coupon.code
        discount= couponRes.discount
        finalFare= Math.max(0,origFare-discount)
    }

    const newRide= new rideModel({
        user,
        pickup,
        otp: getOTP(6),
        destination,
        fare: Number(finalFare.toFixed(2)),
        origFare: Number(origFare.toFixed(2)),
        discount: Number(discount.toFixed(2)),
        coupon: appiedCoupon
    })
    return newRide.save()
}

const getConfirmRide = async (rideId, captainId) => {
    if (!rideId) {
        throw new Error('Ride ID is required');
    }
    await rideModel.findOneAndUpdate({ _id: rideId }, { status: 'accepted', captain: captainId });
    const ride = await rideModel.findById(rideId).populate('user').populate('captain').select('+otp');
    if (!ride) {
        throw new Error('Ride not found');
    }
    return ride;
}

const getStartRide= async ({rideId, otp, captain}) => {
    if(!rideId || !otp){
        throw new Error('Ride ID and OTP are required');
    }
    const ride=await rideModel.findOne({_id: rideId}).populate('user').populate('captain').select('+otp');
    if(!ride){
        throw new Error('Ride not found');
    }
    if(ride.status!=='accepted'){
        throw new Error('Ride is not accepted yet');
    }
    if(ride.otp!==otp){
        throw new Error('Invalid OTP');
    }
    await rideModel.findOneAndUpdate({_id:rideId},{status:'ongoing'})

    sendMessageToSocketId(ride.user.socketId,{
        event:'ride-started',
        data:ride
    })
    return ride;
}

const getEndRide= async ({rideId,captain}) => {
    if(!rideId){
        throw new Error('Ride ID is required');
    }
    const ride=await rideModel.findOne({_id: rideId, captain: captain._id}).populate('user').populate('captain').select('+otp');
    if(!ride){
        throw new Error('Ride not found');
    }
    if(ride.status!=='ongoing'){
        throw new Error('Ride is not ongoing');
    }
    await rideModel.findOneAndUpdate({_id:rideId},{status:'completed'})

    sendMessageToSocketId(ride.user.socketId,{
        event:'ride-completed',
        data:ride
    })
    return ride;
}

export { createRide, getFare, getConfirmRide, getStartRide, getEndRide };