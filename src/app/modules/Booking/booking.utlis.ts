/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from 'axios';
import config from '../../config';

export const initiatePayment = async (paymentData: any) => {
  try {
    const response = await axios.post(config.base_url!, {
      store_id: config.store_id,
      signature_key: config.signature_key,
      tran_id: paymentData.transactionId,
      success_url: `https://steer-away-rakibul58s-projects.vercel.app/api/v1/bookings/verify-payment?status=success&customerName=${paymentData.customerName}&totalPrice=${paymentData.totalPrice}&transactionId=${paymentData.transactionId}&bookingId=${paymentData.bookingId}`,
      fail_url: `https://steer-away-rakibul58s-projects.vercel.app/api/v1/bookings/verify-payment?status=failed&customerName=${paymentData.customerName}&totalPrice=${paymentData.totalPrice}&transactionId=${paymentData.transactionId}&bookingId=${paymentData.bookingId}`,
      cancel_url: `https://steer-away-rakibul58s-projects.vercel.app/api/v1/bookings/verify-payment?status=failed&customerName=${paymentData.customerName}&totalPrice=${paymentData.totalPrice}&transactionId=${paymentData.transactionId}&bookingId=${paymentData.bookingId}`,
      amount: paymentData.totalPrice,
      currency: 'BDT',
      desc: 'Merchant Registration Payment',
      cus_name: paymentData.customerName,
      cus_email: paymentData.customerEmail,
      cus_add1: paymentData.customerAddress,
      cus_add2: 'N/A',
      cus_city: 'N/A',
      cus_state: 'N/A',
      cus_postcode: 'N/A',
      cus_country: 'N/A',
      cus_phone: paymentData.customerPhone,
      type: 'json',
    });

    //console.log(response);
    return response.data;
  } catch (err) {
    throw new Error('Payment initiation failed!');
  }
};

export const verifyPayment = async (tnxId: string) => {
  try {
    const response = await axios.get(config.base_url!, {
      params: {
        store_id: config.store_id,
        signature_key: config.signature_key,
        type: 'json',
        request_id: tnxId,
      },
    });

    return response.data;
  } catch (err) {
    throw new Error('Payment validation failed!');
  }
};
