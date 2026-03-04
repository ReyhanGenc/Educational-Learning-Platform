
import React from 'react';
import { Course } from '../types';

interface PaymentProps {
    cart: Course[];
    onBack: () => void;
    onComplete: () => void;
}

const Payment: React.FC<PaymentProps> = ({ cart, onBack, onComplete }) => {
    const total = cart.reduce((sum, item) => sum + (item.price || 0), 0);

    return (
        <div className="min-h-full p-6 lg:p-10 max-w-[1000px] mx-auto pb-24 animate-fade-in text-slate-900">
            <button
                onClick={onBack}
                className="flex items-center gap-2 text-slate-500 hover:text-brand-500 transition-colors font-bold text-sm mb-8"
            >
                <span className="material-symbols-outlined text-lg">arrow_back</span>
                Back to Dashboard
            </button>

            <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-tight uppercase mb-8">Checkout & Payment</h1>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* Order Summary */}
                <div className="space-y-6">
                    <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm">
                        <h2 className="text-lg font-black text-slate-900 tracking-tight uppercase mb-6">Order Summary</h2>
                        <div className="space-y-4">
                            {cart.map(item => (
                                <div key={item.id} className="flex gap-4 items-start">
                                    <img src={item.image} alt={item.title} className="w-16 h-16 rounded-xl object-cover" />
                                    <div className="flex-1">
                                        <h3 className="font-bold text-slate-900 text-sm">{item.title}</h3>
                                        <p className="text-xs text-slate-500">{item.instructor}</p>
                                    </div>
                                    <span className="font-black text-slate-900">${Number(item.price).toFixed(2)}</span>
                                </div>
                            ))}
                        </div>
                        <div className="my-6 border-t border-slate-100"></div>
                        <div className="flex items-center justify-between text-lg font-black text-slate-900">
                            <span>Total</span>
                            <span>${total.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                {/* Payment Form */}
                <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm h-fit">
                    <h2 className="text-lg font-black text-slate-900 tracking-tight uppercase mb-6">Payment Details</h2>
                    <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); onComplete(); }}>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Cardholder Name</label>
                            <input type="text" placeholder="John Doe" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 font-bold text-slate-900 outline-none focus:border-brand-500 transition-colors" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Card Number</label>
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">credit_card</span>
                                <input type="text" placeholder="0000 0000 0000 0000" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 pl-12 font-bold text-slate-900 outline-none focus:border-brand-500 transition-colors" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Expiry Date</label>
                                <input type="text" placeholder="MM/YY" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 font-bold text-slate-900 outline-none focus:border-brand-500 transition-colors" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">CVC</label>
                                <input type="text" placeholder="123" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 font-bold text-slate-900 outline-none focus:border-brand-500 transition-colors" />
                            </div>
                        </div>

                        <button className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-xl hover:bg-brand-500 transition-all flex items-center justify-center gap-3 active:scale-[0.98] mt-4">
                            Pay ${total.toFixed(2)}
                            <span className="material-symbols-outlined">lock</span>
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Payment;
