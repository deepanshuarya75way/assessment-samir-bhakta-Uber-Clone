const couponConfig= {
  code: process.env.COUPON_CODE || 'AREA50',
  discount: Number(process.env.COUPON_DISCOUNT) || 50,
  discountType: 'fixed',
  targetArea: {
    name:process.env.COUPON_AREA_NAME || 'Delhi',
    lat: process.env.COUPON_AREA_LAT? Number(process.env.COUPON_AREA_LAT):18.9388,
    lng: process.env.COUPON_AREA_LNG? Number(process.env.COUPON_AREA_LNG):72.8354,
    radiusKm: process.env.COUPON_AREA_RADIUS? Number(process.env.COUPON_AREA_RADIUS): 15
  },
  description: process.env.COUPON_DESC || '50rs off in Delhi',
  isActive: true
}

export default couponConfig