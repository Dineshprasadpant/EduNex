"use client"
import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { updateUserPlan } from '../../../../apiCalls/updateUserPlan';
import { uploadFile } from '../../../../apiCalls/fileUpload';

type Plan = 'free' | 'half' | 'full';
type BankDetails = {
    bankName: string;
    accountNumber: string;
    accountName: string;
    qrCode: string;
};

interface PlanInfo {
    name: Plan;
    title: string;
    price: string;
    description: string;
    features: string[];
}

// Static bank details
const staticBankDetails: BankDetails = {
    bankName: "Nabil Bank",
    accountNumber: "03101017501853",
    accountName: "DRAGON EDUCATION FOUNDATION PRIVATE LIMITED",
    qrCode: "/images/qr.png"
};

// Plan details
const planDetails: PlanInfo[] = [
    {
        name: 'free',
        title: 'Free Plan',
        price: 'Free',
        description: 'Basic access',
         features: [
                        "Few mock exams available",
                        "User verification required",
                        "No access to class material",
                        "Basic profile with exam feedback",
                        "Event announcements and news"
                    ]
    },
    {
        name: 'half',
        title: 'Half Plan',
        price: '50% of Full Price',
        description: 'Partial access',
        features: [
                        "Access to limited class materials",
                        "More mock exams available",
                        "Profile with performance feedback",
                        "Event announcements and news",
                        "Zoom meeting links included",
                    ]
    },
    {
        name: 'full',
        title: 'Full Plan',
        price: 'Full Price',
        description: 'Complete access',
        features: [
                        "Access to premium class materials",
                        "Weekly mock practice sessions",
                        "Zoom meeting links included",
                        "Full profile with detailed feedback",
                        "All event announcements and news"
                    ]
    }
];


export default function PlanSelection() {
    const router = useRouter();
    const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
    const [currentPlan, setCurrentPlan] = useState<Plan>('free');
    const [showPaymentDetails, setShowPaymentDetails] = useState(false);
    const [paymentFile, setPaymentFile] = useState<File | null>(null);
    const [paymentImageUrl, setPaymentImageUrl] = useState<string | null>(null);
    const [paymentPreview, setPaymentPreview] = useState<string | null>(null);
    const [showPreview, setShowPreview] = useState(false);
    const [bankDetails, setBankDetails] = useState<BankDetails | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [user, setUser] = useState<any>(null);
    const [isCopied, setIsCopied] = useState<string | null>(null);
    const [previousPayments, setPreviousPayments] = useState<string[]>([]);
    const [fetchingUser, setFetchingUser] = useState(true);

    // Get available plans based on current plan
    const getAvailablePlans = (): PlanInfo[] => {
        if (currentPlan === 'free') {
            return planDetails.filter(plan => plan.name === 'half' || plan.name === 'full');
        }
        return [];
    };

    useEffect(() => {
        const fetchUserData = async () => {
            const userCookie = Cookies.get('user') || "";

            if (!userCookie) {
                router.push('/login');
                return;
            }

            try {
                const userData = JSON.parse(userCookie);
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/userInfo/${userData.id}`);
                const data = await response.json();

                if (data.success) {
                    setUser(data.users);
                    setCurrentPlan(data.users.plan || 'free');
                    setBankDetails(staticBankDetails);

                    // Extract previous payments
                    if (data.users.paymentImage && Array.isArray(data.users.paymentImage)) {
                        const payments = data.users.paymentImage.flat();
                        setPreviousPayments(payments);
                    }
                } else {
                    throw new Error('Failed to fetch user data');
                }
            } catch (err) {
                console.error('Error fetching user data:', err);
                router.push('/login');
            } finally {
                setFetchingUser(false);
            }
        };

        fetchUserData();
    }, [router]);

    const handlePlanSelect = (plan: Plan) => {
        setSelectedPlan(plan);
        setError(null);
        setSuccess(null);

        if (plan !== 'free') {
            setShowPaymentDetails(true);
        } else {
            setShowPaymentDetails(false);
        }
    };

    const handlePaymentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];

            // Check file type
            if (file.type !== 'image/png') {
                setError('Only PNG files are allowed');
                return;
            }

            // Check file size (5MB in bytes)
            if (file.size > 5 * 1024 * 1024) {
                setError('File size must be less than 5MB');
                return;
            }

            setPaymentFile(file);
            setError(null); // Clear any previous errors

            const reader = new FileReader();
            reader.onloadend = () => {
                setPaymentPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const togglePreview = () => {
        if (paymentPreview) {
            setShowPreview(!showPreview);
        }
    };

    const uploadPaymentReceipt = async () => {
        if (!paymentFile) return null;

        try {
            setIsUploading(true);
            const result = await uploadFile(paymentFile);
            setPaymentImageUrl(result.data.url);
            return result.data.url;
        } catch (err: any) {
            setError(`Upload failed: ${err.message}`);
            return null;
        } finally {
            setIsUploading(false);
        }
    };

    const copyToClipboard = (text: string, field: string) => {
        navigator.clipboard.writeText(text);
        setIsCopied(field);
        setTimeout(() => setIsCopied(null), 2000);
    };

    const downloadQR = () => {
        if (!bankDetails?.qrCode) return;
        const link = document.createElement('a');
        link.href = bankDetails.qrCode;
        link.download = 'payment-qr.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleSubmit = async () => {
        if (!selectedPlan || !user) return;

        setIsLoading(true);
        setError(null);
        setSuccess(null);

        try {
            let paymentUrl = paymentImageUrl;

            if (selectedPlan !== 'free' && paymentFile && !paymentImageUrl) {
                paymentUrl = await uploadPaymentReceipt();
                if (!paymentUrl) {
                    setIsLoading(false);
                    return;
                }
            }

            await updateUserPlan(
                user._id,
                currentPlan,
                selectedPlan,
                paymentUrl || undefined
            );

            setSuccess('Plan updated successfully! Admin will verify your payment shortly.');

            setTimeout(() => {
                router.push('/');
            }, 3000);

            setPaymentFile(null);
            setPaymentPreview(null);
            setPaymentImageUrl(null);
        } catch (err: any) {
            setError(err.message || 'Failed to update plan');
        } finally {
            setIsLoading(false);
        }
    };

    // Get current plan details
    const getCurrentPlanDetails = () => {
        return planDetails.find(plan => plan.name === currentPlan) || planDetails[0];
    };

    if (fetchingUser) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center animate-pulse">
                    <div className="h-10 w-10 rounded-full bg-indigo-500 mb-4"></div>
                    <div className="h-4 w-24 bg-slate-200 rounded"></div>
                </div>
            </div>
        );
    }

    const availablePlans = getAvailablePlans();
    const currentPlanDetails = getCurrentPlanDetails();

    return (
        <Suspense fallback={<div>Loading...</div>}>
            <div className="min-h-screen bg-slate-50 pb-16">
                {/* Preview Modal */}
                {showPreview && paymentPreview && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={togglePreview}>
                        <div className="max-w-lg w-full bg-white rounded-lg overflow-hidden shadow-xl" onClick={e => e.stopPropagation()}>
                            <div className="flex justify-between items-center p-4 border-b">
                                <h3 className="font-medium text-slate-700">Receipt Preview</h3>
                                <button
                                    onClick={togglePreview}
                                    className="text-slate-400 hover:text-slate-600"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            <div className="p-4">
                                <img src={paymentPreview} alt="Receipt preview" className="max-h-96 w-full object-contain rounded" />
                            </div>
                            <div className="bg-slate-50 px-4 py-3 flex justify-end">
                                <button
                                    onClick={togglePreview}
                                    className="px-4 py-2 text-sm bg-slate-200 hover:bg-slate-300 rounded font-medium text-slate-700"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-16">
                    {/* Elegant Header */}
                    <div className="text-center mb-16">
                        <h1 className="text-3xl font-bold text-slate-900 mb-2">Subscription Plans</h1>
                        <div className="h-0.5 w-12 bg-indigo-500 mx-auto"></div>
                        <p className="mt-4 text-slate-500 max-w-xl mx-auto">
                            {currentPlan === 'free' ? 'Upgrade your plan to access more content' : 'You have already upgraded your plan'}
                        </p>
                    </div>

                    {/* Current Plan Indicator */}
                    <div className="mb-12 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 opacity-10 rounded-xl"></div>
                        <div className="relative p-6 flex flex-col sm:flex-row items-center justify-between">
                            <div>
                                <div className="text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-1">Current Plan</div>
                                <h2 className="text-2xl font-bold text-slate-800">{currentPlanDetails.title}</h2>
                            </div>
                            <div className="mt-4 sm:mt-0">
                                <div className="text-center">
                                    <span className="text-2xl font-bold text-indigo-600">{currentPlanDetails.price}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Previous Payments Section */}
                    {previousPayments.length > 0 && (
                        <div className="mb-8 bg-white rounded-xl overflow-hidden shadow-sm">
                            <div className="border-b px-6 py-4">
                                <h3 className="font-medium text-slate-800">Your Previous Payments</h3>
                            </div>
                            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                {previousPayments.map((payment, index) => (
                                    <div key={index} className="border rounded-lg overflow-hidden">
                                        <img
                                            src={payment}
                                            alt={`Payment receipt ${index + 1}`}
                                            className="w-full h-40 object-contain bg-slate-50"
                                        />
                                        <div className="p-2 text-center">
                                            <a
                                                href={payment}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-sm text-indigo-600 hover:text-indigo-700"
                                            >
                                                View Full Size
                                            </a>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {availablePlans.length > 0 ? (
                        <>
                            {/* Available Plans */}
                            <div className="space-y-8 mb-12">
                                {availablePlans.map((plan) => (
                                    <div
                                        key={plan.name}
                                        className={`
                    group relative bg-white border rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-all duration-300
                    ${selectedPlan === plan.name ? 'ring-2 ring-indigo-500' : ''}
                  `}
                                        onClick={() => handlePlanSelect(plan.name)}
                                    >
                                        <div className="p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between">
                                            <div className="mb-4 sm:mb-0">
                                                <div className="flex items-center">
                                                    <h3 className="text-xl font-bold text-slate-800">{plan.title}</h3>
                                                    <span className="ml-2 text-xs font-medium bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full">
                                                        {plan.description}
                                                    </span>
                                                </div>
                                                <p className="mt-2 text-2xl font-bold text-indigo-600">{plan.price}</p>
                                            </div>

                                            <div className="flex-1 min-w-0 px-4 mx-4 hidden sm:block">
                                                <div className="grid grid-cols-2 gap-2">
                                                    {plan.features.map((feature, idx) => (
                                                        <div key={idx} className="flex items-center">
                                                            <svg className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                            </svg>
                                                            <span className="text-sm text-slate-600">{feature}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <button
                                                className={`
                        py-2 px-6 rounded-full text-sm font-medium transition-colors sm:self-center
                        ${selectedPlan === plan.name
                                                        ? 'bg-indigo-600 text-white'
                                                        : 'bg-slate-100 text-slate-700 group-hover:bg-slate-200'}
                      `}
                                            >
                                                {selectedPlan === plan.name ? 'Selected' : 'Select Plan'}
                                            </button>
                                        </div>

                                        {/* Mobile features */}
                                        <div className="px-6 pb-6 sm:hidden">
                                            <div className="border-t pt-4">
                                                <div className="grid grid-cols-1 gap-2">
                                                    {plan.features.map((feature, idx) => (
                                                        <div key={idx} className="flex items-center">
                                                            <svg className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                            </svg>
                                                            <span className="text-sm text-slate-600">{feature}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Payment Section */}
                            {showPaymentDetails && bankDetails && (
                                <div className="bg-white rounded-xl overflow-hidden shadow-sm">
                                    <div className="border-b px-6 py-4">
                                        <h3 className="font-medium text-slate-800">Payment Details</h3>
                                    </div>

                                    <div className="p-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div>
                                                <h4 className="font-medium text-slate-700 mb-4">Bank Transfer</h4>

                                                <div className="space-y-3">
                                                    <div>
                                                        <div className="flex justify-between mb-1">
                                                            <label className="text-xs text-slate-500 font-medium">Bank Name</label>
                                                            <button
                                                                onClick={() => copyToClipboard(bankDetails.bankName, "bank")}
                                                                className="text-xs text-indigo-600 hover:text-indigo-700"
                                                            >
                                                                {isCopied === "bank" ? "Copied!" : "Copy"}
                                                            </button>
                                                        </div>
                                                        <div className="bg-slate-50 border border-slate-100 rounded p-3 text-sm text-slate-700">
                                                            {bankDetails.bankName}
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <div className="flex justify-between mb-1">
                                                            <label className="text-xs text-slate-500 font-medium">Account Number</label>
                                                            <button
                                                                onClick={() => copyToClipboard(bankDetails.accountNumber, "number")}
                                                                className="text-xs text-indigo-600 hover:text-indigo-700"
                                                            >
                                                                {isCopied === "number" ? "Copied!" : "Copy"}
                                                            </button>
                                                        </div>
                                                        <div className="bg-slate-50 border border-slate-100 rounded p-3 text-sm text-slate-700">
                                                            {bankDetails.accountNumber}
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <div className="flex justify-between mb-1">
                                                            <label className="text-xs text-slate-500 font-medium">Account Name</label>
                                                            <button
                                                                onClick={() => copyToClipboard(bankDetails.accountName, "name")}
                                                                className="text-xs text-indigo-600 hover:text-indigo-700"
                                                            >
                                                                {isCopied === "name" ? "Copied!" : "Copy"}
                                                            </button>
                                                        </div>
                                                        <div className="bg-slate-50 border border-slate-100 rounded p-3 text-sm text-slate-700">
                                                            {bankDetails.accountName}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex flex-col justify-center items-center">
                                                <div className="bg-white p-2 border rounded-lg shadow-sm">
                                                    <img
                                                        src={bankDetails.qrCode}
                                                        alt="Payment QR Code"
                                                        className="w-40 h-40 object-contain"
                                                    />
                                                </div>
                                                <button
                                                    onClick={downloadQR}
                                                    className="mt-3 text-indigo-600 hover:text-indigo-700 text-sm font-medium flex items-center"
                                                >
                                                    <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                    </svg>
                                                    Download QR Code
                                                </button>
                                            </div>
                                        </div>

                                        <div className="mt-8">
                                            <div className="flex justify-between mb-2">
                                                <h4 className="font-medium text-slate-700">Upload Payment Receipt</h4>
                                                {paymentFile && (
                                                    <button
                                                        onClick={togglePreview}
                                                        className="text-indigo-600 hover:text-indigo-700 text-sm font-medium flex items-center"
                                                    >
                                                        <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                        </svg>
                                                        Preview Receipt
                                                    </button>
                                                )}
                                            </div>

                                            <div className="mt-2">
                                                <label className="flex justify-center border-2 border-dashed border-slate-200 rounded-lg p-6 cursor-pointer hover:bg-slate-50 transition-colors">
                                                    <div className="text-center">
                                                        {!paymentFile ? (
                                                            <>
                                                                <svg className="mx-auto h-12 w-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                                                </svg>
                                                                <div className="mt-2">
                                                                    <span className="block text-sm font-medium text-indigo-600">
                                                                        Select a file
                                                                    </span>
                                                                    <span className="mt-1 block text-xs text-slate-500">
                                                                        PNG files up to 5MB
                                                                    </span>
                                                                </div>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <svg className="mx-auto h-12 w-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                                                </svg>
                                                                <div className="mt-2">
                                                                    <span className="block text-sm font-medium text-green-600">
                                                                        File uploaded
                                                                    </span>
                                                                    <span className="mt-1 block text-xs text-slate-500">
                                                                        Click to change file
                                                                    </span>
                                                                </div>
                                                            </>
                                                        )}
                                                        <input
                                                            type="file"
                                                            className="hidden"
                                                            onChange={handlePaymentUpload}
                                                            accept="image/png"
                                                        />
                                                    </div>
                                                </label>
                                            </div>
                                        </div>

                                        <div className="mt-6 bg-amber-50 border border-amber-100 rounded-lg p-4">
                                            <div className="flex">
                                                <svg className="h-5 w-5 text-amber-400 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                </svg>
                                                <div className="ml-3">
                                                    <h3 className="text-sm font-medium text-amber-800">Important Notice</h3>
                                                    <p className="text-sm text-amber-700 mt-1">
                                                        After upgrading, you'll be redirected to the homepage.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Status Messages */}
                            {error && (
                                <div className="mt-6 bg-red-50 border border-red-100 rounded-lg p-4 flex">
                                    <svg className="h-5 w-5 text-red-400 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                    <span className="ml-3 text-sm text-red-700">{error}</span>
                                </div>
                            )}

                            {success && (
                                <div className="mt-6 bg-green-50 border border-green-100 rounded-lg p-4 flex">
                                    <svg className="h-5 w-5 text-green-400 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    <div className="ml-3">
                                        <span className="text-sm text-green-700">{success}</span>
                                        <p className="text-sm text-green-700 mt-1">
                                            Redirecting to homepage...
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Submit Button */}
                            {selectedPlan && (
                                <div className="mt-8 flex justify-center">
                                    <button
                                        onClick={handleSubmit}
                                        disabled={isLoading || isUploading || (selectedPlan !== 'free' && !paymentFile)}
                                        className={`
                    py-3 px-8 rounded-full text-sm font-medium transition-all 
                    ${isLoading || isUploading || (selectedPlan !== 'free' && !paymentFile)
                                                ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                                                : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md hover:shadow-lg hover:translate-y-0.5 active:translate-y-0'
                                            }
                  `}
                                    >
                                        {isLoading ? (
                                            <span className="flex items-center">
                                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Processing...
                                            </span>
                                        ) : isUploading ? (
                                            <span className="flex items-center">
                                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Uploading Receipt...
                                            </span>
                                        ) : (
                                            'Confirm Plan Change'
                                        )}
                                    </button>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="text-center py-12">
                            <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-indigo-100 text-indigo-600 mb-6">
                                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h2 className="text-xl font-bold text-slate-800 mb-2">
                                {currentPlan === 'free' ? 'You are on the Free Plan' : 'You have already upgraded your plan'}
                            </h2>
                            <p className="text-slate-500 max-w-md mx-auto mb-6">
                                {currentPlan === 'free'
                                    ? 'You can upgrade to Half or Full plan to access more content'
                                    : 'You cannot upgrade or downgrade your plan further'}
                            </p>
                            <button
                                onClick={() => router.push('/')}
                                className="px-6 py-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors"
                            >
                                Go to Homepage
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </Suspense>
    );
}