// Static bank details
const staticBankDetails = {
    bankName: "Global Bank",
    accountNumber: "1234567890123456",
    accountName: "EduTech Solutions",
    qrCode: "/payment-qr.png" // Assuming you have this image in your public folder
  };
  
  export const updateUserPlan = async (
    userId: string,
    currentPlan: string,
    newPlan: string,
    paymentImage?: string
  ) => {
    try {
      const token = document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1];
      if (!token) throw new Error('Authentication token not found');
  
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${userId}/plan`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          planUpgradedFrom: currentPlan,
          plan: newPlan,
          ...(paymentImage && { paymentImage })
        })
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update plan');
      }
  
      return await response.json();
    } catch (error) {
      throw error;
    }
  };
  
  export const getBankDetails = async (): Promise<{
    bankName: string;
    accountNumber: string;
    accountName: string;
    qrCode: string;
  }> => {
    // Return static data instead of API call
    return staticBankDetails;
  };