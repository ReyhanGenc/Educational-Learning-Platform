
import React from 'react';
import { Course } from '../types';

interface CartDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    cartItems: Course[];
    onRemoveItem: (id: string) => void;
    onCheckout: () => void;
}

const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose, cartItems, onRemoveItem, onCheckout }) => {
    const total = cartItems.reduce((sum, item) => sum + (item.price || 0), 0);

    return (
        <>
            {/* Backdrop */}
            <div
                className={`fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                    }`}
                onClick={onClose}
            />

            {/* Drawer */}
            <div
                className={`fixed top-0 right-0 h-full w-full sm:w-[500px] bg-white shadow-2xl z-[101] transform transition-transform duration-300 ease-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'
                    }`}
            >
                <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Your Cart</h2>
                        <p className="text-slate-500 text-sm font-medium mt-1">{cartItems.length} courses selected</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-xl bg-slate-50 hover:bg-slate-100 flex items-center justify-center transition-colors text-slate-500 hover:text-slate-900"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-6">
                    {cartItems.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                                <span className="material-symbols-outlined text-4xl">shopping_bag</span>
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">Your cart is empty</h3>
                                <p className="text-slate-500 text-sm mt-1 max-w-[200px] mx-auto">Looks like you haven't added any courses yet.</p>
                            </div>
                            <button
                                onClick={onClose}
                                className="mt-4 text-brand-500 font-bold text-sm hover:underline"
                            >
                                Browse Courses
                            </button>
                        </div>
                    ) : (
                        cartItems.map(item => (
                            <div key={item.id} className="flex gap-4 p-4 rounded-2xl border border-slate-100 hover:border-brand-500/20 hover:shadow-lg hover:shadow-brand-500/5 transition-all group bg-white">
                                <div className="w-24 h-24 rounded-xl overflow-hidden shrink-0">
                                    <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                                </div>
                                <div className="flex-1 flex flex-col">
                                    <div className="flex justify-between items-start gap-2">
                                        <h3 className="font-bold text-slate-900 line-clamp-2 text-sm leading-relaxed">{item.title}</h3>
                                        <button
                                            onClick={() => onRemoveItem(item.id)}
                                            className="text-slate-400 hover:text-red-500 transition-colors"
                                        >
                                            <span className="material-symbols-outlined text-lg">delete</span>
                                        </button>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1">{item.instructor}</p>
                                    <div className="mt-auto flex items-center justify-between">
                                        <span className="px-2 py-1 bg-slate-100 rounded-md text-[10px] font-bold text-slate-600 uppercase tracking-wider">{item.category}</span>
                                        <span className="font-black text-brand-500 text-lg">${item.price}</span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {cartItems.length > 0 && (
                    <div className="p-8 border-t border-slate-100 bg-slate-50/50 shrink-0">
                        <div className="flex items-center justify-between mb-6">
                            <span className="text-slate-500 font-medium">Total Amount</span>
                            <span className="text-3xl font-black text-slate-900">${total}</span>
                        </div>
                        <button
                            onClick={onCheckout}
                            className="w-full bg-brand-500 hover:bg-brand-600 text-white py-5 rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-xl shadow-brand-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                        >
                            Checkout
                            <span className="material-symbols-outlined">arrow_forward</span>
                        </button>
                        <p className="text-center text-[10px] text-slate-400 mt-4 font-medium">
                            Secure checkout powered by EduPay
                        </p>
                    </div>
                )}
            </div>
        </>
    );
};

export default CartDrawer;
