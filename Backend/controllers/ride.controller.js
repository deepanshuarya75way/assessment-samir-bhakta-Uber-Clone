import { createRide, getFare, getConfirmRide, getStartRide, getEndRide } from '../services/ride.service.js';
import { validationResult } from 'express-validator';
import { getCaptainInTheRadius } from '../services/maps.service.js';
import { getAddressCoordinate } from '../services/maps.service.js';
import { sendMessageToSocketId } from '../socket.js';
import { validAndApplyCoup, getAvailCoupCon } from '../services/coupon.service.js';
import rideModel from '../models/ride.model.js';
import userModel from '../models/userModels.js';


const create = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { userId, pickup, destination, vehicleType } = req.body;
    try {
        const ride = await createRide({ user: req.user._id, pickup, destination, vehicleType });
        res.status(200).json(ride);
        
        let pickupCoordinates = await getAddressCoordinate(pickup);
        pickupCoordinates={
            ltd: pickupCoordinates.lat,
            lng: pickupCoordinates.lng
        }        
        if (!pickupCoordinates || !pickupCoordinates.ltd || !pickupCoordinates.lng) {
            console.error('Invalid pickup coordinates');
            return;
        }

        const captainInRadius = await getCaptainInTheRadius(pickupCoordinates.ltd, pickupCoordinates.lng, 20);        
        ride.otp = "";

        const rideWithUser= await rideModel.findOne({_id:ride._id}).populate('user')
        console.log(`alerting ${captainInRadius?.length ||0} captain in 20km`)
        if(captainInRadius && captainInRadius?.length>0){
            captainInRadius.forEach(cap=>{
                if(cap.socketId){
                    sendMessageToSocketId(cap.socketId,{
                        event: 'new-ride',
                        data: rideWithUser
                    })
                }
            })
        }
    } catch (error) {
        console.error(error);
        if (!res.headersSent) {
            return res.status(500).json({ message: 'Internal server error' });
        }
    }
};

const Fare = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { pickup, destination } = req.query;
    try {
        const fare = await getFare(pickup, destination);
        return res.status(200).json(fare);
    } catch (err) {
        console.error(err);
        if (!res.headersSent) {
            return res.status(500).json({ message: err.message });
        }
    }
};

const confirmRide = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { rideId } = req.body;
    if (!req.captain || !req.captain._id) {
        return res.status(400).json({ message: 'Captain information is missing' });
    }
    try {
        const ride = await getConfirmRide(rideId, req.captain._id); 
        sendMessageToSocketId(ride.user.socketId, {
            event: 'ride-confirmed',
            data: ride
        });
        res.status(200).json(ride);
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: err.message });
    }
}

const startRide = async(req,res)=>{
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { rideId, otp } = req.query;
    try {
        const ride=await getStartRide({rideId, otp, captain:req.captain})

        sendMessageToSocketId(ride.user.socketId,{
            event:'ride-started',
            data:ride
        })
        return res.status(200).json(ride);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
}

const endRide=async(req,res)=>{
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { rideId } = req.body;
    try {
        const ride=await getEndRide({rideId, captain:req.captain})
        sendMessageToSocketId(ride.user.socketId,{
            event:'ride-ended',
            data:ride
        })
        return res.status(200).json(ride);
    } catch (err) {
        console.log(err);
        
        return res.status(500).json({ message: err.message });
    }
}

const updateLocation = async (req, res) => {
    const { userId, location } = req.body;
    try {
        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        user.location = location;
        await user.save();

        // Emit location update to the client
        sendMessageToSocketId(user.socketId, {
            event: 'location-update',
            data: location
        });

        res.status(200).json({ message: 'Location updated' });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: err.message });
    }
}
const applyCoupon= async(req,res)=>{
        const errors= validationResult(req)
        if(!errors.isEmpty()){
            return res.status(400).json({errors: errors.array()})
        }
        const {couponCode, pickup, originalFares} = req.body
        try{
            const result= await validAndApplyCoup({
                couponCode,
                pickup,
                originalFares
            })
            return res.status(200).json({success:true, ...result})
        }catch(err){
            console.log('error applying coupon', err.message)
            return res.status(err.statusCode||400).json({success:false, message: err.message,isAreaError:!!err.isAreaError, distanceKm: err.distanceKm, allowedRadInKm: err.allowedRadInKm})
        }
    }

    const getCouponInfo= async(req,res)=>{
        try {
            const coupon= getAvailCoupCon()
            return res.status(200).json({success: true, coupon})
        } catch (err) {
            console.error('error fetchiong infor')
            return res.status(500).json({success:false, message: 'internal erver error'})
        }
    }

export { create, Fare, confirmRide, startRide, endRide, updateLocation, applyCoupon, getCouponInfo };