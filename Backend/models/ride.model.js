import mongoose from "mongoose";
const rideSchema = mongoose.Schema({
    user:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    captain:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Captain',
    },
    pickup:{
        type:String,
        required:true,
    },
    destination:{
        type:String,
        required:true,
    },
    fare:{
        type:Number,
        required:true,
    },
    originalFare:{
        type: Number
    },
    discount:{
        type: Number,
        default:0
    },
    coupon:{
        type: String,
        default:null
    },
    status:{
        type:String,
        enum:['pending','ongoing','accepted','completed','cancelled'],
        default:'pending',
    },
    duration:{
        type:Number,            // in seconds
    },
    distance:{
        type:Number,             // in meters
    },
    paymentId:{
        type:String
    },
    orderId:{
        type:String
    },
    signature:{
        type:String
    },
    otp:{
        type:String,
        required:true,
        select: false
    },
})

const ride= mongoose.model('Ride', rideSchema)
export default ride;